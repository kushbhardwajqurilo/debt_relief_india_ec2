const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
  phone: { type: String },
  existingUser: { type: Boolean, default: false },
  userProfile: {
    type: String,
    default:
      "https://debtreliefindia-app.s3.eu-north-1.amazonaws.com/Banners/1767774594331-880255069-favicon.png",
  },
  aternatePhone: { type: String, default: "" },
  otp: { type: Number, default: 0 },
  otpExpire: { type: Date, default: "" },
});
const User = new mongoose.model("user", userSchema);
module.exports = User;
