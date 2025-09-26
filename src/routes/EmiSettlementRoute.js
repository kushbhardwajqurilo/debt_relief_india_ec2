const {
  EMISettlement,
  deleteEmis,
  getAllEmiByUser,
  ManualEmiUpload,
  marksAsPaid,
  createTestEmi,
  BultEmiInsert,
} = require("../controllers/EMISettlementController");
const { AuthMiddleWare } = require("../middlewares/adminMiddleware");
const csvUpload = require("../middlewares/csvMiddleware");
const { roleAuthenticaton } = require("../middlewares/roleBaseAuthentication");
const ExcleUpload = require("../middlewares/xlsxMiddleware");

const EmiSettlementRoute = require("express").Router();

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
EmiSettlementRoute.put("/mark-as-paid", AuthMiddleWare, marksAsPaid);

EmiSettlementRoute.post(
  "/create-test-emi",
  csvUpload.single("file"),
  createTestEmi
);
module.exports = EmiSettlementRoute;
