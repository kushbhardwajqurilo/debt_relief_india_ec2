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
exports.importUsersFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File required" });
    }

    // Step 1: Read CSV
    const result = await csv().fromFile(req.file.path);

    // Step 2: Prepare base data from CSV
    const data = result.map((row) => ({
      id: row.UserId || row.id || null, // CSV ke id field se
      name: row.ClientName,
      email: row.ClientEmail,
      gender: row.Gender,
      phone: String(row.Phone).trim(),
      existingUser: true,
      status: "N/A",
    }));

    // Step 3: Collect all phone numbers
    const phones = data.map((u) => u.phone);

    // Step 4: Find existing users in User model
    const existingUsers = await User.find(
      { phone: { $in: phones } },
      { phone: 1 }
    );

    const existingUserPhones = existingUsers.map((u) => String(u.phone));

    // Step 5: Create new users in User model (for missing phones)
    const newUserPhones = phones.filter((p) => !existingUserPhones.includes(p));
    if (newUserPhones.length > 0) {
      const newUserDocs = newUserPhones.map((p) => ({
        phone: p,
        existingUser: true,
      }));
      await User.insertMany(newUserDocs, { ordered: true });
    }

    // Step 6: Re-fetch all users to build a phone → _id map
    const allUsers = await User.find(
      { phone: { $in: phones } },
      { _id: 1, phone: 1 }
    );

    const userMap = new Map();
    allUsers.forEach((u) => userMap.set(String(u.phone), u._id));

    // Step 7: Find existing Dris users (avoid duplicates)
    const existingDrisUsers = await DrisModel.find(
      { phone: { $in: phones } },
      { phone: 1 }
    );
    const existingDrisPhones = existingDrisUsers.map((u) => String(u.phone));

    // Step 8: Filter new Dris entries only
    const newUsers = data.filter((u) => !existingDrisPhones.includes(u.phone));

    if (newUsers.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No new users to insert (all phone numbers already exist)",
      });
    }

    // Step 9: Add userId + id to each new Dris record
    const drisToInsert = newUsers.map((u) => ({
      ...u,
      id: u.id || null, // from CSV
      userId: userMap.get(String(u.phone)) || null, // from User model
    }));

    // Step 10: Insert new records
    await DrisModel.insertMany(drisToInsert, { ordered: true });
    console.log("dud", drisToInsert);
    return res.status(200).json({
      success: true,
      message: "Users inserted successfully with id and userId",
      insertedCount: drisToInsert.length,
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
    const { userIds = [], phones = [] } = req.body;

    if (
      (!Array.isArray(userIds) || userIds.length === 0) &&
      (!Array.isArray(phones) || phones.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "No userIds or phones provided",
      });
    }

    const userIdFilter = userIds.length ? { userId: { $in: userIds } } : {};
    const user_idFilter = userIds.length ? { user_id: { $in: userIds } } : {};
    const phoneFilter = phones.length ? { phone: { $in: phones } } : {};

    const kycFilter = {
      $or: [
        ...(phones.length ? [{ phone: { $in: phones } }] : []),
        ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
        ...(userIds.length ? [{ user_id: { $in: userIds } }] : []),
      ],
    };

    // 💥 Promise.all: Run all deletions in parallel
    const results = await Promise.all([
      DrisModel.deleteMany(phoneFilter), // 1
      fcmTokenModel.deleteMany(userIdFilter), // 2
      KYCmodel.deleteMany(kycFilter), // 3
      NotificationModel.deleteMany(userIdFilter), // 4
      paidSubscriptionModel.deleteMany(userIdFilter), // 5
      subscriptionModel.deleteMany(userIdFilter), // 6
      User.deleteMany(phoneFilter), // 7
      userSavingsModel.deleteMany(user_idFilter), // 8
      advocateModel.updateMany(
        // 9: remove userIds from assignUsers array
        { assignUsers: { $in: userIds } },
        { $pull: { assignUsers: { $in: userIds } } }
      ),
    ]);

    return res.status(200).json({
      success: true,
      message: "User and related data deleted permanently",
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

//  1 inside DrisModel delelte data from phone, 2 FcmTokens model have userId for delete, 3. Invoice also vale phone for delete , 4. kycmodel have phone or user_id, 5. notification model contain userId, 6.paidSubscription model contain userId, 7. paidSubscrioption model also contain userId, sbscriptionModel also contain userId, userModel also conntain phone, usersaivng modle contain user_id now delete data from all these collection by there field of match
