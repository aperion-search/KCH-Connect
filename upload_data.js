require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const HF_TOKEN = process.env.HF_TOKEN;
const HF_REPO = process.env.HF_REPO || 'huzaifayusufali/kch-connect-backup';

async function uploadAll() {
    if (!HF_TOKEN || !HF_REPO) {
        console.error("HF_TOKEN or HF_REPO not set in .env");
        return;
    }
    const types = ['students', 'teachers', 'attendance', 'leaves', 'gallery', 'announcements'];
    for (const type of types) {
        const filePath = path.join(__dirname, 'data', `${type}.json`);
        if (!fs.existsSync(filePath)) {
            console.log(`${type}.json not found locally, skipping.`);
            continue;
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const base64Data = Buffer.from(content, 'utf8').toString('base64');
        const fileName = `backups/${type}.json`;

        try {
            console.log(`Uploading ${type}.json to Hugging Face ${HF_REPO}...`);
            await axios.post(
                `https://huggingface.co/api/datasets/${HF_REPO}/commit/main`,
                {
                    summary: `Initial/Full Sync ${type}.json`,
                    description: "Full data upload from KCH Connect",
                    operations: [
                        {
                            operation: "add",
                            path: fileName,
                            content: base64Data,
                            encoding: "base64"
                        }
                    ]
                },
                {
                    headers: {
                        Authorization: `Bearer ${HF_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            console.log(`Successfully uploaded ${type}.json!`);
        } catch (e) {
            console.error(`Error uploading ${type}.json:`, e.response?.data || e.message);
        }
    }
}

uploadAll();
