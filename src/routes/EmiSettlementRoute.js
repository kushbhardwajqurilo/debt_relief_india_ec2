const {
  EMISettlement,
  deleteEmis,
  getAllEmiByUser,
  ManualEmiUpload,
  marksAsPaid,
  createTestEmi,
  BultEmiInsert,
  outstandingController,
  getPaidSerivcesToEachUser,
  updateServiceDueDates,
  addSingleLoanToClient,
} = require("../controllers/EMISettlementController");
const { AuthMiddleWare } = require("../middlewares/adminMiddleware");
const csvUpload = require("../middlewares/csvMiddleware");
const { roleAuthenticaton } = require("../middlewares/roleBaseAuthentication");
const ExcleUpload = require("../middlewares/xlsxMiddleware");

const EmiSettlementRoute = require("express").Router();

EmiSettlementRoute.get("/get-paid-service/:user_id", getPaidSerivcesToEachUser);
// EmiSettlementRoute.post("/create-emi", csvUpload.single("file"), EMISettlement);
EmiSettlementRoute.post("/create-emi", csvUpload.single("file"), createTestEmi);
EmiSettlementRoute.post("/bulk-insert", csvUpload.single("csv"), BultEmiInsert);
EmiSettlementRoute.delete(
  "/delete-emi",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  deleteEmis
);
EmiSettlementRoute.get("/getall", getAllEmiByUser);
EmiSettlementRoute.post("/manual", ManualEmiUpload);
EmiSettlementRoute.put(
  "/mark-as-paid",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  marksAsPaid
);
EmiSettlementRoute.patch(
  "/update-date",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  updateServiceDueDates
);
EmiSettlementRoute.post(
  "/create-test-emi",
  csvUpload.single("file"),
  createTestEmi
);

EmiSettlementRoute.post(
  "/outstand",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  outstandingController
);
EmiSettlementRoute.post(
  "/add-single-loan",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  addSingleLoanToClient
);
module.exports = EmiSettlementRoute;
