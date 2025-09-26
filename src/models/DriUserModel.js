// const mongoose = require("mongoose");
// const Counter = require("./counter");
// const userSchema = new mongoose.Schema({
//   id: {
//     type: String,
//   },
//   name: {
//     type: String,
//     required: true,
//   },
//   email: {
//     tyep: String,
//   },
//   gender: {
//     type: String,
//     default: "Other",
//   },
//   phone: {
//     type: String,
//     ref: "kyc",
//   },
//   credit_Cards: {
//     type: [String],
//     default: [],
//   },
//   credit_Amount: {
//     type: [String],
//     default: [],
//   },
//   CreditTotal: {
//     type: String,
//   },
//   personal_Loan: {
//     type: [String],
//     default: [],
//   },
//   PL_Amount: {
//     type: [String],
//     default: [],
//   },
//   PL_Total: {
//     type: String,
//     default: "",
//   },
//   Service_Fees: {
//     type: String,
//     default: "",
//   },
//   Service_Advance_Total: {
//     type: String,
//     default: "",
//   },
//   Final_Settlement: {
//     type: String,
//     default: "",
//   },
//   Settlement_Percent: {
//     type: String,
//     default: "",
//   },
//   totalEmi: {
//     type: Number,
//     default: 0,
//   },
//   monthlyEmi: {
//     type: String,
//     default: 0,
//   },
//   emiPay: {
//     type: Number,
//     default: 0,
//   },
//   loanType: {
//     type: String,
//     default: "",
//   },
//   status: {
//     type: "String",
//     default: "Pending",
//   },
//   dueDate: {
//     type: Date,
//   },
//   isDelete: {
//     type: Boolean,
//     default: false,
//   },
//   deletedAt: {
//     type: Date,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// const DrisModel = mongoose.model("DriUser", userSchema);
// module.exports = DrisModel;

const mongoose = require("mongoose");

const creditCardSchema = new mongoose.Schema({
  bank: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    default: "",
  },
  settlement: {
    type: String,
    default: "",
  },
  total: {
    type: String,
    default: "",
  },
  isOutstanding: {
    type: Boolean,
    default: false,
  },
});

const personalLoanSchema = new mongoose.Schema({
  bank: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    default: "",
  },
  settlement: {
    type: String,
    default: "",
  },
  total: {
    type: String,
    default: "",
  },
  isOutstanding: {
    type: Boolean,
    default: false,
  },
});

const userSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  gender: {
    type: String,
    default: "Other",
  },
  fees: { type: String, default: "N/A" },
  gst: { type: String, default: "N/A" },
  phone: {
    type: String,
    ref: "kyc",
  },
  credit_Cards: {
    type: [creditCardSchema],
    default: [],
  },
  CreditTotal: {
    type: String,
    default: "0",
  },
  personal_Loans: {
    type: [personalLoanSchema],
    default: [],
  },
  PL_Total: {
    type: String,
    default: "0",
  },
  Service_Fees: {
    type: String,
    default: "",
  },
  Service_Name: {
    type: String,
    default: "",
  },
  Service_Advance_Total: {
    type: String,
    default: "",
  },
  Final_Settlement: {
    type: String,
    default: "",
  },
  Settlement_Percent: {
    type: String,
    default: "",
  },
  totalEmi: {
    type: Number,
    default: 0,
  },
  monthlyEmi: {
    type: String,
    default: "0",
  },
  emiPay: {
    type: Number,
    default: 0,
  },
  loanType: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    default: "Pending",
  },
  joinDate: {
    type: Date,
  },
  dueDate: {
    type: Date,
  },
  insert: {
    type: Boolean,
    default: false,
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const DrisModel = mongoose.model("DriUser", userSchema);
module.exports = DrisModel;
