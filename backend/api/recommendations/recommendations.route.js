const router = require("express").Router();
const recommendations = require("./recommendations.controller");
const {
  authenticateToken,
  authenticateTokenExpert,
} = require("../../middleware/authenticateToken");

router
  .route("/")
  .post(recommendations.createRecommendation)
  .get(recommendations.getAllRecommendations);

router.route("/:id").get(recommendations.getAllRecommendationsByExpert)

module.exports = router;
