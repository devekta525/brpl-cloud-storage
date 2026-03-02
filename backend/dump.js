import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Bucket, { FileItem } from './src/models/Bucket.js';

dotenv.config();

const populateFileItems = async (fileItemIds) => {
  if (!fileItemIds || fileItemIds.length === 0) return [];
  const items = await FileItem.find({ _id: { $in: fileItemIds } });
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      item.children = await populateFileItems(item.children);
    }
  }
  return items;
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cloudstore'); 
  // Let me check actual DB name. 
  const bucket = await Bucket.findOne({ name: 'brpl-public' });
  if (!bucket) {
    console.log('Bucket not found');
    process.exit(1);
  }
  const populated = await populateFileItems(bucket.files);
  import('fs').then((fs) => {
    fs.writeFileSync('dump.json', JSON.stringify(populated, null, 2));
    process.exit(0);
  });
}

run();
