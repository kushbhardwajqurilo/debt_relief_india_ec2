const mongoose = require("mongoose");
const outstandingSchemaa = new mongoose.Schema({
  phone: { type: Number, required: true },
  finalOutstandingAmount: {
    type: Number,
    required: [true, "final outstaing amount missing"],
  },
  finalSettelement: {
    type: Number,
    required: [true, "final settelement missing"],
  },
  finalPercentage: {
    type: Number,
    required: [true, "final percentage missing"],
  },
  finalSavings: { type: Number, required: [true, "final savings missing"] },
});

const outstandingModel = mongoose.model(
  "outstanding_settlement",
  outstandingSchemaa
);

module.exports = outstandingModel;
