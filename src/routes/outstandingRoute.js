const {
  outstandingController,
  getOutstanding,
} = require("../controllers/outstandindController");
const { AuthMiddleWare } = require("../middlewares/adminMiddleware");
const { roleAuthenticaton } = require("../middlewares/roleBaseAuthentication");
const { UserAuthMiddleWare } = require("../middlewares/userMiddleware");
const outstandingRouter = require("express").Router();
outstandingRouter.post(
  "/add-outstanding",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  outstandingController
);

outstandingRouter.get(
  "/",
  UserAuthMiddleWare,
  roleAuthenticaton("user"),
  getOutstanding
);
module.exports = outstandingRouter;
