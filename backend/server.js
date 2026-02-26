import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/db.js";

import authRoutes from "./src/routes/authRoutes.js";
import bucketRoutes from "./src/routes/bucketRoutes.js";

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/buckets", bucketRoutes);

import { getFileByName } from "./src/controllers/bucketController.js";
app.get("/api/public/:bucketName/:fileName", getFileByName);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));
