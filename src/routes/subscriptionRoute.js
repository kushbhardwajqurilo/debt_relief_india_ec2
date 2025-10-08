const {
  SubscriptionsController,
  getUsersSubscriptionToUser,
  getUsersSubscriptionToAdmin,
  deleteSubscription,
  updateSubscription,
  getAllUserToAdmin,
  markSubscriptionAsPaid,
  getPaidSubscriptions,
} = require("../controllers/admin/monthlySubsciption");
const { AuthMiddleWare } = require("../middlewares/adminMiddleware");
const { roleAuthenticaton } = require("../middlewares/roleBaseAuthentication");
const { UserAuthMiddleWare } = require("../middlewares/userMiddleware");

const subscriptionRouter = require("express").Router();
subscriptionRouter.post(
  "/add-subscription",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  SubscriptionsController
);
subscriptionRouter.get("/get-substouser/:id", getUsersSubscriptionToUser);
subscriptionRouter.get(
  "/get-substoadmin",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  getUsersSubscriptionToAdmin
);
subscriptionRouter.put(
  "/update-subscription",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  updateSubscription
);
subscriptionRouter.delete(
  "/delete-subscription",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  deleteSubscription
);
subscriptionRouter.get(
  "/subscription-users",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  getAllUserToAdmin
);

subscriptionRouter.post(
  "/markAsPaid",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  markSubscriptionAsPaid
);

subscriptionRouter.get("/getPaidSubscriptions", getPaidSubscriptions);
module.exports = subscriptionRouter;
