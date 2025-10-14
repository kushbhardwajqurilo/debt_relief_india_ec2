const mongoose = require("mongoose");
const paidDialogBox = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  alternatePhone: {
    type: String,
  },
  content: {
    type: String,
    required: [true, "content required"],
  },
  status: {
    type: Boolean,
    default: false,
  },
});

const padiDialBoxModel = mongoose.model("paiddialogbox", paidDialogBox);
module.exports = padiDialBoxModel;
