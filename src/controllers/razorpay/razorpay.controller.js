const razorpay = require("../../config/razorpay/razorpay");
const crypto = require("crypto");
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
