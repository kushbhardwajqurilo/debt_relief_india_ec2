const {
  importUsersFromCSV,
  getUsersList,
  searchUserById,
  getSingleUser,
  getAssignAdvocate,
  getSettementAdvance,
  multipleSoftDelete,
  updateDriUserPhoneId,
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
driRoute.get("/settlement-advance", getSettementAdvance);
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
module.exports = driRoute;
