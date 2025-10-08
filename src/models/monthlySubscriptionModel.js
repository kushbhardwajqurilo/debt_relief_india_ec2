const mongoose = require("mongoose");

// Main subscription
const subscriptionSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",
    required: [true, "admin id is required"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: [true, "user id required"],
  },
  subscription: {
    type: String,
    required: [true, "subscription missing"],
  },
  gst: {
    type: Number,
    required: [true, "gst missing"],
  },
  amount: {
    type: Number,
    required: [true, "amount missing"],
  },
  dueDate: {
    type: Date,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  unPaid: {
    type: [Date],
  },
});

// Paid subscription
const paidSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: [true, "user id required"],
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",
    required: [true, "admin id required"],
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "subscription",
    required: [true, "subscription id required"],
  },
  paidForMonth: {
    type: String, // e.g. "October 2025"
    required: [true, "Paid month required"],
  },
  paidForDueDate: {
    type: Date,
    required: [true, "Paid due date required"],
  },
  amount: {
    type: Number,
    required: [true, "amount required"],
  },
  gst: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: [true, "total amount required"],
  },
  status: {
    type: String,
    enum: ["paid", "failed", "pending"],
    default: "paid",
  },
});

const subscriptionModel =
  mongoose.models.subscription ||
  mongoose.model("subscription", subscriptionSchema);

const paidSubscriptionModel =
  mongoose.models.paidSubscription ||
  mongoose.model("paidSubscription", paidSubscriptionSchema);

module.exports = { subscriptionModel, paidSubscriptionModel };
