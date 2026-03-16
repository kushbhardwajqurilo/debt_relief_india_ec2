const { default: mongoose } = require("mongoose");
const adminModel = require("../../models/adminModel");
const advocateModel = require("../../models/advocateModel");
const cloudinay = require("../../utilitis/cloudinary");
const fs = require("fs");
const { serviceTimingModel } = require("../../models/contactYourAdvocateModel");
const { createLog } = require("../../utilitis/log");
exports.addAdvocate = async (req, res, next) => {
  try {
    const { name, contactNumber } = req.body;
    const imagePath = req.file;

    const admin = await adminModel.findById(req.admin_id, "name");

    if (!admin) {
      await createLog({
        user_name: "Unknown",
        role: "unknown",
        action: `Someone tried to add advocate -> name:${name || ""}, contactNumber:${contactNumber || ""}`,
      });

      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!name || !contactNumber || !imagePath) {
      return res.status(400).json({
        success: false,
        message: "Advocate Credentials Missing",
      });
    }

    const payload = {
      name,
      contactNumber,
      advocateImage: imagePath.location,
      imagePublicKey: imagePath.key,
    };

    const createAdvocate = await advocateModel.create(payload);

    await createLog({
      user_name: admin?.name,
      role: req.role,
      action: `${admin?.name} added advocate -> name:${name}, contactNumber:${contactNumber}`,
    });

    return res.status(200).json({
      success: true,
      message: "Advocate added successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

// update timing
exports.updateAdvocate = async (req, res, next) => {
  try {
    const { admin_id } = req;
    const imagePath = req.file;
    const { name, contact, id } = req.body;

    const maskContact = (contact) => {
      if (!contact) return "";
      return contact.slice(0, 2) + "******" + contact.slice(-2);
    };

    if (!admin_id) {
      await createLog({
        user_name: "Unknown",
        role: "unknown",
        action: "Someone tried to update advocate but admin id missing",
      });

      return res.status(401).json({ message: "Admin id missing" });
    }

    const admin = await adminModel.findById(admin_id, "name");

    const isAdvocate = await advocateModel.findById(id);
    if (!isAdvocate) {
      await createLog({
        user_name: admin?.name || "Admin",
        role: req.role,
        action: `${admin?.name} tried to update advocate but not found | AdvocateId:${id}`,
      });

      return res.status(404).json({
        success: false,
        message: "Advocate not found",
      });
    }

    const payload = {
      name,
      contactNumber: contact,
      advocateImage: imagePath?.location || isAdvocate.advocateImage,
      imagePublicKey: imagePath?.key || isAdvocate.imagePublicKey,
    };

    await isAdvocate.updateOne(payload);

    await createLog({
      user_name: admin?.name,
      role: req.role,
      action: `${admin?.name} updated advocate | Name:${name} | Contact:${maskContact(contact)}`,
    });

    return res.status(200).json({
      success: true,
      message: "Profile Updated",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message, success: false });
  }
};

// single advocate profile get
exports.getSingleAdvocate = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(200)
        .json({ success: false, message: "Advocate id must be ObjectId" });
    }
    const advocate = await advocateModel.findById(id);
    if (!advocate) {
      return res
        .status(404)
        .json({ success: false, message: "Advocate Not Found" });
    }
    if (advocate.isDelete === true) {
      return res
        .status(400)
        .json({ success: false, messae: "Advocate not available" });
    }
    return res.status(200).json({ success: true, data: advocate });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

// get all advocates
exports.getAllAdvocates = async (req, res, next) => {
  try {
    const advocates = await advocateModel.find({ isDelete: { $ne: true } });
    if (!advocates) {
      return res
        .status(404)
        .json({ success: false, message: "No advocates found" });
    }
    return res.status(200).json({ success: true, data: advocates });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

// service timeing
exports.serviceTiming = async (req, res) => {
  try {
    const { admin_id, role } = req;
    const { timing } = req.body;

    if (!admin_id) {
      await createLog({
        user_name: "Unknown",
        role: "unknown",
        action: "Someone tried to update service timing but admin id missing",
      });

      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const admin = await adminModel.findById(admin_id, "name");

    if (!timing) {
      await createLog({
        user_name: admin?.name || "Admin",
        role,
        action: `${admin?.name} tried to update service timing but timing missing`,
      });

      return res.status(400).json({
        success: false,
        message: "Timing credentials missing",
      });
    }

    const set_timing = await serviceTimingModel.findOneAndUpdate(
      {},
      { timing },
      { upsert: true, new: true },
    );

    if (!set_timing) {
      await createLog({
        user_name: admin?.name || "Admin",
        role,
        action: `${admin?.name} failed to update service timing`,
      });

      return res.status(400).json({
        success: false,
        message: "Failed to set timing",
      });
    }

    await createLog({
      user_name: admin?.name,
      role,
      action: `${admin?.name} updated service timing -> ${timing}`,
    });

    return res.json({
      success: true,
      message: "Service timing updated successfully",
    });
  } catch (error) {
    await createLog({
      user_name: "System",
      role: "error",
      action: `Error while updating service timing -> ${error.message}`,
    });

    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.getAdvocateTiming = async (req, res, next) => {
  try {
    const timing = await serviceTimingModel.find({});
    return res.status(200).json({ success: true, timing });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

// advocate delete
exports.deleteAdvocate = async (req, res, next) => {
  try {
    const { admin_id, role } = req;
    const { id } = req.params;

    const maskContact = (contact) => {
      if (!contact) return "";
      return contact.slice(0, 2) + "******" + contact.slice(-2);
    };

    if (!admin_id) {
      await createLog({
        user_name: "Unknown",
        role: "unknown",
        action: "Someone tried to delete advocate but admin id missing",
      });

      return res
        .status(401)
        .json({ success: false, message: "Admin id missing" });
    }

    const admin = await adminModel.findById(admin_id, "name");

    if (!admin) {
      await createLog({
        user_name: "Unknown",
        role: "unknown",
        action: `Unauthorized attempt to delete advocate | AdvocateId:${id}`,
      });

      return res
        .status(400)
        .json({ success: false, message: "Un-authorized Admin" });
    }

    const isAdvocate = await advocateModel.findById(id);

    if (!isAdvocate) {
      await createLog({
        user_name: admin?.name,
        role,
        action: `${admin?.name} tried to delete advocate but not found | AdvocateId:${id}`,
      });

      return res
        .status(404)
        .json({ success: false, message: "Advocate not found" });
    }

    await advocateModel.updateOne({ _id: id }, { $set: { isDelete: true } });

    await createLog({
      user_name: admin?.name,
      role,
      action: `${admin?.name} deleted advocate | Name:${isAdvocate.name} | Contact:${maskContact(
        isAdvocate.contactNumber,
      )}`,
    });

    return res
      .status(200)
      .json({ success: true, message: "Advocate profile removed." });
  } catch (error) {
    await createLog({
      user_name: "System",
      role: "error",
      action: `Error while deleting advocate -> ${error.message}`,
    });

    return res.status(500).json({ success: false, message: error.message });
  }
};
