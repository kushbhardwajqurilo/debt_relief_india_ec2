const cron = require("node-cron");
const DrisModel = require("../../models/DriUserModel");
const { subscriptionModel } = require("../../models/monthlySubscriptionModel");
async function updateEMIDueDates() {
  const getDates = await DrisModel.find({});
  const today = new Date();
  for (let rec of getDates) {
    if (!rec.dueDate) continue;

    let [day, month, year] = rec.dueDate.split("-").map(Number);
    let dueDate = new Date(year, month - 1, day);
    dueDate.setHours(0, 0, 0, 0);

    if (today >= dueDate) {
      // add 1 month
      dueDate.setMonth(dueDate.getMonth() + 1);

      // format back to dd-mm-yyyy
      let newDay = String(dueDate.getDate()).padStart(2, "0");
      let newMonth = String(dueDate.getMonth() + 1).padStart(2, "0");
      let newYear = dueDate.getFullYear();

      rec.dueDate = `${newDay}-${newMonth}-${newYear}`;
      await rec.save();
    }
  }
}

async function monthlySubsciptionDueDateUpdate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // CRITICAL FIX: Only get PAID subscriptions that have passed their due date
  // Unpaid subscriptions should NOT have their due dates automatically updated
  // This prevents automatic deletion/loss of unpaid subscription records
  const allSubscriptions = await subscriptionModel.find({
    dueDate: { $exists: true, $ne: null },
    isPaid: true, // Only process paid subscriptions
  });

  if (!allSubscriptions.length) {
    console.log("No paid subscriptions found for due date updates");
    return;
  }

  let updatedCount = 0;
  let errorCount = 0;

  for (let rec of allSubscriptions) {
    try {
      if (!rec.dueDate) continue;

      let dueDate = new Date(rec.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      // Only update if today is past or equal to due date
      if (today >= dueDate) {
        // Add 1 month to due date for next billing cycle
        const nextDueDate = new Date(dueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);

        // Update subscription: set new due date and mark as unpaid for next month
        rec.dueDate = nextDueDate;
        rec.isPaid = false; // Mark next month as unpaid

        await rec.save();
        updatedCount++;

        console.log(
          `✅ Updated subscription ${rec._id}: dueDate → ${nextDueDate.toISOString()}, isPaid → false`,
        );
      }
    } catch (error) {
      errorCount++;
      console.error(
        `❌ Error updating subscription ${rec._id}:`,
        error.message,
      );
      // Continue with next subscription instead of stopping
    }
  }

  console.log(
    `📊 Due date update complete: ${updatedCount} updated, ${errorCount} errors`,
  );
}

const dateCron = cron.schedule(
  "0 9 * * *",
  async () => {
    try {
      console.log("Date cron running");
      await updateEMIDueDates();
      await monthlySubsciptionDueDateUpdate();
    } catch (err) {
      console.log("erro in updating dueDates", err);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  },
);

module.exports = dateCron;
