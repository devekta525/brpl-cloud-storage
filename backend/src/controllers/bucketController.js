import Bucket, { FileItem } from "../models/Bucket.js";

// Helper function to recursively populate file items
const populateFileItems = async (fileItemIds) => {
  if (!fileItemIds || fileItemIds.length === 0) return [];
  
  const items = await FileItem.find({ _id: { $in: fileItemIds } });
  
  // Recursively populate children for each item
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      item.children = await populateFileItems(item.children);
    }
  }
  
  return items;
};

// @route   GET /api/buckets
export const getBuckets = async (req, res) => {
  try {
    const buckets = await Bucket.find({ user: req.user._id }).populate({
      path: 'files',
      populate: {
        path: 'children',
        recursive: true // This won't work with mongoose, so we'll do it manually
      }
    });
    
    // Manually populate nested children
    for (const bucket of buckets) {
      if (bucket.files && bucket.files.length > 0) {
        bucket.files = await populateFileItems(bucket.files);
      }
    }
    
    res.json(buckets);
  } catch (error) {
    console.error(error);
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
    const { name, type, size, dataUrl, parentId } = req.body;
    const bucket = await Bucket.findById(req.params.id);

    if (!bucket || bucket.user.toString() !== req.user._id.toString()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Bucket not found or unauthorized" });
    }

    const dir = path.join(process.cwd(), "uploads", bucket.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Build full path for file storage
    let fullPath = name;
    let parentFolder = null;
    
    if (parentId) {
      parentFolder = await FileItem.findById(parentId);
      if (!parentFolder || parentFolder.type !== "folder") {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "Invalid parent folder" });
      }
      // Build path from root
      const pathParts = [name];
      let currentParent = parentFolder;
      while (currentParent) {
        pathParts.unshift(currentParent.name);
        if (currentParent.parent) {
          currentParent = await FileItem.findById(currentParent.parent);
        } else {
          break;
        }
      }
      fullPath = pathParts.join("/");
    }

    // Handle nested folder paths - create directory structure if needed
    const filePath = path.join(dir, fullPath);
    const fileDir = path.dirname(filePath);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    
    if (req.file) {
      fs.renameSync(req.file.path, filePath);
    } else if (dataUrl) {
      const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        fs.writeFileSync(filePath, match[2], "base64");
      }
    }

    // Create file item
    const fileItem = new FileItem({
      name: name.split("/").pop(), // Just the filename, not the full path
      type: type || "file",
      size: size || 0,
      dataUrl: `/api/public/${bucket.name}/${fullPath}`,
      parent: parentId || null,
      children: []
    });

    await fileItem.save();

    // Add to parent folder's children or bucket's root files
    if (parentId && parentFolder) {
      parentFolder.children.push(fileItem._id);
      await parentFolder.save();
    } else {
      bucket.files.push(fileItem._id);
      await bucket.save();
    }

    // Populate the response
    const populatedBucket = await Bucket.findById(bucket._id).populate({
      path: 'files',
      populate: { path: 'children' }
    });
    populatedBucket.files = await populateFileItems(populatedBucket.files);

    res.status(201).json(populatedBucket);
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error(error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// Helper function to recursively delete file items and their children
const deleteFileItemRecursive = async (fileItemId) => {
  const fileItem = await FileItem.findById(fileItemId);
  if (!fileItem) return;

  // Recursively delete all children
  if (fileItem.children && fileItem.children.length > 0) {
    for (const childId of fileItem.children) {
      await deleteFileItemRecursive(childId);
    }
  }

  // Delete the file item itself
  await FileItem.findByIdAndDelete(fileItemId);
};

// @route   DELETE /api/buckets/:id/files/:fileId
export const deleteFileFromBucket = async (req, res) => {
  try {
    const bucket = await Bucket.findById(req.params.id);

    if (!bucket || bucket.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Bucket not found or unauthorized" });
    }

    const fileItem = await FileItem.findById(req.params.fileId);
    if (!fileItem) {
      return res.status(404).json({ message: "File not found" });
    }

    // Remove from parent's children array or bucket's files array
    if (fileItem.parent) {
      const parent = await FileItem.findById(fileItem.parent);
      if (parent) {
        parent.children = parent.children.filter(
          (id) => id.toString() !== req.params.fileId
        );
        await parent.save();
      }
    } else {
      bucket.files = bucket.files.filter(
        (id) => id.toString() !== req.params.fileId
      );
      await bucket.save();
    }

    // Recursively delete the file item and all its children
    await deleteFileItemRecursive(req.params.fileId);

    // Populate the response
    const populatedBucket = await Bucket.findById(bucket._id).populate({
      path: 'files',
      populate: { path: 'children' }
    });
    populatedBucket.files = await populateFileItems(populatedBucket.files);

    res.json(populatedBucket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @route   POST /api/buckets/:id/folders
export const createFolder = async (req, res) => {
  try {
    const { folderName, parentId } = req.body;
    const bucket = await Bucket.findById(req.params.id);

    if (!bucket || bucket.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Bucket not found or unauthorized" });
    }

    // Validate folder name
    if (!folderName || !folderName.trim()) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const cleanFolderName = folderName.trim();

    // Check if folder already exists in the current location
    let existingItems = [];
    if (parentId) {
      const parentFolder = await FileItem.findById(parentId);
      if (!parentFolder || parentFolder.type !== "folder") {
        return res.status(400).json({ message: "Invalid parent folder" });
      }
      existingItems = await FileItem.find({ 
        parent: parentId,
        name: cleanFolderName,
        type: "folder"
      });
    } else {
      // Check root level
      const rootItems = await FileItem.find({ _id: { $in: bucket.files } });
      existingItems = rootItems.filter(item => 
        item.name === cleanFolderName && item.type === "folder"
      );
    }

    if (existingItems.length > 0) {
      return res.status(400).json({ message: "Folder already exists" });
    }

    // Build full path for folder storage
    let fullPath = cleanFolderName;
    if (parentId) {
      const parentFolder = await FileItem.findById(parentId);
      const pathParts = [cleanFolderName];
      let currentParent = parentFolder;
      while (currentParent) {
        pathParts.unshift(currentParent.name);
        if (currentParent.parent) {
          currentParent = await FileItem.findById(currentParent.parent);
        } else {
          break;
        }
      }
      fullPath = pathParts.join("/");
    }

    // Create folder entry
    const folder = new FileItem({
      name: cleanFolderName,
      type: "folder",
      size: 0,
      dataUrl: `/api/public/${bucket.name}/${fullPath}/`,
      parent: parentId || null,
      children: []
    });

    await folder.save();

    // Add to parent folder's children or bucket's root files
    if (parentId) {
      const parentFolder = await FileItem.findById(parentId);
      parentFolder.children.push(folder._id);
      await parentFolder.save();
    } else {
      bucket.files.push(folder._id);
      await bucket.save();
    }

    // Create the actual folder directory on disk
    const folderPath = path.join(process.cwd(), "uploads", bucket.name, fullPath);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Populate the response
    const populatedBucket = await Bucket.findById(bucket._id).populate({
      path: 'files',
      populate: { path: 'children' }
    });
    populatedBucket.files = await populateFileItems(populatedBucket.files);

    res.status(201).json(populatedBucket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

const findFileByPath = async (fileItems, targetPath) => {
  const parts = targetPath.split('/').filter(Boolean);
  let currentItems = fileItems;
  let currentItem = null;

  for (let i = 0; i < parts.length; i++) {
    currentItem = currentItems.find(item => item.name === parts[i]);
    if (!currentItem) return null;

    if (i < parts.length - 1) {
      currentItems = currentItem.children || [];
    }
  }
  
  return currentItem;
};

// @route   GET /api/public/:bucketName/:fileName
export const getFileByName = async (req, res) => {
  try {
    const { bucketName } = req.params;
    let fileName = req.params.fileName;
    
    // In Express 5 wildcard routes (*fileName) pass the parameter as an array of path segments
    if (Array.isArray(fileName)) {
      fileName = fileName.join('/');
    }
    const bucket = await Bucket.findOne({ name: bucketName });
    if (!bucket) return res.status(404).send('Bucket not found');

    // Populate files and search recursively
    const populatedFiles = await populateFileItems(bucket.files);
    console.log('getFileByName inputs:', {bucket: bucketName, fileName, isArray: Array.isArray(req.params.fileName), param: req.params.fileName});
    const file = await findFileByPath(populatedFiles, fileName);
    
    if (!file) {
      console.log('findFileByPath returned null for:', fileName);
      return res.status(404).send('File not found');
    }

    // Extract the actual file path from dataUrl or construct it
    let filePath = path.join(process.cwd(), "uploads", bucketName, fileName);
    
    // Try to get path from dataUrl if available
    if (file.dataUrl) {
      const urlPath = file.dataUrl.replace(`/api/public/${bucketName}/`, '');
      if (urlPath) {
        filePath = path.join(process.cwd(), "uploads", bucketName, urlPath);
      }
    }

    if (!fs.existsSync(filePath)) {
      // Fallback: previous backend bug saved files to disk omitting the immediate parent folder name
      const parts = fileName.split('/');
      if (parts.length > 1) {
        const defectiveParts = [...parts];
        defectiveParts.splice(defectiveParts.length - 2, 1);
        const defectivePath = path.join(process.cwd(), "uploads", bucketName, defectiveParts.join('/'));
        if (fs.existsSync(defectivePath)) {
          filePath = defectivePath;
        }
      }
    }

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
    console.error(error);
    res.status(500).send('Server Error');
  }
};
