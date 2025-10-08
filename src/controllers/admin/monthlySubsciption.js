const { default: mongoose } = require("mongoose");
const adminModel = require("../../models/adminModel");
const User = require("../../models/userModel");

const DrisModel = require("../../models/DriUserModel");
const KYCmodel = require("../../models/KYCModel");
const {
  subscriptionModel,
  paidSubscriptionModel,
} = require("../../models/monthlySubscriptionModel");
exports.SubscriptionsController = async (req, res, next) => {
  try {
    const validation = {
      subscription: "",
      gst: "",
      duedate: "",
      client: "",
    };
    const { admin_id, role } = req;
    const { subscription, gst, client, duedate } = req.body;
    const fees = parseInt(subscription);
    const amount = fees + (fees * gst) / 100;
    if (!admin_id || !role) {
      return res.status(400).json({ message: "Invalid admin credentials" });
    }

    if (!mongoose.Types.ObjectId.isValid(admin_id)) {
      return res.status(400).json({ message: "Invalid admin ID format" });
    }

    const admin = await adminModel.findById(admin_id);
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    for (let val of Object.keys(validation)) {
      const field = req.body[val];
      if (
        field === undefined ||
        field === null ||
        String(field).trim().length === 0
      ) {
        return res
          .status(400)
          .json({ success: false, message: `${val} is Require` });
      }
    }
    const payload = {
      adminId: admin_id,
      subscription,
      userId: client,
      gst,
      amount: Math.round(amount),
      dueDate: duedate,
    };
    const newSubscription = await subscriptionModel.create(payload);

    return res.status(201).json({
      success: true,
      message: "Subscription saved successfully.",
      data: newSubscription,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// get perticular user subscriptions for admin...

exports.getUsersSubscriptionToAdmin = async (req, res, next) => {
  try {
    const { role, admin_id } = req;
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: "User id is required" });
    }
    if (!role || !admin_id) {
      return res.status(400).json({ message: "admin credential missing" });
    }
    // by admin

    const isExist = await adminModel.findById(admin_id);
    if (!isExist) {
      return res.status(400).json({ message: "Admin not found" });
    }
    const isUser = await User.findById(id);
    if (!isUser) {
      return res.status(400).json({ message: "User not found" });
    }
    const subscription = await subscriptionModel
      .find({ userId: id })
      .select("-_id -userId -adminId -__v");
    if (!subscription || subscription.length === 0) {
      return res.status(400).json({ message: "User has no subscription" });
    }
    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// get  perticular user subscriptions for user...
exports.getUsersSubscriptionToUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log("id", id);
    const subscription = await subscriptionModel
      .find({ userId: id })
      .select("-adminId -__v");
    if (!subscription || subscription.length === 0) {
      return res
        .status(400)
        .json({ message: "You don’t have an subscription" });
    }
    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//update subscription by admin...
exports.updateSubscription = async (req, res, next) => {
  try {
    const { admin_id } = req;
    const { id } = req.query;
    const { subscription, gst, duedate, subscriptionId } = req.body;
    const fees = 1000;
    const amount = fees + (fees * gst) / 100;
    if (!duedate || isNaN(new Date(duedate))) {
      return res.status(400).json({ message: "Invalid due date" });
    }
    const parsedDueDate = new Date(duedate);
    const updatedSubscription = {
      subscription,
      amount,
      gst,
      duedate: parsedDueDate,
      userId: id,
      adminId: admin_id,
    };
    if (!id) {
      return res.status(400).json({ message: "User required" });
    }
    if (!role || !admin_id) {
      return res.status(400).json({ message: "Invalid admin credentials" });
    }

    const isUser = await User.findById(id);
    if (!isUser || isUser.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }
    const subscriptionResponse = await subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      updatedSubscription,
      { new: true }
    );
    if (!subscriptionResponse) {
      return res.status(400).json({ message: "Subscription not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Subscription Update",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// subscription delete by admin..
exports.deleteSubscription = async (req, res, next) => {
  try {
    const { role, admin_id } = req;
    const { id } = req.query;
    const { subscriptionId } = req.body;
    if (!role || !admin_id) {
      return res.status(400).json({ message: "Invalid admin credentials" });
    }
    const isUser = await User.findById(id);
    if (!isUser || isUser.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }
    const subscription = await subscriptionModel.findByIdAndDelete(
      subscriptionId
    );
    if (!subscription) {
      return res.status(400).json({ message: "Subscription not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Subscription Deleted",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// get all users to admin
exports.getAllUserToAdmin = async (req, res) => {
  try {
    const validation = {
      admin_id: "",
      role: "",
    };

    const { admin_id, role } = req;

    // validation
    for (let val of Object.keys(validation)) {
      if (!req[val] || req[val].toString().trim().length === 0) {
        return res
          .status(400)
          .json({ success: false, message: `${val} is required` });
      }
      if (val === "admin_id") {
        if (!mongoose.Types.ObjectId.isValid(req[val])) {
          return res
            .status(400)
            .json({ success: false, message: "admin_id not valid" });
        }
      }
    }

    // fetch all users
    const drisUsers = await DrisModel.find({ isDelete: { $ne: true } });
    const kycUsers = await KYCmodel.find();

    // make map of kyc users by phone
    const kycMap = new Map();
    kycUsers.forEach((k) => {
      if (k.phone) {
        kycMap.set(k.phone, k);
      }
    });

    // now filter & map
    const formateUser = drisUsers
      .filter((e) => e.phone && kycMap.has(e.phone))
      .map((e) => {
        const kyc = kycMap.get(e.phone);
        return {
          id: e.id, // from DrisModel
          name: e.name, // from DrisModel
          _id: kyc.user_id, // from KYCmodel (not DrisModel)
        };
      });
    return res.status(200).json({ success: true, data: formateUser });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

//  paid subscriptions

// Mark subscription as paid
exports.markSubscriptionAsPaid = async (req, res) => {
  try {
    const { subscriptionId, paymentMode, transactionId } = req.body;
    const adminId = req.admin_id; // from auth middleware

    if (!subscriptionId) {
      return res.status(400).json({ message: "Subscription ID is required" });
    }

    // 1️⃣ Find the subscription
    const subscription = await subscriptionModel.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

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
      paymentMode: paymentMode || "UPI",
      transactionId: transactionId || null,
      status: "paid",
    });

    // 4️⃣ Increment subscription dueDate by 1 month and reset isPaid
    if (subscription.dueDate) {
      const nextDueDate = new Date(subscription.dueDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);

      subscription.dueDate = nextDueDate;
      subscription.isPaid = false; // mark next month as unpaid
      await subscription.save();
    }

    return res.status(200).json({
      success: true,
      message: "Subscription marked as paid successfully",
      paidSubscription: paidSub,
    });
  } catch (error) {
    console.error("Error marking subscription as paid:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Get all paid subscriptions
exports.getPaidSubscriptions = async (req, res) => {
  try {
    const adminId = req.admin_id;
    const { userId } = req.query; // optional filters

    const filter = {};
    if (userId) filter.userId = userId;
    if (adminId) filter.adminId = adminId;

    const paidSubs = await paidSubscriptionModel
      .find(filter)
      .populate("userId", "name email") // optional: populate user info
      .populate("adminId", "name email") // optional: populate admin info
      .populate("subscriptionId", "subscription amount gst dueDate") // optional: populate subscription info
      .sort({ paidForDueDate: -1 });

    return res.status(200).json({ success: true, data: paidSubs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// data [
//   {

//   }
// ]
