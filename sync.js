const { Storage } = require('megajs');

function hasValidMegaCredentials() {
    const megaEmail = process.env.MEGA_EMAIL;
    const megaPassword = process.env.MEGA_PASSWORD;
    if (!megaEmail || !megaPassword) return false;
    if (megaEmail.includes('example.com') || megaPassword.includes('mega_password')) return false;
    return true;
}

async function syncData(type, data) {
    if (!hasValidMegaCredentials()) return;
    const megaEmail = process.env.MEGA_EMAIL;
    const megaPassword = process.env.MEGA_PASSWORD;

    try {
        const storage = new Storage({ email: megaEmail, password: megaPassword });
        storage.on('error', (err) => {
            // Suppress storage error events
        });

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Mega connection timeout')), 15000);
            storage.on('ready', () => { clearTimeout(timeout); resolve(); });
            storage.on('error', (err) => { clearTimeout(timeout); reject(err); });
        });

        const rootFiles = storage.files || (storage.root && storage.root.children) || [];
        const filesArray = Array.isArray(rootFiles) ? rootFiles : Object.values(rootFiles);
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

        const children = backupFolder.children || (backupFolder.files && Object.values(backupFolder.files)) || [];
        const childrenArray = Array.isArray(children) ? children : Object.values(children);

        for (const file of childrenArray.filter(f => f.name === fileName)) {
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
    const megaEmail = process.env.MEGA_EMAIL;
    const megaPassword = process.env.MEGA_PASSWORD;

    try {
        const storage = new Storage({ email: megaEmail, password: megaPassword });
        storage.on('error', (err) => {
            // Suppress unhandled storage error events
        });

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Mega connection timeout')), 15000);
            storage.on('ready', () => { clearTimeout(timeout); resolve(); });
            storage.on('error', (err) => { clearTimeout(timeout); reject(err); });
        });

        const rootFiles = storage.files || (storage.root && storage.root.children) || [];
        const filesArray = Array.isArray(rootFiles) ? rootFiles : Object.values(rootFiles);
        let backupFolder = filesArray.find(f => f.name === 'KCH_Connect_Backups' && f.directory);
        if (!backupFolder) return null;

        const children = backupFolder.children || (backupFolder.files && Object.values(backupFolder.files)) || [];
        const childrenArray = Array.isArray(children) ? children : Object.values(children);
        const targetFile = childrenArray.find(f => f.name === `${type}.json`);
        if (!targetFile) return null;

        const dataBuffer = await new Promise((resolve, reject) => {
            targetFile.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        return JSON.parse(dataBuffer.toString('utf8'));
    } catch (e) {
        console.error(`[SYNC - Mega] Error loading ${type} from Mega:`, e.message);
        return null;
    }
}

async function syncMediaToMega(filename, buffer) {
    if (!hasValidMegaCredentials()) return;
    const megaEmail = process.env.MEGA_EMAIL;
    const megaPassword = process.env.MEGA_PASSWORD;

    try {
        const storage = new Storage({ email: megaEmail, password: megaPassword });
        storage.on('error', () => {});

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Mega connection timeout')), 15000);
            storage.on('ready', () => { clearTimeout(timeout); resolve(); });
            storage.on('error', (err) => { clearTimeout(timeout); reject(err); });
        });

        const rootFiles = storage.files || (storage.root && storage.root.children) || [];
        const filesArray = Array.isArray(rootFiles) ? rootFiles : Object.values(rootFiles);
        let mediaFolder = filesArray.find(f => f.name === 'KCH_Connect_Media' && f.directory);

        if (!mediaFolder) {
            mediaFolder = await new Promise((resolve, reject) => {
                storage.mkdir('KCH_Connect_Media', (err, folder) => {
                    if (err) reject(err);
                    else resolve(folder);
                });
            });
        }

        const children = mediaFolder.children || (mediaFolder.files && Object.values(mediaFolder.files)) || [];
        const childrenArray = Array.isArray(children) ? children : Object.values(children);

        for (const file of childrenArray.filter(f => f.name === filename)) {
            await new Promise((resolve) => file.delete(() => resolve()));
        }

        await new Promise((resolve, reject) => {
            mediaFolder.upload({ name: filename, size: buffer.length }, buffer, (err, file) => {
                if (err) reject(err);
                else resolve(file);
            });
        });
    } catch (e) {
        console.error(`[SYNC - Mega] Media sync error:`, e.message);
    }
}

async function deleteMediaFromMega(filename) {
    if (!hasValidMegaCredentials()) return;
    const megaEmail = process.env.MEGA_EMAIL;
    const megaPassword = process.env.MEGA_PASSWORD;

    try {
        const storage = new Storage({ email: megaEmail, password: megaPassword });
        storage.on('error', () => {});

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Mega connection timeout')), 15000);
            storage.on('ready', () => { clearTimeout(timeout); resolve(); });
            storage.on('error', (err) => { clearTimeout(timeout); reject(err); });
        });

        const rootFiles = storage.files || (storage.root && storage.root.children) || [];
        const filesArray = Array.isArray(rootFiles) ? rootFiles : Object.values(rootFiles);
        const mediaFolder = filesArray.find(f => f.name === 'KCH_Connect_Media' && f.directory);
        if (mediaFolder) {
            const children = mediaFolder.children || (mediaFolder.files && Object.values(mediaFolder.files)) || [];
            const childrenArray = Array.isArray(children) ? children : Object.values(children);
            for (const file of childrenArray.filter(f => f.name === filename)) {
                await new Promise((resolve) => file.delete(() => resolve()));
            }
        }
    } catch (e) {
        console.error(`[SYNC - Mega] Media delete error:`, e.message);
    }
}

async function createMegaFolder(folderName) {
    if (!hasValidMegaCredentials()) return;
    const megaEmail = process.env.MEGA_EMAIL;
    const megaPassword = process.env.MEGA_PASSWORD;

    try {
        const storage = new Storage({ email: megaEmail, password: megaPassword });
        storage.on('error', () => {});

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Mega connection timeout')), 15000);
            storage.on('ready', () => { clearTimeout(timeout); resolve(); });
            storage.on('error', (err) => { clearTimeout(timeout); reject(err); });
        });

        const rootFiles = storage.files || (storage.root && storage.root.children) || [];
        const filesArray = Array.isArray(rootFiles) ? rootFiles : Object.values(rootFiles);
        let mediaFolder = filesArray.find(f => f.name === 'KCH_Connect_Media' && f.directory);

        if (!mediaFolder) {
            mediaFolder = await new Promise((resolve, reject) => {
                storage.mkdir('KCH_Connect_Media', (err, folder) => {
                    if (err) reject(err);
                    else resolve(folder);
                });
            });
        }

        const children = mediaFolder.children || (mediaFolder.files && Object.values(mediaFolder.files)) || [];
        const childrenArray = Array.isArray(children) ? children : Object.values(children);
        let subFolder = childrenArray.find(f => f.name === folderName && f.directory);

        if (!subFolder) {
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
