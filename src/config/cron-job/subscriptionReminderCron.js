// const cron = require("node-cron");
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
// const { subscriptionModel } = require("../../models/monthlySubscriptionModel");

// /* ---------- HELPERS ---------- */
// const parseDueDate = (d) => {
//   if (!d) return null;
//   if (d instanceof Date) return d;
//   const [day, month, year] = d.split("-");
//   return new Date(year, month - 1, day);
// };

// /* ---------- CRON ---------- */
// const SubscriptionCronJob = cron.schedule(
//   "0 11 * * *",
//   async () => {
//     try {
//       console.log("✅ Subscription Cron tick:", new Date().toLocaleString());

//       const today = new Date();
//       today.setHours(0, 0, 0, 0);

//       /* ---------- FETCH PENDING SUBSCRIPTIONS ---------- */
//       const pendingSubscriptions = await subscriptionModel
//         .find({ isPaid: false })
//         .lean();

//       if (!pendingSubscriptions.length) return;

//       /* ---------- USER IDS ---------- */
//       const userIds = [
//         ...new Set(pendingSubscriptions.map((e) => String(e.userId))),
//       ];

//       /* ---------- TOKENS ---------- */
//       const tokenDocs = await fcmTokenModel.find({
//         userId: { $in: userIds },
//       });

//       const userIdToTokens = {};
//       tokenDocs.forEach((t) => {
//         if (!t.token) return;
//         const uid = String(t.userId);
//         if (!userIdToTokens[uid]) userIdToTokens[uid] = new Set();
//         userIdToTokens[uid].add(t.token);
//       });

//       /* ---------- MESSAGE ---------- */
//       const reminder = await customeNoticationModel.findOne({}).lean();
//       const message =
//         reminder?.reminder_notification ||
//         "Your subscription payment is pending. Pay now to avoid interruption.";

//       /* ---------- PROCESS EACH SUBSCRIPTION ---------- */
//       for (const sub of pendingSubscriptions) {
//         const dueDate = parseDueDate(sub.dueDate);
//         if (!dueDate) continue;

//         dueDate.setHours(0, 0, 0, 0);

//         const reminderStart = new Date(dueDate);
//         reminderStart.setDate(dueDate.getDate() - 2);

//         if (today < reminderStart || today > dueDate) continue;

//         /* ---------- DAILY LOCK ---------- */
//         const lock = await User.updateOne(
//           {
//             _id: sub.userId,
//             $or: [
//               { lastSubscriptionReminderDate: { $exists: false } },
//               { lastSubscriptionReminderDate: { $lt: today } },
//             ],
//           },
//           { lastSubscriptionReminderDate: today },
//         );

//         if (lock.modifiedCount === 0) continue;

//         const tokens = [...(userIdToTokens[String(sub.userId)] || [])];

//         const title = "Payment Reminder";
//         const subTitle = "Monthy Subscription";

//         if (tokens.length) {
//           await sentNotificationToMultipleUsers(
//             tokens,
//             message,
//             title,
//             "",
//             "Monthly Subscription",
//           );
//         }

//         await insertManyNotification(
//           [String(sub.userId)],
//           title,
//           message,
//           subTitle,
//         );

//         console.log(`🔔 Reminder sent to user ${sub.userId}`);
//       }
//     } catch (err) {
//       console.error("❌ Subscription Cron Error:", err);
//     }
//   },
//   {
//     scheduled: true,
//     timezone: "Asia/Kolkata",
//   },
// );

// module.exports = SubscriptionCronJob;

const cron = require("node-cron");
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
const { subscriptionModel } = require("../../models/monthlySubscriptionModel");

/* ---------- HELPERS ---------- */
const parseDueDate = (d) => {
  if (!d) return null;

  // Already Date object
  if (d instanceof Date) return new Date(d);

  // Handle "DD-MM-YYYY"
  if (
    typeof d === "string" &&
    d.includes("-") &&
    d.split("-")[0].length === 2
  ) {
    const [day, month, year] = d.split("-");
    return new Date(year, month - 1, day);
  }

  // Fallback (ISO string etc.)
  return new Date(d);
};

/* ---------- CRON ---------- */
const SubscriptionCronJob = cron.schedule(
  "0 9 * * *", // runs daily at 09:00 AM IST
  async () => {
    try {
      console.log(
        "✅ Subscription Cron tick:",
        new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      );

      /* ---------- TODAY (IST SAFE) ---------- */
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      /* ---------- FETCH PENDING SUBSCRIPTIONS ---------- */
      const pendingSubscriptions = await subscriptionModel
        .find({ isPaid: false })
        .lean();

      if (!pendingSubscriptions.length) return;

      /* ---------- USER IDS ---------- */
      const userIds = [
        ...new Set(pendingSubscriptions.map((e) => String(e.userId))),
      ];

      /* ---------- TOKENS ---------- */
      const tokenDocs = await fcmTokenModel.find({
        userId: { $in: userIds },
      });

      const userIdToTokens = {};
      tokenDocs.forEach((t) => {
        if (!t.token) return;
        const uid = String(t.userId);
        if (!userIdToTokens[uid]) userIdToTokens[uid] = new Set();
        userIdToTokens[uid].add(t.token);
      });

      /* ---------- MESSAGE TEMPLATE ---------- */
      const reminderTemplate = await customeNoticationModel.findOne({}).lean();

      const baseMessage =
        reminderTemplate?.reminder_notification ||
        "Your subscription payment is pending. Pay now to avoid interruption.";

      /* ---------- PROCESS EACH SUBSCRIPTION ---------- */
      for (const sub of pendingSubscriptions) {
        const dueDate = parseDueDate(sub.dueDate);
        if (!dueDate) continue;

        dueDate.setHours(0, 0, 0, 0);

        /* ---------- REMINDER DATES ---------- */
        const twoDaysBefore = new Date(dueDate);
        twoDaysBefore.setDate(dueDate.getDate() - 2);

        const oneDayBefore = new Date(dueDate);
        oneDayBefore.setDate(dueDate.getDate() - 1);

        /* ---------- CHECK REMINDER DAY ---------- */
        let reminderType = null;

        if (today.getTime() === twoDaysBefore.getTime()) {
          reminderType = "2 days before";
        } else if (today.getTime() === oneDayBefore.getTime()) {
          reminderType = "1 day before";
        } else if (today.getTime() === dueDate.getTime()) {
          reminderType = "today";
        }

        if (!reminderType) continue;

        /* ---------- DAILY LOCK ---------- */
        const lock = await User.updateOne(
          {
            _id: sub.userId,
            $or: [
              { lastSubscriptionReminderDate: { $exists: false } },
              { lastSubscriptionReminderDate: { $lt: today } },
            ],
          },
          { lastSubscriptionReminderDate: today },
        );

        if (lock.modifiedCount === 0) continue;

        /* ---------- NOTIFICATION ---------- */
        const tokens = [...(userIdToTokens[String(sub.userId)] || [])];

        const title = "Payment Reminder";
        const subTitle = "Monthly Subscription";

        const finalMessage = `${baseMessage} (Due ${reminderType})`;

        if (tokens.length) {
          await sentNotificationToMultipleUsers(
            tokens,
            finalMessage,
            title,
            "",
            "Monthly Subscription",
          );
        }

        await insertManyNotification(
          [String(sub.userId)],
          title,
          finalMessage,
          subTitle,
        );

        console.log(`🔔 Reminder sent → User: ${sub.userId} | ${reminderType}`);
      }
    } catch (err) {
      console.error("❌ Subscription Cron Error:", err);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  },
);

module.exports = SubscriptionCronJob;
