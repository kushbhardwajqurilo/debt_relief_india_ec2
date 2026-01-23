const { default: mongoose } = require("mongoose");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const userSavingsModel = require("../models/userSavingsModel");
const KYCmodel = require("../models/KYCModel");
const { saveExpoToken } = require("../utilitis/fcm.utils");
const {
  sendNotificationToSingleUser,
} = require("../config/expo-push-notification/expoNotification");
const { default: axios } = require("axios");
const { deleteFileFromS3, s3Client } = require("../config/aws-s3/s3Config");
const DrisModel = require("../models/DriUserModel");
const otpStore = {};
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    // Phone validation
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit phone number is required",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000);
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 min expiry

    let user = await User.findOne({ phone: phone });
    if (!user) {
      user = await User.create({ phone: phone });
    }

    user.otp = Number(otp);
    user.otpExpire = otpExpiry;
    await user.save();

    //     const apiUrl = `https://www.alots.in/sms-panel/api/http/index.php?username=DEBTRELIEF&apikey=C4A0D-7B2C2&apirequest=Text&sender=DebtRI&mobile=${phone}&message=Your OTP for Login is ${otp}. Please do not share this code with anyone. https://debtreliefindia.com/&route=TRANS&TemplateID=1707176285995736690
    // &format=JSON`;
    // const apiUrl = `https://www.alots.in/sms-panel/api/http/index.php?username=DEBTRELIEF&apikey=C4A0D-7B2C2&apirequest=Text&sender=DebtRI&mobile=${phone}&message=Your Debt Relief India Login code is ${otp}.&route=TRANS&TemplateID=1707176907356446576&format=JSON`;

    // const apiUrl = `https://www.alots.in/sms-panel/api/http/index.php?username=DEBTRELIEF&apikey=C4A0D-7B2C2&apirequest=Text&sender=DebtRI&mobile=${phone}&message=Your Debt Relief India Login code is {#${otp}#}.&route=TRANS&TemplateID=1707176907356446576&format=JSON`;
    const message = `<#> Your Debt Relief India Login code is ${otp}`;

    const apiUrl = `https://www.alots.in/sms-panel/api/http/index.php?username=DEBTRELIEF&apikey=C4A0D-7B2C2&apirequest=Text&sender=DebtRI&mobile=${phone}&message=${encodeURIComponent(message)}&route=TRANS&TemplateID=1707176907356446576&format=JSON`;

    const response = await axios.get(apiUrl);
    if (response.data.status === "success") {
      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
        error: response.data,
      });
    }
  } catch (err) {
    console.error("OTP sending error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Verify OTP
// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp, expoToken } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    // ✅ PLAY STORE DUMMY LOGIN + AUTO KYC
    if (phone === "9999999999" && Number(otp) === 1234) {
      let user = await User.findOne({ phone });

      if (!user) {
        user = await User.create({
          phone,
          existingUser: true,
        });
      }

      // 🔐 CREATE / ENSURE KYC
      let kyc = await KYCmodel.findOne({ phone });

      if (!kyc) {
        kyc = await KYCmodel.create({
          user_id: user._id,
          phone,
          alternatePhone: phone,
          status: "approve",
          name: "dummy",
          lastname: "user",
          email: "dummyuser@exapmple.com",
          gender: "male",
          assign_advocate: "690d98c28b92f5a301990018",
          userType: "existing",
        });
      }

      if (expoToken) {
        await saveExpoToken(user._id, expoToken);
      }

      const token = jwt.sign(
        { userId: user._id, role: "user", phone },
        process.env.SecretKey,
      );

      return res.status(200).json({
        success: true,
        message: "Login Successful (Test Account)",
        token,
        status: "approve",
        isTestAccount: true,
      });
    }

    // 🔒 ORIGINAL USER FLOW (NO CHANGE)
    let user = await User.findOne({
      $or: [{ phone }, { aternatePhone: phone }],
    });

    if (!user) {
      user = await User.create({ phone });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Failed to verify user.",
        });
      }
    }

    if (!user.otp || !user.otpExpire || Date.now() > user.otpExpire) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    if (Number(user.otp) !== Number(otp)) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.otp = null;
    user.otpExpire = null;
    await user.save();

    if (expoToken) {
      await saveExpoToken(user._id, expoToken);
    }

    const token = jwt.sign(
      { userId: user._id, role: "user", phone },
      process.env.SecretKey,
    );

    if (user.existingUser) {
      return res.status(200).json({
        success: true,
        message: "Login Successfull",
        token,
        status: "existingUser",
      });
    }

    const isKycApprove = await KYCmodel.findOne({
      $or: [{ alternatePhone: phone }, { phone }],
    });

    if (isKycApprove) {
      console.log("kk", isKycApprove);
      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        status: isKycApprove.status,
      });
    }
    console.log(isKycApprove);
    await sendNotificationToSingleUser(
      expoToken,
      "Login Successfully",
      "Debt Relief India",
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      status: "new",
      token,
    });
  } catch (err) {
    console.error("verifyOTP error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.userController = async (req, res, next) => {
  try {
    const { user_id } = req;
    if (!user_id) {
      return res
        .status(404)
        .json({ success: false, message: "user id missing" });
    }
    const userData = await User.findOne({ _id: user_id });
    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }
    return res.status(200).json({ success: true, userData });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
      error: err,
    });
  }
};
exports.userControllerForAdmin = async (req, res, next) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res
        .status(404)
        .json({ success: false, message: "user id missing" });
    }
    const userData = await User.findOne({ _id: user_id });
    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }
    return res.status(200).json({ success: true, userData });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
      error: err,
    });
  }
};

//  create user

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    if (!req.body) {
      return res
        .status(400)
        .json({ success: false, message: "invalid request" });
    }
    if (!name || !email || !phone) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid Credentials" });
    }
    const existingUser = await User.findOne({ phone: phone });
    if (existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User already exists" });
    }
    const user = await User.create({ name, email, phone });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Created" });
    }
    return res
      .status(201)
      .json({ success: true, message: "User Created Successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const { id } = req.query;
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "invalid user" });
    }
    const updateFields = {
      name,
      email,
      phone,
    };
    const user = await User.updateOne({ _id: id }, updateFields, { new: true });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "faild to update" });
    }

    return res.status(200).json({ success: true, message: "update success" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
// user login ny phone and otp

//
exports.InsertUser = async (req, res, next) => {
  try {
    // const {name, email,gender,}
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// insert saving by user
exports.userSaving = async (req, res, next) => {
  try {
    // Get user_id from proper place
    const user_id = req?.user_id || req.params.user_id || req.body.user_id;
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "unauthorized user",
      });
    }

    const { month, year, amount, bank_id } = req.body;
    const requiredFields = { month, year, amount };
    const missingFields = [];

    for (const [key, value] of Object.entries(requiredFields)) {
      if (value == null || value === "") {
        missingFields.push(key);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        errors: missingFields,
      });
    }

    const saving = await userSavingsModel.create({
      user_id,
      month,
      year,
      amount,
      bank_id,
    });

    return res.statuss(200).json({ success: true, message: "savings" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// get savings by user
exports.getSavingByMonthYear = async (req, res) => {
  try {
    const user_id =
      req.user_id ||
      req.params.user_id ||
      req.body.user_id ||
      req.query.user_id;
    if (!user_id) {
      return res.status(404).json({
        success: false,
        message: "invalid user",
      });
    }

    const { month, year } = req.body;
    const requiredFields = { user_id, month, year };
    const missingFields = [];

    for (const [key, value] of Object.entries(requiredFields)) {
      if (value == null || value === "" || value === "undefined") {
        missingFields.push(key);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${missingFields.join(", ")} required`,
        errors: missingFields,
      });
    }

    const payload = {
      user_id,
      month: month.trim(),
      year: parseInt(year),
    };

    const savings = await userSavingsModel.find(payload);

    if (savings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No savings found for this month and year",
      });
    }

    return res.status(200).json({
      success: true,
      data: savings,
    });
  } catch (err) {
    console.error("Error fetching savings:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

//get all saivng to usr
exports.getAllSavingToUser = async (req, res) => {
  try {
    const { user_id } = req;
    if (!user_id) {
      return res.status(404).json({
        success: false,
        message: "user id missing",
      });
    }

    const savings = await userSavingsModel
      .find({ user_id })
      .select("-__v")
      .populate("bank_id", "-__v -_id");

    if (savings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No savings found",
      });
    }

    return res.status(200).json({
      success: true,
      data: savings,
    });
  } catch (err) {
    console.error("Error fetching savings:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

//get all user savings

// change phone number
exports.changePhoneNumber = async (req, res) => {
  try {
    const { oldNumber, newNumber } = req.body;
    if (!oldNumber) {
      return res.status(200).json({
        success: false,
        message: "old number missing",
      });
    }
    if (!newNumber) {
      return res.status(200).json({
        success: false,
        message: "old number missing",
      });
    }
    //check alterPhone already register
    const isAlternatePhone = await User.findOne({ alternatePhone: newNumber });
    if (isAlternatePhone) {
      return res
        .status(400)
        .json({ success: false, message: "New Number already register" });
    }
    const user = await User.findOne({ phone: oldNumber });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "old number not register",
      });
    }
    user.alternatePhone = newNumber;
    await user.save();
    return res.status(201).json({
      success: true,
      message: "phone number change successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// get user profiles
// exports.getUserProfile = async (req, res) => {
//   try {
//     const { user_id } = req;
//     console.log("user", user_id);
//     if (!user_id) {
//       return res.status(400).json({ success: false, message: "user required" });
//     }
//     // first find in users details
//     const user_profile = await KYCmodel.findOne({ _id: user_id });
//     if (
//       !user_profile.userProfile ||
//       user_profile.userProfile.length === 0 ||
//       user_profile.userProfile == ""
//     ) {
//       const profile = await KYCmodel.findOne({ user_id }).select(
//         "-aadhar -backAdhar -pan -__v  -status -date"
//       );
//       if (!profile) {
//         return res.status(400).json({
//           success: false,
//           message: "User profile not found try again.",
//         });
//       }
//     }
//     const profile = await KYCmodel.findOne({ user_id }).select(
//       "-aadhar -backAdhar -pan -__v  -status -date"
//     );
//     if (!profile) {
//       return res
//         .status(400)
//         .json({ success: false, message: "User profile not found try again." });
//     }
//     return res.status(200).json({ success: true, data: profile });
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error?.message });
//   }
// };

exports.getUserProfile = async (req, res) => {
  try {
    const { user_id, phone } = req;

    // 🔹 Step 1: Validate inputs
    if (!user_id && !phone) {
      return res.status(400).json({
        success: false,
        message: "User ID or phone number is required",
      });
    }

    // 🔹 Step 2: Find user from User model
    let profile = await User.findOne({
      $or: [{ _id: user_id }, { phone }],
    }).select("-password -__v -createdAt -updatedAt");

    let kycData = null;

    // 🔹 Step 3: If user found, handle based on existingUser flag
    if (profile) {
      let userProfile = profile.toObject ? profile.toObject() : profile;

      // find KYC data
      kycData = await KYCmodel.findOne({
        $or: [{ user_id }, { phone }],
      }).select(
        "name profile -_id", // only get required fields
      );

      // ✅ Case 1: existing user → only add name from KYC
      if (userProfile.existingUser === true) {
        if (kycData && kycData.name) {
          userProfile.name = kycData.name;
        }
      }

      // ✅ Case 2: existing user = false → only replace userProfile with KYC profile URL
      else if (
        userProfile.existingUser === false &&
        kycData &&
        kycData.profile
      ) {
        userProfile.userProfile = kycData.profile;
      }

      profile = userProfile;
      userProfile.name = kycData.name;
    }

    // 🔹 Step 4: If user not found, check KYCmodel directly
    if (!profile) {
      profile = await KYCmodel.findOne({
        $or: [{ user_id }, { phone }],
      }).select("-aadhar -backAdhar -pan -__v -status -date");
    }

    // 🔹 Step 5: If still not found
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found. Please try again.",
      });
    }

    // 🔹 Step 6: Return final response
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("getUserProfile error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// update User ProfilePicture

exports.updateUserProfilePicture = async (req, res) => {
  try {
    const { user_id, phone } = req;
    const profile = req.file;

    // console.log("file", profile);
    if ((!user_id, !phone)) {
      return res
        .status(400)
        .json({ success: false, message: "Invaid User Credentials" });
    }
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res
        .status(400)
        .json({ success: false, message: "User_id Not Valid" });
    }
    const user = await User.findOne({ $or: [{ _id: user_id }, { phone }] });
    if (user.existingUser === true) {
      user.userProfile = profile.location;
      await user.save();
      return res
        .status(201)
        .json({ success: false, messge: "Profile Picture Uploaded" });
    }
    const userKyc = await KYCmodel.findOne({ user_id });
    if (!userKyc) {
      return res
        .status(400)
        .json({ success: false, message: "user not found." });
    }
    userKyc.profile = profile.location;
    await userKyc.save();
    return res
      .status(200)
      .json({ success: true, message: "profile picture updated" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message, error });
  }
};
