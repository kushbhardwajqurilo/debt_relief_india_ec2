const {
  deleteFileFromS3,
  s3Client,
  PutObjectCommand,
} = require("../config/aws-s3/s3Config");
const bannerModel = require("../models/bannerModel");
const bannerWithTitle = require("../models/bannerWithTitleModel");
const cloudinary = require("../utilitis/cloudinary");
const fs = require("fs");
const path = require("path");
// banner without title
exports.createBanner = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res
        .status(404)
        .json({ message: "Image is required", success: false });
    }
    const upload = await bannerModel.create({
      bannerImage: file.location,
      public_id: file.key,
    });
    if (!upload) {
      return res
        .status(404)
        .json({ success: false, message: "failed to upload" });
    }
    return res
      .status(201)
      .json({ success: true, message: "banner uploaded successfully" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getBanner = async (req, res, next) => {
  try {
    const banner = await bannerModel.find();
    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "No banner found" });
    }
    return res.status(200).json({ success: true, banner });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// banner without title end...

//banner with title start...

exports.bannerWithTitle = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "Image is required" });
    }
    const { title, hyperLink } = req.body;
    if (!title || !hyperLink) {
      return res
        .status(400)
        .json({ success: false, message: "Title and hyperLink is required" });
    }

    const paylod = {
      bannerImage: file.location,
      bannerTitle: title,
      public_id: file.key,
      hyperLink,
    };

    const bannerRes = await bannerWithTitle.create(paylod);
    if (!bannerRes) {
      return res.status(400).json({ success: false, message: "Upload failed" });
    }
    return res.status(201).json({
      success: true,
      message: "Banner uploaded successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err,
      message: err.message,
    });
  }
};

// updpate banner with titiel
exports.updateBannerWithTitle = async (req, res) => {
  try {
    const bannerId = req.body.id;
    const { title, hyperLink } = req.body;

    const existingBanner = await bannerWithTitle.findById(bannerId);
    if (!existingBanner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    const updatedData = {};
    if (title) updatedData.bannerTitle = title;
    if (hyperLink) updatedData.hyperLink = hyperLink;

    if (req.file) {
      // delete old banner from S3
      const oldKey = existingBanner.public_id;
      if (oldKey) await deleteFileFromS3(oldKey);

      // multer-s3 already uploaded the file
      updatedData.bannerImage = req.file.location; // S3 file URL
      updatedData.public_id = req.file.key; // S3 file key
    }

    const updatedBanner = await bannerWithTitle.findByIdAndUpdate(
      bannerId,
      updatedData,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: updatedBanner,
    });
  } catch (err) {
    console.error("Error in updateBannerWithTitle:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteBannerWithTitle = async (req, res, next) => {
  try {
    const bannerId = req.params.id;

    // Find banner by ID
    const banner = await bannerWithTitle.findById(bannerId);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // Delete image from s3
    const del = delteFileFromS3(banner.public_id);
    if (del === true) {
      // Delete banner from database
      await bannerWithTitle.findByIdAndDelete(bannerId);

      return res.status(200).json({
        success: true,
        message: "Banner deleted successfully",
      });
    }
    return res.status(400).json({ success: false, message: "faild to delete" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// banner without title end...

exports.getBannerWithTitle = async (req, res, next) => {
  try {
    const banner = await bannerWithTitle.find();
    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "No banners found" });
    }
    return res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.deleteBannerWithTitle = async (req, res, next) => {
  try {
    const bannerId = req.params.id;
    const isBanner = await bannerWithTitle.findById(bannerId);
    if (!isBanner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }
    await isBanner.deleteOne();
    return res
      .status(200)
      .json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//delete banner
exports.deleteBanner = async (req, res, next) => {
  try {
    const { public_id } = req.query;
    if (!public_id) {
      return res
        .status(400)
        .json({ success: false, message: "banner id missing" });
    }
    const findBanner = await bannerModel.findOne({ public_id });
    if (!findBanner || findBanner.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "banner not found" });
    }
    const del = await deleteFileFromS3(public_id);
    if (del === true) {
      await bannerModel.deleteOne({ public_id });
      res.status(201).json({
        success: true,
        message: "image deleted successfully",
      });
    }
    res.status(400).json({ success: false, message: "failed to delete" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
