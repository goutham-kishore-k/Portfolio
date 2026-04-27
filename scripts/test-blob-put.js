const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { put } = require('@vercel/blob');

(async () => {
  try {
    const name = `test-portfolio-${Date.now()}.json`;
    const payload = { test: 'blob-put', ts: Date.now() };
    console.log('Using BLOB_READ_WRITE_TOKEN:', !!process.env.BLOB_READ_WRITE_TOKEN);
    const res = await put(name, JSON.stringify(payload), {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    console.log('Put result:', res);
  } catch (err) {
    console.error('Blob put error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
