const { default: mongoose } = require("mongoose");
const DrisModel = require("../models/DriUserModel");
const outstandingModel = require("../models/OutstandingSettelmenetModel");

exports.outstandingController = async (req, res) => {
  try {
    const validation = {
      finaloutamount: "",
      finalsettelement: "",
      finalpercentage: "",
      finalsaving: "",
      phone: "",
      loanId: "",
    };

    const {
      finaloutamount,
      finalsaving,
      finalsettelement,
      finalpercentage,
      phone,
      loanId,
    } = req.body;

    // Validation
    for (let val of Object.keys(validation)) {
      if (!req.body[val] || req.body[val].toString().trim().length === 0) {
        return res
          .status(400)
          .json({ success: false, message: `${val} is required` });
      }
    }

    const loanObjId = new mongoose.Types.ObjectId(loanId);

    // Check existing outstanding
    const isExist = await outstandingModel.findOne({ phone });
    if (isExist && isExist.loanId.equals(loanObjId)) {
      return res
        .status(400)
        .json({ success: false, message: "Already Outstanding In this loan" });
    }

    // Create new outstanding
    const newOutstanding = new outstandingModel({
      finalOutstandingAmount: parseInt(finaloutamount),
      finalSettelement: parseInt(finalsettelement),
      finalPercentage: parseInt(finalpercentage),
      finalSavings: parseInt(finalsaving),
      phone: Number(phone),
      loanId: loanObjId,
    });

    await newOutstanding.save();

    // Update user loans
    const driUser = await DrisModel.findOne({ phone });
    if (driUser) {
      driUser.credit_Cards?.forEach((val) => {
        if (val._id.equals(loanObjId)) val.isOutstanding = true;
      });
      driUser.personal_Loans?.forEach((val) => {
        if (val._id.equals(loanObjId)) val.isOutstanding = true;
      });
      await driUser.save();
    }

    return res
      .status(201)
      .json({ success: true, message: "Outstanding successfully" });
  } catch (error) {
    console.log("error", error);
    return res
      .status(500)
      .json({ success: false, message: error.message, error });
  }
};

// get outstanding
exports.getOutstanding = async (req, res) => {
  try {
    const { phone } = req.body;
    const outstaings = await outstandingModel.find({ phone });
    if (!outstaings || outstaings.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "no outstanding found" });
    }
    return res.status(200).json({
      success: true,
      data: outstaings,
    });
  } catch (error) {
    console.log("error", error);
    return res
      .status(500)
      .json({ success: false, message: error.message, error });
  }
};
