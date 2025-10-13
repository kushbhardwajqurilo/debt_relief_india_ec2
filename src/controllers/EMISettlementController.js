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
const NotificationModel = require("../models/NotificationModel");
const {
  customeNoticationModel,
} = require("../models/contactYourAdvocateModel");

const { paidSubscriptionModel } = require("../models/monthlySubscriptionModel");
const PaidService = require("../models/paidServicesModel");

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
    isUser.insert = true;
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

// mark as paid emi
exports.marksAsPaid = async (req, res) => {
  try {
    const { phone, user_id } = req.body;
    const { admin_id } = req;

    if (!phone)
      return res
        .status(400)
        .json({ success: false, message: "Phone number required" });
    if (!admin_id)
      return res
        .status(400)
        .json({ success: false, message: "Admin credentials missing" });

    const user = await DrisModel.findOne({ phone });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (!user.dueDate || user.dueDate.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No DueDate Found" });
    }
    if (user.status === "paid")
      return res
        .status(200)
        .json({ success: false, message: "Currently no EMI pending" });
    // 🔹 Helpers for date
    const parseDDMMYYYY = (dateStr) => {
      const [day, month, year] = dateStr?.split("-").map(Number);
      return new Date(year, month - 1, day);
    };

    const formatDDMMYYYY = (date) => {
      console.log("date", date);
      if (date) {
        return `${String(date.getDate()).padStart(2, "0")}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${date.getFullYear()}`;
      } else {
        return res.status(400).json({ success: false, message: "date issue" });
      }
    };

    const formatDDMMYYYY_slash = (date) => {
      return `${String(date.getDate()).padStart(2, "0")}/${String(
        date.getMonth() + 1
      ).padStart(2, "0")}/${date.getFullYear()}`;
    };

    const addMonth = (date, months = 1) => {
      const d = new Date(date);
      const day = d.getDate();
      d.setMonth(d.getMonth() + months);
      if (d.getDate() !== day) d.setDate(0); // month rollover
      return d;
    };

    // 🔹 Increment dueDate in DrisModel (DD-MM-YYYY)

    const currentDate = parseDDMMYYYY(user.dueDate);
    const newDueDate = addMonth(currentDate, 1);
    user.dueDate = formatDDMMYYYY(newDueDate);
    user.emiPay = user.emiPay + 1;

    // 🔹 PaidService date in DD/MM/YYYY string (same as frontend)
    const payload = {
      userId: user_id,
      serviceName: user.serviceFees ? "Service Fees" : "Service Advance",
      emiNo: user.emiPay,
      emiAmount: user.monthlyEmi,
      date: formatDDMMYYYY_slash(currentDate), // use original dueDate in DD/MM/YYYY
    };

    const paidService = await PaidService.create(payload);
    if (!paidService)
      return res
        .status(400)
        .json({ success: false, message: "Mark Paid Failed" });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Marked as Paid & Due Date Updated (+1 Month)",
      data: {
        phone: user.phone,
        newDueDate: user.dueDate,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Error in marksAsPaid:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message, error: err.message });
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
            insert: row["Insert"] === "true" || false,
            details: {
              serviceFees:
                row["Service Fees"] && row["Service Fees"].trim() !== "0"
                  ? row["Service Fees"]
                  : "",
              monthlySubscription: row["Monthly Subscription"] || "",
              settlementAdvance:
                row["Settlement Advance"] &&
                row["Settlement Advance"].trim() !== "0"
                  ? row["Settlement Advance"]
                  : "",
              monthlyFees: row["Monthly Fees"] || "",
              settlementPercent: row["Settlement Percentage"] || "",
              noOfEmi: row["No Of EMI"] || "",
              emiAmount: row["EMI Amount"] || "",
              dueDate: "", // initialize empty
            },
            creditCards: [],
            personalLoans: [],
          };
        }
      }

      if (!currentClientName) return;

      const client = grouped[currentClientName];

      // --- Conditional dueDate assignment ---
      if (row["Due Date"] && row["Due Date"].trim() !== "") {
        client.details.dueDate = row["Due Date"].trim();
      }

      // Credit Card handling
      if (row["Credit Card"] && row["Credit Card"].trim() !== "") {
        const amount = parseFloat(row["Amount"] || 0);
        const settlementPercent = parseFloat(row["CC Settlement"] || 0);
        const estimatedSettlement = (amount * settlementPercent) / 100;
        const estimatedSaving = amount - estimatedSettlement;

        client.creditCards.push({
          bank: row["Credit Card"],
          amount: amount,
          settlement: settlementPercent,
          total: row["CC Total"] || "",
          estimatedSettlement: estimatedSettlement,
          saving: estimatedSaving,
          finalOutstandingAmount: "",
          finalSettelement: "",
          finalPercentage: "",
          finalSavings: "",
          isOutstanding: true,
        });
      }

      // Personal Loan handling
      if (row["Personal Loan"] && row["Personal Loan"].trim() !== "") {
        const amount = parseFloat(row["PL Amount"] || 0);
        const settlementPercent = parseFloat(row["PL Settlement"] || 0);
        const estimatedSettlement = (amount * settlementPercent) / 100;
        const estimatedSaving = amount - estimatedSettlement;

        client.personalLoans.push({
          bank: row["Personal Loan"],
          amount: amount,
          settlement: settlementPercent,
          total: row["PL Total"] || "",
          estimatedSettlement: estimatedSettlement,
          saving: estimatedSaving,
          finalOutstandingAmount: "",
          finalSettelement: "",
          finalPercentage: "",
          finalSavings: "",
          isOutstanding: true,
        });
      }
    });

    // Find matched client by phone
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
      credit_Cards: matchedClient.creditCards,
      CreditTotal: creditTotal.toString(),
      personal_Loans: matchedClient.personalLoans,
      PL_Total: plTotal.toString(),
      Service_Fees: matchedClient.details.serviceFees || "",
      Service_Advance_Total: matchedClient.details.settlementAdvance || "",
      Settlement_Percent: matchedClient.details.settlementPercent,
      totalEmi: parseInt(matchedClient.details.noOfEmi || "0"),
      monthlyEmi: parseFloat(matchedClient.details.emiAmount || "0"),
      dueDate: matchedClient.details.dueDate,
      insert: true,
    };

    // Status
    let status = "pending";
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
          message: "Insertion not allowed ",
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
        token.token,
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

exports.BultEmiInsert = async (req, res) => {
  try {
    const filePath = req.file.path;
    const jsonArray = await csv().fromFile(filePath);

    // ✅ Clean CSV data
    const cleanData = jsonArray.filter((row) => {
      const isEmptyRow = Object.values(row).every(
        (value) => !value || value.toString().trim() === ""
      );
      if (isEmptyRow) return false;

      const isHeaderRow =
        row["Client Name"] === "Client Name" && row["Phone"] === "Phone";
      return !isHeaderRow;
    });

    // ✅ Group by client name
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
            insert: row["Insert"] === "true" || false,
            details: {
              fees: row["Fees %"] || "",
              gst: row["GST %"] || "",
              serviceFees:
                row["Service Fees"] && row["Service Fees"].trim() !== "0"
                  ? row["Service Fees"]
                  : "",
              monthlySubscription: row["Monthly Subscription"] || "",
              settlementAdvance:
                row["Settlement Advance"] &&
                row["Settlement Advance"].trim() !== "0"
                  ? row["Settlement Advance"]
                  : "",
              monthlyFees: row["Monthly Fees"] || "",
              settlementPercent: row["Settlement Percentage"] || "",
              noOfEmi: row["No Of EMI"] || "",
              emiAmount: row["EMI Amount"] || "",
              dueDate: row["Due Date"] || "", // default
            },
            creditCards: [],
            personalLoans: [],
          };
        }
      }

      if (!currentClientName) return;
      const client = grouped[currentClientName];

      // ✅ Always update dueDate if row has value
      if (row["Due Date"] && row["Due Date"].trim() !== "") {
        client.details.dueDate = row["Due Date"].trim();
      }

      // ✅ Credit Card
      if (row["Credit Card"] && row["Credit Card"].trim() !== "") {
        const amount = parseFloat(row["Amount"] || 0);
        const settlementPercent = parseFloat(row["CC Settlement"] || 0);
        const estimatedSettlement = (amount * settlementPercent) / 100;
        const estimatedSaving = amount - estimatedSettlement;

        client.creditCards.push({
          bank: row["Credit Card"],
          amount,
          settlement: settlementPercent,
          total: row["CC Total"] || "",
          estimatedSettlement,
          saving: estimatedSaving,
          finalOutstandingAmount: "",
          finalSettelement: "",
          finalPercentage: "",
          finalSavings: "",
          isOutstanding: true,
        });
      }

      // ✅ Personal Loan
      if (row["Personal Loan"] && row["Personal Loan"].trim() !== "") {
        const amount = parseFloat(row["PL Amount"] || 0);
        const settlementPercent = parseFloat(row["PL Settlement"] || 0);
        const estimatedSettlement = (amount * settlementPercent) / 100;
        const estimatedSaving = amount - estimatedSettlement;

        client.personalLoans.push({
          bank: row["Personal Loan"],
          amount,
          settlement: settlementPercent,
          total: row["PL Total"] || "",
          estimatedSettlement,
          saving: estimatedSaving,
          finalOutstandingAmount: "",
          finalSettelement: "",
          finalPercentage: "",
          finalSavings: "",
          isOutstanding: true,
        });
      }
    });

    const allClients = Object.values(grouped);
    const bulkOps = [];
    const notificationTasks = [];

    for (const client of allClients) {
      if (client.insert === true) continue;

      const existingUser = await DrisModel.findOne({ phone: client.phone });
      if (!existingUser) {
        console.log(`⚠️ User with phone ${client.phone} not found. Skipping.`);
        continue;
      }

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
        dueDate: client.details.dueDate || "",
        insert: true,
        status: "pending",
      };

      // ✅ Update user data
      bulkOps.push({
        updateOne: {
          filter: { phone: client.phone },
          update: { $set: userData },
          upsert: false,
        },
      });

      // ✅ Fetch notification template safely

      // ✅ Prepare notification task
      notificationTasks.push(async () => {
        try {
          const token = await getSingleUserToken(client.phone);
          if (token.status === true && token.userId) {
            const message = `Dear ${userData.name}, Your Settlements has been issued!`;
            console.log("message", message);
            await sendNotificationToSingleUser(
              token.token,
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
            console.log("✅ Notification sent to", client.phone);
          } else {
            console.log("⚠️ No valid token for", client.phone);
          }
        } catch (err) {
          console.log(
            "❌ Error sending notification for",
            client.phone,
            err.message
          );
        }
      });
    }

    // ✅ Bulk update all users
    if (bulkOps.length > 0) {
      await DrisModel.bulkWrite(bulkOps);
    }

    // ✅ Execute notifications in small batches
    console.log("📤 Total notifications to send:", notificationTasks.length);
    for (let i = 0; i < notificationTasks.length; i += 10) {
      const batch = notificationTasks.slice(i, i + 10);
      await Promise.all(batch.map((task) => task()));
    }

    return res.status(201).json({
      success: true,
      message: "EMI processing completed successfully",
      totalProcessed: bulkOps.length,
      totalNotifications: notificationTasks.length,
      totalSkipped: allClients.filter((c) => c.insert === true).length,
    });
  } catch (error) {
    console.log("❌ Error processing CSV:", error);
    return res.status(500).json({
      success: false,
      message: "Error while processing CSV",
      error: error.message,
    });
  }
};

exports.outstandingController = async (req, res) => {
  try {
    const requiredFields = [
      "finaloutamount",
      "finalsettelement",
      "finalpercentage",
      "finalsaving",
      "phone",
      "loanId",
    ];

    for (let field of requiredFields) {
      if (!req.body[field] || req.body[field].toString().trim() === "") {
        return res
          .status(400)
          .json({ success: false, message: `${field} is required` });
      }
    }

    const {
      finaloutamount,
      finalsettelement,
      finalpercentage,
      finalsaving,
      phone,
      loanId,
    } = req.body;
    const loanObjId = new mongoose.Types.ObjectId(loanId);

    const newOutstanding = {
      finalOutstandingAmount: parseInt(finaloutamount),
      finalSettelement: parseInt(finalsettelement),
      finalPercentage: parseInt(finalpercentage),
      finalSavings: parseInt(finalsaving),
    };

    const driUser = await DrisModel.findOne({ phone });
    if (!driUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ✅ Handle credit cards
    for (const val of driUser.credit_Cards || []) {
      if (val._id.equals(loanObjId)) {
        if (val.isOutstanding) {
          val.isOutstanding = false;
          Object.assign(val, newOutstanding);
          driUser.markModified("credit_Cards");
          await driUser.save();
          return res.status(200).json({
            success: true,
            message: "Service Closed (credit card)",
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "This service is already outstanded",
          });
        }
      }
    }

    // ✅ Handle personal loans
    for (const val of driUser.personal_Loans || []) {
      if (val._id.equals(loanObjId)) {
        if (val.isOutstanding) {
          val.isOutstanding = false;
          Object.assign(val, newOutstanding);
          driUser.markModified("personal_Loans");
          await driUser.save();
          return res.status(200).json({
            success: true,
            message: "Service Closed (personal loan)",
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "This service is already outstanded",
          });
        }
      }
    }

    // If no matching loan found
    return res.status(404).json({
      success: false,
      message: "No matching loan found",
    });
  } catch (error) {
    console.error("error", error);
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

// get paid services

exports.getPaidSerivcesToEachUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user info not required",
      });
    }
    const service = await PaidService.find({ userId: user_id });
    if (!service || service.length === 0) {
      return res.status(400).json({ success: false, message: "failed fetch" });
    }
    return res.status(200).json({ success: true, data: service });
  } catch (error) {
    return res.status(500).json({ success: false, message: error });
  }
};

// update due date
exports.updateServiceDueDates = async (req, res, next) => {
  try {
    const { date, phone } = req.body;
    console.log({ date, phone });

    if (!date || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "Credentials missing" });
    }

    const getDates = await DrisModel.findOne({ phone });

    if (!getDates || !getDates.dueDate) {
      return res
        .status(404)
        .json({ success: false, message: "No due date found for this phone" });
    }

    // Ensure day is always 2 digits
    const day = date.toString().padStart(2, "0");

    // Replace the day in the existing dueDate string
    const updatedDate = day + getDates.dueDate.slice(2); // keep "-MM-YYYY"
    console.log("d", updatedDate);
    getDates.dueDate = updatedDate;
    await getDates.save();
    // Optionally, update in DB
    // await DrisModel.updateOne({ phone }, { dueDate: updatedDate });

    return res.json({ success: true, message: "Date Update" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message, error });
  }
};

// add single loan to user

exports.addSingleLoanToClient = async (req, res, next) => {
  try {
    const validation = {
      loanType: "",
      bank: "",
      amount: "",
      settlmentPercentage: "",
      phone: "",
      total: "",
    };
    Object.keys(validation).forEach((key) => {
      if (!req.body[key] || req.body[key].toString().trim().length === 0) {
        return res
          .status(400)
          .json({ success: false, message: `${key} missing` });
      }
    });
    const amount = parseFloat(req.body.amount || 0); // 7,40,000
    const settlementPercent = parseFloat(req.body.settlmentPercentage || 0); //40%
    const estimatedSettlement = (amount * settlementPercent) / 100; // 2,96,000
    const estimatedSaving = amount - estimatedSettlement;
    const bank = req.body.bank;
    const total = req.body.total;
    const loanType = req.body.loanType;
    const payload = {
      bank,
      amount,
      settlement: settlementPercent,
      total,
      estimatedSettlement,
      saving: estimatedSaving,
      finalOutstandingAmount: "",
      finalSettelement: "",
      finalPercentage: "",
      finalSavings: "",
      isOutstanding: true,
    };
    const user = await DrisModel.findOne({ phone: req.body.phone });
    if (!user || user.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "User Not Found" });
    }
    if (loanType === "Personal_Loan") {
      user.personal_Loans.push(payload);
    }
    if (loanType === "Credit_Loan") {
      user.credit_Cards.push(payload);
    }
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "New loan record created." });
  } catch (error) {
    console.log("er", error);
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};
