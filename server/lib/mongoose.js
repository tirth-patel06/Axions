const mongoose = require("mongoose");

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("❌ MONGO_URI environment variable is not set");
  process.exit(1);
}

mongoose
  .connect(mongoUri, {
    dbName: process.env.DB_NAME || "axions_db",
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log(`   Database: ${process.env.DB_NAME || "axions_db"}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

module.exports = mongoose;
