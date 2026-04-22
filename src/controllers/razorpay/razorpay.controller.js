require("dotenv").config({});
const { default: mongoose } = require("mongoose");
const razorpay = require("../../config/razorpay/razorpay");
const crypto = require("crypto");
const DrisModel = require("../../models/DriUserModel");
const {
  subscriptionModel,
  paidSubscriptionModel,
} = require("../../models/monthlySubscriptionModel");
// <----- Priority Call Back 50 Rupees Start ------>
exports.PriorityCallPricePay = async (req, res, next) => {
  try {
    const amount = 50;
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
  try {
    // console.log("secret", process.env.RAZORPAY_SECRET_KEY);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      return res.json({ success: true, message: "Payment verified" });
    }

    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  } catch (error) {
    console.log("error verify:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
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
    // console.log("order", order);
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
exports.verifyPaymentAndUpdteMonthlySubscription = async (req, res) => {
  try {
    // console.log("secret", process.env.RAZORPAY_SECRET_KEY);
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscriptionId,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const subscription = await subscriptionModel.findById(subscriptionId);

      // 2️⃣ Mark current month as paid
      subscription.isPaid = true;
      await subscription.save();

      // 3️⃣ Add entry to paidSubscription
      const paidSub = await paidSubscriptionModel.create({
        subscriptionId: subscription._id,
        userId: subscription.userId,
        adminId: subscription.adminId,
        paidForMonth: new Date(subscription.dueDate).toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        paidForDueDate: subscription.dueDate,
        amount: subscription.amount,
        gst: subscription.gst,
        totalAmount:
          subscription.amount + (subscription.amount * subscription.gst) / 100,
        paymentMode: "ONLINE",
        transactionId: null,
        status: "paid",
      });

      // 4️⃣ Increment subscription dueDate by 1 month
      if (subscription.dueDate) {
        const nextDueDate = new Date(subscription.dueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);

        subscription.dueDate = nextDueDate;
        subscription.isPaid = false;
        await subscription.save();
      }
      const user = await DrisModel.findOne(
        { userId: subscription?.userId },
        "id",
      );
      // return res.status(200).json({
      //   success: true,
      //   message: "Subscription marked as paid successfully",
      //   paidSubscription: paidSub,
      // });
      return res.json({ success: true, message: "Payment verified" });
    }

    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  } catch (error) {
    console.log("error verify:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};
// Pay Monthly Subscription With Razorpay End ....
