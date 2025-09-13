const FcmToken = require("../models/fcmTokenModel");
async function saveExpoToken(userId, token) {
  console.log("userId", userId);
  if (!token) {
    return;
  }

  const check = await FcmToken.findOne({ userId });

  if (!check) {
    const newToken = new FcmToken({ userId, token });
    await newToken.save();
  } else {
    if (check.token !== token) {
      check.token = token;
      await check.save();
    } else {
    }
  }
}

module.exports = { saveExpoToken };
