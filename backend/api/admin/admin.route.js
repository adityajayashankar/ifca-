const router = require("express").Router();
const admin = require("./admin.controller");
const {
  authenticateTokenSuperAdmin,
  authenticateTokenAdmin,
  authenticateTokenExpert,
  authenticateTokenPartner,
  authenticateToken,
} = require("../../middleware/authenticateToken");
router
  .route("/")
  .get([authenticateTokenSuperAdmin, admin.getAllAdmins])
  .post([ admin.addAdmin]);

router
  .route("/create/user")
  .post([authenticateTokenAdmin, admin.createUsersBulk]);
router
  .route("/create/expert")
  .post([authenticateToken, admin.createExpertsBulk]);

router
  .route("/:id")
  .patch([authenticateTokenAdmin, admin.updateAdminById])
  .get([authenticateTokenAdmin, admin.getAdminById]);

router
  .route("/:id/session")
  .get([authenticateTokenAdmin, admin.getAdminSessions]);
router.post("/forms", admin.createForm);

// Community subscription management routes
router.get("/community/:communityId/users", authenticateToken, admin.getCommunityUsers);
router.post("/community/:communityId/subscriptions", authenticateToken, admin.manageCommunitySubscriptions);

module.exports = router;
