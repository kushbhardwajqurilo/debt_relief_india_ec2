// <------------ old code -------------->

// const cron = require("node-cron");
// const DrisModel = require("../../models/DriUserModel");
// const fcmTokenModel = require("../../models/fcmTokenModel");
// const User = require("../../models/userModel");
// const {
//   sentNotificationToMultipleUsers,
// } = require("../expo-push-notification/expoNotification");
// const {
//   insertManyNotification,
// } = require("../../controllers/notificationController/notificationsController");
// const {
//   customeNoticationModel,
// } = require("../../models/contactYourAdvocateModel");

// const cronJob = cron.schedule(
//   "0 9 * * *", // ✅ every minute (removed trailing space)
//   async () => {
//     try {
//       console.log("✅ Cron tick at", new Date().toLocaleString());

//       const pendingEmis = await DrisModel.find({ status: "pending" });
//       if (!pendingEmis.length) {
//         console.log(" No pending EMI found.");
//         return;
//       }

//       const phones = [...new Set(pendingEmis.map((e) => String(e.phone)))];
//       const users = await User.find({ phone: { $in: phones } });
//       const userIdsObj = users.map((u) => u._id);
//       const userIdsStr = users.map((u) => u._id.toString());

//       const tokenDocs = await fcmTokenModel.find({
//         $or: [{ userId: { $in: userIdsObj } }, { userId: { $in: userIdsStr } }],
//       });

//       const userIdToTokens = {};
//       tokenDocs.forEach((td) => {
//         const id = String(td.userId);
//         userIdToTokens[id] = userIdToTokens[id] || [];
//         if (td.token) userIdToTokens[id].push(td.token);
//       });

//       // Custom notification
//       const reminder = await customeNoticationModel.findOne({});
//       const message =
//         reminder?.reminder_notification ||
//         "Your EMI payment is pending. Pay Now!";

//       for (const emi of pendingEmis) {
//         const user = users.find((u) => String(u.phone) === String(emi.phone));
//         if (!user) continue;

//         const tokens = userIdToTokens[user._id.toString()] || [];
//         if (tokens.length > 0) {
//           await sentNotificationToMultipleUsers(
//             tokens,
//             message,
//             "EMI Reminder",
//             "emiReminder"
//           );
//         }
//         await insertManyNotification(
//           [user._id.toString()],
//           "EMI Reminder",
//           message,
//           "EMI"
//         );
//       }
//     } catch (err) {
//       console.error("❌ Error in cron job:", err);
//     }
//   },
//   {
//     scheduled: false,
//     timezone: "Asia/Kolkata",
//   }
// );

// module.exports = cronJob;

// <----------- new code -------------->

// const cron = require("node-cron");
// const DrisModel = require("../../models/DriUserModel");
// const fcmTokenModel = require("../../models/fcmTokenModel");
// const User = require("../../models/userModel");
// const {
//   sentNotificationToMultipleUsers,
// } = require("../expo-push-notification/expoNotification");
// const {
//   insertManyNotification,
// } = require("../../controllers/notificationController/notificationsController");
// const {
//   customeNoticationModel,
// } = require("../../models/contactYourAdvocateModel");

// const cronJob = cron.schedule(
//   "* * * * *", // daily at 9 AM
//   async () => {
//     try {
//       console.log("✅ Cron tick at", new Date().toLocaleString());

//       const pendingEmis = await DrisModel.find({ status: "pending" });
//       if (!pendingEmis.length) {
//         console.log("No pending EMI found.");
//         return;
//       }

//       const phones = [...new Set(pendingEmis.map((e) => String(e.phone)))];
//       const users = await User.find({ phone: { $in: phones } });

//       const userIdsObj = users.map((u) => u._id);
//       const userIdsStr = users.map((u) => u._id.toString());

//       const tokenDocs = await fcmTokenModel.find({
//         $or: [{ userId: { $in: userIdsObj } }, { userId: { $in: userIdsStr } }],
//       });

//       const userIdToTokens = {};
//       tokenDocs.forEach((td) => {
//         const id = String(td.userId);
//         userIdToTokens[id] = userIdToTokens[id] || [];
//         if (td.token) userIdToTokens[id].push(td.token);
//       });

//       // 🔹 Message (NO CHANGE)
//       const reminder = await customeNoticationModel.findOne({});
//       const message =
//         reminder?.reminder_notification ||
//         "Your EMI payment is pending. Pay Now!";

//       for (const emi of pendingEmis) {
//         const user = users.find((u) => String(u.phone) === String(emi.phone));
//         if (!user) continue;

//         // 🔹 Dynamic Subtitle Logic
//         let subTitle = "";
//         if (emi.Service_Fees && emi.Service_Fees !== "") {
//           subTitle = "Service Fees";
//         } else if (
//           emi.Service_Advance_Total &&
//           emi.Service_Advance_Total !== ""
//         ) {
//           subTitle = "Service Advance";
//         }

//         if (!subTitle) continue; // safety

//         const title = "Payment Reminder";
//         const tokens = userIdToTokens[user._id.toString()] || [];

//         // Push Notification
//         if (tokens.length > 0) {
//           await sentNotificationToMultipleUsers(
//             tokens,
//             message, // ❌ untouched
//             title, // ✅ fixed
//             subTitle // ✅ dynamic
//           );
//         }

//         // 🗃️ Save notification
//         await insertManyNotification(
//           [user._id.toString()],
//           title, // Payment Reminder
//           message, // DB message
//           subTitle // Service Fees / Service Advance
//         );
//       }
//     } catch (err) {
//       console.error("❌ Error in cron job:", err);
//     }
//   },
//   {
//     scheduled: false,
//     timezone: "Asia/Kolkata",
//   }
// );

// module.exports = cronJob;

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

/* ---------- DATE HELPERS ---------- */
const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const parseDueDate = (dueDateStr) => {
  // expects "DD-MM-YYYY"
  const [day, month, year] = dueDateStr.split("-");
  return new Date(year, month - 1, day);
};

/* ---------- CRON ---------- */
const cronJob = cron.schedule(
  "10 12 * * *",
  async () => {
    try {
      console.log(" Cron tick at", new Date().toLocaleString());

      const pendingEmis = await DrisModel.find({ status: "pending" });
      if (!pendingEmis.length) return;

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

      /* ---------- MESSAGE (NO CHANGE) ---------- */
      const reminder = await customeNoticationModel.findOne({});
      const message =
        reminder?.reminder_notification ||
        "Your EMI payment is pending. Pay Now!";

      /* ---------- TODAY (NORMALIZED) ---------- */
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      /* ---------- PER-RUN USER DEDUP ---------- */
      const notifiedUsers = new Set();

      for (const emi of pendingEmis) {
        if (!emi.dueDate) continue;

        const user = users.find((u) => String(u.phone) === String(emi.phone));
        if (!user) continue;

        // ❌ same run me already notified
        if (notifiedUsers.has(user._id.toString())) continue;

        /* ---------- DUE DATE WINDOW ---------- */
        const dueDate = parseDueDate(emi.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const startReminderDate = new Date(dueDate);
        startReminderDate.setDate(dueDate.getDate() - 2);

        // ❌ not in reminder window
        if (today < startReminderDate || today > dueDate) continue;

        // ❌ already notified today
        if (
          user.lastEmiReminderDate &&
          isSameDay(new Date(user.lastEmiReminderDate), today)
        ) {
          continue;
        }

        /* ---------- SUBTITLE ---------- */
        let subTitle = "";
        if (emi.Service_Fees && emi.Service_Fees !== "") {
          subTitle = "Service Fees";
        } else if (
          emi.Service_Advance_Total &&
          emi.Service_Advance_Total !== ""
        ) {
          subTitle = "Service Advance";
        }

        if (!subTitle) continue;

        const title = "Payment Reminder";
        const tokens = userIdToTokens[user._id.toString()] || [];

        /* ---------- PUSH ---------- */
        if (tokens.length > 0) {
          await sentNotificationToMultipleUsers(
            tokens,
            message, // DB message (unchanged)
            title,
            subTitle
          );
        }

        /* ---------- SAVE NOTIFICATION ---------- */
        await insertManyNotification(
          [user._id.toString()],
          title,
          message,
          subTitle
        );

        /* ---------- UPDATE USER (DAILY DEDUP) ---------- */
        await User.updateOne({ _id: user._id }, { lastEmiReminderDate: today });

        notifiedUsers.add(user._id.toString());

        console.log(
          `🔔 EMI reminder sent to user ${user._id} on ${today.toDateString()}`
        );
      }
    } catch (err) {
      console.error("❌ Error in cron job:", err);
    }
  },
  {
    scheduled: true, // auto start
    timezone: "Asia/Kolkata",
  }
);

module.exports = cronJob;
