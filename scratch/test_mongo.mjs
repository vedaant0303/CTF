import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
console.log('Testing connection to MongoDB Atlas...');
console.log('URI:', uri.replace(/:([^:@]+)@/, ':••••••••@'));

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
});

try {
  await client.connect();
  console.log('Connected successfully!');
  const adminDb = client.db('admin');
  const pingResult = await adminDb.command({ ping: 1 });
  console.log('Ping Result:', pingResult);

  const db = client.db('ctf_training');
  const collections = await db.listCollections().toArray();
  console.log('Current collections in ctf_training:', collections.map(c => c.name));
  console.log('MongoDB Atlas test passed with 100% success!');
} catch (err) {
  console.error('Connection test error:', err);
} finally {
  await client.close();
}
