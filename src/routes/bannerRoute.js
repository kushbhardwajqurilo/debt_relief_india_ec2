const {
  createBanner,
  getBanner,
  bannerWithTitle,
  getBannerWithTitle,
  deleteBanner,
  updateBannerWithTitle,
} = require("../controllers/bannerControll");
const { AuthMiddleWare } = require("../middlewares/adminMiddleware");
const s3BannerUploader = require("../middlewares/bannerMiddleware");
const { roleAuthenticaton } = require("../middlewares/roleBaseAuthentication");
const upload = require("../middlewares/singleImageUpload");

const bannerRouter = require("express").Router();

bannerRouter.put("/update", upload.single("image"), updateBannerWithTitle);
bannerRouter.post("/upload", s3BannerUploader.single("image"), createBanner);
bannerRouter.get("/", getBanner);
bannerRouter.post(
  "/bannertext",
  s3BannerUploader.single("image"),
  bannerWithTitle
);
bannerRouter.get("/all", getBannerWithTitle);
bannerRouter.delete("/delete", deleteBanner);
module.exports = bannerRouter;
