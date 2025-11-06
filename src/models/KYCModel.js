const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "user missing"],
    ref: "user",
  },
  id: {
    type: String,
  },
  profile: {
    type: String,
    default: "blank.jpg",
  },
  image: {
    type: [String],

    default: [],
  },
  pdf: {
    type: [String], // store all PDFs URLs
    default: [],
  },
  name: {
    type: String,
    required: [true, "name required"],
  },
  lastname: {
    type: String,
  },
  status: {
    type: String,
    default: "pending",
  },
  phone: {
    type: String,
    required: [true, "phone number required"],
  },
  alernatePhone: {
    type: String,
    default: "0",
  },
  email: {
    type: String,
    required: [true, "email missing"],
    unique: true,
  },
  gender: {
    type: String,
  },
  joinDate: {
    type: Date,
    default: Date.now(),
  },
  assign_advocate: {
    type: String,
    ref: "advocate",
  },
  userType: {
    type: String,
  },
});

const KYCmodel = mongoose.model("kyc", kycSchema);
module.exports = KYCmodel;
