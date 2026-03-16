const mongoose = require("mongoose");
const logSchema = new mongoose.Schema(
  {
    user_name: {
      type: String,
      default: "System",
    },
    role: {
      type: String,
      default: "Unknown",
    },
    action: {
      type: String,
      required: [true, "action required"],
    },
  },
  {
    timestamps: true,
  },
);
logSchema.index({ createdAt: -1 });
const logModel = mongoose.model("log", logSchema);
module.exports = logModel;
