const csv = require("csvtojson");
const DrisModel = require("../models/DriUserModel");
const KYCmodel = require("../models/KYCModel");
const EmiModel = require("../models/EMIModel");
const advocateModel = require("../models/advocateModel");
const { default: mongoose } = require("mongoose");
const User = require("../models/userModel");
const fcmTokenModel = require("../models/fcmTokenModel");
const NotificationModel = require("../models/NotificationModel");
const {
  paidSubscriptionModel,
  subscriptionModel,
} = require("../models/monthlySubscriptionModel");
const userSavingsModel = require("../models/userSavingsModel");
// exports.importUsersFromCSV = async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ message: "File required" });

//     // CSV read
//     const result = await csv().fromFile(req.file.path);

//     // CSV se users banaye
//     const data = result.map((row) => ({
//       name: row.name,
//       email: row.email,
//       gender: row.gender,
//       id: row.id,
//       phone: row.phone,
//       status: "N/A",
//     }));

//     // Sare phone numbers nikaale
//     const phones = data.map((u) => u.phone);

//     // DB me already existing phone numbers check karo
//     const existingUsers = await DrisModel.find(
//       { phone: { $in: phones } },
//       { phone: 1 }
//     );
//     const existingPhones = existingUsers.map((u) => u.phone);

//     // Filter karo sirf naye users ke liye
//     const newUsers = data.filter((u) => !existingPhones.includes(u.phone));

//     if (newUsers.length === 0) {
//       return res.status(200).json({
//         success: false,
//         message: "No new users to insert (all phone numbers already exist)",
//       });
//     }

//     // Insert karo only new users
//     const uplodUserData = await DrisModel.insertMany(newUsers, {
//       ordered: true,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Users inserted",
//     });
//   } catch (err) {
//     console.error("Insertion error:", err);
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//       reason: err?.writeErrors?.[0]?.errmsg || "Unknown error",
//     });
//   }
// };

exports.importUsersFromCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });
    // CSV read
    const result = await csv().fromFile(req.file.path);

    // CSV se users banaye
    const data = result.map((row) => ({
      name: row.ClientName,
      email: row.ClientEmail,
      gender: row.Gender,
      id: row.id,
      phone: row.Phone,
      id: row.UserId,
      status: "N/A",
    }));

    // Sare phone numbers nikaale
    const phones = data.map((u) => u.phone);

    // ----------------------------
    // Step 1: Pehle UserModel me check karo
    // ----------------------------
    const existingUserPhones = await User.find(
      { phone: { $in: phones } },
      { phone: 1 }
    );
    const existingUserPhoneList = existingUserPhones.map((u) => u.phone);

    // jo phones UserModel me nahi hai unko insert kar do
    const newUserPhones = phones.filter(
      (p) => !existingUserPhoneList.includes(p)
    );
    if (newUserPhones.length > 0) {
      const phoneDocs = newUserPhones.map((p) => ({ phone: p }));
      await User.insertMany(phoneDocs, { ordered: true });
    }

    // ----------------------------
    // Step 2: Ab DrisModel ke liye process
    // ----------------------------
    const existingDrisUsers = await DrisModel.find(
      { phone: { $in: phones } },
      { phone: 1 }
    );
    const existingDrisPhones = existingDrisUsers.map((u) => u.phone);

    // Filter karo sirf naye users ke liye
    const newUsers = data.filter((u) => !existingDrisPhones.includes(u.phone));

    if (newUsers.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No new users to insert (all phone numbers already exist)",
      });
    }

    // Insert karo only new users
    await DrisModel.insertMany(newUsers, { ordered: true });

    return res.status(200).json({
      success: true,
      message: "Users inserted",
    });
  } catch (err) {
    console.error("Insertion error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
      reason: err?.writeErrors?.[0]?.errmsg || "Unknown error",
    });
  }
};

//get all user list for admin
exports.getUsersList = async (req, res) => {
  try {
    // Fetch all users
    const users = await DrisModel.find({ isDelete: { $ne: true } })
      .select("-createdAt -__v") // remove unwanted fields
      .lean();

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No User Found",
      });
    }

    // For each user, fetch KYC + EMI by phone
    const results = await Promise.all(
      users.map(async (user) => {
        // Fetch KYC by phone number
        const kycData = await KYCmodel.findOne({ phone: user.phone })
          .select("-__v")
          .lean();

        return {
          ...user,
          kyc: kycData || null,
        };
      })
    );

    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
      reason: err?.writeErrors?.[0]?.errmsg || "Unknown error",
    });
  }
};

// update user details
exports.searchUserById = async (req, res) => {
  try {
    const { search } = req.query;
    console.log("search");
    // validate
    if (!search) {
      return res.status(400).json({
        success: false,
        message: "Search query parameter is required (e.g. ?search=12345)",
      });
    }

    // Search in "id" field
    const users = await DrisModel.find({
      id: { $regex: search, $options: "i" },
    });

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching users found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//  get single user
exports.getSingleUser = async (req, res) => {
  try {
    const { phone } = req.body;

    // Find single user by phone
    const user = await DrisModel.findOne({ phone })
      .select("-createdAt -__v") // remove unwanted fields
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No User Found",
      });
    }

    // Fetch KYC by phone number
    const kycData = await KYCmodel.findOne({ phone: user.phone })
      .select("-__v")
      .lean();

    // You can also fetch EMI if needed
    const emiData = await EmiModel.find({ phone: user.phone })
      .select("-__v")
      .lean();

    const result = {
      ...user,
      kyc: kycData || null,
      emi: emiData || [],
    };

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("Error fetching user:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
      reason: err?.writeErrors?.[0]?.errmsg || "Unknown error",
    });
  }
};

// get assing advocate to user

exports.getAssignAdvocate = async (req, res, next) => {
  try {
    const { user_id } = req;
    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "User Id Required" });
    }
    const user = await KYCmodel.findOne({ user_id });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "user not found" });
    }
    const advocate = await advocateModel
      .findById(user.assign_advocate)
      .select("-date -imagePublicKey -assignUsers -_id -__v");
    if (!advocate) {
      return res
        .status(400)
        .json({ success, message: "advocate not found try again..." });
    }
    return res.status(200).json({ success: true, data: advocate });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      reason: err?.writeErrors?.[0]?.errmsg || "Unknown error",
    });
  }
};

// get settlement advance
exports.getSettementAdvance = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(500).json({
        success: false,
        message: "phone number required",
      });
    }
    const settlement = await DrisModel.findOne({ phone });
    if (!settlement) {
      return res.status(500).json({
        success: false,
        message: "no advance emi found",
      });
    }
    return res.json(settlement);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      reason: err?.writeErrors?.[0]?.errmsg || "something went wrong.",
    });
  }
};

// multiple user soft delete
exports.multipleSoftDelete = async (req, res) => {
  try {
    const { userIds, phones } = req.body;
    console.log("body", req.body);

    let users;

    // Case 1: Delete by userIds array
    if (Array.isArray(userIds) && userIds.length > 0) {
      users = await DrisModel.updateMany(
        { id: { $in: userIds } },
        { $set: { isDelete: true, deletedAt: new Date() } }
      );

      if (
        users.modifiedCount === 0 &&
        Array.isArray(phones) &&
        phones.length > 0
      ) {
        users = await DrisModel.updateMany(
          { phone: { $in: phones } },
          { $set: { isDelete: true, deletedAt: new Date() } }
        );
      }

      if (!users || users.modifiedCount === 0) {
        return res.status(400).json({
          success: false,
          message: "No users deleted",
        });
      }

      return res.status(200).json({
        success: true,
        message: `users deleted`,
      });
    }

    // Case 2: Delete by phones array
    if (Array.isArray(phones) && phones.length > 0) {
      users = await DrisModel.deleteMany({ phone: { $in: phones } });

      return res.status(200).json({
        success: true,
        message: `users deleted`,
      });
    }

    // Case 3: Single userId
    if (userIds) {
      const user = await DrisModel.findOneAndDelete({ id: userIds });

      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "User not found" });
      }

      return res.status(200).json({ success: true, message: "User deleted" });
    }

    return res
      .status(400)
      .json({ success: false, message: "Invalid request body" });
  } catch (err) {
    console.error("delete error", err);
    return res.status(500).json({
      success: false,
      message: err.message,
      reason: err?.writeErrors?.[0]?.errmsg || "Something went wrong.",
    });
  }
};

// update phone and driID;
exports.updateDriUserPhoneId = async (req, res, next) => {
  try {
    const { id, phone } = req.body;
    if (!id || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "client id and mobile require" });
    }
    const query = {
      $or: [{ id: id }, { phone: phone }],
    };
    const driuser = await DrisModel.findOneAndUpdate(
      query,
      { $set: { id, phone } },
      { upsert: true, new: true }
    );
    if (driuser?.modifiedCount === 0) {
      return res
        .status(400)
        .json({ success: false, message: "unable to udpate client" });
    }
    return res
      .status(201)
      .json({ success: true, message: "Client Details Upadate" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: err.message,
      reason: err?.writeErrors?.[0]?.errmsg || "Something went wrong.",
    });
  }
};

//
exports.permanentDeleteUserData = async (req, res) => {
  try {
    const { userIds, phones } = req.body;
    console.log(userIds, phones);
    if (
      (!Array.isArray(userIds) || userIds.length === 0) &&
      (!Array.isArray(phones) || phones.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "No userIds or phones provided",
      });
    }

    // Build filters
    const userIdFilter =
      userIds.length > 0 ? { userId: { $in: userIds } } : null;
    const user_idFilter =
      userIds.length > 0 ? { user_id: { $in: userIds } } : null;
    const phoneFilter = phones.length > 0 ? { phone: { $in: phones } } : null;

    // KYC filter: match phone, userId, or user_id
    const kycFilter = {};
    if (phoneFilter) kycFilter.phone = { $in: phones };
    if (userIdFilter) kycFilter.userId = { $in: userIds };
    if (user_idFilter) kycFilter.user_id = { $in: userIds };

    // Array of delete operations for Promise.all
    const deleteOperations = [
      phoneFilter ? DrisModel.deleteMany(phoneFilter) : null,
      userIdFilter ? fcmTokenModel.deleteMany(userIdFilter) : null,
      KYCmodel.deleteMany(kycFilter),
      userIdFilter ? NotificationModel.deleteMany(userIdFilter) : null,
      userIdFilter ? paidSubscriptionModel.deleteMany(userIdFilter) : null,
      userIdFilter ? subscriptionModel.deleteMany(userIdFilter) : null,
      phoneFilter ? User.deleteMany(phoneFilter) : null,
      user_idFilter ? userSavingsModel.deleteMany(user_idFilter) : null,
    ].filter(Boolean); // Remove nulls if filter not present

    // Run all deletions in parallel
    const results = await Promise.all(deleteOperations);

    return res.status(200).json({
      success: true,
      message: `User and related data permanently deleted`,
      details: results.map((r, i) => ({
        collectionIndex: i,
        deletedCount: r.deletedCount,
      })),
    });
  } catch (err) {
    console.error("Permanent delete error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
      reason: err?.writeErrors?.[0]?.errmsg || "Something went wrong.",
    });
  }
};
