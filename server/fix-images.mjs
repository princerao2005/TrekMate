// One-time script to fix corrupted imageUrls in MongoDB
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const trekSchema = new mongoose.Schema({
  name: String,
  region: String,
  imageUrl: String,
  imageFilename: String,
}, { strict: false });

const Trek = mongoose.model('Trek', trekSchema);

const regionImageMap = {
  'Nepal': 'everest-base-camp.jpg',
  'Northern India': 'deoria-tal-india.jpg',
  'Southern India': 'nilgiri-hills-india.jpg',
  'Japan': 'mount-fuji.jpg',
  'Vietnam': 'sapa-vietnam.jpg',
  'Kyrgyzstan': 'tian-shan-kyrgyzstan.jpg',
  'Bhutan': 'paro-taktsang-bhutan.jpg',
  'Sri Lanka': 'kirigalpotta-sri-lanka.jpg',
  'China': 'great-wall-china.jpg',
};

function getLocalImage(region) {
  return regionImageMap[region] || 'everest-base-camp.jpg';
}

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trekking_management');
console.log('Connected to MongoDB');

// Find all treks with corrupted imageUrl (starts with /static/uploads/http)
const bad = await Trek.find({ imageUrl: /^\/static\/uploads\/https?:\/\//i }).select('_id region imageUrl').lean();
console.log(`Found ${bad.length} trek(s) with corrupted imageUrl`);

for (const t of bad) {
  const newUrl = `/static/uploads/${getLocalImage(t.region)}`;
  console.log(`Fixing "${t.region}" trek: ${t.imageUrl.substring(0, 60)} -> ${newUrl}`);
  await Trek.updateOne({ _id: t._id }, { $set: { imageUrl: newUrl, imageFilename: '' } });
}

console.log('Done! All corrupted imageUrls fixed.');
await mongoose.disconnect();
