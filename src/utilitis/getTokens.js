const fcmTokenModel = require("../models/fcmTokenModel");
const userModel = require("../models/userModel");
exports.getSingleUserToken = async (phone) => {
  console.log("token phone", phone);
  if (!phone) {
    return { status: false };
  }
  const user = await userModel.findOne({ phone });
  if (!user || user.length === 0) {
    return { status: false };
  }
  const token = await fcmTokenModel.findOne({ userId: user._id });
  if (!token) {
    return { sucess: false };
  }
  console.log("user token ", token);
  return { token: token.token, userId: user._id, status: true };
};
