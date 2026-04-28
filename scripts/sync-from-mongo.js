const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'portfolio';
const TIMEOUT = parseInt(process.env.MONGODB_TIMEOUT_MS || '4000', 10);

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in environment. Aborting.');
  process.exit(2);
}

async function run() {
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: TIMEOUT,
    connectTimeoutMS: TIMEOUT,
  });

  try {
    await client.connect();
    const db = client.db(MONGODB_DB_NAME);
    const coll = db.collection('portfolio_data');

    const doc = await coll.findOne({ _id: 'portfolio_data' });
    if (!doc || !doc.data) {
      console.warn('No portfolio document found in MongoDB. Nothing to write.');
      process.exit(0);
    }

    const outPath = path.join(process.cwd(), 'public', 'portfolio_data.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(doc.data, null, 2), 'utf8');
    console.log('Wrote portfolio_data.json to', outPath);
    process.exit(0);
  } catch (err) {
    console.error('Error syncing from Mongo:', err.message || err);
    process.exit(1);
  } finally {
    try { await client.close(); } catch (_) {}
  }
}

run();
