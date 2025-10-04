const {
  CompleteKYC,
  ApproveByAdmin,
  getSingleKycDetails,
  getAllKycDetails,
  getPresingedURLs,
} = require("../controllers/KYCController");
const { AuthMiddleWare } = require("../middlewares/adminMiddleware");
const s3Uploader = require("../middlewares/AWS-S3/S3_UploadMiddleware");
const { roleAuthenticaton } = require("../middlewares/roleBaseAuthentication");
const { UserAuthMiddleWare } = require("../middlewares/userMiddleware");
const KycRouters = require("express").Router();

KycRouters.get("/get-presignedurl", getPresingedURLs);

KycRouters.post(
  "/add-kyc",
  s3Uploader.array("file"),
  UserAuthMiddleWare,
  roleAuthenticaton("user"),
  CompleteKYC
);
KycRouters.post(
  "/approve-kyc",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  ApproveByAdmin
);
KycRouters.get("/get-kyc", getAllKycDetails);
KycRouters.get("/single-kyc", getSingleKycDetails);
module.exports = KycRouters;
