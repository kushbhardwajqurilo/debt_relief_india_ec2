const mongoose = require("mongoose");
if (!mongoose.connection.readyState) {
  mongoose
    .connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ DB Connected"))
    .catch((err) => console.error("❌ DB connection error:", err));
}
