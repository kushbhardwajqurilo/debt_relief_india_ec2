const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
const zlib = require("zlib");

// Routes
const userRouter = require("./src/routes/userRouter");
const bannerRouter = require("./src/routes/bannerRoute");
const loanRouter = require("./src/routes/loansRoute");
const adminRouter = require("./src/routes/adminRoute");
const subscriptionRouter = require("./src/routes/subscriptionRoute");
const serviceRouter = require("./src/routes/serviceRoute");
const advocateRouter = require("./src/routes/advocateRouter");
const DRIRoutes = require("./src/routes/DriRoutes");
const KycRouters = require("./src/routes/KycRouter");
const EmiSettlementRoute = require("./src/routes/EmiSettlementRoute");
const driRoute = require("./src/routes/DriUser");
const InvoiceRouter = require("./src/routes/invoiceRoute");
const TncRoutetr = require("./src/routes/TncRouter");
const privacyPolicyRouter = require("./src/routes/privacyPolicyRoute");
const QRUPIRouter = require("./src/routes/UpiAndQrRoute");
const emiRouters = require("./src/routes/testingRoute");
const whatsAppRouter = require("./src/routes/whatappRoute");
const notificationRouter = require("./src/routes/notificationRouter");
// require("./src/config/cron-job/nodeCron");
const app = express();

// ----------------------------
// Middleware
// ----------------------------
//git
// Enable CORS
app.use(cors());
app.set("view engine", "ejs");
// Security headers with Helmet (optimized)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(helmet.hidePoweredBy());

// Compression with Gzip/Brotli
app.use(
  compression({
    level: zlib.constants.Z_BEST_COMPRESSION,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  })
);
// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ----------------------------
// Static files
// ----------------------------
app.use(
  "/public/uploads/banner",
  express.static(path.resolve("public/uploads/banner"))
);

// ----------------------------
// API Routes
// ----------------------------
const baseURI = "/api/v1/";

// app.post("/upload", s3Uploader.single("file"), (req, res) => {
//   try {
//     if (!req.file) {
//       console.log("file", req.file);
//       return res.status(400).json({ error: "File upload failed" });
//     }
//     res.status(200).json({
//       message: "File uploaded successfully",
//       fileUrl: req.file.location,
//     });
//   } catch (error) {
//     return res.json(error);
// //   }
// // });
// app.post("/upload", s3Uploader.array("file"), (req, res) => {
//   try {
//     if (!req.files || req.files.length === 0) {
//       console.log("files", req.files);
//       return res.status(400).json({ error: "File upload failed" });
//     }

//     const fileUrls = req.files.map((file) => file.location);

//     res.status(200).json({
//       message: "Files uploaded successfully",
//       fileUrls: fileUrls,
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

app.use(`${baseURI}admin`, adminRouter);
app.use(`${baseURI}user`, userRouter);
app.use(`${baseURI}banner`, bannerRouter);
app.use(`${baseURI}loan`, loanRouter);
app.use(`${baseURI}subcription`, subscriptionRouter);
app.use(`${baseURI}service`, serviceRouter);
app.use(`${baseURI}advocate`, advocateRouter);
app.use(`${baseURI}driworks`, DRIRoutes);
app.use(`${baseURI}kyc`, KycRouters);
app.use(`${baseURI}emi`, EmiSettlementRoute);
app.use(`${baseURI}driuser`, driRoute);
app.use(`${baseURI}invoice`, InvoiceRouter);
app.use(`${baseURI}tnc`, TncRoutetr);
app.use(`${baseURI}privacy`, privacyPolicyRouter);
app.use(`${baseURI}upi`, QRUPIRouter);
app.use(`${baseURI}emiSettle`, emiRouters);
app.use(`${baseURI}whatsapp`, whatsAppRouter);
app.use(`${baseURI}notification`, notificationRouter);
// ----------------------------
// 404 Handler
// ----------------------------

// app.post("/not", async (req, res) => {
//   await sendNotificationToSingleUser(req.body.token, "hello", "ssfs", "ssss");
// });

app.get("/", (req, res) => {
  return res.render("index");
});

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "API endpoint not found" });
});

// ----------------------------
// Global Error Handler
// ----------------------------
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message,
  });
});

module.exports = app;
