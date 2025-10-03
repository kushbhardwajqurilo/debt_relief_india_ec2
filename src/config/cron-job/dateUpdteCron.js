const cron = require("node-cron");
const DrisModel = require("../../models/DriUserModel");
async function updateEMIDueDates() {
  const getDates = await DrisModel.find({});
  console.log(getDates);
  const today = new Date();
  for (let rec of getDates) {
    if (!rec.dueDate) continue;

    //  convert date do dd-mm-yyyy string to Date object
    let [day, month, year] = rec.dueDate.split("-").map(Number);
    let dueDate = new Date(year, month - 1, day);
    dueDate.setHours(0, 0, 0, 0);

    // Only update if today >= dueDate AND dueDate month/year < today month/year
    if (today >= dueDate) {
      // add 1 month
      dueDate.setMonth(dueDate.getMonth() + 1);

      // format back to dd-mm-yyyy
      let newDay = String(dueDate.getDate()).padStart(2, "0");
      let newMonth = String(dueDate.getMonth() + 1).padStart(2, "0");
      let newYear = dueDate.getFullYear();

      rec.dueDate = `${newDay}-${newMonth}-${newYear}`;
      await rec.save();
      console.log(`Updated dueDate for ${rec.id} to ${rec.dueDate}`);
    }
  }
}
const dateCron = cron.schedule(
  "* * * * *",
  async () => {
    try {
      console.log("Date cron running");
      await updateEMIDueDates();
    } catch (err) {
      console.log("erro in updating dueDates", err);
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  }
);

module.exports = dateCron;
