const logModel = require("../models/LogsModel");

exports.createLog = async ({ user_name, role, action }) => {
  try {
    await logModel.create({
      user_name,
      role,
      action,
    });
  } catch (error) {
    console.error("Log Error:", error.message);
  }
};
// /
