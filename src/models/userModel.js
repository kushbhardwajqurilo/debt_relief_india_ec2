const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
  phone: { type: String },
  existingUser: { type: Boolean, default: false },
  userProfile: {
    type: String,
    default:
      "https://res-console.cloudinary.com/dqwc7j44b/thumbnails/v1/image/upload/v1767778832/ZmF2aWNvbl9wdWE2ZXI=/as_is",
  },
  aternatePhone: { type: String, default: "" },
  otp: { type: Number, default: 0 },
  otpExpire: { type: Date, default: "" },
});
const User = new mongoose.model("user", userSchema);
module.exports = User;
