import express from "express";
import {
  getBuckets,
  createBucket,
  deleteBucket,
  addFileToBucket,
  deleteFileFromBucket,
} from "../controllers/bucketController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(protect, getBuckets)
  .post(protect, createBucket);

router.route("/:id")
  .delete(protect, deleteBucket);

router.route("/:id/files")
  .post(protect, addFileToBucket);

router.route("/:id/files/:fileId")
  .delete(protect, deleteFileFromBucket);

export default router;
