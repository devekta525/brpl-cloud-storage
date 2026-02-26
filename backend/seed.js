import connectDB from "./src/config/db.js";
import User from "./src/models/User.js";
import dotenv from "dotenv";
dotenv.config();

const seed = async () => {
    await connectDB();
    const existing = await User.findOne({ email: "admin@cloudstore.com" });
    if (!existing) {
        await User.create({ name: "Admin", email: "admin@cloudstore.com", password: "admin123" });
        console.log("Seeded");
    } else {
        console.log("Already seeded");
    }
    process.exit();
};
seed();
