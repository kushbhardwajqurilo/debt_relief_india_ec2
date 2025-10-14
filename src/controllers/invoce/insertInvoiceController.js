const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const UserModel = require("../../models/userModel");
const InvoiceModel = require("../../models/InvoiceModel");
const DrisModel = require("../../models/DriUserModel");
const {
  sendNotificationToSingleUser,
} = require("../../config/expo-push-notification/expoNotification");
const fcmTokenModel = require("../../models/fcmTokenModel");
const {
  createNotification,
} = require("../notificationController/notificationsController");
const { s3Client, PutObjectCommand } = require("../../config/aws-s3/s3Config");
const {
  customeNoticationModel,
} = require("../../models/contactYourAdvocateModel");

exports.viewInvoice = async (req, res, next) => {
  try {
    const secure_url = req.params.id;
    return res.redirect(secure_url);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
// get all invoices for user
exports.getInvoices = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "User required" });
    }
    const result = await InvoiceModel.find({ phone }).select("-_id -phone");
    if (!result) {
      return res.status(404).json({ message: "No invoices found" });
    }
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get invoice by date
exports.getInvoicesByMonthYear = async (req, res) => {
  try {
    const { month, year, phone } = req.body;
    if (!month || !year) {
      return res.status(400).json({ message: "Month and year required" });
    }
    if (!phone) {
      return res.status(400).json({ message: "phone number missing" });
    }

    const formattedMonth = month.padStart(2, "0");
    const regex = new RegExp(`/${formattedMonth}/${year}$`);

    const invoices = await InvoiceModel.find({
      phone: phone,
      invoiceDate: {
        $regex: regex,
      },
    });
    if (invoices.length === 0) {
      return res
        .status(404)
        .json({ message: "no invoice found", success: false });
    }
    res
      .status(200)
      .json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadInvoice = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const haveEmi = await DrisModel.findOne({ phone });

    if (!haveEmi || haveEmi.totalEmi === 0) {
      return res
        .status(400)
        .json({ success: false, message: "User hasn't any EMIs" });
    }
    if (haveEmi.status == "closed") {
      return res.status(500).json({
        success: false,
        message: "All EMIs are already settled for this user.",
      });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number required" });
    }

    const filePath = file.path;

    // Parse PDF
    const buffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(buffer);
    const text = pdfData?.text || "";

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Could not extract text from PDF (empty content)",
      });
    }

    // ✅ Safe Helper function
    const extractField = (text, label, pattern = /(.+)/) => {
      if (!text) return "";
      try {
        const regex = new RegExp(`${label}\\s*${pattern.source}`, "i");
        const match = text.match(regex);
        return match && match[1] ? match[1].trim() : "";
      } catch (e) {
        console.log(`extractField failed for ${label}:`, e.message);
        return "";
      }
    };

    // 🔹 Robust Service Extraction (handles compressed text)
    let serviceName = "";
    try {
      // Example matches:
      // "1Settlement Advance9971..."  → Settlement Advance
      // "1Service Fees9971..."        → Service Fees
      const serviceMatch = text.match(/1\s*([A-Za-z ]+?)\s*9971/i);
      if (serviceMatch && serviceMatch[1]) {
        serviceName = serviceMatch[1].trim();
      }
    } catch (e) {
      console.log("Service extraction failed:", e.message);
    }

    if (!serviceName) {
      serviceName = "N/A"; // fallback
    }

    // Extract other fields dynamically
    const invoiceData = {
      invoiceDate: extractField(text, "Invoice Date", /([\d\/]+)/),
      invoiceNumber: extractField(text, "Invoice No.", /#?([\w\/-]+)/),
      serviceName: serviceName,
      totalAmount: extractField(text, "Total Amount", /₹?\s*([\d,]+)/),
      taxableAmount: extractField(text, "Taxable Amount", /₹?\s*([\d,]+)/),
      tax: extractField(text, "IGST|CGST|SGST|Tax", /₹?\s*([\d,]+)/),
      billTo: extractField(text, "Bill To", /(.+)/),
      gstin: extractField(text, "GSTIN", /([\w\d]+)/),
      placeOfSupply: extractField(text, "Place of Supply", /(.+)/),
      url: "",
      phone,
    };

    console.log("🧾 Extracted Invoice Data:", invoiceData);

    // Validate required fields
    if (
      !invoiceData.invoiceDate ||
      !invoiceData.totalAmount ||
      !invoiceData.serviceName
    ) {
      return res.status(400).json({
        success: false,
        message: "Failed to extract required fields from invoice",
      });
    }

    const user = await UserModel.findOne({ phone });

    const expo_token = await fcmTokenModel.findOne({ userId: user._id });

    // Upload to S3
    const fileContent = fs.readFileSync(req.file.path);
    const ext = path.extname(req.file.originalname);
    const newKey = `Invoices/${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${ext}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: newKey,
        Body: fileContent,
        ContentType: req.file.mimetype,
        ACL: "public-read",
      })
    );

    const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newKey}`;
    invoiceData["url"] = s3Url;

    fs.unlinkSync(req.file.path);

    // Save to DB
    const result = await InvoiceModel.create(invoiceData);
    if (!result) {
      return res.status(500).json({ message: "Failed to save invoice data" });
    }

    // Update DrisModel
    const driuser = await DrisModel.findOneAndUpdate(
      { phone },
      {
        $inc: { emiPay: 1 },
        $set: { status: "pending", invoiceInsert: true },
      },
      { new: true, upsert: true }
    );

    const custom_notification = await customeNoticationModel.find({});
    const invoice_noti =
      custom_notification?.[0]?.invoice ||
      `Dear ${driuser.name} Your Invoice Is Ready...`;

    await sendNotificationToSingleUser(
      expo_token.token,
      "Debt Relief India",
      invoice_noti,
      "invoice"
    );

    await createNotification(
      expo_token.userId,
      "Invoice",
      `${invoice_noti}`,
      "invoice"
    );

    return res.status(200).json({
      message: "Invoice uploaded successfully",
      success: true,
    });
  } catch (err) {
    console.log("❌ Error in uploadInvoice:", err);
    return res.status(500).json({
      success: false,
      message: "Server error: " + err.message,
    });
  }
};
