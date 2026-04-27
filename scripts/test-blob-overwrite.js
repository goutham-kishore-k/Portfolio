const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { put } = require('@vercel/blob');

(async () => {
  try {
    const name = 'portfolio_data.json';
    const payload = {
      activeProfileId: 'test-overwrite',
      profiles: [
        { id: 'test-overwrite', name: 'TEST OVERWRITE', roles: ['Tester'], avatarUrl: '', resumeUrl: '', experienceBio: 'This is a test overwrite.', projects: [], systemPrompt: 'Test' }
      ],
      menuVisibility: { Home: true, About: true, Projects: true, Resume: true },
      chatbot: { model: 'test-model' }
    };

    console.log('Using BLOB_READ_WRITE_TOKEN:', !!process.env.BLOB_READ_WRITE_TOKEN);
    const res = await put(name, JSON.stringify(payload), {
      access: 'private',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    console.log('Put overwrite result:', res);
  } catch (err) {
    console.error('Blob put error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
