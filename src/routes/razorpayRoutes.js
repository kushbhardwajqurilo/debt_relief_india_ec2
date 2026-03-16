const {
  PriorityCallPricePay,
  verifyPayment,
} = require("../controllers/razorpay/razorpay.controller");

const razorpayRouter = require("express").Router();

razorpayRouter.post("/create-order", PriorityCallPricePay);
razorpayRouter.post("/verifyPayment", verifyPayment);

module.exports = razorpayRouter;
