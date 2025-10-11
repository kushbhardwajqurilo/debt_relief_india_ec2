const {
  importUsersFromCSV,
  getUsersList,
  searchUserById,
  getSingleUser,
  getAssignAdvocate,
  getSettementAdvance,
  multipleSoftDelete,
  updateDriUserPhoneId,
  permanentDeleteUserData,
} = require("../controllers/DriUser");
const { AuthMiddleWare } = require("../middlewares/adminMiddleware");
const csvUpload = require("../middlewares/csvMiddleware");
const { roleAuthenticaton } = require("../middlewares/roleBaseAuthentication");
const { UserAuthMiddleWare } = require("../middlewares/userMiddleware");

const driRoute = require("express").Router();
driRoute.post("/", csvUpload.single("csv"), importUsersFromCSV);
driRoute.get("/", getUsersList);
driRoute.get("/search", searchUserById);
driRoute.post("/single", getSingleUser);
driRoute.get("/assign-advocate", UserAuthMiddleWare, getAssignAdvocate);
driRoute.post("/settlement-advance", getSettementAdvance);
driRoute.delete(
  "/delete-user",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  multipleSoftDelete
);
driRoute.put(
  "/update-user",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  updateDriUserPhoneId
);
driRoute.delete(
  "/permanent-delete",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  permanentDeleteUserData
);
module.exports = driRoute;
