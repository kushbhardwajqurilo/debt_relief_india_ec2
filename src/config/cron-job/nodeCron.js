const cron = require("node-cron");
const cluster = require("cluster");
const DrisModel = require("../../models/DriUserModel");
const fcmTokenModel = require("../../models/fcmTokenModel");
const User = require("../../models/userModel");
const {
  sentNotificationToMultipleUsers,
} = require("../expo-push-notification/expoNotification");
const {
  insertManyNotification,
} = require("../../controllers/notificationController/notificationsController");

const cronJob = cron.schedule(
  // "0 9 * * *", // Run every day at 9:00 AM
  "0 9 * * * *",
  async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pendingEmis = await DrisModel.find({ status: "pending" });
      if (!pendingEmis.length) {
        console.log(" No pending EMI found.");
        return;
      }

      // phones
      const phones = [...new Set(pendingEmis.map((e) => String(e.phone)))];

      // users
      const users = await User.find({ phone: { $in: phones } });
      const userIdsObj = users.map((u) => u._id);
      const userIdsStr = users.map((u) => u._id.toString());

      const tokenDocs = await fcmTokenModel.find({
        $or: [{ userId: { $in: userIdsObj } }, { userId: { $in: userIdsStr } }],
      });

      const userIdToTokens = {};
      tokenDocs.forEach((td) => {
        const id = String(td.userId);
        userIdToTokens[id] = userIdToTokens[id] || [];
        if (td.token) userIdToTokens[id].push(td.token);
      });

      for (const emi of pendingEmis) {
        const user = users.find((u) => String(u.phone) === String(emi.phone));
        if (!user) continue;

        const tokens = userIdToTokens[user._id.toString()] || [];
        console.log(`EMI for ${emi.name} -> tokens:`, tokens);

        if (tokens.length > 0) {
          await sentNotificationToMultipleUsers(
            tokens,
            "⚠️ Your EMI payment is pending. Please pay now!",
            "EMI Reminder",
            "emiReminder"
          );
        }
        await insertManyNotification(
          [user._id.toString()],
          "EMI Reminder",
          "Your EMI Payment is pending. Please pay now!",
          "EMI"
        );
      }
    } catch (err) {
      console.error("❌ Error in cron job:", err);
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  }
);

module.exports = cronJob;
