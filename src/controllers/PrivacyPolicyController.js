const adminModel = require("../models/adminModel");
const prvivayPolicyModel = require("../models/PricacyPolicyModel");
const { createLog } = require("../utilitis/log");
// exports.privacyPolicy = async (req, res, next) => {
//   try {
//     const { title } = req.body;
//     const points = req.body.points;
//     if (!title || !points) {
//       return res.status(400).json({ message: "Please fill in all fields" });
//     }
//     const privacyPolicy = await prvivayPolicyModel.create({ title, points });
//     if (!privacyPolicy) {
//       return res
//         .status(400)
//         .json({ message: "Failed to create privacy policy" });
//     }
//     res
//       .status(201)
//       .json({ message: "Privacy policy created successfully", success: true });
//   } catch (err) {}
// };

// // get all policy
// exports.getAllPolicy = async (req, res, next) => {
//   try {
//     const privacyPolicy = await prvivayPolicyModel.find({});
//     if (!privacyPolicy) {
//       return res.status(400).json({ message: "No privacy policy found" });
//     }
//     res.status(200).json({ success: true, data: privacyPolicy });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//       error,
//     });
//   }
// };
// //update privacy policy
// exports.updatePrivacyPolicy = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const title = req.body.title;
//     const points = req.body.points;
//     const update = await prvivayPolicyModel.updateOne();
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//       error: err,
//     });
//   }
// };

// // delete policy

// exports.deletePrivacyPolicy = async (req, res, next) => {
//   try {
//     const { id } = req.query;
//     const del = await prvivayPolicyModel.findByIdAndDelete(id);
//     if (!del) {
//       return res
//         .status(400)
//         .json({ success: false, message: "failed to delete" });
//     }
//     return res
//       .status(200)
//       .json({ success: true, message: "delete successfull" });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//       error: err,
//     });
//   }
// };

exports.privacyPolicy = async (req, res, next) => {
  try {
    const admin = await adminModel.findOne({}, "name");
    const { title } = req.body;
    const points = req.body.points;

    if (!title || !points) {
      await createLog({
        user_name: admin?.name ?? "System",
        role: admin?.name ? "admin" : "System",
        action: "Create Privacy Policy failed: Missing fields",
      });

      return res.status(400).json({ message: "Please fill in all fields" });
    }

    const privacyPolicy = await prvivayPolicyModel.create({ title, points });

    if (!privacyPolicy) {
      await createLog({
        user_name: admin?.name ?? "System",
        role: admin?.name ? "admin" : "System",
        action: "Create Privacy Policy failed: Insert failed",
      });

      return res
        .status(400)
        .json({ message: "Failed to create privacy policy" });
    }

    await createLog({
      user_name: admin?.name ?? "System",
      role: admin?.name ? "admin" : "System",
      action: `Privacy Policy created (${title})`,
    });

    res
      .status(201)
      .json({ message: "Privacy policy created successfully", success: true });
  } catch (err) {
    await createLog({
      user_name: "System",
      role: "System",
      action: `Create Privacy Policy error: ${err?.message}`,
    });
  }
};

// get all policy
exports.getAllPolicy = async (req, res, next) => {
  try {
    const admin = await adminModel.findOne({}, "name");

    const privacyPolicy = await prvivayPolicyModel.find({});

    if (!privacyPolicy) {
      return res.status(400).json({ message: "No privacy policy found" });
    }
    res.status(200).json({ success: true, data: privacyPolicy });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

// update privacy policy
exports.updatePrivacyPolicy = async (req, res, next) => {
  try {
    const admin = await adminModel.findOne({}, "name");
    const { id } = req.params;
    const title = req.body.title;
    const points = req.body.points;

    await createLog({
      user_name: admin?.name ?? "System",
      role: admin?.name ? "admin" : "System",
      action: `Update Privacy Policy attempt`,
    });

    const update = await prvivayPolicyModel.updateOne();
    if (!update) {
      await createLog({
        user_name: "System",
        role: "System",
        action: `Update Privacy Policy failed`,
      });
      return res.status(400).json({
        success: false,
        message: "failed to update policy",
      });
    }
    return res.status(200).json({
      success: true,
      message: "privacy policy updated",
    });
  } catch (err) {
    await createLog({
      user_name: "System",
      role: "System",
      action: `Update Privacy Policy error: ${err.message}`,
    });

    return res.status(500).json({
      success: false,
      message: err.message,
      error: err,
    });
  }
};

// delete policy
exports.deletePrivacyPolicy = async (req, res, next) => {
  try {
    const admin = await adminModel.findOne({}, "name");
    const { id } = req.query;

    const del = await prvivayPolicyModel.findByIdAndDelete(id);

    if (!del) {
      await createLog({
        user_name: admin?.name ?? "System",
        role: "System",
        action: `Delete Privacy Policy failed `,
      });

      return res
        .status(400)
        .json({ success: false, message: "failed to delete" });
    }

    await createLog({
      user_name: admin?.name ?? "System",
      role: "System",
      action: `Privacy Policy deleted (${id})`,
    });

    return res
      .status(200)
      .json({ success: true, message: "delete successfull" });
  } catch (err) {
    await createLog({
      user_name: "System",
      role: "System",
      action: `Delete Privacy Policy error: ${err.message}`,
    });

    return res.status(500).json({
      success: false,
      message: err.message,
      error: err,
    });
  }
};
