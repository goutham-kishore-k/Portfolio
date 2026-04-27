const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { get } = require('@vercel/blob');
const { Readable } = require('stream');

const streamToString = async (stream) => {
  if (!stream) return '';
  if (stream instanceof Readable) {
    return await new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      stream.on('error', reject);
    });
  }
  if (typeof stream.getReader === 'function') {
    const reader = stream.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks).toString('utf8');
  }
  try { return String(stream); } catch (e) { return '';} 
};

(async () => {
  try {
    const name = 'portfolio_data.json';
    console.log('Using BLOB_READ_WRITE_TOKEN:', !!process.env.BLOB_READ_WRITE_TOKEN);
    const result = await get(name, { access: 'private', useCache: false });
    console.log('Get result keys:', Object.keys(result || {}));
    if (result && result.stream) {
      console.log('Stream present, converting to string...');
      const text = await streamToString(result.stream);
      console.log('Blob content (first 1k):', text.substring(0, 1000));
    } else {
      console.log('No stream in get() result, full result:', result);
    }
  } catch (err) {
    console.error('Blob get error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
