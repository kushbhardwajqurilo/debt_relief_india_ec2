// const cron = require("node-cron");
// const DrisModel = require("../../models/DriUserModel");
// const { subscriptionModel } = require("../../models/monthlySubscriptionModel");
// async function updateEMIDueDates() {
//   const getDates = await DrisModel.find({});
//   const today = new Date();
//   for (let rec of getDates) {
//     if (!rec.dueDate) continue;

//     let [day, month, year] = rec.dueDate.split("-").map(Number);
//     let dueDate = new Date(year, month - 1, day);
//     dueDate.setHours(0, 0, 0, 0);

//     if (today >= dueDate) {
//       // add 1 month
//       dueDate.setMonth(dueDate.getMonth() + 1);

//       // format back to dd-mm-yyyy
//       let newDay = String(dueDate.getDate()).padStart(2, "0");
//       let newMonth = String(dueDate.getMonth() + 1).padStart(2, "0");
//       let newYear = dueDate.getFullYear();

//       rec.dueDate = `${newDay}-${newMonth}-${newYear}`;
//       await rec.save();
//     }
//   }
// }

// async function monthlySubsciptionDueDateUpdate() {
//   try {
//     const allSubscriptions = await subscriptionModel.find({
//       dueDate: { $exists: true, $ne: null },
//       isPaid: false,
//     });

//     console.log("📦 Subscriptions found:", allSubscriptions.length);

//     if (!allSubscriptions.length) {
//       console.log("No un-paid subscriptions found for due date updates");
//       return;
//     }

//     let updatedCount = 0;
//     let errorCount = 0;

//     // 👉 today date only (no time)
//     const todayStr = new Date().toISOString().split("T")[0];

//     for (let rec of allSubscriptions) {
//       try {
//         if (!rec.dueDate) continue;

//         // 👉 due date only
//         const dueStr = new Date(rec.dueDate).toISOString().split("T")[0];

//         console.log(`Checking → today: ${todayStr}, due: ${dueStr}`);

//         // ✅ if due today or past
//         if (todayStr >= dueStr) {
//           const nextDueDate = new Date(rec.dueDate);
//           nextDueDate.setMonth(nextDueDate.getMonth() + 1);

//           rec.dueDate = nextDueDate;
//           rec.isPaid = false;

//           await rec.save();
//           updatedCount++;

//           console.log(
//             `✅ Updated subscription ${rec._id} → ${nextDueDate.toISOString()}`,
//           );
//         }
//       } catch (err) {
//         errorCount++;
//         console.log(`❌ Error for ${rec._id}:`, err.message);
//       }
//     }

//     console.log(
//       `📊 Due date update complete: ${updatedCount} updated, ${errorCount} errors`,
//     );
//   } catch (error) {
//     console.log("❌ Cron main error:", error.message);
//   }
// }

// const dateCron = cron.schedule(
//   "15 09 * * *",
//   async () => {
//     try {
//       console.log("Date cron running");
//       await updateEMIDueDates();
//       await monthlySubsciptionDueDateUpdate();
//     } catch (err) {
//       console.log("erro in updating dueDates", err);
//     }
//   },
//   {
//     scheduled: true,
//     timezone: "Asia/Kolkata",
//   },
// );

// module.exports = dateCron;
