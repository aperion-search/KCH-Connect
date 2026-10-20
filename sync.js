const { Storage } = require('megajs');

function hasValidMegaCredentials() {
    const megaEmail = process.env.MEGA_EMAIL;
    const megaPassword = process.env.MEGA_PASSWORD;
    if (!megaEmail || !megaPassword) return false;
    if (megaEmail.includes('example.com') || megaPassword.includes('mega_password')) return false;
    return true;
}

// Helper to retry Mega operations on transient congestion (EAGAIN, timeouts, fetch failed, etc.)
async function withMegaRetry(fn, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (e) {
            const msg = (e.message || '').toLowerCase();
            const isTransient = msg.includes('eagain') || msg.includes('timeout') || msg.includes('offline') || msg.includes('econnreset') || msg.includes('etimedout') || msg.includes('-3') || msg.includes('fetch failed');
            if (i === retries - 1 || !isTransient) {
                if (!isTransient && i === retries - 1) throw e;
                if (i === retries - 1) throw e;
            }
            console.warn(`[SYNC - Mega] Transient error (${e.message}), retrying in ${delay}ms... (${i + 1}/${retries})`);
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
        }
    }
}

// Helper to initialize and wait for storage ready
async function getMegaStorage() {
    return withMegaRetry(async () => {
        const megaEmail = process.env.MEGA_EMAIL;
        const megaPassword = process.env.MEGA_PASSWORD;
        let storage;
        try {
            storage = new Storage({ email: megaEmail, password: megaPassword });
        } catch (initErr) {
            throw new Error(`Mega storage init failed: ${initErr.message}`);
        }

        storage.on('error', (err) => {
            // Suppress storage error events to prevent uncaught exceptions
        });

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                try {
                    if (storage && typeof storage.destroy === 'function') storage.destroy();
                } catch (e) {}
                reject(new Error('Mega connection timeout or offline'));
            }, 12000);

            storage.on('ready', () => { clearTimeout(timeout); resolve(); });
            storage.on('error', (err) => {
                clearTimeout(timeout);
                reject(err || new Error('Mega storage error'));
            });
        });
        return storage;
    });
}

function getFilesArray(storage) {
    const rawFiles = storage.files || [];
    return Array.isArray(rawFiles) ? rawFiles : Object.values(rawFiles);
}

function getAllStorageFiles(storage) {
    const rawFiles = storage.files || [];
    return Array.isArray(rawFiles) ? rawFiles : Object.values(rawFiles);
}

function getFileName(file) {
    if (!file) return '';
    return typeof file.name === 'function' ? file.name() : (file.name || '');
}

function isFileDirectory(file) {
    if (!file) return false;
    return typeof file.directory === 'function' ? file.directory() : Boolean(file.directory);
}

async function syncData(type, data) {
    if (!hasValidMegaCredentials()) return;
    try {
        await withMegaRetry(async () => {
            const storage = await getMegaStorage();
            const filesArray = getFilesArray(storage);
            let backupFolder = filesArray.find(f => isFileDirectory(f) && getFileName(f) === 'KCH_Connect_Backups');

            if (!backupFolder) {
                backupFolder = await new Promise((resolve, reject) => {
                    storage.mkdir('KCH_Connect_Backups', (err, folder) => {
                        if (err) reject(err);
                        else resolve(folder);
                    });
                });
            }

            const fileName = `${type}.json`;
            const fileContent = JSON.stringify(data, null, 2);
            const buffer = Buffer.from(fileContent, 'utf8');

            // Delete existing files with same name across entire storage to prevent duplicates
            const allFiles = getAllStorageFiles(storage);
            const existingFiles = allFiles.filter(f => !isFileDirectory(f) && getFileName(f) === fileName);
            for (const file of existingFiles) {
                await new Promise((resolve) => file.delete(() => resolve()));
            }

            await new Promise((resolve, reject) => {
                backupFolder.upload({ name: fileName, size: buffer.length }, buffer, (err, file) => {
                    if (err) reject(err);
                    else resolve(file);
                });
            });
            console.log(`[SYNC - Mega] Successfully synced ${fileName}.`);
        });
    } catch (e) {
        console.error(`[SYNC - Mega] Sync error for ${type}:`, e.message);
    }
}

async function loadDataFromMega(type) {
    if (!hasValidMegaCredentials()) return null;
    try {
        return await withMegaRetry(async () => {
            const storage = await getMegaStorage();
            const allFiles = getAllStorageFiles(storage);
            const targetFile = allFiles.find(f => !isFileDirectory(f) && getFileName(f) === `${type}.json`);
            if (!targetFile) return null;

            const dataBuffer = await new Promise((resolve, reject) => {
                targetFile.download((err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });

            if (!dataBuffer) return null;
            return JSON.parse(dataBuffer.toString('utf8'));
        });
    } catch (e) {
        if (e.message && (e.message.includes('MAC verification failed') || e.message.includes('decryption'))) {
            console.warn(`[SYNC - Mega] Notice: Could not download ${type}.json from Mega (${e.message}). Using local default.`);
        } else {
            console.error(`[SYNC - Mega] Error loading ${type} from Mega:`, e.message);
        }
        return null;
    }
}

async function syncMediaToMega(filename, buffer, eventFolderName) {
    if (!hasValidMegaCredentials()) return;
    try {
        await withMegaRetry(async () => {
            const storage = await getMegaStorage();
            const filesArray = getFilesArray(storage);
            let mediaFolder = filesArray.find(f => isFileDirectory(f) && getFileName(f) === 'KCH_Connect_Media');

            if (!mediaFolder) {
                mediaFolder = await new Promise((resolve, reject) => {
                    storage.mkdir('KCH_Connect_Media', (err, folder) => {
                        if (err) reject(err);
                        else resolve(folder);
                    });
                });
            }

            // If an event folder name is specified, find or create subfolder inside KCH_Connect_Media
            let targetFolder = mediaFolder;
            if (eventFolderName) {
                const allFiles = getAllStorageFiles(storage);
                let subFolder = allFiles.find(f => isFileDirectory(f) && getFileName(f) === eventFolderName);
                if (!subFolder) {
                    subFolder = await new Promise((resolve, reject) => {
                        mediaFolder.mkdir(eventFolderName, (err, folder) => {
                            if (err) reject(err);
                            else resolve(folder);
                        });
                    });
                    console.log(`[SYNC - Mega] Created event subfolder: ${eventFolderName}`);
                }
                targetFolder = subFolder;
            }

            // Delete existing media files with same filename across entire storage to prevent duplicates
            const allFiles = getAllStorageFiles(storage);
            const existingFiles = allFiles.filter(f => !isFileDirectory(f) && getFileName(f) === filename);
            for (const file of existingFiles) {
                await new Promise((resolve) => file.delete(() => resolve()));
            }

            await new Promise((resolve, reject) => {
                targetFolder.upload({ name: filename, size: buffer.length }, buffer, (err, file) => {
                    if (err) reject(err);
                    else resolve(file);
                });
            });
            console.log(`[SYNC - Mega] Successfully uploaded media ${filename} to Mega${eventFolderName ? ` (folder: ${eventFolderName})` : ''}.`);
        });
    } catch (e) {
        console.error(`[SYNC - Mega] Media sync error:`, e.message);
    }
}

async function deleteMediaFromMega(filename) {
    if (!hasValidMegaCredentials()) return;
    try {
        await withMegaRetry(async () => {
            const storage = await getMegaStorage();
            const allFiles = getAllStorageFiles(storage);
            const existingFiles = allFiles.filter(f => !isFileDirectory(f) && getFileName(f) === filename);
            for (const file of existingFiles) {
                try {
                    await new Promise((resolve, reject) => {
                        file.delete(err => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    console.log(`[SYNC - Mega] Successfully deleted media ${filename} from Mega.`);
                } catch (delErr) {
                    if (!delErr.message.includes('ENOENT') && !delErr.message.includes('-9') && !delErr.message.includes('not found')) {
                        console.warn(`[SYNC - Mega] Media delete notice for ${filename}:`, delErr.message);
                    }
                }
            }
        });
    } catch (e) {
        if (!e.message.includes('ENOENT') && !e.message.includes('-9') && !e.message.includes('not found')) {
            console.error(`[SYNC - Mega] Media delete error:`, e.message);
        }
    }
}

async function deleteFolderFromMega(folderName) {
    if (!hasValidMegaCredentials()) return;
    try {
        await withMegaRetry(async () => {
            const storage = await getMegaStorage();
            const allFiles = getAllStorageFiles(storage);
            const targetFolder = allFiles.find(f => isFileDirectory(f) && getFileName(f) === folderName);
            if (!targetFolder) return;

            // Delete all children inside targetFolder
            const children = allFiles.filter(f => {
                return f.parent === targetFolder || f.u === targetFolder.h || (f.directory === false && targetFolder.children && targetFolder.children.includes(f));
            });
            for (const child of children) {
                await new Promise((resolve) => {
                    try {
                        child.delete(() => resolve());
                    } catch (e) {
                        resolve();
                    }
                });
            }

            // Delete folder itself
            await new Promise((resolve, reject) => {
                targetFolder.delete(err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            console.log(`[SYNC - Mega] Successfully deleted folder ${folderName} and contents from Mega.`);
        });
    } catch (e) {
        if (!e.message.includes('ENOENT') && !e.message.includes('-9') && !e.message.includes('not found')) {
            console.error(`[SYNC - Mega] Delete folder error for ${folderName}:`, e.message);
        }
    }
}

async function loadMediaFromMega(filename) {
    if (!hasValidMegaCredentials()) return null;
    try {
        return await withMegaRetry(async () => {
            const storage = await getMegaStorage();
            const allFiles = getAllStorageFiles(storage);
            const targetFile = allFiles.find(f => !isFileDirectory(f) && getFileName(f) === filename);
            if (!targetFile) return null;

            const dataBuffer = await new Promise((resolve, reject) => {
                targetFile.download((err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });
            return dataBuffer;
        });
    } catch (e) {
        return null;
    }
}

async function createMegaFolder(folderName) {
    if (!hasValidMegaCredentials()) return;
    try {
        await withMegaRetry(async () => {
            const storage = await getMegaStorage();
            const filesArray = getFilesArray(storage);
            let mediaFolder = filesArray.find(f => isFileDirectory(f) && getFileName(f) === 'KCH_Connect_Media');

            if (!mediaFolder) {
                mediaFolder = await new Promise((resolve, reject) => {
                    storage.mkdir('KCH_Connect_Media', (err, folder) => {
                        if (err) reject(err);
                        else resolve(folder);
                    });
                });
            }

            const subFolders = filesArray.filter(f => isFileDirectory(f) && getFileName(f) === folderName);
            if (subFolders.length === 0) {
                await new Promise((resolve, reject) => {
                    mediaFolder.mkdir(folderName, (err, folder) => {
                        if (err) reject(err);
                        else resolve(folder);
                    });
                });
                console.log(`[SYNC - Mega] Created new event folder on Mega: ${folderName}`);
            }
        });
    } catch (e) {
        console.error(`[SYNC - Mega] Create folder error:`, e.message);
    }
}

module.exports = { syncData, loadDataFromMega, syncMediaToMega, deleteMediaFromMega, deleteFolderFromMega, createMegaFolder, loadMediaFromMega };
