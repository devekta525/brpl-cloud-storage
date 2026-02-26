import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    // Parse the host from the MONGO_URI to hide the specific cluster shard name
    const uriHost = new URL(process.env.MONGO_URI).hostname;
    console.log(`MongoDB Connected: ${uriHost}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;