// Verification script for TrekMate credentials
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import dns from 'node:dns';

dns.setServers(['8.8.8.8']);
dotenv.config();

console.log('='.repeat(50));
console.log('   🔍 TrekMate Credentials Verification Report');
console.log('='.repeat(50));

// 1. JWT Secret Check
console.log('\n[1/4] Checking JWT_SECRET...');
const jwtSecret = process.env.JWT_SECRET || 'prince1234';
try {
  const token = jwt.sign({ test: 'auth' }, jwtSecret, { expiresIn: '1h' });
  const decoded = jwt.verify(token, jwtSecret);
  if (decoded.test === 'auth') {
    console.log('  ✅ JWT_SECRET: Working (tokens sign & verify properly)');
  }
} catch (e) {
  console.log('  ❌ JWT_SECRET: Failed ->', e.message);
}

// 2. Cloudinary Check
console.log('\n[2/4] Checking Cloudinary Credentials...');
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'nljiwp7l';
const apiKey = process.env.CLOUDINARY_API_KEY || '448495119856346';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'prince123';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

try {
  const pingResult = await cloudinary.api.ping();
  console.log('  ✅ Cloudinary: Connected successfully! Status:', pingResult.status);
} catch (e) {
  console.log('  ⚠️  Cloudinary: Authentication failed!');
  console.log(`     Error: "${e.message || e.error?.message || 'api_secret mismatch'}"`);
  console.log('     Note: Your Cloudinary API Secret is usually a ~27-character random string from your Cloudinary Console dashboard, rather than a custom password.');
}

// 3. MongoDB Atlas (Cloud) Check
console.log('\n[3/4] Checking MongoDB Atlas (Cloud Database)...');
const atlasUri = process.env.MONGODB_URI?.includes('mongodb+srv')
  ? process.env.MONGODB_URI
  : 'mongodb+srv://princerao2005pr_db_user:2NwtaRXJw7QkOkPf@cluster0.kpsouse.mongodb.net/trekking_management?retryWrites=true&w=majority';

try {
  const conn = await mongoose.connect(atlasUri, { serverSelectionTimeoutMS: 6000 });
  console.log('  ✅ MongoDB Atlas: Connected successfully!');
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log(`     Collections found: ${collections.length} [${collections.map(c => c.name).join(', ') || 'None yet'}]`);
  await mongoose.disconnect();
} catch (e) {
  console.log('  ❌ MongoDB Atlas: Connection failed ->', e.message);
  console.log('     Make sure IP 0.0.0.0/0 is whitelisted in Atlas Network Access!');
}

// 4. Local Docker MongoDB Check
console.log('\n[4/4] Checking Local Docker MongoDB...');
const localUri = 'mongodb://127.0.0.1:27017/trekking_management';
try {
  await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
  console.log('  ✅ Local Docker MongoDB: Connected successfully!');
  const db = mongoose.connection.db;
  const trekCount = await db.collection('treks').countDocuments();
  const userCount = await db.collection('users').countDocuments();
  console.log(`     Data in local DB: ${trekCount} treks, ${userCount} users`);
  await mongoose.disconnect();
} catch (e) {
  console.log('  ⚠️  Local Docker MongoDB: Not running or unreachable ->', e.message);
}

console.log('\n' + '='.repeat(50));
