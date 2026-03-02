import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Bucket, { FileItem } from './src/models/Bucket.js';

dotenv.config();

async function fixPaths() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1/cloud-bucket');
  
  const buckets = await Bucket.find({});
  console.log(`Found ${buckets.length} buckets`);

  for (const bucket of buckets) {
    console.log(`Processing bucket: ${bucket.name}`);
    
    // Recursive function to update paths
    async function updateItem(itemRefId, parentPath) {
      const item = await FileItem.findById(itemRefId);
      if (!item) return;

      const newPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      const expectedDataUrl = item.type === 'folder' 
        ? `/api/public/${bucket.name}/${newPath}/`
        : `/api/public/${bucket.name}/${newPath}`;

      if (item.dataUrl !== expectedDataUrl) {
        console.log(`Fixing ${item.name}: ${item.dataUrl} -> ${expectedDataUrl}`);
        item.dataUrl = expectedDataUrl;
        await item.save();
      }

      for (const childId of item.children) {
        await updateItem(childId, newPath);
      }
    }

    // Process root files
    for (const rootFileId of bucket.files) {
      await updateItem(rootFileId, "");
    }
  }

  console.log("Done fixing paths.");
  process.exit(0);
}

fixPaths().catch(console.error);
