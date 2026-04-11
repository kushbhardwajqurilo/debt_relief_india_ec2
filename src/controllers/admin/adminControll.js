const adminModel = require("../../models/adminModel");
const jwt = require("jsonwebtoken");
const {
  hashPassword,
  compareHashPassword,
} = require("../../utilitis/hashPash");
const fs = require("fs");
const cloudinary = require("../../utilitis/cloudinary");
const adminAndLoginBannerModel = require("../../models/adminAndLoginBannerModel");
const { json } = require("stream/consumers");
const {
  contatYourAdvocateModel,
} = require("../../models/contactYourAdvocateModel");
const padiDialBoxModel = require("../../models/paidDialogBoxModel");
const User = require("../../models/userModel");
const { default: mongoose } = require("mongoose");
const backupDatabase = require("../back/db/backup");
const { default: axios } = require("axios");
const logModel = require("../../models/LogsModel");
const { createLog } = require("../../utilitis/log");
const DriMeterModel = require("../../models/drimeterModel");
const ReviewModel = require("../../models/reviewModel");
const DrisModel = require("../../models/DriUserModel");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client } = require("../../config/aws-s3/s3Config");
const {
  sendNotificationToSingleUser,
} = require("../../config/expo-push-notification/expoNotification");
const fcmTokenModel = require("../../models/fcmTokenModel");
const otpStores = {};

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !phone || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });
    }
    const isAdmin = await adminModel.findOne({ phone: phone });
    if (isAdmin) {
      return res
        .status(400)
        .json({ success: false, message: "Admin already exists" });
    }

    const haspass = await hashPassword(password);
    const addAdmin = await adminModel.create({
      name,
      email,
      phone,
      password: haspass,
      role,
    });
    if (!addAdmin) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to create Admin" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Admin created successfully" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      error: err,
    });
  }
};

exports.loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Admin Credentials" });
    }
    const isExist = await adminModel.findOne({ email });
    if (!isExist) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }
    // --------- Check if account is locked -------------
    if (isExist.lockUntil && isExist.lockUntil > Date.now()) {
      const unlockTime = new Date(isExist.lockUntil).toLocaleTimeString();
      return res.status(403).json({
        success: false,
        message: `Account locked until ${unlockTime}`,
      });
    }
    // ------ check password match --------
    const isMatch = await compareHashPassword(password, isExist.password);
    if (!isMatch) {
      isExist.failedAttempts = (isExist.failedAttempts || 0) + 1;
      // Lock the account if failed 3 times
      if (isExist.failedAttempts >= 3) {
        isExist.lockUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await isExist.save();
        return res.status(403).json({
          success: false,
          message:
            "Account locked due to 3 failed attempts. Try again in 10 minutes.",
        });
      }
      await isExist.save();
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }
    //If correct password, reset attempts
    isExist.failedAttempts = 0;
    isExist.lockUntil = null;
    await isExist.save();

    const payload = {
      name: isExist.name,
      email: isExist.email,
      adminId: isExist._id,
      role: isExist.role,
    };
    const secretKey = process.env.SecretKey;
    const adminToken = jwt.sign(payload, secretKey, { expiresIn: "15d" });
    await createLog({
      user_name: payload.name,
      role: "admin",
      action: `${payload.name} logged in to the admin panel`,
    });
    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token: adminToken,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {
    const { admin_id } = req;
    const file = req.file;
    const user = await adminModel.findByIdAndUpdate(
      admin_id,
      {
        image: file.location,
        public_id: file.key,
      },
      { new: true },
    );
    await createLog({
      user_name: user.name,
      role: "admin",
      action: `${user.name} updated their profile picture`,
    });
    res.status(200).json({
      message: "Profile image uploaded successfully",
      success: "Prifile Uploaded.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addBarcodeWithUpi = async (req, res, next) => {
  try {
    const { admin_id, imagePath } = req;
    const { upi, role } = req.body;
    if (!imagePath || !upi || !admin_id || !role) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Request" });
    }
    const isAdmin = await adminModel.findOne({ _id: admin_id });
    if (!isAdmin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }
    const addBarcodeWithUpi = await adminModel.updateOne(
      { _id: admin_id },
      { barcode: imagePath, upi },
    );
    if (addBarcodeWithUpi.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "upload failed...",
      });
    }
    await createLog({
      user_name: isAdmin.name,
      role: "admin",
      action: `${isAdmin.name} updated Barcode and UPI`,
    });
    return res
      .status(201)
      .json({ success: true, message: "barcode and upi added." });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateAdminDetails = async (req, res) => {
  try {
    const { admin_id } = req;
    const { email, phone } = req.body;

    // Validate inputs
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide email or phone to update",
      });
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be 10 digits",
      });
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check email uniqueness
    if (email) {
      const existingEmail = await adminModel.findOne({
        email,
        _id: { $ne: admin_id },
      });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email is already in use",
        });
      }
    }

    // Check phone uniqueness
    if (phone) {
      const existingPhone = await adminModel.findOne({
        phone,
        _id: { $ne: admin_id },
      });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: "Phone number is already in use",
        });
      }
    }

    // Prepare update object
    const updates = {};
    if (email) updates.email = email;
    if (phone) updates.phone = phone;

    const updatedAdmin = await adminModel.findByIdAndUpdate(admin_id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    await createLog({
      user_name: updatedAdmin.name,
      role: "admin",
      action: `${updatedAdmin.name} updated their details ${email ? "Email" : ""}, ${phone ? "Phone" : ""}`,
    });
    return res.status(200).json({
      success: true,
      message: "Admin details updated successfully",
      data: updatedAdmin,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

exports.requestOtp = async (req, res, next) => {
  try {
    const { admin_id } = req;
    if (!admin_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "phone required",
      });
    }
    const otp = Math.floor(1000 + Math.random() * 9000);
    const admin = await adminModel.findById(admin_id);
    if (admin) {
      if (!admin.phone === phone) {
        delete otpStores[phone];
        return res.status(400).json({
          success: false,
          message: "phone Invaid",
        });
      }
      admin.otp = otp;
      admin.otpExpire = Date.now() + 5 * 60 * 1000;
      await admin.save();
      const apiUrl = `https://www.alots.in/sms-panel/api/http/index.php?username=DEBTRELIEF&apikey=C4A0D-7B2C2&apirequest=Text&sender=DebtRI&mobile=${phone}&message=Your Debt Relief India Login code is ${otp}.&route=TRANS&TemplateID=1707176907356446576&format=JSON`;
      await createLog({
        user_name: admin?.name,
        role: "admin",
        action: `${admin?.name} requested an OTP to change password`,
      });
      const response = await axios.get(apiUrl);
      if (response.data.status === "success") {
        return res.status(200).json({
          success: true,
          message: "OTP sent successfully",
          otp: "",
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP",
          error: response.data,
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: "Admin not found",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};

// send ot to admin
exports.verifyOtpForAdmin = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number requred" });
    }
    if (!otp) {
      return res.status(400).json({ success: false, message: "Otp Missing" });
    }
    const admin = await adminModel.findOne({ phone });
    if (!admin) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Admin Phone Numbber" });
    }
    const record = admin;
    if (!record || record.otpExpire < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "OTP expired or not found" });
    }

    const submittedOtp = Number(otp);
    const storedOtp = Number(record.otp);
    if (storedOtp !== submittedOtp) {
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }
    admin.otp = null;
    admin.otpExpire = null;
    await admin.save();
    const verifyToken = jwt.sign(
      { key: admin._id },
      process.env.ChangePasswordKey,
      { expiresIn: "5m" },
    );
    await createLog({
      user_name: admin.name,
      role: "admin",
      action: `${admin.name} requested OTP verification for password change`,
    });
    return res
      .status(200)
      .json({ success: true, message: "OTP verified", verifyToken });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
};
// change password
exports.changePasswprd = async (req, res) => {
  try {
    const { key } = req;
    const { newPassword } = req.body;
    if (!key) {
      return res
        .status(400)
        .json({ success: false, message: "verification key missing" });
    }
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New Password Missing",
      });
    }
    const encryptPassword = await hashPassword(newPassword);
    const update_password = await adminModel.findByIdAndUpdate(key, {
      password: encryptPassword,
    });
    if (!update_password) {
      return res
        .status(400)
        .json({ success: false, message: "Filed Try Again..." });
    }
    await createLog({
      user_name: update_password.name,
      role: "admin",
      action: `Password changed by ${update_password.name}`,
    });
    return res
      .status(200)
      .json({ success: true, message: "Passoword Changed" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
exports.getAdminDetails = async (req, res) => {
  try {
    const { admin_id, role } = req;
    if (!admin_id || !role) {
      return res.status(400).json({
        success: false,
        message: "Invalid request: missing admin ID or role",
      });
    }

    const admin = await adminModel.findById(admin_id).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin details fetched successfully",
      data: admin,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

exports.getBarcodeAndUpi = async (req, res, next) => {
  try {
    const { admin_id, role } = req;
    if (!admin_id || !role) {
      return res.status(400).json({
        success: false,
        message: "Invalid request: missing admin ID or role",
      });
    }
    const admin = await adminModel
      .findById(admin_id)
      .select("-password -name -email -phone  -_id -role -__v");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// login backgroudd api
exports.addLoginBackground = async (req, res, next) => {
  try {
    const { admin_id } = req;

    const file = req.file;
    if (!admin_id) {
      return res.status(400).json({
        success: false,
        message: "admin invalid",
      });
    }
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "file missing",
      });
    }

    const payload = {
      loginBanner: file.location,
      loginBanner_public_key: file.key,
    };
    const store = await adminAndLoginBannerModel.create(payload);
    if (store.length === 0 || !store) {
      return res.status(404).json({
        success: false,
        message: "Faild.. try agian.",
      });
    }
    return res.status(201).json({
      success: true,
      message: "upload done.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

//  get login banner
exports.adminDashboardBanner = async (req, res, next) => {
  try {
    const { admin_id } = req;
    const file = req.file;
    if (!admin_id) {
      return res.status(400).json({
        success: false,
        message: "admin invalid",
      });
    }
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "file missing",
      });
    }
    const payload = {
      adminBanner: file.location,
      adminBanner_public_key: file.key,
    };
    const store = await adminAndLoginBannerModel.create(payload);
    if (store.length === 0 || !store) {
      return res.status(404).json({
        success: false,
        message: "Faild.. try agian.",
      });
    }
    return res.status(201).json({
      success: true,
      message: "upload done.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};
// delelte login banner
exports.deletLoginDashboardBanner = async (req, res, next) => {
  try {
    const { admin_id } = req;
    const { public_id } = req.params;
    if (!admin_id) {
      return res.status(400).json({
        success: false,
        message: "admin invalid",
      });
    }
    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: "image credentials missing",
      });
    }
    const image = await cloudinary.uploader.destroy(public_id);
    if (image.result === "ok") {
      const res = await adminAndLoginBannerModel.deleteOne({
        $or: [
          { loginBanner_public_key: public_id },
          { adminBanner_public_key: public_id },
        ],
      });
      if (!res) {
        return res
          .status(404)
          .json({ success: false, message: "unable to delete image" });
      }
      return res.status(201).json({
        success: true,
        message: "Image delete",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Faild to delete image",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

exports.getAdminAnsLoginBanner = async (req, res, next) => {
  try {
    const response = await adminAndLoginBannerModel.find({});
    if (!response) {
      return res
        .status(404)
        .json({ success: false, message: "unable to get banner" });
    }
    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//  admin banner and profile image get api
exports.getAdminProfileAndBanner = async (req, res, next) => {
  try {
    const adminImage = await adminModel.find({});
    const adminBanner = await adminAndLoginBannerModel.find({});
    // console.log(adminImage[0].image,adminBanner[0].adminBanner)
    if (!adminImage || !adminBanner) {
      return res
        .status(404)
        .json({ success: false, message: "unable to get banner and image" });
    }
    return res.status(200).json({
      success: true,
      data: {
        adminProfile: adminImage[0].image,
        adminBanner: adminBanner[0].adminBanner,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

exports.getUserLoginBanner = async (req, res) => {
  try {
    const banners = await adminAndLoginBannerModel.find({}).select();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

// call now setup || contact your advocate

exports.callNowSetup = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.length === 0) {
      return res.status(400).json({
        success: false,
        message: "message missing",
      });
    }
    const setupMessage = await contatYourAdvocateModel.findOneAndUpdate(
      {},
      { $set: { message } },
      { new: true, upsert: true },
    );

    if (!setupMessage) {
      return res.status(400).json({
        success: false,
        message: "failed to setup message",
      });
    }
    const admin = await adminModel.findOne({}, "name");
    await createLog({
      user_name: admin?.name,
      role: "admin",
      action: `update call now setup and contact your advocate message`,
    });
    return res.status(200).json({
      success: true,
      message: "message setup successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

exports.getYourContactCall = async (req, res, next) => {
  try {
    const get = await contatYourAdvocateModel.find();
    return res.status(200).json({ success: true, data: get });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

// set dialbox content
exports.addDialBoxContent = async (req, res) => {
  try {
    const admin = await adminModel.findOne({}, "name");
    await createLog({
      user_name: admin?.name,
      role: "admin",
      action: `${admin?.name || "Admin"} performed an action on Paid Dial Box content`,
    });
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    // Get all users
    const users = await User.find({});
    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }

    // Update or insert for each user
    const operations = users.map((user) =>
      padiDialBoxModel.updateOne(
        { user_id: user._id }, // find by user_id
        {
          $set: {
            phone: user.phone,
            alternatePhone: user.alternatePhone || "",
            content: content,
          },
        },
        { upsert: true }, // create if not found
      ),
    );

    await Promise.all(operations);

    return res.status(200).json({
      success: true,
      message: "Content updated successfully",
    });
  } catch (error) {
    console.error("Error in addDialBoxContent:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get dialog box to all users
exports.getDialogBoxToAll = async (req, res) => {
  try {
    const { user_id } = req;
    const { phone } = req.body;
    console.log({ user_id, phone });
    if (!user_id || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "user crediential invalid" });
    }
    const query = {
      $or: [
        { user_id: new mongoose.Types.ObjectId(user_id) },
        { phone: `${phone}` },
        { alternatePhone: `${phone}` },
      ],
    };
    const content = await padiDialBoxModel
      .findOne(query)
      .select("-_id -user_id -alternatePhone -phone -__v");
    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "failed to fetch" });
    }
    return res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.log("err", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      message: error.message,
    });
  }
};

// to admin
exports.getDialogBoxToAdmin = async (req, res) => {
  try {
    console.log("res", req.admin_id);
    const content = await padiDialBoxModel
      .findOne({})
      .select("-_id -user_id -alternatePhone -phone -__v");
    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "failed to fetch" });
    }
    return res.status(200).json({ success: true, data: content });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      message: error.message,
    });
  }
};

// backup code

exports.dataBackup = async (req, res) => {
  try {
    const { admin_id } = req;
    if (!admin_id || admin_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User credentials required",
      });
    }
    if (!new mongoose.Types.ObjectId(admin_id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid User Credentials" });
    }
    const admin = await adminModel.findOne({}, "name");
    const result = await backupDatabase(
      process.env.DB_URL,
      process.env.BackupDB,
    );
    await createLog({
      user_name: admin?.name,
      role: "admin",
      action: `Backup process executed by ${admin?.name}`,
    });
    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.err, error });
  }
};

// forget password  start

exports.getOtp = async (req, res) => {
  try {
    const { data } = req.body;

    // Phone validation
    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit email or phone number is required",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000);
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 min expiry
    const query = { $or: [{ phone: data }, { email: data }] };
    let admin = await adminModel.findOne(query);
    admin.otp = Number(otp);
    admin.otpExpire = otpExpiry;
    await admin.save();
    const phone = admin.phone;
    // const apiUrl = `https://sms.autobysms.com/app/smsapi/index.php?key=45FA150E7D83D8&campaign=0&routeid=9&type=text&contacts=${Number(
    //   admin.phone
    // )}&senderid=SMSSPT&msg=Your OTP is ${otp} SELECTIAL&template_id=1707166619134631839`;
    await createLog({
      user_name: admin?.name,
      role: "admin",
      action: `Admin ${admin?.name} initiated an OTP request for password reset`,
    });
    const apiUrl = `https://www.alots.in/sms-panel/api/http/index.php?username=DEBTRELIEF&apikey=C4A0D-7B2C2&apirequest=Text&sender=DebtRI&mobile=${phone}&message=Your Debt Relief India Login code is ${otp}.&route=TRANS&TemplateID=1707176907356446576&format=JSON`;

    const response = await axios.get(apiUrl);
    if (response.data.status === "success") {
      return res.status(200).json({
        success: true,
        message: `OTP sent Successfully to ${admin.phone}`,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Failed to send OTP",
        error: response.data,
      });
    }
  } catch (err) {
    console.log("OTP sending error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.forgetPassword = async (req, res, next) => {
  try {
    const { otp, password, data } = req.body;
    if (!otp || !password || !data) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }
    const admin = await adminModel.findOne({
      $or: [{ phone: data }, { email: data }],
    });
    await createLog({
      user_name: admin?.name || "Admin",
      role: "admin",
      action: `Password for the admin panel was changed by ${admin?.name || "Admin"}}`,
    });
    if (!admin) {
      return res
        .status(400)
        .json({ success: false, message: "Admin Not Found" });
    }
    if (admin.otp !== Number(otp)) {
      return res.status(400).json({ success: false, message: "Invaid OTP" });
    }
    if (!admin.otpExpire || new Date() > new Date(admin.otpExpire)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired.  Please request a new OTP ",
      });
    }
    const hashPass = await hashPassword(password);
    admin.otp = "";
    admin.otpExpire = "";
    admin.password = hashPass;
    await admin.save();
    return res.status(201).json({
      success: true,
      message: "Password Updated",
    });
  } catch (error) {
    console.log("d", error);
    return res
      .status(500)
      .json({ sccuess: false, message: error.message, error });
  }
};
// forget password end

// get logs data
exports.getLogsDetails = async (req, res) => {
  try {
    const logs = await logModel
      .find({}, "user_name role action createdAt") // select only needed fields
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();
    const filteredData = logs.map((val) => {
      return {
        user_name: val?.user_name,
        role: val?.role,
        action: val?.action,
        date: val?.createdAt,
      };
    });
    return res.status(200).json({
      status: true,
      data: filteredData,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// get monthly logs
// exports.getMonthlyYe

// add debt relief meter details
exports.addMeterDetails = async (req, res, next) => {
  try {
    const { admin_id } = req;

    if (!admin_id) {
      return res.status(401).json({
        status: false,
        message: "Admin credential missing",
      });
    }

    const requiredFields = [
      "fees",
      "settlement_percentage",
      "enroll_fees",
      "harashment_plan",
    ];

    for (let field of requiredFields) {
      const value = req.body[field];

      if (value === undefined || value === null) {
        return res.status(400).json({
          status: false,
          message: `${field} is required`,
        });
      }

      if (typeof value === "string" && value.trim().length === 0) {
        return res.status(400).json({
          status: false,
          message: `${field} cannot be empty`,
        });
      }
    }

    const payload = {
      fees: Number(req.body.fees),
      settlement_percentage: Number(req.body.settlement_percentage),
      enroll_fees: Number(req.body.enroll_fees),
      harashment_plan: Number(req.body.harashment_plan),
    };
    console.log(payload);
    const driMeter = await DriMeterModel.findOneAndUpdate(
      {},
      { $set: payload },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      status: true,
      message: "Meter details saved successfully",
      // data: driMeter,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// get dri meter details
exports.getDriMeterDetails = async (req, res, next) => {
  try {
    const meter = await DriMeterModel.findOne({}).select("-_id -__v");
    if (!meter) {
      return res.status(400).json({
        status: false,
        message: "meter details not found",
      });
    }
    return res.status(200).json({
      status: true,
      data: meter,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// allow users to review
exports.AllowUsersForReview = async (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Users  required",
      });
    }

    const review = await ReviewModel.findOneAndUpdate(
      {}, // filter (you can also include trustpilot if needed)
      {
        $set: {
          allow_users: users, // overwrite array
        },
      },
      {
        new: true, // updated doc return kare
        upsert: true, // agar nahi mila to create kare
      },
    );

    return res.status(200).json({
      status: true,
      message: "Review data saved successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};
// get users + names

// get review to user
exports.getReviewPermissionToUser = async (req, res) => {
  try {
    const { user_id } = req;
    console.log("userId", user_id);
    if (!user_id) {
      return res.status(400).json({
        status: false,
        message: "User Id missig",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid User Id",
      });
    }
    const objId = new mongoose.Types.ObjectId(user_id);
    const result = await ReviewModel.findOne({
      allow_users: { $in: [objId] },
    });
    if (!result) {
      return res.status(200).json({
        status: true,
        message: "Review Permission Not Allowed",
        permission: false,
      });
    }
    return res.status(200).json({
      status: true,
      message: "success",
      permission: true,
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: `Review Error: ${error.message}`,
    });
  }
};

//  GET ALL USERS WITH PERMISSION
exports.getReviewUsers = async (req, res) => {
  try {
    const users = await DrisModel.find({}).select("name phone userId phone id");
    console.log("users", users);
    let review = await ReviewModel.findOne();

    // create doc if not exists
    if (!review) {
      review = await ReviewModel.create({});
    }

    const allowedUsers = review.allow_users.map((id) => id.toString());

    const finalUsers = users.map((user) => ({
      _id: user.userId,
      driId: user.id,
      name: user.name,
      phone: user.phone,
      isAllowed: allowedUsers.includes(user._id.toString()),
    }));
    console.log("fona;", finalUsers);
    return res.json({
      status: true,
      data: finalUsers,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

//  TOGGLE USER PERMISSION
exports.toggleReviewPermission = async (req, res) => {
  try {
    const { userId, allow } = req.body;
    console.log(userId);
    if (!userId) {
      return res.json({
        status: false,
        message: "userId required",
      });
    }

    let review = await ReviewModel.findOne();

    if (!review) {
      review = await ReviewModel.create({});
    }

    if (allow) {
      await ReviewModel.updateOne({}, { $addToSet: { allow_users: userId } });
    } else {
      await ReviewModel.updateOne({}, { $pull: { allow_users: userId } });
    }

    return res.json({
      status: true,
      message: allow
        ? "User Allowed Successfully"
        : "User Blocked Successfully",
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

// client settlement letter
// presign url for settlement letter
exports.settlementLetterPresignUrl = async (req, res, next) => {
  try {
    const { fileName } = req.body;
    const key = `pdfs/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      // ContentType: "application/pdf",
      ACL: "public-read",
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 120 });

    return res.status(200).json({
      success: true,
      message: "success",
      data: {
        uploadUrl: url,
        fileUrl: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`,
      },
    });
  } catch (error) {
    console.log("settlement letter pre signed URL Error:", error);
    res.status(500).json({ success: false, message: "Error Generating URL" });
  }
};
exports.settlementLetterNotificationController = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ status: false, message: "phone required" });
    }
    const user = await User.findOne({ phone }, "_id");

    const token = await fcmTokenModel.findOne({ userId: user?._id }, "token");
    await sendNotificationToSingleUser(
      token.token,
      "Congrats! You have settled the obligation. Now you can download the settlement letter from app!",
    );
    return res.status(200).json({ status: true, message: "success" });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something Went Wrong",
      error: error.message,
    });
  }
};
