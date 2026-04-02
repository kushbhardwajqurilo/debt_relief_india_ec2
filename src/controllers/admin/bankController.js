const BankModel = require("../../models/BankModel");
const cloudinary = require("../../utilitis/cloudinary");
const fs = require("fs");
const { createLog } = require("../../utilitis/log");
const adminModel = require("../../models/adminModel");
exports.addBanks = async (req, res) => {
  try {
    const { admin_id, role } = req;
    const { bankName } = req.body;
    const file = req.file;

    if (!admin_id) {
      await createLog({
        user_name: "Unknown",
        role: "unknown",
        action: "Someone tried to add bank but admin id missing",
      });

      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const admin = await adminModel.findById(admin_id, "name");

    if (!bankName) {
      await createLog({
        user_name: admin?.name || "Admin",
        role,
        action: `${admin?.name} tried to add bank but bank name missing`,
      });

      return res.status(400).json({
        success: false,
        message: "Bank name missing",
      });
    }

    if (!file) {
      await createLog({
        user_name: admin?.name || "Admin",
        role,
        action: `${admin?.name} tried to add bank ${bankName} but image missing`,
      });

      return res.status(400).json({
        success: false,
        message: "Image missing",
      });
    }

    const payload = {
      bankName,
      icon: file.location,
    };

    const insertBank = await BankModel.create(payload);

    await createLog({
      user_name: admin?.name,
      role,
      action: `${admin?.name} added bank | BankName:${bankName}`,
    });

    return res.status(201).json({
      success: true,
      message: "Bank added successfully",
    });
  } catch (error) {
    console.log("error", error);

    await createLog({
      user_name: "System",
      role: "error",
      action: `Error while adding bank -> ${error.message}`,
    });

    return res.status(500).json({
      success: false,
      message: error.message,
    });
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
