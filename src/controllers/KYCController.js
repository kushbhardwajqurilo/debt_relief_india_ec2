const adminModel = require("../models/adminModel");
const advocateModel = require("../models/advocateModel");
const DrisModel = require("../models/DriUserModel");
const KYCmodel = require("../models/KYCModel");
const User = require("../models/userModel");

const {
  createNotification,
} = require("./notificationController/notificationsController");
const {
  sendNotificationToSingleUser,
} = require("../config/expo-push-notification/expoNotification");
const fcmTokenModel = require("../models/fcmTokenModel");
const {
  customeNoticationModel,
} = require("../models/contactYourAdvocateModel");
const {
  genratePresignedURL,
  generatePresignedURL,
} = require("../config/aws-s3/s3Config");

// exports.CompleteKYC = async (req, res, next) => {
//   try {
//     const imageResults = [];
//     const pdfResults = [];
//     const { user_id } = req;
//     const { name, lastname, email, gender, phone } = req.body;

//     // Validate required fields
//     if (!name || !user_id) {
//       return res
//         .status(400)
//         .json({ message: "Please fill all fields", success: false });
//     }

//     // Check if user exists
//     const isUser = await User.findById(user_id);
//     if (!isUser) {
//       return res.status(400).json({ message: "Invalid User", success: false });
//     }

//     // Check for duplicate email
//     if (isUser.email === email) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Email Already Registered" });
//     }

//     // Check if KYC already exists
//     const isKyc = await KYCmodel.findOne({ $or: [{ user_id }, { phone }] });
//     if (isKyc) {
//       if (isKyc.status === "pending") {
//         return res.status(400).json({
//           message: "KYC already submitted. Awaiting approval",
//           success: false,
//         });
//       }
//       if (isKyc.status === "approve") {
//         return res
//           .status(200)
//           .json({ message: "KYC already approved", success: true });
//       }
//     }

//     // Function to upload to Cloudinary
//     const uploadToCloudinary = (fileBuffer) => {
//       return new Promise((resolve, reject) => {
//         const stream = cloudinary.uploader.upload_stream(
//           { folder: "Kyc Documents" },
//           (error, result) => {
//             if (error) return reject(error);
//             resolve(result.secure_url);
//           }
//         );
//         Readable.from(fileBuffer).pipe(stream);
//       });
//     };

//     // Function to upload to Supabase
//     const uploadToSupabase = async (fileBuffer, filename) => {
//       try {
//         const uniqueFilename = `pdfs/${Date.now()}-${filename}`;
//         const { data, error } = await superbase.storage
//           .from("kyc-pdfs")
//           .upload(uniqueFilename, fileBuffer, {
//             contentType: "application/pdf",
//             upsert: true,
//           });

//         if (error) {
//           console.error("Supabase upload error:", error.message);
//           throw new Error(`Failed to upload PDF: ${error.message}`);
//         }

//         // Get public URL
//         const { publicUrl } = superbase.storage
//           .from("kyc-pdfs")
//           .getPublicUrl(data.path);

//         console.log(publicUrl);
//         if (!publicUrl) {
//           throw new Error("Failed to generate public URL for PDF");
//         }

//         console.log("PDF uploaded to Supabase:", publicUrl);
//         return publicUrl;
//       } catch (error) {
//         console.error("Supabase upload error:", error.message);
//         throw error;
//       }
//     };

//     // Process uploaded files
//     if (req.files && Array.isArray(req.files)) {
//       for (const file of req.files) {
//         const ext = file.originalname.split(".").pop().toLowerCase();

//         if (ext === "pdf") {
//           const pdfUrl = await uploadToSupabase(file.buffer, file.originalname);
//           pdfResults.push(pdfUrl);
//         } else {
//           const imageUrl = await uploadToCloudinary(file.buffer);
//           imageResults.push(imageUrl);
//         }
//       }
//     } else {
//       console.warn("No files found in req.files");
//     }

//     // Log results for debugging
//     console.log("Image Results:", imageResults);
//     console.log("PDF Results:", pdfResults);

//     // Create KYC payload
//     const payload = {
//       user_id,
//       name,
//       lastname,
//       email,
//       gender,
//       phone,
//       image: imageResults.length > 0 ? imageResults : [],
//       pdf: pdfResults.length > 0 ? pdfResults : [],
//     };

//     // Save to database
//     const uploadKyc = await KYCmodel.create(payload);

//     if (!uploadKyc) {
//       return res
//         .status(400)
//         .json({ message: "Failed to upload KYC", success: false });
//     }
//     return res.status(200).json({
//       success: true,
//       message:
//         "Your documents have been submitted. Admin will approve within 24 hours.",
//     });
//   } catch (error) {
//     console.error("KYC submission error:", error.message);
//     return res.status(500).json({ message: error.message, success: false });
//   }
// };
//approved kyc by admin

exports.ApproveByAdmin = async (req, res) => {
  try {
    const iconUrl = req.protocol + "://" + req.get("host");

    const admin_id = req.admin_id;
    const { kycId, assign_id, advocate_id } = req.body;

    if (!admin_id) {
      return res.status(400).json({
        success: false,
        message: "Invalid Admin Credentials",
      });
    }

    if (!kycId || !assign_id || !advocate_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const isAdmin = await adminModel.findById(admin_id);
    if (!isAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isKYC = await KYCmodel.findById(kycId);
    if (!isKYC) {
      return res.status(404).json({
        success: false,
        message: "KYC not found",
      });
    }

    if (isKYC.status === "approve") {
      return res.status(400).json({
        success: false,
        message: "KYC is already approved",
      });
    }

    // Get user_id from KYC and assign to advocate
    const userId = isKYC.user_id;

    const updatedAdvocate = await advocateModel.findByIdAndUpdate(
      advocate_id,
      { $addToSet: { assignUsers: userId.toString() } }, // prevent duplicates
      { new: true }
    );

    if (!updatedAdvocate) {
      return res.status(404).json({
        success: false,
        message: "Advocate not found or update failed",
      });
    }

    const payload = {
      assign_advocate: advocate_id,
      status: "approve",
    };

    const updateKYC = await KYCmodel.findByIdAndUpdate(kycId, payload, {
      new: true,
    });

    if (!updateKYC) {
      return res.status(400).json({
        success: false,
        message: "Failed to approve KYC",
      });
    }
    const driPayload = {
      name: updateKYC.name,
      gender: updateKYC.gender,
      phone: updateKYC.phone,
      id: assign_id,
      status: "N/A",
      userId: updateKYC.user_id,
    };
    const existingDRiUser = await DrisModel.findOne({
      phone: driPayload.phone,
    });

    if (!existingDRiUser) {
      // User doesn't exist → create new
      const insertDRiUserAfterAsign = await DrisModel.create(driPayload);
      console.log("New DRi user created:", insertDRiUserAfterAsign);
    } else {
      // User exists → do nothing
      console.log("DRi user already exists. Skipping insert.");
    }
    const expo_token = await fcmTokenModel.findOne({
      userId: updateKYC.user_id,
    });
    const message = await customeNoticationModel.find({});
    const kyc_message =
      message?.[0]?.kyc_approve ||
      `Congratulations ${updateKYC?.name} your KYC Has been approved by admin`;

    const msg = kyc_message
      ? `${updateKYC.name} ${kyc_message}`
      : `Congratulations ${updateKYC?.name} your KYC Has been approved by admin`;

    await sendNotificationToSingleUser(
      expo_token.token,
      msg,
      "Kyc Aprrove",
      "kyc"
    );

    await createNotification(
      updateKYC.user_id,
      "kyc Approved",
      kyc_message,
      "kyc"
    );
    return res.status(200).json({
      success: true,
      message: "KYC approved and advocate assigned",
    });
  } catch (error) {
    console.log("aprove kyc error", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
//
exports.getAllKycDetails = async (req, res) => {
  try {
    const query = { userType: { $ne: "existing" } };
    const fetchKYCUsers = await KYCmodel.find(query).populate("user_id");
    if (!fetchKYCUsers || fetchKYCUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No KYC details found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: fetchKYCUsers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//  get single kyc details
exports.getSingleKycDetails = async (req, res, next) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(404).json({
        success: false,
        message: "Invalid Credentials",
      });
    }
    const fetchSingleKyc = await KYCmodel.findOne({ user_id });
    if (!fetchSingleKyc) {
      return res.status(404).json({
        success: false,
        message: "No KYC details found for the user",
      });
    }
    return res.status(200).json({
      success: true,
      data: fetchSingleKyc,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.CompleteKYC = async (req, res, next) => {
  try {
    const imageResults = [];
    const pdfResults = [];
    const { user_id } = req;
    const { name, lastname, email, gender, phone, files } = req.body;

    // 1. Basic validation
    if (!name || !user_id) {
      return res
        .status(400)
        .json({ message: "Please fill all fields", success: false });
    }

    // 2. User lookup
    const isUser = await User.findById(user_id);
    if (!isUser) {
      return res.status(400).json({ message: "Invalid User", success: false });
    }

    // 3. Duplicate email check
    if (isUser.email === email) {
      return res
        .status(400)
        .json({ success: false, message: "Email Already Registered" });
    }

    // 4. Check for existing KYC
    const isKyc = await KYCmodel.findOne({ $or: [{ user_id }, { phone }] });
    if (isKyc) {
      if (isKyc.status === "pending") {
        return res.status(400).json({
          message: "KYC already submitted. Awaiting approval",
          success: true,
        });
      }
      if (isKyc.status === "approve") {
        return res
          .status(200)
          .json({ message: "KYC already approved", success: true });
      }
    }

    // 5. Process files from req.body.files
    let profileImage = "";
    if (files && typeof files === "object") {
      for (const [key, url] of Object.entries(files)) {
        if (!url) continue; // skip empty values
        const lowerUrl = url.toLowerCase();

        // set profile image if key is 'photo'
        if (key === "photo") {
          profileImage = url;
          continue; // don't re-check this one
        }

        // check file type
        if (lowerUrl.endsWith(".pdf")) {
          pdfResults.push(url);
        } else {
          imageResults.push(url);
        }
      }
    }
    const UserCheck = isUser.status == true ? "existing" : "new";
    // 6. Prepare KYC data
    const payload = {
      user_id,
      profile: profileImage || "",
      name,
      lastname,
      email,
      gender,
      phone,
      image: imageResults,
      pdf: pdfResults,
      userType: UserCheck,
    };

    // 7. Save KYC
    const uploadKyc = await KYCmodel.create(payload);

    if (!uploadKyc) {
      return res
        .status(400)
        .json({ message: "Failed to upload KYC", success: false });
    }

    // 8. Send Notifications
    const expoToken = await fcmTokenModel.findOne({ userId: user_id });
    const custom_notification = await customeNoticationModel.find({});
    const upload_message =
      custom_notification?.[0]?.kyc_submit ||
      `Dear ${uploadKyc.name}, your KYC documents have been submitted.`;

    if (expoToken?.token) {
      await sendNotificationToSingleUser(
        expoToken.token,
        upload_message,
        "kyc"
      );
    }

    await createNotification(
      expoToken?.userId,
      "Debt Relief India",
      upload_message,
      "kyc"
    );

    // 9. Final response
    return res.status(200).json({
      success: true,
      message:
        "Your documents have been submitted. Admin will approve within 24 hours.",
    });
  } catch (error) {
    console.error("KYC Error:", error);
    return res.status(500).json({ message: error.message, success: false });
  }
};

// get presinged url for upload kyc form in s3
// POST /api/upload-multiple
exports.getPresingedURLs = async (req, res) => {
  try {
    const ALLOWED_TYPES = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
      "application/pdf",
      "video/x-msvideo",
    ];
    console.log("fies", req.body);
    const { files } = req.body; // [{ fileName, fileType, size }, ...]
    if (!files || !files.length) {
      return res.status(400).json({ error: "No files provided" });
    }

    for (let file of files) {
      if (!ALLOWED_TYPES.includes(file.fileType)) {
        return res
          .status(400)
          .json({ error: `Invalid file type: ${file.fileName}` });
      }
    }

    // Generate presigned URLs for all files
    const urls = await Promise.all(
      files.map((file) => generatePresignedURL(file.fileName, file.fileType))
    );

    res.json(urls); // [{uploadURL, fileURL}, ...]
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};
