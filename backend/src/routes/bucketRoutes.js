import express from "express";
import multer from "multer";
import os from "os";
import fs from "fs";
import path from "path";
import {
  getBuckets,
  createBucket,
  deleteBucket,
  addFileToBucket,
  deleteFileFromBucket,
  createFolder,
} from "../controllers/bucketController.js";
import { protect } from "../middleware/authMiddleware.js";

const tempDir = path.join(process.cwd(), "uploads", "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// Configure multer with file size limits
// 500MB file size limit (matches express body parser limit)
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes

const upload = multer({
  dest: tempDir,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: `File too large. Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message || "Upload error" });
  }
  next();
};

const router = express.Router();

router.route("/")
  .get(protect, getBuckets)
  .post(protect, createBucket);

router.route("/:id")
  .delete(protect, deleteBucket);

router.route("/:id/files")
  .post(protect, upload.single("file"), handleMulterError, addFileToBucket);

router.route("/:id/files/:fileId")
  .delete(protect, deleteFileFromBucket);

router.route("/:id/folders")
  .post(protect, createFolder);

export default router;
