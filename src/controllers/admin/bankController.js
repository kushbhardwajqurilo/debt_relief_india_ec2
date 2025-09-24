const BankModel = require("../../models/BankModel");
const cloudinary = require("../../utilitis/cloudinary");
const fs = require("fs");
exports.addBanks = async (req, res) => {
  try {
    console.log("hell");
    const { bankName } = req.body;
    const file = req.file;
    if (!bankName) {
      return res
        .status(400)
        .json({ success: false, message: "bank name missing" });
    }
    if (!file) {
      return res.status(400).json({ success: false, message: "image missing" });
    }
    const payload = { bankName, icon: file.location };
    const insertBank = await BankModel.create(payload);
    if (!insertBank) {
      return res
        .status(400)
        .json({ success: false, message: "failed to insert bank" });
    }
    return res.status(201).json({
      success: true,
      message: "bank add successfull",
    });
  } catch (error) {
    console.log("error", error);
    return res.status({ success: false, message: error.message, error });
  }
};

exports.getBanks = async (req, res) => {
  try {
    const banks = await BankModel.find({});
    if (!banks || banks.length === 0) {
      return res.json(400).json({ success: false, message: "Unable to fetch" });
    }
    return res.status(200).json({
      success: true,
      data: banks,
    });
  } catch (error) {
    return res.status({ success: false, message: error.message, error });
  }
};
