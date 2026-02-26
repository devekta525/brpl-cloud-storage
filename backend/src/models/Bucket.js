import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  dataUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

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
    files: [fileSchema],
  },
  { timestamps: true }
);

const Bucket = mongoose.model("Bucket", bucketSchema);
export default Bucket;
