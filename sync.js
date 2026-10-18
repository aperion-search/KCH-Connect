const { Storage } = require('megajs');

/**
 * Sync data changes to Mega Cloud Storage.
 * @param {string} type - 'attendance', 'leaves', 'students', 'teachers', 'gallery'
 * @param {any} data - The updated data to sync
 */
async function syncData(type, data) {
    console.log(`[SYNC] Triggered Mega sync for ${type}...`);

    const megaEmail = process.env.MEGA_EMAIL;
    const megaPassword = process.env.MEGA_PASSWORD;

    if (!megaEmail || !megaPassword) {
        console.log(`[SYNC - Mega] Mega credentials (MEGA_EMAIL, MEGA_PASSWORD) not configured. Skipping Mega cloud upload.`);
        return;
    }

    try {
        const storage = new Storage({
            email: megaEmail,
            password: megaPassword
        });

        await new Promise((resolve, reject) => {
            storage.on('ready', resolve);
            storage.on('error', reject);
        });

        console.log(`[SYNC - Mega] Connected to Mega successfully as ${megaEmail}`);

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
            console.log(`[SYNC - Mega] Created 'KCH_Connect_Backups' folder on Mega.`);
        }

        const fileName = `${type}.json`;
        const fileContent = JSON.stringify(data, null, 2);
        const buffer = Buffer.from(fileContent, 'utf8');

        const children = backupFolder.children || (backupFolder.files && Object.values(backupFolder.files)) || [];
        const childrenArray = Array.isArray(children) ? children : Object.values(children);

        const existingFiles = childrenArray.filter(f => f.name === fileName);
        for (const file of existingFiles) {
            await new Promise((resolve) => {
                file.delete(() => resolve());
            });
        }

        await new Promise((resolve, reject) => {
            backupFolder.upload({
                name: fileName,
                size: buffer.length
            }, buffer, (err, file) => {
                if (err) reject(err);
                else resolve(file);
            });
        });

        console.log(`[SYNC - Mega] Successfully synced ${fileName} to Mega cloud storage.`);
    } catch (e) {
        console.error(`[SYNC - Mega] Sync error for ${type}:`, e.message);
    }
}

/**
 * Load data file from Mega cloud storage on startup.
 */
async function loadDataFromMega(type) {
    const megaEmail = process.env.MEGA_EMAIL;
    const megaPassword = process.env.MEGA_PASSWORD;
    if (!megaEmail || !megaPassword) return null;

    try {
        const storage = new Storage({
            email: megaEmail,
            password: megaPassword
        });

        await new Promise((resolve, reject) => {
            storage.on('ready', resolve);
            storage.on('error', reject);
        });

        const rootFiles = storage.files || (storage.root && storage.root.children) || [];
        const filesArray = Array.isArray(rootFiles) ? rootFiles : Object.values(rootFiles);
        let backupFolder = filesArray.find(f => f.name === 'KCH_Connect_Backups' && f.directory);
        if (!backupFolder) return null;

        const children = backupFolder.children || (backupFolder.files && Object.values(backupFolder.files)) || [];
        const childrenArray = Array.isArray(children) ? children : Object.values(children);
        const fileName = `${type}.json`;
        const targetFile = childrenArray.find(f => f.name === fileName);

        if (!targetFile) return null;

        const dataBuffer = await new Promise((resolve, reject) => {
            targetFile.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        console.log(`[SYNC - Mega] Successfully loaded ${fileName} from Mega cloud storage.`);
        return JSON.parse(dataBuffer.toString('utf8'));
    } catch (e) {
        console.error(`[SYNC - Mega] Error loading ${type} from Mega:`, e.message);
        return null;
    }
}

/**
 * Upload media file directly to Mega under 'KCH_Connect_Media' folder
 */
async function syncMediaToMega(filename, buffer) {
    const megaEmail = process.env.MEGA_EMAIL;
    const megaPassword = process.env.MEGA_PASSWORD;

    if (!megaEmail || !megaPassword) return;

    try {
        const storage = new Storage({
            email: megaEmail,
            password: megaPassword
        });

        await new Promise((resolve, reject) => {
            storage.on('ready', resolve);
            storage.on('error', reject);
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

        const existingFiles = childrenArray.filter(f => f.name === filename);
        for (const file of existingFiles) {
            await new Promise((resolve) => {
                file.delete(() => resolve());
            });
        }

        await new Promise((resolve, reject) => {
            mediaFolder.upload({
                name: filename,
                size: buffer.length
            }, buffer, (err, file) => {
                if (err) reject(err);
                else resolve(file);
            });
        });

        console.log(`[SYNC - Mega] Successfully uploaded media ${filename} to Mega.`);
    } catch (e) {
        console.error(`[SYNC - Mega] Media sync error:`, e.message);
    }
}

/**
 * Delete media file from Mega
 */
async function deleteMediaFromMega(filename) {
    const megaEmail = process.env.MEGA_EMAIL;
    const megaPassword = process.env.MEGA_PASSWORD;

    if (!megaEmail || !megaPassword) return;

    try {
        const storage = new Storage({
            email: megaEmail,
            password: megaPassword
        });

        await new Promise((resolve, reject) => {
            storage.on('ready', resolve);
            storage.on('error', reject);
        });

        const rootFiles = storage.files || (storage.root && storage.root.children) || [];
        const filesArray = Array.isArray(rootFiles) ? rootFiles : Object.values(rootFiles);

        const mediaFolder = filesArray.find(f => f.name === 'KCH_Connect_Media' && f.directory);
        if (mediaFolder) {
            const children = mediaFolder.children || (mediaFolder.files && Object.values(mediaFolder.files)) || [];
            const childrenArray = Array.isArray(children) ? children : Object.values(children);
            const existingFiles = childrenArray.filter(f => f.name === filename);
            for (const file of existingFiles) {
                await new Promise((resolve) => {
                    file.delete(() => resolve());
                });
            }
        }
    } catch (e) {
        console.error(`[SYNC - Mega] Media delete error:`, e.message);
    }
}

module.exports = { syncData, loadDataFromMega, syncMediaToMega, deleteMediaFromMega };
