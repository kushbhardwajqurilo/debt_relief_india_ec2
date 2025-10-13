const mongoose = require("mongoose");
const paidDialogBox = new mongoose.Schema({
  content: {
    type: String,
    required: [true, "content required"],
  },
});

const padiDialBoxModel = mongoose.model("paiddialogbox", paidDialogBox);
module.exports = padiDialBoxModel;
