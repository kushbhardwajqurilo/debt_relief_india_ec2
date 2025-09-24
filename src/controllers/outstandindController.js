const outstandingModel = require("../models/OutstandingSettelmenetModel");

exports.outstandingController = async (req, res) => {
  try {
    const validation = {
      finaloutamount: "",
      finalsettelement: "",
      finalpercentage: "",
      finalsaving: "",
      phone: "",
    };
    const {
      finaloutamount,
      finalsaving,
      finalsettelement,
      finalpercentage,
      phone,
    } = req.body;
    console.log("body", req.body);
    for (let val of Object.keys(validation)) {
      if (!req.body[val] || req.body[val].toString().trim().length === 0) {
        return res
          .status(400)
          .json({ success: false, message: `${val} is required` });
      }
    }
    const isExist = await outstandingModel.findOne({ phone });
    if (isExist) {
      return res
        .status(400)
        .json({ success: false, message: "Outstanding already add" });
    }
    const newOutstanding = new outstandingModel({
      finalOutstandingAmount: parseInt(finaloutamount),
      finalSettelement: parseInt(finalsettelement),
      finalPercentage: parseInt(finalpercentage),
      finalSavings: parseInt(finalsaving),
      phone: Number(phone),
    });

    await newOutstanding.save();
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
