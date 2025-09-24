const mongoose = require("mongoose");
const subscriptionSchema = mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "admin id is required"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "user id required"],
  },
  subscription: {
    type: String,
    required: [true, "subscription missing"],
  },
  gst: {
    type: Number,
    required: [true, "gst  missing"],
  },
  amount: {
    type: Number,
    required: [true, "amount missing"],
  },
  dueDate: {
    type: Date,
  },
});

const subscriptionModel = new mongoose.model(
  "subscription",
  subscriptionSchema
);
module.exports = subscriptionModel;
