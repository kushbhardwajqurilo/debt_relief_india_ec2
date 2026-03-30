const {
  sendNotificationToSingleUser,
} = require("../config/expo-push-notification/expoNotification");
const {
  getReviewPermissionToUser,
  getReviewUsers,
  toggleReviewPermission,
} = require("../controllers/admin/adminControll");
const {
  userController,
  createUser,
  updateUser,
  sendOTP,
  verifyOTP,
  userSaving,
  getSavingByMonthYear,
  changePhoneNumber,
  getUserProfile,
  getAllSavingToUser,
  updateUserProfilePicture,
  userControllerForAdmin,
  deleteUserSavings,
  updateUserSavings,
} = require("../controllers/userControll");
const { AuthMiddleWare } = require("../middlewares/adminMiddleware");
const s3Uploader = require("../middlewares/AWS-S3/S3_UploadMiddleware");
const { roleAuthenticaton } = require("../middlewares/roleBaseAuthentication");
// const limiter = require("../middlewares/rateLimitMiddleware");
const { UserAuthMiddleWare } = require("../middlewares/userMiddleware");

const userRouter = require("express").Router();
userRouter.get("/", userController);
userRouter.get("/user-profile", UserAuthMiddleWare, getUserProfile);
userRouter.post("/", createUser);
userRouter.post("/login", sendOTP);
userRouter.put("/", updateUser);
userRouter.put("/change-phone", changePhoneNumber);
userRouter.post("/verify-otp", verifyOTP);
userRouter.post("/user-savings", UserAuthMiddleWare, userSaving);
userRouter.get("/get-user", UserAuthMiddleWare, userController);
userRouter.get("/get-user-admin", UserAuthMiddleWare, userController);
userRouter.post("/get-user-saving", AuthMiddleWare, userControllerForAdmin);
userRouter.get("/get-savings", UserAuthMiddleWare, getAllSavingToUser);
userRouter.delete("/delete-savings", UserAuthMiddleWare, deleteUserSavings);
userRouter.put("/update-savings", UserAuthMiddleWare, updateUserSavings);
userRouter.patch(
  "/update-profile",
  UserAuthMiddleWare,
  roleAuthenticaton("user"),
  s3Uploader.single("file"),
  updateUserProfilePicture,
);
userRouter.post("/notification", sendNotificationToSingleUser);
userRouter.get(
  "/permission",
  UserAuthMiddleWare,
  roleAuthenticaton("user"),
  getReviewPermissionToUser,
);
userRouter.get(
  "/user",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  getReviewUsers,
);
userRouter.post(
  "/toggle",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  toggleReviewPermission,
);
module.exports = userRouter;
