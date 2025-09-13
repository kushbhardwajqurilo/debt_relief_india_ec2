const {
  uploadInvoice,
  viewInvoice,
  getInvoices,
  getInvoicesByMonthYear,
} = require("../controllers/invoce/insertInvoiceController");
const { AuthMiddleWare } = require("../middlewares/adminMiddleware");
const InvoiceMiddleware = require("../middlewares/InvoiceMiddleware");

const { roleAuthenticaton } = require("../middlewares/roleBaseAuthentication");

const InvoiceRouter = require("express").Router();
InvoiceRouter.get("/invoice-by-month", getInvoicesByMonthYear);
InvoiceRouter.post(
  "/",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  InvoiceMiddleware.single("pdf"),
  uploadInvoice
);
InvoiceRouter.post("/get-invoice", getInvoices);
InvoiceRouter.get("/", viewInvoice);

module.exports = InvoiceRouter;
