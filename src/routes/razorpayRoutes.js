const {
  PriorityCallPricePay,
  verifyPayment,
  EMIPayWithRazorPay,
  MonthlySubscriptionPayWithRazorpay,
} = require("../controllers/razorpay/razorpay.controller");
const { UserAuthMiddleWare } = require("../middlewares/userMiddleware");

const razorpayRouter = require("express").Router();

razorpayRouter.post("/create-order", PriorityCallPricePay);
razorpayRouter.post("/verifyPayment", verifyPayment);
razorpayRouter.post("/payemi", UserAuthMiddleWare, EMIPayWithRazorPay);
razorpayRouter.post(
  "/subscription-pay",
  UserAuthMiddleWare,
  MonthlySubscriptionPayWithRazorpay,
);

module.exports = razorpayRouter;
