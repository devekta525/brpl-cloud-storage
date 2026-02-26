import Bucket from "../models/Bucket.js";

// @route   GET /api/buckets
export const getBuckets = async (req, res) => {
  try {
    const buckets = await Bucket.find({ user: req.user._id });
    res.json(buckets);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @route   POST /api/buckets
export const createBucket = async (req, res) => {
  try {
    const { name, region } = req.body;
    const bucket = new Bucket({
      name,
      region,
      user: req.user._id,
      files: [],
    });
    const createdBucket = await bucket.save();
    res.status(201).json(createdBucket);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @route   DELETE /api/buckets/:id
export const deleteBucket = async (req, res) => {
  try {
    const bucket = await Bucket.findById(req.params.id);

    if (bucket && bucket.user.toString() === req.user._id.toString()) {
      await bucket.deleteOne();
      res.json({ message: "Bucket removed" });
    } else {
      res.status(404).json({ message: "Bucket not found or unauthorized" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @route   POST /api/buckets/:id/files
import fs from "fs";
import path from "path";

export const addFileToBucket = async (req, res) => {
  try {
    const { name, type, size, dataUrl } = req.body;
    const bucket = await Bucket.findById(req.params.id);

    if (bucket && bucket.user.toString() === req.user._id.toString()) {
      const dir = path.join(process.cwd(), "uploads", bucket.name);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const filePath = path.join(dir, name);
      const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        fs.writeFileSync(filePath, match[2], "base64");
      }

      const file = { name, type, size, dataUrl: `http://localhost:5000/api/public/${bucket.name}/${name}` };
      bucket.files.push(file);
      await bucket.save();
      res.status(201).json(bucket);
    } else {
      res.status(404).json({ message: "Bucket not found or unauthorized" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// @route   DELETE /api/buckets/:id/files/:fileId
export const deleteFileFromBucket = async (req, res) => {
  try {
    const bucket = await Bucket.findById(req.params.id);

    if (bucket && bucket.user.toString() === req.user._id.toString()) {
      bucket.files = bucket.files.filter(
        (file) => file._id.toString() !== req.params.fileId
      );
      await bucket.save();
      res.json(bucket);
    } else {
      res.status(404).json({ message: "Bucket not found or unauthorized" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @route   GET /api/public/:bucketName/:fileName
export const getFileByName = async (req, res) => {
  try {
    const { bucketName, fileName } = req.params;
    const bucket = await Bucket.findOne({ name: bucketName });
    if (!bucket) return res.status(404).send('Bucket not found');

    const file = bucket.files.find(f => f.name === fileName);
    if (!file) return res.status(404).send('File not found');

    const filePath = path.join(process.cwd(), "uploads", bucketName, fileName);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', file.type);
      const readStream = fs.createReadStream(filePath);
      return readStream.pipe(res);
    } else {
      // Fallback for files saved in DB during earlier dev
      const match = file.dataUrl && file.dataUrl.match && file.dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        res.setHeader('Content-Type', mimeType);
        return res.send(buffer);
      } else {
        return res.status(404).send('File content missing');
      }
    }
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
