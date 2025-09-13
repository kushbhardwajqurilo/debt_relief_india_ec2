const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./public/uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDFs allowed"), false);
  }
};

const InvoiceMiddleware = multer({ storage, fileFilter });

module.exports = InvoiceMiddleware;
