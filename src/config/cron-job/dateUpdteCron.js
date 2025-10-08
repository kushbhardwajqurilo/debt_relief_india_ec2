const cron = require("node-cron");
const DrisModel = require("../../models/DriUserModel");
const subscriptionModel = require("../../models/monthlySubscriptionModel");
async function updateEMIDueDates() {
  const getDates = await DrisModel.find({});
  console.log(getDates);
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
  const getDates = await subscriptionModel.find({});
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let rec of getDates) {
    if (!rec.dueDate) continue;

    let dueDate = new Date(rec.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    if (today > dueDate) {
      dueDate.setMonth(dueDate.getMonth() + 1);
      rec.dueDate = dueDate;
      await rec.save();

      console.log(
        `Updated dueDate for ${rec._id} → ${rec.dueDate.toISOString()}`
      );
    }
  }
}

const dateCron = cron.schedule(
  "0 1 * * *",
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
  }
);

module.exports = dateCron;
