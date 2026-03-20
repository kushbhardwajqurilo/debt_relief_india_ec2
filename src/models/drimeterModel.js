const mongoose = require("mongoose");
const DriMeterSchema = new mongoose.Schema({
  fees: { type: Number, default: 0 },
  settlement_percentage: { type: Number, default: 0 },
  enroll_fees: { type: Number, default: 0 },
  harashment_plan: { type: Number, default: 0 },
});

const DriMeterModel = mongoose.model("drimeter", DriMeterSchema);
module.exports = DriMeterModel;
