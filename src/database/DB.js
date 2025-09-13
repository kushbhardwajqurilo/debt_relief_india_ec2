const mongoose = require("mongoose");

let isConnected = false; // track status manually

const connectDB = async () => {
  if (isConnected) {
    return; // already connected
  }

  try {
    const conn = await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = mongoose.connection.readyState === 1;

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ DB connection error:", err);
    process.exit(1); // stop the app if DB fails
  }
};

module.exports = connectDB;
