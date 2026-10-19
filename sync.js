const { Storage } = require('megajs');

function hasValidMegaCredentials() {
    const megaEmail = process.env.MEGA_EMAIL;
    const megaPassword = process.env.MEGA_PASSWORD;
    if (!megaEmail || !megaPassword) return false;
    if (megaEmail.includes('example.com') || megaPassword.includes('mega_password')) return false;
    return true;
}

// Helper to initialize and wait for storage ready
async function getMegaStorage() {
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
}

async function syncData(type, data) {
    if (!hasValidMegaCredentials()) return;
    try {
        const storage = await getMegaStorage();
        const filesArray = storage.files || [];
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

        // Delete existing file with same name if present in storage
        const existingFiles = (storage.files || []).filter(f => !f.directory && f.name === fileName);
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
        const filesArray = storage.files || [];
        const targetFile = filesArray.find(f => !f.directory && f.name === `${type}.json`);
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
        const filesArray = storage.files || [];
        let mediaFolder = filesArray.find(f => f.name === 'KCH_Connect_Media' && f.directory);

        if (!mediaFolder) {
            mediaFolder = await new Promise((resolve, reject) => {
                storage.mkdir('KCH_Connect_Media', (err, folder) => {
                    if (err) reject(err);
                    else resolve(folder);
                });
            });
        }

        // Delete existing media file with same filename anywhere in storage
        const existingFiles = (storage.files || []).filter(f => !f.directory && f.name === filename);
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
        const filesArray = storage.files || [];
        const existingFiles = filesArray.filter(f => !f.directory && f.name === filename);
        for (const file of existingFiles) {
            await new Promise((resolve) => file.delete(() => resolve()));
            console.log(`[SYNC - Mega] Successfully deleted media ${filename} from Mega.`);
        }
    } catch (e) {
        console.error(`[SYNC - Mega] Media delete error:`, e.message);
    }
}

async function createMegaFolder(folderName) {
    if (!hasValidMegaCredentials()) return;
    try {
        const storage = await getMegaStorage();
        const filesArray = storage.files || [];
        let mediaFolder = filesArray.find(f => f.name === 'KCH_Connect_Media' && f.directory);

        if (!mediaFolder) {
            mediaFolder = await new Promise((resolve, reject) => {
                storage.mkdir('KCH_Connect_Media', (err, folder) => {
                    if (err) reject(err);
                    else resolve(folder);
                });
            });
        }

        const subFolders = (storage.files || []).filter(f => f.directory && f.name === folderName);
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

module.exports = { syncData, loadDataFromMega, syncMediaToMega, deleteMediaFromMega, createMegaFolder };
