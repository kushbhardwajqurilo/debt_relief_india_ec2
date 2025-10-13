const mongoose = require("mongoose");
const customeNotificatin = mongoose.Schema({
  kyc_approve: {
    type: String,
    required: true,
  },
  kyc_submit: {
    type: String,
    required: true,
  },
  invoice: {
    type: String,
    required: true,
  },
  reminder_notification: {
    type: String,
  },
  Emi_Notification: {
    type: String,
    required: true,
  },
});

const conctYourAdvocateSchema = mongoose.Schema({
  message: {
    type: String,
    default:
      "our advocate are available form 9:00 AM t 11:00 AM, Monday to Saturday. Please ccall use during these hours for assistance with your legal matters. For urgent matters outside these hours, you can send us a message via WhatsApp abd we'll get back to you as soon as possible",
  },
});
const serviceTimingSchema = mongoose.Schema({
  timing: { type: String, required: true },
});
const serviceTimingModel = new mongoose.model(
  "service_timing",
  serviceTimingSchema
);
const customeNoticationModel = new mongoose.model(
  "customeNotification",
  customeNotificatin
);
const contatYourAdvocateModel = new mongoose.model(
  "contactmessage",
  conctYourAdvocateSchema
);
module.exports = {
  contatYourAdvocateModel,
  customeNoticationModel,
  serviceTimingModel,
};
