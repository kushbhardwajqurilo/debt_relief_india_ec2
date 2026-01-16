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

/* ---------- HELPERS ---------- */
const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const parseDueDate = (d) => {
  if (!d) return null;
  if (d instanceof Date) return d;
  const [day, month, year] = d.split("-");
  return new Date(year, month - 1, day);
};

/* ---------- CRON ---------- */
const cronJob = cron.schedule(
  "0 9 * * *",
  async () => {
    try {
      console.log("✅ Cron tick", new Date().toLocaleString());

      /* ---------- PENDING EMIs ---------- */
      const pendingEmis = await DrisModel.find({ status: "pending" }).lean();
      if (!pendingEmis.length) return;

      /* ---------- USERS ---------- */
      const phones = [...new Set(pendingEmis.map((e) => String(e.phone)))];
      const users = await User.find({ phone: { $in: phones } }).lean();
      if (!users.length) return;

      /* ---------- TOKENS (DEDUPED) ---------- */
      const userIds = users.map((u) => u._id);
      const tokenDocs = await fcmTokenModel.find({
        userId: { $in: userIds },
      });

      const userIdToTokens = {};
      tokenDocs.forEach((t) => {
        const uid = String(t.userId);
        if (!userIdToTokens[uid]) userIdToTokens[uid] = new Set();
        if (t.token) userIdToTokens[uid].add(t.token);
      });

      /* ---------- MESSAGE ---------- */
      const reminder = await customeNoticationModel.findOne({}).lean();
      const message =
        reminder?.reminder_notification ||
        "Your EMI payment is pending. Pay Now!";

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      /* ---------- USER BASED LOOP (🔥 IMPORTANT) ---------- */
      for (const user of users) {
        const userEmis = pendingEmis.filter(
          (e) => String(e.phone) === String(user.phone)
        );

        if (!userEmis.length) continue;

        // ek hi EMI consider karo
        const emi = userEmis[0];

        const dueDate = parseDueDate(emi.dueDate);
        if (!dueDate) continue;

        dueDate.setHours(0, 0, 0, 0);

        const startReminderDate = new Date(dueDate);
        startReminderDate.setDate(dueDate.getDate() - 2);

        // ❌ not in window
        if (today < startReminderDate || today > dueDate) continue;

        /* ---------- DB LEVEL DAILY LOCK ---------- */
        const updateResult = await User.updateOne(
          {
            _id: user._id,
            $or: [
              { lastEmiReminderDate: { $exists: false } },
              { lastEmiReminderDate: { $lt: today } },
            ],
          },
          { lastEmiReminderDate: today }
        );

        // ❌ already notified (multi server safe)
        if (updateResult.modifiedCount === 0) continue;

        /* ---------- SUBTITLE ---------- */
        let subTitle = "";
        if (emi.Service_Fees) subTitle = "Service Fees";
        else if (emi.Service_Advance_Total) subTitle = "Service Advance";
        if (!subTitle) continue;

        const title = "Payment Reminder";
        const tokens = [...(userIdToTokens[String(user._id)] || [])];

        /* ---------- PUSH ---------- */
        if (tokens.length) {
          await sentNotificationToMultipleUsers(
            tokens,
            message,
            title,
            subTitle
          );
        }

        /* ---------- SAVE ---------- */
        await insertManyNotification(
          [String(user._id)],
          title,
          message,
          subTitle
        );

        console.log(
          `🔔 Notification sent to user ${user._id} | tokens=${tokens.length}`
        );
      }
    } catch (err) {
      console.error("❌ Cron error:", err);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);

module.exports = cronJob;
