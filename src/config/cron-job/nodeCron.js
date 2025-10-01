const cron = require("node-cron");
const DrisModel = require("../../models/DriUserModel");
const fcmTokenModel = require("../../models/fcmTokenModel");
const User = require("../../models/userModel");
const {
  sentNotificationToMultipleUsers,
} = require("../expo-push-notification/expoNotification");
const {
  insertManyNotification,
} = require("../../controllers/notificationController/notificationsController");
const {
  customeNoticationModel,
} = require("../../models/contactYourAdvocateModel");

const cronJob = cron.schedule(
  "0 9 * * *", // ✅ every minute (removed trailing space)
  async () => {
    try {
      console.log("✅ Cron tick at", new Date().toLocaleString());

      const pendingEmis = await DrisModel.find({ status: "pending" });
      if (!pendingEmis.length) {
        console.log(" No pending EMI found.");
        return;
      }

      const phones = [...new Set(pendingEmis.map((e) => String(e.phone)))];
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

      // Custom notification
      const reminder = await customeNoticationModel.findOne({});
      const message =
        reminder?.reminder_notification ||
        "Your EMI payment is pending. Pay Now!";

      for (const emi of pendingEmis) {
        const user = users.find((u) => String(u.phone) === String(emi.phone));
        if (!user) continue;

        const tokens = userIdToTokens[user._id.toString()] || [];
        if (tokens.length > 0) {
          await sentNotificationToMultipleUsers(
            tokens,
            message,
            "EMI Reminder",
            "emiReminder"
          );
        }
        await insertManyNotification(
          [user._id.toString()],
          "EMI Reminder",
          message,
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
