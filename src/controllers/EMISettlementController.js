const EmiModel = require("../models/EMIModel");
const DrisModel = require("../models/DriUserModel");
const fs = require("fs");
const csv = require("csvtojson");
const KYCmodel = require("../models/KYCModel");
const {
  sendNotificationToSingleUser,
} = require("../config/expo-push-notification/expoNotification");
const fcmTokenModel = require("../models/fcmTokenModel");
const { getSingleUserToken } = require("../utilitis/getTokens");
const {
  createNotification,
} = require("./notificationController/notificationsController");
const csvParser = require("csv-parser");
const { default: mongoose } = require("mongoose");

// exports.EMISettlement = async (req, res) => {
//   try {
//     const { phone } = req.body;
//     console.log("phone", phone);
//     const csvfilepath = req.file.path;
//     if (!phone) {
//       return res.status(400).json({
//         success: false,
//         message: "Phone number is required",
//       });
//     }
//     if (phone.length > 10) {
//       return res
//         .status(400)
//         .json({ success: false, message: "phone number must me 10 digit" });
//     }
//     const rawRows = await csv().fromFile(req.file.path);

//     let lastPhone = "";
//     let lastName = "";

//     // Fill missing Person & Phone values
//     const normalizedData = rawRows.map((row) => {
//       if (row.Phone && row.Phone.trim()) lastPhone = row.Phone.trim();
//       if (row.Person && row.Person.trim()) lastName = row.Person.trim();

//       return {
//         ...row,
//         Phone: row.Phone && row.Phone.trim() ? row.Phone.trim() : lastPhone,
//         Person: row.Person && row.Person.trim() ? row.Person.trim() : lastName,
//       };
//     });
//     console.log("phone", normalizedData);
//     // Filter only this phone number
//     const filteredRows = normalizedData.filter((row) => {
//       return String(row.Phone).trim() === String(phone).trim();
//     });
//     console.log("filterer", filteredRows);
//     if (filteredRows.length === 0) {
//       fs.unlinkSync(req.file.path);
//       return res.status(404).json({
//         success: false,
//         message: "User Not Found In This Nunber..",
//       });
//     }

//     // Build grouped output
//     const output = {
//       phone: phone,
//       credit_Cards: [],
//       credit_Amount: [],
//       personal_Loan: [],
//       PL_Amount: [],
//       CreditTotal: "",
//       PL_Total: "",
//       Service_Fees: "",
//       Service_Advance_Total: "",
//       Final_Settlement: "",
//       Settlement_Percent: "",
//       totalEmi: "",
//       monthlyEmi: "",
//       status: "penidng",
//     };

//     filteredRows.forEach((entry) => {
//       if (entry.CreditCard) {
//         output.credit_Cards.push(entry.CreditCard);
//         output.credit_Amount.push(entry.CreditAmc || entry.CreditAmount || "");
//       }

//       if (entry.CCTotal) output.CreditTotal = entry.CCTotal;

//       // Loan details
//       if (entry.PersonalLoan) {
//         output.personal_Loan.push(entry.PersonalLoan);
//         output.PL_Amount.push(entry.TotalAmount || "");
//       }

//       if (entry.PLTotal) output.PL_Total = entry.PLTotal;
//       if (entry.ServiceTotal) output.Service_Fees = entry.ServiceTotal;
//       if (entry.AdvanceTotal) output.Service_Advance_Total = entry.AdvanceTotal;
//       if (entry.FinalSettlement)
//         output.Final_Settlement = entry.FinalSettlement;
//       if (entry.SettlementPercent)
//         output.Settlement_Percent = entry.SettlementPercent;
//       if (entry.TotalEMI) output.totalEmi = Number(entry.TotalEMI);
//       if (entry.MonthlyEmi) output.monthlyEmi = Number(entry.MonthlyEmi);
//     });

//     fs.unlinkSync(csvfilepath);
//     const isUser = await DrisModel.findOne({ phone: phone });
//     if (isUser) {
//       Object.assign(isUser, output);
//       await isUser.save();

//       return res.status(201).json({
//         success: true,
//         message: "EMI Upload successfully",
//       });
//     }

//     return res.json({
//       success: false,
//       message: "Invalid User",
//     });
//   } catch (err) {
//     console.log("err", err);
//     return res.status(500).send({
//       message: "Server Error",
//       error: err.message,
//     });
//   }
// };

exports.EMIPayment = async (req, res, next) => {
  try {
    const { user_id, loanId, emiId } = req.body;
    if (!user_id || !loanId || !emiId) {
      return res.status(400).json({ message: "Requirement Missing" });
    }
    const isEMIexist = await EmiModel.findOne({
      userId: user_id,
      loanId: loan,
    });
    if (isEMIexist.paidEmis === isEMIexist.numberOfEmI) {
      return res.status(200).json({ success: true, message: "No EMI to pay" });
    }
    isEMIexist.paidEmis + 1;
    await isEMIexist.save();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.deleteEmis = async (req, res, next) => {
  try {
    const { user_id, emiId } = req.body;
    if (!user_id || !emiId) {
      return res.status(400).json({ message: "Requirement Missing" });
    }
    const isEMIexist = await EmiModel.findOne({ userId: user_id, _id: emiId });
    if (!isEMIexist) {
      return res.status(400).json({ message: "EMI not found" });
    }
    await isEMIexist.deleteOne();
    return res
      .status(200)
      .json({ success: true, message: "EMI deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Something went wrong.", error: err.message });
  }
};

exports.getAllEmiByUser = async (req, res, next) => {
  try {
    const emidata = await EmiModel.find({}).populate("phone");
    return res.status(200).json({ success: true, data: emidata });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

exports.ManualEmiUpload = async (req, res, next) => {
  try {
    const validation = {
      phone: "",
      emiAmount: "",
      emiType: "",
      noOfEmi: "",
      dueDate: "",
      settlementAount: "",
    };
    const { phone, emiAmount, emiType, noOfEmi, dueDate, settlementAount } =
      req.body;
    console.log("body", req.body);
    for (let val of Object.keys(validation)) {
      if (
        req.body[val] === undefined ||
        req.body[val] === "" ||
        req.body[val].toString().trim().length === 0
      ) {
        return res
          .status(400)
          .json({ success: false, message: `${val} is required` });
      }
    }
    if (!phone || phone.length !== 10) {
      return res.status(200).json({
        success: false,
        message: "Phone number is required and must be exactly 10 digits",
      });
    }
    const kyc = await KYCmodel.findOne({ phone });
    const isUser = await DrisModel.findOne({ phone });
    if (!isUser) {
      return res
        .status(400)
        .json({ success: false, message: "user not found at this number" });
    }
    if (emiType === "Settlement_Advance") {
      isUser.Service_Advance_Total = settlementAount;
      isUser.Service_Name = emiType;
    }
    if (emiType === "Service_Fees") {
      isUser.Service_Name = emiType;
      isUser.Service_Fees = settlementAount;
    }
    isUser.totalEmi = noOfEmi;
    isUser.dueDate = dueDate;
    isUser.Final_Settlement = emiAmount;
    isUser.status = "pending";
    await isUser.save();

    // send notification for emi's

    const expo_token = await fcmTokenModel.findOne({ userId: kyc?.user_id });
    await sendNotificationToSingleUser(
      expo_token.token,
      `Dear ${kyc.name}, your total EMI has been created, please check it.`
    );
    return res.status(201).json({
      success: true,
      message: "emi uploded",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message, error });
  }
};

// //  advance settelement
// exports.EMISettlement = async (req, res) => {
//   try {
//     const { phone } = req.body;
//     console.log("phone", phone);

//     if (!req.file || !req.file.path) {
//       return res.status(400).json({
//         success: false,
//         message: "CSV file is required",
//       });
//     }

//     const csvfilepath = req.file.path;

//     if (!phone) {
//       return res.status(400).json({
//         success: false,
//         message: "Phone number is required",
//       });
//     }
//     if (phone.length > 10) {
//       return res
//         .status(400)
//         .json({ success: false, message: "phone number must be 10 digits" });
//     }

//     const rawRows = await csv().fromFile(csvfilepath);

//     console.log("Row", rawRows);
//     let lastPhone = "";
//     let lastName = "";

//     // Fill missing Person & Phone values
//     const normalizedData = rawRows.map((row) => {
//       if (row.Phone && row.Phone.trim()) lastPhone = row.Phone.trim();
//       if (row.Person && row.Person.trim()) lastName = row.Person.trim();

//       return {
//         ...row,
//         Phone: row.Phone && row.Phone.trim() ? row.Phone.trim() : lastPhone,
//         Person: row.Person && row.Person.trim() ? row.Person.trim() : lastName,
//       };
//     });

//     // Filter only this phone number
//     const filteredRows = normalizedData.filter((row) => {
//       return String(row.Phone).trim() === String(phone).trim();
//     });

//     if (filteredRows.length === 0) {
//       fs.unlinkSync(csvfilepath);
//       return res.status(404).json({
//         success: false,
//         message: "User Not Found In This Number..",
//       });
//     }

//     // Build grouped output (NO status here)
//     const output = {
//       phone: phone,
//       credit_Cards: [],
//       credit_Amount: [],
//       personal_Loan: [],
//       PL_Amount: [],
//       CreditTotal: "",
//       PL_Total: "",
//       Service_Fees: "",
//       Service_Advance_Total: "",
//       Final_Settlement: "",
//       Settlement_Percent: "",
//       totalEmi: "",
//       monthlyEmi: "",
//     };

//     filteredRows.forEach((entry) => {
//       if (entry.CreditCard) {
//         output.credit_Cards.push(entry.CreditCard);
//         output.credit_Amount.push(entry.CreditAmc || entry.CreditAmount || "");
//       }

//       if (entry.CCTotal) output.CreditTotal = entry.CCTotal;

//       if (entry.PersonalLoan) {
//         output.personal_Loan.push(entry.PersonalLoan);
//         output.PL_Amount.push(entry.TotalAmount || "");
//       }

//       if (entry.PLTotal) output.PL_Total = entry.PLTotal;
//       if (entry.ServiceTotal) output.Service_Fees = entry.ServiceTotal;
//       if (entry.AdvanceTotal) output.Service_Advance_Total = entry.AdvanceTotal;
//       if (entry.FinalSettlement)
//         output.Final_Settlement = entry.FinalSettlement;
//       if (entry.SettlementPercent)
//         output.Settlement_Percent = entry.SettlementPercent;
//       if (entry.TotalEMI) output.totalEmi = entry.TotalEMI;
//       if (entry.MonthlyEmi) output.monthlyEmi = entry.MonthlyEmi;
//     });

//     fs.unlinkSync(csvfilepath);

//     const isUser = await DrisModel.findOne({ phone: phone });
//     if (isUser) {
//       // Preserve current status before overwriting
//       const currentStatus = isUser.status;

//       Object.assign(isUser, output);

//       // Restore proper status
//       if (currentStatus === "Pending") {
//         isUser.status = "Pending";
//       } else if (currentStatus === "paid") {
//         isUser.status = "paid";
//       } else if (!currentStatus || currentStatus === "") {
//         isUser.status = "N/A"; // only set N/A if no status exists
//       }
//       await isUser.save();
//       const token = await getSingleUserToken(phone);
//       if (token.status === true) {
//         await sendNotificationToSingleUser(
//           token,
//           `Dear ${isUser.name} your emi has been issued, Debt Relief India will send you Monthly Invoice.`,
//           "Debt Reilef India",
//           "emi"
//         );
//         await createNotification(
//           token.userId,
//           "Debt Relief India",
//           `Dear ${isUser.name} your emi has been issued, Debt Relief India will send you Monthly Invoice.`,
//           "emi"
//         );
//       }

//       return res.status(201).json({
//         success: true,
//         message: "EMI Upload successfully",
//       });
//     }

//     return res.json({
//       success: false,
//       message: "Invalid User",
//     });
//   } catch (err) {
//     console.log("err", err);
//     return res.status(500).send({
//       message: "Server Error",
//       error: err.message,
//     });
//   }
// };

// mark as paid emi
exports.marksAsPaid = async (req, res) => {
  try {
    const { phone } = req.body;
    const { admin_id } = req;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number required",
      });
    }

    if (!admin_id) {
      return res.status(400).json({
        success: false,
        message: "Admin credentials missing",
      });
    }

    // 🔹 Find user first
    const user = await DrisModel.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔹 Check emiPay > 0
    if (user.emiPay === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot mark paid. EMI payment is 0",
      });
    }

    // 🔹 Update status if emiPay > 0
    user.status = "paid";
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Marked as Paid Successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      error: err.message,
    });
  }
};

//  test

exports.createTestEmi = async (req, res) => {
  try {
    const filePath = req.file.path;
    const { phone } = req.body;
    const jsonArray = await csv().fromFile(filePath);

    // Clean CSV
    const cleanData = jsonArray.filter((row) => {
      const isEmptyRow = Object.values(row).every(
        (value) => !value || value.toString().trim() === ""
      );
      if (isEmptyRow) return false;

      const isHeaderRow =
        row["Client Name"] === "Client Name" && row["Phone"] === "Phone";
      return !isHeaderRow;
    });

    // Group by client name
    const grouped = {};
    let currentClientName = null;

    cleanData.forEach((row) => {
      if (row["Client Name"] && row["Client Name"].trim() !== "") {
        currentClientName = row["Client Name"].trim();

        if (!grouped[currentClientName]) {
          grouped[currentClientName] = {
            clientName: currentClientName,
            phone: row["Phone"] || "",
            fees: row["Fees %"] || "",
            gst: row["GST %"] || "",
            insert: row["Insert"] === "true" || false, // insert field from CSV
            details: {
              fees: row["Fees %"] || "",
              gst: row["GST %"] || "",
              serviceFees: row["Service Fees"] || "",
              monthlySubscription: row["Monthly Subscription"] || "",
              settlementAdvance: row["Settlement Advance"] || "",
              monthlyFees: row["Monthly Fees"] || "",
              settlementPercent: row["Settlement Percentage"] || "",
              noOfEmi: row["No Of EMI"] || "",
              emiAmount: row["EMI Amount"] || "",
            },
            creditCards: [],
            personalLoans: [],
          };
        }
      }

      if (!currentClientName) return;

      const client = grouped[currentClientName];

      if (row["Credit Card"] && row["Credit Card"].trim() !== "") {
        client.creditCards.push({
          bank: row["Credit Card"],
          amount: row["Amount"] || "",
          settlement: row["CC Settlement"] || "",
          total: row["CC Total"] || "",
          finalOutstandingAmount: "",
          finalSettelement: "",
          finalPercentage: "",
          finalSavings: "",
          isOutstanding: false,
        });
      }

      if (row["Personal Loan"] && row["Personal Loan"].trim() !== "") {
        client.personalLoans.push({
          bank: row["Personal Loan"],
          amount: row["PL Amount"] || "",
          settlement: row["PL Settlement"] || "",
          total: row["PL Total"] || "",
          finalOutstandingAmount: "",
          finalSettelement: "",
          finalPercentage: "",
          finalSavings: "",
          isOutstanding: false,
        });
      }
    });

    let matchedClient = Object.values(grouped).find(
      (client) => client.phone === phone
    );

    if (!matchedClient) {
      return res.status(404).json({
        success: false,
        message: "No client found in CSV with provided phone",
      });
    }

    // Calculate totals
    const creditTotal = matchedClient.creditCards.reduce(
      (sum, card) => sum + (parseFloat(card.total) || 0),
      0
    );

    const plTotal = matchedClient.personalLoans.reduce(
      (sum, loan) => sum + (parseFloat(loan.total) || 0),
      0
    );

    const userData = {
      name: matchedClient.clientName,
      phone: matchedClient.phone,
      fees: matchedClient.details.fees,
      gst: matchedClient.details.gst,
      credit_Cards: matchedClient.creditCards,
      CreditTotal: creditTotal.toString(),
      personal_Loans: matchedClient.personalLoans,
      PL_Total: plTotal.toString(),
      Service_Fees: matchedClient.details.serviceFees || "",
      Service_Advance_Total: matchedClient.details.settlementAdvance || "",
      Settlement_Percent: matchedClient.details.settlementPercent,
      totalEmi: parseInt(matchedClient.details.noOfEmi || "0"),
      monthlyEmi: parseFloat(matchedClient.details.emiAmount || "0"),
      insert: true,
    };

    // Status
    let status = "Pending";
    if (userData.totalEmi === 0 && userData.monthlyEmi === 0) {
      status = "N/A";
    }

    // Find existing user by phone
    let user = await DrisModel.findOne({ phone: matchedClient.phone });

    if (user) {
      if (user.insert === true) {
        return res.status(400).json({
          success: false,
          message: "Settlements Already Inserted",
        });
      }

      // Update existing user
      Object.assign(user, userData);
      user.status = status;
      await user.save();
    } else {
      // New user insert only if insert !== true
      if (userData.insert === true) {
        return res.status(400).json({
          success: false,
          message: "Insertion not allowed (insert=true)",
        });
      }

      user = new DrisModel({ ...userData, status });
      await user.save();
    }

    // Notification
    const token = await getSingleUserToken(phone);
    if (token.status === true && token.userId) {
      const message = `Dear ${user.name}, your EMI has been issued. Debt Relief India will send you Monthly Invoice.`;
      await sendNotificationToSingleUser(
        token,
        message,
        "Debt Relief India",
        "emi"
      );
      await createNotification(
        token.userId,
        "Debt Relief India",
        message,
        "emi"
      );
    }

    return res.status(201).json({
      success: true,
      message: "EMI uploaded successfully for provided phone",
    });
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return res.status(500).json({
      success: false,
      message: "Error while parsing CSV",
      error: error.message,
    });
  }
};

//  bulk Emi Insertn

exports.BultEmiInsert = async (req, res) => {
  try {
    const filePath = req.file.path;
    const jsonArray = await csv().fromFile(filePath);

    // Clean CSV
    const cleanData = jsonArray.filter((row) => {
      const isEmptyRow = Object.values(row).every(
        (value) => !value || value.toString().trim() === ""
      );
      if (isEmptyRow) return false;

      const isHeaderRow =
        row["Client Name"] === "Client Name" && row["Phone"] === "Phone";
      return !isHeaderRow;
    });

    // Group by client name
    const grouped = {};
    let currentClientName = null;

    cleanData.forEach((row) => {
      if (row["Client Name"] && row["Client Name"].trim() !== "") {
        currentClientName = row["Client Name"].trim();

        if (!grouped[currentClientName]) {
          grouped[currentClientName] = {
            clientName: currentClientName,
            phone: row["Phone"] || "",
            fees: row["Fees %"] || "",
            gst: row["GST %"] || "",
            insert: row["Insert"] === "true" || false, // CSV insert flag
            details: {
              fees: row["Fees %"] || "",
              gst: row["GST %"] || "",
              serviceFees: row["Service Fees"] || "",
              monthlySubscription: row["Monthly Subscription"] || "",
              settlementAdvance: row["Settlement Advance"] || "",
              monthlyFees: row["Monthly Fees"] || "",
              settlementPercent: row["Settlement Percentage"] || "",
              noOfEmi: row["No Of EMI"] || "",
              emiAmount: row["EMI Amount"] || "",
            },
            creditCards: [],
            personalLoans: [],
          };
        }
      }

      if (!currentClientName) return;

      const client = grouped[currentClientName];

      if (row["Credit Card"] && row["Credit Card"].trim() !== "") {
        client.creditCards.push({
          bank: row["Credit Card"],
          amount: row["Amount"] || "",
          settlement: row["CC Settlement"] || "",
          total: row["CC Total"] || "",
          finalOutstandingAmount: "",
          finalSettelement: "",
          finalPercentage: "",
          finalSavings: "",
          isOutstanding: false,
        });
      }

      if (row["Personal Loan"] && row["Personal Loan"].trim() !== "") {
        client.personalLoans.push({
          bank: row["Personal Loan"],
          amount: row["PL Amount"] || "",
          settlement: row["PL Settlement"] || "",
          total: row["PL Total"] || "",
          finalOutstandingAmount: "",
          finalSettelement: "",
          finalPercentage: "",
          finalSavings: "",
          isOutstanding: false,
        });
      }
    });

    const allClients = Object.values(grouped);
    const bulkOps = [];
    const notificationTasks = [];

    for (const client of allClients) {
      if (client.insert === true) continue; // Skip users with insert=true

      const creditTotal = client.creditCards.reduce(
        (sum, card) => sum + (parseFloat(card.total) || 0),
        0
      );

      const plTotal = client.personalLoans.reduce(
        (sum, loan) => sum + (parseFloat(loan.total) || 0),
        0
      );

      const userData = {
        name: client.clientName,
        phone: client.phone,
        fees: client.details.fees,
        gst: client.details.gst,
        credit_Cards: client.creditCards,
        CreditTotal: creditTotal.toString(),
        personal_Loans: client.personalLoans,
        PL_Total: plTotal.toString(),
        Service_Fees: client.details.serviceFees || "",
        Service_Advance_Total: client.details.settlementAdvance || "",
        Settlement_Percent: client.details.settlementPercent,
        totalEmi: parseInt(client.details.noOfEmi || "0"),
        monthlyEmi: parseFloat(client.details.emiAmount || "0"),
        insert: false,
        status:
          parseInt(client.details.noOfEmi || "0") === 0 &&
          parseFloat(client.details.emiAmount || "0") === 0
            ? "N/A"
            : "Pending",
      };

      // Prepare bulkWrite operation (upsert)
      bulkOps.push({
        updateOne: {
          filter: { phone: client.phone },
          update: { $set: userData },
          upsert: true,
        },
      });

      // Prepare notification task for this user
      notificationTasks.push(async () => {
        const token = await getSingleUserToken(client.phone);
        if (token.status === true && token.userId) {
          const message = `Dear ${userData.name}, your EMI has been issued. Debt Relief India will send you Monthly Invoice.`;
          await sendNotificationToSingleUser(
            token,
            message,
            "Debt Relief India",
            "emi"
          );
          await createNotification(
            token.userId,
            "Debt Relief India",
            message,
            "emi"
          );
        }
      });
    }

    // Execute bulk write
    if (bulkOps.length > 0) {
      await DrisModel.bulkWrite(bulkOps);
    }

    // Execute notifications in parallel
    await Promise.all(notificationTasks.map((task) => task()));

    return res.status(201).json({
      success: true,
      message: "EMI processing completed",
      totalProcessed: bulkOps.length,
      totalSkipped: allClients.filter((c) => c.insert === true).length,
    });
  } catch (error) {
    console.log("Error processing CSV:", error);
    return res.status(500).json({
      success: false,
      message: "Error while processing CSV",
      error: error.message,
    });
  }
};

// he

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

    // Prepare new outstanding data
    const newOutstanding = {
      finalOutstandingAmount: parseInt(finaloutamount),
      finalSettelement: parseInt(finalsettelement),
      finalPercentage: parseInt(finalpercentage),
      finalSavings: parseInt(finalsaving),
    };

    // Find user
    const driUser = await DrisModel.findOne({ phone });
    if (driUser) {
      driUser.credit_Cards?.forEach((val) => {
        if (val._id.equals(loanObjId)) {
          if (val.isOutstanding === true) {
            return res.status(400).json({
              success: false,
              message: "this service already outstand",
            });
          } else {
            val.isOutstanding = true;
            Object.assign(val, newOutstanding);
          }
        }
      });

      driUser.personal_Loans?.forEach((val) => {
        if (val._id.equals(loanObjId)) {
          if (val.isOutstanding === true) {
            return res.status(400).json({
              success: false,
              message: "this service already outstand",
            });
          } else {
            val.isOutstanding = true;
            Object.assign(val, newOutstanding);
          }
        }
      });

      //  Ensure subdocs are marked as modified
      driUser.markModified("credit_Cards");
      driUser.markModified("personal_Loans");

      await driUser.save();
    }

    return res
      .status(201)
      .json({ success: true, message: "Outstanding successfully updated" });
  } catch (error) {
    console.log("error", error);
    return res
      .status(500)
      .json({ success: false, message: error.message, error });
  }
};

// get outstanding
// exports.getOutstanding = async (req, res) => {
//   try {
//     const { phone } = req.body;
//     const outstaings = await outstandingModel.find({ phone });
//     if (!outstaings || outstaings.length === 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "no outstanding found" });
//     }
//     return res.status(200).json({
//       success: true,
//       data: outstaings,
//     });
//   } catch (error) {
//     console.log("error", error);
//     return res
//       .status(500)
//       .json({ success: false, message: error.message, error });
//   }
// };
