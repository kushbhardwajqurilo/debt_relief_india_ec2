const {
  privacyPolicy,
  getAllPolicy,
  deletePrivacyPolicy,
  updatePrivacyPolicy,
} = require("../controllers/PrivacyPolicyController");

const privacyPolicyRouter = require("express").Router();

privacyPolicyRouter.post("/", privacyPolicy);
privacyPolicyRouter.get("/", getAllPolicy);
privacyPolicyRouter.delete("/", deletePrivacyPolicy);
privacyPolicyRouter.put("/:id", updatePrivacyPolicy);
module.exports = privacyPolicyRouter;
