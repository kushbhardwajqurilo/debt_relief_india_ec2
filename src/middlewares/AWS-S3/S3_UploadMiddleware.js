const multer = require("multer");
const multerS3 = require("multer-s3");
const { s3Client } = require("../../config/aws-s3/s3Config");

const allowFileTypes = [
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "video/x-msvideo", // avi
];

// File type validation
const fileTypeCheck = (req, file, cb) => {
  if (allowFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid File Type"), false);
  }
};

// Multer + S3 config
const s3Uploader = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,

    contentDisposition: (req, file, cb) => {
      cb(null, "inline");
    },
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },

    key: (req, file, cb) => {
      const uniSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, "kyc_documents/" + uniSuffix + "-" + file.originalname);
    },
  }),

  fileFilter: fileTypeCheck,

  limits: { fileSize: 100 * 1024 * 1024 }, // 40MB
});

module.exports = s3Uploader;
