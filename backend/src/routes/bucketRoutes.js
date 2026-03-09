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

const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE
  ? Number(process.env.MAX_FILE_SIZE)
  : null;

const uploadOptions = {
  dest: tempDir,
};

if (Number.isFinite(MAX_FILE_SIZE) && MAX_FILE_SIZE > 0) {
  uploadOptions.limits = { fileSize: MAX_FILE_SIZE };
}

const upload = multer(uploadOptions);

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      const maxMb = Number.isFinite(MAX_FILE_SIZE)
        ? MAX_FILE_SIZE / (1024 * 1024)
        : null;
      return res.status(413).json({
        message: maxMb
          ? `File too large. Maximum file size is ${maxMb}MB`
          : "File too large.",
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
