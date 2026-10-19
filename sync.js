const axios = require('axios');

const HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN;
const HF_REPO = process.env.HF_REPO || 'KCH-Wajihiyah/KCH-M-connect';

// In-memory debounce timers and pending data
const pendingSyncs = {};
const pendingTimers = {};
const lastSyncTimes = {};
const SYNC_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes minimum between syncs per type
let hfBlockedUntil = 0;

async function syncData(type, data) {
    if (!HF_TOKEN || !HF_REPO) {
        console.log(`[SYNC - HF Bucket] HF_TOKEN or HF_REPO not configured. Skipping sync.`);
        return;
    }
    if (Date.now() < hfBlockedUntil) {
        console.log(`[SYNC - HF Bucket] Paused due to recent error protection. Skipping sync for ${type}.`);
        return;
    }

    pendingSyncs[type] = data;

    if (pendingTimers[type]) {
        clearTimeout(pendingTimers[type]);
    }

    const now = Date.now();
    const timeSinceLastSync = now - (lastSyncTimes[type] || 0);
    const delay = timeSinceLastSync < SYNC_COOLDOWN_MS ? SYNC_COOLDOWN_MS - timeSinceLastSync : 5000;

    console.log(`[SYNC] Scheduled HF Bucket sync for ${type} in ${Math.round(delay / 1000)}s...`);

    pendingTimers[type] = setTimeout(async () => {
        const payload = pendingSyncs[type];
        delete pendingSyncs[type];
        delete pendingTimers[type];
        if (!payload) return;

        lastSyncTimes[type] = Date.now();
        await executeHFSync(type, payload);
    }, delay);
}

async function executeHFSync(type, data) {
    if (!HF_TOKEN || !HF_REPO) return;

    try {
        console.log(`[SYNC - HF Bucket] Uploading ${type}.json to HF Bucket ${HF_REPO}...`);
        const filePath = `${type}.json`;
        const jsonContent = JSON.stringify(data, null, 2);
        const base64Content = Buffer.from(jsonContent, 'utf8').toString('base64');

        const payload = {
            summary: `Sync ${type}.json`,
            operations: [
                {
                    operation: "add",
                    path: filePath,
                    content: base64Content,
                    encoding: "base64"
                }
            ]
        };

        await axios.post(
            `https://huggingface.co/api/buckets/${HF_REPO}/commit/main`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        console.log(`[SYNC - HF Bucket] Successfully synced ${type}.json to HF Bucket.`);
    } catch (e) {
        console.error(`[SYNC - HF Bucket] Sync error for ${type}:`, e.response?.data || e.message);
        if (e.response?.status === 429 || e.message.toLowerCase().includes('rate') || e.message.toLowerCase().includes('limit')) {
            hfBlockedUntil = Date.now() + (30 * 60 * 1000);
            console.error(`[SYNC - HF Bucket] Rate limit detected. Sync paused for 30 minutes.`);
        }
    }
}

async function loadDataFromHF(type) {
    if (!HF_TOKEN || !HF_REPO || Date.now() < hfBlockedUntil) return null;

    // Try root path first (${type}.json), then backups/${type}.json
    const paths = [`${type}.json`, `backups/${type}.json`];
    for (const filePath of paths) {
        try {
            const url = `https://huggingface.co/buckets/${HF_REPO}/resolve/${filePath}`;

            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`
                },
                validateStatus: status => status === 200
            });

            console.log(`[SYNC - HF Bucket] Successfully loaded ${filePath} from HF Bucket.`);
            return response.data;
        } catch (e) {
            // continue to next path
        }
    }

    console.log(`[SYNC - HF Bucket] Note on loading ${type}.json: File not found in bucket (will initialize from default/local).`);
    return null;
}

async function syncMediaToHF(filename, buffer) {
    if (!HF_TOKEN || !HF_REPO || Date.now() < hfBlockedUntil) return;

    try {
        const filePath = `media/${filename}`;
        const base64Content = Buffer.from(buffer).toString('base64');

        const payload = {
            summary: `Upload media ${filename}`,
            operations: [
                {
                    operation: "add",
                    path: filePath,
                    content: base64Content,
                    encoding: "base64"
                }
            ]
        };

        await axios.post(
            `https://huggingface.co/api/buckets/${HF_REPO}/commit/main`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        console.log(`[SYNC - HF Bucket] Successfully uploaded media ${filename} to HF Bucket.`);
    } catch (e) {
        console.error(`[SYNC - HF Bucket] Media upload error:`, e.response?.data || e.message);
    }
}

async function deleteMediaFromHF(filename) {
    if (!HF_TOKEN || !HF_REPO || Date.now() < hfBlockedUntil) return;

    try {
        const filePath = `media/${filename}`;

        const payload = {
            summary: `Delete media ${filename}`,
            operations: [
                {
                    operation: "delete",
                    path: filePath
                }
            ]
        };

        await axios.post(
            `https://huggingface.co/api/datasets/${HF_REPO}/commit/main`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`[SYNC - HF Bucket] Successfully deleted media ${filename} from HF Bucket.`);
    } catch (e) {
        console.error(`[SYNC - HF Bucket] Media delete error:`, e.response?.data || e.message);
    }
}

module.exports = {
    syncData,
    loadDataFromMega: loadDataFromHF,
    syncMediaToMega: syncMediaToHF,
    deleteMediaFromMega: deleteMediaFromHF
};
