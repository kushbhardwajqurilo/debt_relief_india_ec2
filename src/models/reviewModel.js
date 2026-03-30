const mongoose = require("mongoose");
const ReviewSchema = new mongoose.Schema(
  {
    google_review: { type: String, default: null },
    trust_pilot: { type: String, default: null },
    allow_users: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  },
  { timestamps: true },
);

const ReviewModel = mongoose.model("review", ReviewSchema);
module.exports = ReviewModel;
