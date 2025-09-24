const {
  outstandingController,
} = require("../controllers/outstandindController");
const { AuthMiddleWare } = require("../middlewares/adminMiddleware");
const { roleAuthenticaton } = require("../middlewares/roleBaseAuthentication");
const outstandingRouter = require("express").Router();
outstandingRouter.post(
  "/add-outstanding",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  outstandingController
);

module.exports = outstandingRouter;
