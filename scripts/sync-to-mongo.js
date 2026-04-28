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
  const filePath = path.join(process.cwd(), 'public', 'portfolio_data.json');
  if (!fs.existsSync(filePath)) {
    console.error('Local file not found:', filePath);
    process.exit(2);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try { data = JSON.parse(raw); } catch (err) {
    console.error('Invalid JSON in', filePath, err.message);
    process.exit(2);
  }

  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: TIMEOUT,
    connectTimeoutMS: TIMEOUT,
  });

  try {
    await client.connect();
    const db = client.db(MONGODB_DB_NAME);
    const coll = db.collection('portfolio_data');

    const res = await coll.updateOne(
      { _id: 'portfolio_data' },
      { $set: { data, updatedAt: new Date() } },
      { upsert: true }
    );

    console.log('Upserted portfolio_data to Mongo. result:', res.result || res);
    process.exit(0);
  } catch (err) {
    console.error('Error syncing to Mongo:', err.message || err);
    process.exit(1);
  } finally {
    try { await client.close(); } catch (_) {}
  }
}

run();
