const mongoose = require("mongoose");
const ReviewSchema = new mongoose.Schema(
  {
    allow_users: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  },
  { timestamps: true },
);

const ReviewModel = mongoose.model("review", ReviewSchema);
module.exports = ReviewModel;
