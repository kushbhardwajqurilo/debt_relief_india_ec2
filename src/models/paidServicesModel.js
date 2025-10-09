const mongoose = require("mongoose");
const paidService = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Phone Number Required"],
  },
  serviceName: {
    type: String,
    required: [true, "Service Name Rerquired"],
  },
  emiNo: {
    type: Number,
    require: [true, "EMI Number Required"],
  },
  emiAmount: {
    type: Number,
    required: [true, "EMI Amount Required"],
  },
  date: {
    type: String,
    required: [true, "EMI Pay Date Required"],
  },
});

const PaidService = mongoose.model("Paid-service", paidService);
module.exports = PaidService;
