const adminModel = require("../models/adminModel");

exports.getAdminName = async () => {
  try {
    const admin = await adminModel.findOne({}, "name");
    return { name: admin?.name };
  } catch (error) {
    return error.message;
  }
};
