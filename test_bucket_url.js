require('dotenv').config();
const axios = require('axios');

const HF_TOKEN = process.env.HF_TOKEN;

async function test() {
  const urls = [
    'https://huggingface.co/api/buckets/KCH-Wajihiyah/KCH-M-connect',
    'https://huggingface.co/buckets/KCH-Wajihiyah/KCH-M-connect',
    'https://s3.hf.co/KCH-M-connect',
    'https://s3.hf.co/KCH-Wajihiyah/KCH-M-connect',
    'https://huggingface.co/api/spaces/KCH-Wajihiyah/KCH-M-connect'
  ];

  for (const url of urls) {
    try {
      const res = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${HF_TOKEN}` },
        validateStatus: () => true
      });
      console.log(`URL: ${url} -> Status: ${res.status}`, res.data);
    } catch (e) {
      console.log(`URL: ${url} -> Error:`, e.message);
    }
  }
}

test();
