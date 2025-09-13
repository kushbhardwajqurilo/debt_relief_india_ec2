const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const { s3Client } = require("../config/aws-s3/s3Config");

// ✅ Allowed image types
const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "image/avif",
];
const filterCheck = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};
const s3AdvoateUpload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    acl: "public-read",
    contentDisposition: (req, file, cb) => {
      cb(null, "inline");
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const name = path
        .basename(file.originalname, ext)
        .replace(/\s+/g, "_")
        .toLowerCase();

      const finalKey = `Advocates/${timestamp}-${random}-${name}${ext}`;
      cb(null, finalKey);
    },
  }),
  fileFilter: filterCheck,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = s3AdvoateUpload;
