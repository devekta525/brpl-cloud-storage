import mongoose from "mongoose";

// Recursive schema for nested folder structure
const fileItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // "file" or "folder"
  size: { type: Number, required: true },
  dataUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  // For folders, this contains the children (files and subfolders)
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "FileItem"
  }],
  // Reference to parent folder (null for root level items)
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FileItem",
    default: null
  }
}, { timestamps: true });

// Create a separate model for file items to enable self-referencing
const FileItem = mongoose.model("FileItem", fileItemSchema);

const bucketSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Root level files and folders
    files: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "FileItem"
    }],

    currentFile: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

const Bucket = mongoose.model("Bucket", bucketSchema);
export default Bucket;
export { FileItem };