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
} from "../controllers/bucketController.js";
import { protect } from "../middleware/authMiddleware.js";

const tempDir = path.join(process.cwd(), "uploads", "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const upload = multer({ dest: tempDir });
const router = express.Router();

router.route("/")
  .get(protect, getBuckets)
  .post(protect, createBucket);

router.route("/:id")
  .delete(protect, deleteBucket);

router.route("/:id/files")
  .post(protect, upload.single("file"), addFileToBucket);

router.route("/:id/files/:fileId")
  .delete(protect, deleteFileFromBucket);

export default router;
