const { Storage } = require('megajs');

function hasValidMegaCredentials() {
    const megaEmail = process.env.MEGA_EMAIL;
    const megaPassword = process.env.MEGA_PASSWORD;
    if (!megaEmail || !megaPassword) return false;
    if (megaEmail.includes('example.com') || megaPassword.includes('mega_password')) return false;
    return true;
}

// Helper to retry Mega operations on transient congestion (EAGAIN, timeouts, etc.)
async function withMegaRetry(fn, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (e) {
            if (i === retries - 1) throw e;
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
        const storage = new Storage({ email: megaEmail, password: megaPassword });
        storage.on('error', () => {
            // Suppress storage error events
        });

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Mega connection timeout')), 15000);
            storage.on('ready', () => { clearTimeout(timeout); resolve(); });
            storage.on('error', (err) => { clearTimeout(timeout); reject(err); });
        });
        return storage;
    });
}

function getFilesArray(storage) {
    const rawFiles = storage.files || (storage.root && storage.root.children) || [];
    return Array.isArray(rawFiles) ? rawFiles : Object.values(rawFiles);
}

function getAllStorageFiles(storage) {
    const allFiles = [];
    function traverse(item) {
        if (!item) return;
        if (item.directory) {
            const children = item.children || item.files || [];
            const childArray = Array.isArray(children) ? children : Object.values(children);
            for (const child of childArray) {
                traverse(child);
            }
        } else {
            allFiles.push(item);
        }
    }
    const rootFiles = getFilesArray(storage);
    for (const f of rootFiles) {
        traverse(f);
    }
    return allFiles;
}

async function syncData(type, data) {
    if (!hasValidMegaCredentials()) return;
    try {
        const storage = await getMegaStorage();
        const filesArray = getFilesArray(storage);
        let backupFolder = filesArray.find(f => f.name === 'KCH_Connect_Backups' && f.directory);

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
        const existingFiles = allFiles.filter(f => !f.directory && f.name === fileName);
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
    } catch (e) {
        console.error(`[SYNC - Mega] Sync error for ${type}:`, e.message);
    }
}

async function loadDataFromMega(type) {
    if (!hasValidMegaCredentials()) return null;
    try {
        const storage = await getMegaStorage();
        const allFiles = getAllStorageFiles(storage);
        const targetFile = allFiles.find(f => !f.directory && f.name === `${type}.json`);
        if (!targetFile) return null;

        const dataBuffer = await new Promise((resolve, reject) => {
            targetFile.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        }).catch(err => {
            console.warn(`[SYNC - Mega] Notice: Could not download ${type}.json from Mega (${err.message}). Using local default.`);
            return null;
        });

        if (!dataBuffer) return null;
        return JSON.parse(dataBuffer.toString('utf8'));
    } catch (e) {
        console.error(`[SYNC - Mega] Error loading ${type} from Mega:`, e.message);
        return null;
    }
}

async function syncMediaToMega(filename, buffer) {
    if (!hasValidMegaCredentials()) return;
    try {
        const storage = await getMegaStorage();
        const filesArray = getFilesArray(storage);
        let mediaFolder = filesArray.find(f => f.name === 'KCH_Connect_Media' && f.directory);

        if (!mediaFolder) {
            mediaFolder = await new Promise((resolve, reject) => {
                storage.mkdir('KCH_Connect_Media', (err, folder) => {
                    if (err) reject(err);
                    else resolve(folder);
                });
            });
        }

        // Delete existing media files with same filename across entire storage to prevent duplicates
        const allFiles = getAllStorageFiles(storage);
        const existingFiles = allFiles.filter(f => !f.directory && f.name === filename);
        for (const file of existingFiles) {
            await new Promise((resolve) => file.delete(() => resolve()));
        }

        await new Promise((resolve, reject) => {
            mediaFolder.upload({ name: filename, size: buffer.length }, buffer, (err, file) => {
                if (err) reject(err);
                else resolve(file);
            });
        });
        console.log(`[SYNC - Mega] Successfully uploaded media ${filename} to Mega.`);
    } catch (e) {
        console.error(`[SYNC - Mega] Media sync error:`, e.message);
    }
}

async function deleteMediaFromMega(filename) {
    if (!hasValidMegaCredentials()) return;
    try {
        const storage = await getMegaStorage();
        const allFiles = getAllStorageFiles(storage);
        const existingFiles = allFiles.filter(f => !f.directory && f.name === filename);
        for (const file of existingFiles) {
            await new Promise((resolve, reject) => {
                file.delete(err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            console.log(`[SYNC - Mega] Successfully deleted media ${filename} from Mega.`);
        }
    } catch (e) {
        console.error(`[SYNC - Mega] Media delete error:`, e.message);
    }
}

async function loadMediaFromMega(filename) {
    if (!hasValidMegaCredentials()) return null;
    try {
        const storage = await getMegaStorage();
        const allFiles = getAllStorageFiles(storage);
        const targetFile = allFiles.find(f => !f.directory && f.name === filename);
        if (!targetFile) return null;

        const dataBuffer = await new Promise((resolve, reject) => {
            targetFile.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        }).catch(err => {
            return null;
        });
        return dataBuffer;
    } catch (e) {
        console.error(`[SYNC - Mega] Error loading media ${filename} from Mega:`, e.message);
        return null;
    }
}

async function createMegaFolder(folderName) {
    if (!hasValidMegaCredentials()) return;
    try {
        const storage = await getMegaStorage();
        const filesArray = getFilesArray(storage);
        let mediaFolder = filesArray.find(f => f.name === 'KCH_Connect_Media' && f.directory);

        if (!mediaFolder) {
            mediaFolder = await new Promise((resolve, reject) => {
                storage.mkdir('KCH_Connect_Media', (err, folder) => {
                    if (err) reject(err);
                    else resolve(folder);
                });
            });
        }

        const subFolders = getFilesArray(storage).filter(f => f.directory && f.name === folderName);
        if (subFolders.length === 0) {
            await new Promise((resolve, reject) => {
                mediaFolder.mkdir(folderName, (err, folder) => {
                    if (err) reject(err);
                    else resolve(folder);
                });
            });
            console.log(`[SYNC - Mega] Created new event folder on Mega: ${folderName}`);
        }
    } catch (e) {
        console.error(`[SYNC - Mega] Create folder error:`, e.message);
    }
}

module.exports = { syncData, loadDataFromMega, syncMediaToMega, deleteMediaFromMega, createMegaFolder, loadMediaFromMega };
