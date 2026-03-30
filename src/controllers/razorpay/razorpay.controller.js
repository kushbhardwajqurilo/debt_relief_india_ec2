const { default: mongoose } = require("mongoose");
const razorpay = require("../../config/razorpay/razorpay");
const crypto = require("crypto");
const DrisModel = require("../../models/DriUserModel");
const { subscriptionModel } = require("../../models/monthlySubscriptionModel");
// <----- Priority Call Back 50 Rupees Start ------>
exports.PriorityCallPricePay = async (req, res, next) => {
  try {
    const amount = 10;
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    console.log("order", order);
    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "Order Creation failed",
      error: error.message,
    });
  }
};

exports.verifyPayment = (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    return res.json({ success: true, message: "Payment verified" });
  }

  return res.status(400).json({ success: false, message: "Invalid signature" });
};
// <----- Priority Call Back 50 Rupees End ------>

// EMI Pay RazorPay Configuration...

exports.EMIPayWithRazorPay = async (req, res) => {
  try {
    const { user_id, phone } = req;
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: " Credentials Missing",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid  Credentials",
      });
    }
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone Number Requred",
      });
    }
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter valid Indian mobile number",
      });
    }
    const user = await DrisModel.findOne({ userId: user_id });
    // console.log("user", user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    if (user.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Your EMI Has Been Closed",
      });
    }
    const amount = Number(user?.monthlyEmi);
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid EMI amount",
      });
    }
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    console.log("order", order);
    if (order?.status !== "created") {
      return res
        .status(400)
        .json({ success: false, message: "Faild to create order" });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.log("EMI Payment Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// EMI Pay RazorPay Cnfiguration End...

// Pay Monthly Subscription With Razorpay Start ....
exports.MonthlySubscriptionPayWithRazorpay = async (req, res) => {
  try {
    const { user_id, phone } = req;
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: " Credentials Missing",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid  Credentials",
      });
    }
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone Number Requred",
      });
    }
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter valid Indian mobile number",
      });
    }
    const user = await subscriptionModel.findOne({ userId: user_id });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Subscription not found",
      });
    }
    const amount = Number(user?.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid EMI amount",
      });
    }
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    if (order?.status !== "created") {
      return res
        .status(400)
        .json({ success: false, message: "Faild to create order" });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.log("Monthly Subsctiption Payment Error:", error);
  }
};
// Pay Monthly Subscription With Razorpay End ....
