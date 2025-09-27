const {
  addAdvocate,
  updateAdvocate,
  getSingleAdvocate,
  getAllAdvocates,
  serviceTiming,
  getAdvocateTiming,
} = require("../controllers/admin/advocateController");
const { AuthMiddleWare } = require("../middlewares/adminMiddleware");
const s3AdvoateUpload = require("../middlewares/AdvocateImageMiddleware");
const { roleAuthenticaton } = require("../middlewares/roleBaseAuthentication");

const advocateRouter = require("express").Router();
advocateRouter.post("/add", s3AdvoateUpload.single("image"), addAdvocate);
advocateRouter.put(
  "/update",
  AuthMiddleWare,
  roleAuthenticaton("admin"),
  s3AdvoateUpload.single("image"),
  updateAdvocate
);
advocateRouter.get("/single/:id", getSingleAdvocate);
advocateRouter.get("/all", getAllAdvocates);
advocateRouter.post("/set-timing", AuthMiddleWare, serviceTiming);
advocateRouter.get("/get-timing", getAdvocateTiming);

module.exports = advocateRouter;
