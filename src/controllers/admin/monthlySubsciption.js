const { default: mongoose } = require("mongoose");
const adminModel = require("../../models/adminModel");
const User = require("../../models/userModel");

const DrisModel = require("../../models/DriUserModel");
const KYCmodel = require("../../models/KYCModel");
const {
  subscriptionModel,
  paidSubscriptionModel,
} = require("../../models/monthlySubscriptionModel");
const fcmTokenModel = require("../../models/fcmTokenModel");
const {
  sendNotificationToSingleUser,
} = require("../../config/expo-push-notification/expoNotification");
const { createLog } = require("../../utilitis/log");
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

    // ---------------- VALIDATIONS ----------------
    if (!admin_id || !role) {
      await createLog({
        user_name: "Unknown",
        role: "unknown",
        action:
          "Someone tried to create subscription but admin credentials missing",
      });

      return res.status(400).json({ message: "Invalid admin credentials" });
    }

    if (!mongoose.Types.ObjectId.isValid(admin_id)) {
      return res.status(400).json({ message: "Invalid admin ID format" });
    }

    if (!mongoose.Types.ObjectId.isValid(client)) {
      return res.status(400).json({ message: "Invalid client ID format" });
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
          .json({ success: false, message: `${val} is required` });
      }
    }

    const admin = await adminModel.findById(admin_id, "name");
    if (!admin) {
      await createLog({
        user_name: "Unknown",
        role,
        action: "Invalid admin tried to create/update subscription",
      });

      return res.status(400).json({ message: "Admin not found" });
    }

    // ---------------- CALCULATIONS ----------------
    const fees = parseInt(subscription);
    const amount = fees + (fees * gst) / 100;

    const payload = {
      adminId: admin_id,
      subscription: fees,
      userId: new mongoose.Types.ObjectId(client),
      gst,
      amount: Math.round(amount),
      dueDate: duedate,
    };

    // ---------------- CHECK EXISTING SUBSCRIPTION ----------------
    const existingSubscription = await subscriptionModel.findOne({
      userId: payload.userId,
    });

    let result;
    let message;

    if (existingSubscription) {
      result = await subscriptionModel.findByIdAndUpdate(
        existingSubscription._id,
        payload,
        { new: true },
      );

      message = "Subscription updated successfully";
      const clientName = await DrisModel.findOne({ userId: client }, "id");
      await createLog({
        user_name: admin?.name,
        role,
        action: `${admin?.name} updated subscription | ClientId:${clientName.id} | Amount:${amount} | GST:${gst}% | Amount:${Math.round(amount)}`,
      });
    } else {
      result = await subscriptionModel.create(payload);

      message = "Subscription created successfully";

      await createLog({
        user_name: admin?.name,
        role,
        action: `${admin?.name} created subscription | ClientId:${client} | Amount:${Math.round(amount)}`,
      });
    }

    return res.status(201).json({
      success: true,
      message,
      data: result,
    });
  } catch (err) {
    console.error(err);

    await createLog({
      user_name: "System",
      role: "error",
      action: `Error while creating/updating subscription -> ${err.message}`,
    });

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
exports.getSubscriptionToUser = async (req, res, next) => {
  try {
    const { user_id } = req;
    const subscription = await subscriptionModel
      .find({ userId: user_id })
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
    console.log("error", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//update subscription by admin...
exports.updateSubscription = async (req, res, next) => {
  try {
    const { admin_id, role } = req;
    const { id } = req.query;
    const { subscription, gst, duedate, subscriptionId } = req.body;

    if (!role || !admin_id) {
      await createLog({
        user_name: "Unknown",
        role: "unknown",
        action:
          "Someone tried to update subscription but admin credentials missing",
      });

      return res.status(400).json({ message: "Invalid admin credentials" });
    }

    const admin = await adminModel.findById(admin_id, "name");

    const fees = 1000;
    const amount = fees + (fees * gst) / 100;

    if (!duedate || isNaN(new Date(duedate))) {
      await createLog({
        user_name: admin?.name || "Admin",
        role,
        action: `${admin?.name} tried to update subscription but invalid due date`,
      });

      return res.status(400).json({ message: "Invalid due date" });
    }

    if (!id) {
      await createLog({
        user_name: admin?.name || "Admin",
        role,
        action: `${admin?.name} tried to update subscription but user id missing`,
      });

      return res.status(400).json({ message: "User required" });
    }

    const parsedDueDate = new Date(duedate);

    const isUser = await User.findById(id);

    if (!isUser) {
      await createLog({
        user_name: admin?.name || "Admin",
        role,
        action: `${admin?.name} tried to update subscription but user not found | UserId:${id}`,
      });

      return res.status(400).json({ message: "User not found" });
    }

    const updatedSubscription = {
      subscription,
      amount,
      gst,
      duedate: parsedDueDate,
      userId: id,
      adminId: admin_id,
    };

    const subscriptionResponse = await subscriptionModel.findByIdAndUpdate(
      subscriptionId,
      updatedSubscription,
      { new: true },
    );

    if (!subscriptionResponse) {
      await createLog({
        user_name: admin?.name || "Admin",
        role,
        action: `${admin?.name} tried to update subscription but subscription not found | SubscriptionId:${subscriptionId}`,
      });

      return res.status(400).json({ message: "Subscription not found" });
    }

    await createLog({
      user_name: admin?.name,
      role,
      action: `${admin?.name} updated subscription | User:${isUser.name} | Amount:${amount}`,
    });

    return res.status(200).json({
      success: true,
      message: "Subscription Update",
    });
  } catch (err) {
    await createLog({
      user_name: admin?.name,
      role: "role",
      action: `Error while updating subscription -> ${err.message}`,
    });

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
      await createLog({
        user_name: "Unknown",
        role: "unknown",
        action:
          "Someone tried to delete subscription but admin credentials missing",
      });

      return res.status(400).json({ message: "Invalid admin credentials" });
    }

    const admin = await adminModel.findById(admin_id, "name");

    const isUser = await User.findById(id);

    if (!isUser) {
      await createLog({
        user_name: admin?.name || "Admin",
        role,
        action: `${admin?.name} tried to delete subscription but user not found | UserId:${id}`,
      });

      return res.status(400).json({ message: "User not found" });
    }

    const subscription =
      await subscriptionModel.findByIdAndDelete(subscriptionId);

    if (!subscription) {
      await createLog({
        user_name: admin?.name || "Admin",
        role,
        action: `${admin?.name} tried to delete subscription but not found | SubscriptionId:${subscriptionId}`,
      });

      return res.status(400).json({ message: "Subscription not found" });
    }

    await createLog({
      user_name: admin?.name,
      role,
      action: `${admin?.name} deleted subscription | User:${isUser.name} | SubscriptionId:${subscriptionId}`,
    });

    return res.status(200).json({
      success: true,
      message: "Subscription Deleted",
    });
  } catch (err) {
    await createLog({
      user_name: "System",
      role: "error",
      action: `Error while deleting subscription -> ${err.message}`,
    });

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// get all users to admin
// exports.getAllUserToAdmin = async (req, res) => {
//   try {
//     const validation = {
//       admin_id: "",
//       role: "",
//     };

//     const { admin_id, role } = req;

//     // validation
//     for (let val of Object.keys(validation)) {
//       if (!req[val] || req[val].toString().trim().length === 0) {
//         return res
//           .status(400)
//           .json({ success: false, message: `${val} is required` });
//       }
//       if (val === "admin_id") {
//         if (!mongoose.Types.ObjectId.isValid(req[val])) {
//           return res
//             .status(400)
//             .json({ success: false, message: "admin_id not valid" });
//         }
//       }
//     }

//     // fetch all users
//     const drisUsers = await DrisModel.find({ isDelete: { $ne: true } });
//     const kycUsers = await KYCmodel.find();

//     // make map of kyc users by phone
//     const kycMap = new Map();
//     kycUsers.forEach((k) => {
//       if (k.phone) {
//         kycMap.set(k.phone, k);
//       }
//     });

//     // now filter & map
//     const formateUser = drisUsers
//       .filter((e) => e.phone && kycMap.has(e.phone))
//       .map((e) => {
//         const kyc = kycMap.get(e.phone);
//         return {
//           id: e.id, // from DrisModel
//           name: e.name, // from DrisModel
//           _id: kyc.user_id, // from KYCmodel (not DrisModel)
//         };
//       });
//     return res.status(200).json({ success: true, data: formateUser });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//       error,
//     });
//   }
// };

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

    // fetch all collections
    const drisUsers = await DrisModel.find({ isDelete: { $ne: true } });
    const allUsers = await User.find({});
    const kycUsers = await KYCmodel.find();

    // maps for quick lookup
    const userMap = new Map();
    allUsers.forEach((u) => {
      if (u.phone) userMap.set(u.phone, u);
    });

    const kycMap = new Map();
    kycUsers.forEach((k) => {
      if (k.phone) kycMap.set(k.phone, k);
    });

    // main mapping
    const formateUser = drisUsers.map((e) => {
      const user = userMap.get(e.phone);
      const kyc = kycMap.get(e.phone);

      // CASE 1: existingUser = true → from User model
      if (user && user.existingUser === true) {
        return {
          id: e.id, // from DrisModel
          name: user.name || e.name, // prefer User name
          user_id: user._id, // from User
        };
      }

      // CASE 2: existingUser = false → from KYCmodel
      if (kyc) {
        return {
          id: e.id, // from DrisModel
          name: e.name || kyc.name, // prefer Dris name
          user_id: kyc.user_id, // from KYCmodel
        };
      }

      // CASE 3: neither exists → skip or return null
      return null;
    });

    // filter out nulls
    const finalData = formateUser.filter(Boolean);

    return res.status(200).json({ success: true, data: finalData });
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
    const adminId = req.admin_id;
    const role = req.role;

    if (!subscriptionId) {
      await createLog({
        user_name: "Unknown",
        role: "unknown",
        action:
          "Someone tried to mark subscription as paid but subscriptionId missing",
      });

      return res.status(400).json({ message: "Subscription ID is required" });
    }

    const admin = await adminModel.findById(adminId, "name");

    // 1️⃣ Find the subscription
    const subscription = await subscriptionModel.findById(subscriptionId);

    if (!subscription) {
      await createLog({
        user_name: admin?.name || "Admin",
        role,
        action: `${admin?.name} tried to mark subscription as paid but subscription not found `,
      });

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
    await createLog({
      user_name: admin?.name,
      role,
      action: `${admin?.name} marked subscription as paid | CustomerId: ${user?.id} | Amount:${subscription.amount}}`,
    });

    return res.status(200).json({
      success: true,
      message: "Subscription marked as paid successfully",
      paidSubscription: paidSub,
    });
  } catch (error) {
    console.error("Error marking subscription as paid:", error);

    await createLog({
      user_name: "System",
      role: "error",
      action: `Error while marking subscription paid -> ${error.message}`,
    });

    return res.status(500).json({ message: "Server Error" });
  }
};

// Get all paid subscriptions
exports.getPaidSubscriptions = async (req, res) => {
  try {
    const adminId = req.admin_id;
    const { userId } = req.query; // optional filters

    if (!userId)
      return res
        .status(400)
        .json({ success: false, message: "user credential required" });
    const filter = {};
    if (userId) filter.userId = userId;
    if (adminId) filter.adminId = adminId;

    const paidSubs = await paidSubscriptionModel
      .find(filter)
      .populate("userId", "name email") // optional: populate user info
      .populate("adminId", "name email") // optional: populate admin info
      .populate("subscriptionId", "subscription amount gst dueDate") // optional: populate subscription info
      .sort({ paidForDueDate: -1 });

    if (!paidSubs || paidSubs.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No Paid Subscription found" });
    }
    return res.status(200).json({ success: true, data: paidSubs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// chage due date
exports.updateDueDates = async (req, res, next) => {
  try {
    const { date, user_id } = req.body;
    const { admin_id, role } = req;

    if (!date) {
      await createLog({
        user_name: "Unknown",
        role: "unknown",
        action: "Someone tried to update due date but date missing",
      });

      return res
        .status(400)
        .json({ success: false, message: "Date is required" });
    }

    const admin = await adminModel.findById(admin_id, "name");

    const getSubscriptinDate = await subscriptionModel.findOne({
      userId: user_id,
    });

    if (!getSubscriptinDate) {
      await createLog({
        user_name: admin?.name || "Admin",
        role,
        action: `${admin?.name} tried to update due date but subscription not found | UserId:${user_id}`,
      });

      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    const oldDate = getSubscriptinDate.dueDate;

    const d = new Date(getSubscriptinDate.dueDate);
    d.setDate(date);
    const updateDate = d.toISOString();

    await subscriptionModel.updateOne(
      { userId: user_id },
      { $set: { dueDate: updateDate } },
    );
    const user = await DrisModel.findOne({ userId: user_id }, "id");
    await createLog({
      user_name: admin?.name,
      role,
      action: `${admin?.name} updated subscription due date | UserId:${user?.id} | ${new Date(oldDate).toLocaleDateString("en-IN")} → ${new Date(updateDate).toLocaleDateString("en-IN")}`,
    });

    return res.json({
      success: true,
      message: "Date Update",
    });
  } catch (error) {
    await createLog({
      user_name: "System",
      role: "error",
      action: `Error while updating due date -> ${error.message}`,
    });

    return res.status(500).json({ success: false, message: error.message });
  }
};

// monthly subscription undo
// exports.undoMonthlySubscription = async (req, res) => {
//   try {
//     const { subscriptionId } = req.body;
//     const adminId = req.admin_id;
//     const role = req.role;

//     if (!subscriptionId) {
//       await createLog({
//         user_name: "Unknown",
//         role: "unknown",
//         action: "Undo subscription payment attempted without subscriptionId",
//       });

//       return res.status(400).json({ message: "Subscription ID is required" });
//     }

//     const admin = await adminModel.findById(adminId, "name");

//     // 1️⃣ Find subscription
//     const subscription = await subscriptionModel.findById(subscriptionId);

//     if (!subscription) {
//       await createLog({
//         user_name: admin?.name || "Admin",
//         role,
//         action: `${admin?.name} tried to undo subscription but subscription not found`,
//       });

//       return res.status(404).json({ message: "Subscription not found" });
//     }

//     // 2️⃣ Find last paid subscription entry
//     const lastPaid = await paidSubscriptionModel
//       .findOne({ subscriptionId: subscription._id })
//       .sort({ createdAt: -1 });

//     if (!lastPaid) {
//       return res
//         .status(400)
//         .json({
//           success: false,
//           message: "No paid subscription found to undo",
//         });
//     }

//     // 3️⃣ Decrease due date by 1 month
//     if (subscription.dueDate) {
//       const previousDueDate = new Date(subscription.dueDate);
//       previousDueDate.setMonth(previousDueDate.getMonth() - 1);

//       subscription.dueDate = previousDueDate;
//       subscription.isPaid = false;
//     }

//     // 4️⃣ Delete last payment record
//     await lastPaid.deleteOne();

//     await subscription.save();

//     const user = await DrisModel.findOne(
//       { userId: subscription?.userId },
//       "id",
//     );

//     await createLog({
//       user_name: admin?.name,
//       role,
//       action: `${admin?.name} undo monthly subscription payment | CustomerId: ${user?.id} | Amount:${subscription.amount}`,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Monthly subscription payment undone successfully",
//       data: {
//         newDueDate: subscription.dueDate,
//       },
//     });
//   } catch (error) {
//     console.error("Undo subscription error:", error);

//     await createLog({
//       user_name: "System",
//       role: "error",
//       action: `Error while undoing subscription payment -> ${error.message}`,
//     });

//     return res.status(500).json({ message: "Server Error" });
//   }
// };

exports.undoMonthlySubscription = async (req, res) => {
  try {
    const { userId, date } = req.body;

    const adminId = req.admin_id;
    const role = req.role;

    if (!userId) {
      await createLog({
        user_name: "Unknown",
        role: "unknown",
        action: "Undo subscription payment attempt fail",
      });

      return res.status(400).json({ message: "Subscription ID is required" });
    }

    const admin = await adminModel.findById(adminId, "name");

    // 1️⃣ Find subscription
    const subscription = await subscriptionModel.findOne({
      userId: userId.userId,
    });

    if (!subscription) {
      await createLog({
        user_name: admin?.name || "Admin",
        role,
        action: `${admin?.name} tried to undo subscription but subscription not found`,
      });

      return res.status(404).json({ message: "Subscription not found" });
    }
    const preDate = new Date(userId.date);
    preDate.setMonth(preDate.getMonth() - 1);
    // 2️⃣ Find last paid subscription entry
    const lastPaid = await paidSubscriptionModel.findOne({
      userId: userId.userId,
      paidForDueDate: { $eq: preDate },
    });
    if (!lastPaid) {
      return res.status(400).json({
        success: false,
        message: "No paid subscription found to undo",
      });
    }

    // 3️⃣ Decrease due date by 1 month
    if (subscription.dueDate) {
      const previousDueDate = new Date(subscription.dueDate);
      previousDueDate.setMonth(previousDueDate.getMonth() - 1);

      subscription.dueDate = previousDueDate;
      subscription.isPaid = false;
    }

    // 4️⃣ Delete last payment record
    await lastPaid.deleteOne();

    await subscription.save();

    const user = await DrisModel.findOne(
      { userId: subscription?.userId },
      "id",
    );

    await createLog({
      user_name: admin?.name,
      role,
      action: `${admin?.name} undo monthly subscription payment | CustomerId: ${user?.id} | Amount:${subscription.amount}`,
    });

    return res.status(200).json({
      success: true,
      message: "Monthly subscription payment undone successfully",
      data: {
        newDueDate: subscription.dueDate,
      },
    });
  } catch (error) {
    console.error("Undo subscription error:", error);

    await createLog({
      user_name: "System",
      role: "error",
      action: `Error while undoing subscription payment -> ${error.message}`,
    });

    return res.status(500).json({ message: "Server Error" });
  }
};
