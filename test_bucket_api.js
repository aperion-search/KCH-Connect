require('dotenv').config();
const axios = require('axios');

const HF_TOKEN = process.env.HF_TOKEN;
const REPO = 'KCH-Wajihiyah/KCH-M-connect';

async function test() {
  const urls = [
    `https://huggingface.co/api/buckets/${REPO}/raw/students.json`,
    `https://huggingface.co/buckets/${REPO}/resolve/students.json`,
    `https://huggingface.co/buckets/${REPO}/raw/students.json`,
    `https://huggingface.co/api/buckets/${REPO}/resolve/students.json`,
    `https://huggingface.co/api/buckets/${REPO}/file?path=students.json`
  ];

  for (const url of urls) {
    try {
      const res = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${HF_TOKEN}` },
        validateStatus: () => true
      });
      console.log(`GET ${url} -> Status: ${res.status}`, typeof res.data === 'string' ? res.data.substring(0, 50) : res.data);
    } catch (e) {
      console.log(`GET ${url} -> Error:`, e.message);
    }
  }
}

test();
