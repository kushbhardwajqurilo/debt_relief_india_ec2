const {
  createUPI,
  getUPI,
  deleteUPI,
  updateUPI,
} = require("../controllers/UPIController");
const s3UPIMiddleware = require("../middlewares/AWS-S3/UpiMiddleware");

const QRUPIRouter = require("express").Router();
QRUPIRouter.post("/", s3UPIMiddleware.single("image"), createUPI);
QRUPIRouter.get("/", getUPI);
QRUPIRouter.delete("/:id", deleteUPI);
QRUPIRouter.put("/update", s3UPIMiddleware.single("image"), updateUPI);
module.exports = QRUPIRouter;
