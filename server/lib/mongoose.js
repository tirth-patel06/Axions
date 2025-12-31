const mongoose = require("mongoose");

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI environment variable is not set");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

module.exports = mongoose;
