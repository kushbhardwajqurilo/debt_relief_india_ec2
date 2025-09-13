const mongoose = require("mongoose");
const DRISchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: [true, "content required"],
  },
  avatar: {
    type: String,
    default: ".jpb/png",
  },
  public_id: {
    type: String,
    required: true,
  },
});

const DRIModel = new mongoose.model("driwork", DRISchema);
module.exports = DRIModel;
