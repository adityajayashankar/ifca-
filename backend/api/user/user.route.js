const express = require('express');
const user = require("./user.controller");
const {
  authenticateTokenUser,
  authenticateToken,
} = require("../../middleware/authenticateToken");
const { cleanupBeforeUserDeletion } = require('../../middleware/userDeletion.middleware');

const router = express.Router();

router.get("/:id/subscription", user.getUserSubscriptions);
router
  .route("/:id/sessions")
  .get([user.getUserSessions])
  .post([user.addUserSession])
  .patch([user.addUserAttendence])
  .delete([user.deleteUserSession]);

router.patch("/:id/sessions/buy", [authenticateTokenUser, user.buySession]);
router.get("/:id/community", [user.getUserCommunities]);
router.get("/:id/community/sessions", [
  user.getSessionsFromCommunity,
]);
router.get("/:id/community/subscribed", [user.getUserSubscribedCommunities]);
router.get("/:id/community/non-subscribed", [user.getUserNonSubscribedCommunities]);
router.get("/:id/attendance", [authenticateTokenUser, user.getUserAttendance]);
router
  .route("/:id/cart")
  .get([user.getCartItems])
  .patch([user.deleteCartSessions]);

router.route(`/`).get(user.getUsersByFilter);
router.get("/all", user.getAllUsers);

router
  .route("/:id/profile-progress").get(user.getUserProfileProgress);
router
  .route("/:id/intial-community").get(user.getInitialCommunity);

router
  .route("/:id")
  .get(user.getUserById)
  .patch([user.updateUserById])
  .delete([cleanupBeforeUserDeletion, user.deleteUserById]);

router.post("/notifications", user.createNotification);

// Route for fetching all notifications
router.get("/notifications", user.getAllNotifications);
router.get('/:id/recent-activities', user.getUserRecentActivities);

router.get('/:userId/community/:communityId/subscribed', user.isUserSubscribedToCommunity);
router.get('/:userId/community/:communityId/requested', user.hasUserRequestedCommunity);

router.get('/:userId/communities/requested', user.getAllRequestedCommunities);

// Debug route to see all communities
router.get("/debug/communities", user.getAllCommunitiesDebug);

// Session management routes
router.get("/:id/sessions/subscribed", user.getUserSubscribedSessions);
router.get("/:id/sessions/non-subscribed", user.getUserNonSubscribedSessions);
router.get("/:userId/session/:sessionId/subscribed", user.isUserSubscribedToSession);
router.get("/:userId/session/:sessionId/join-status", user.getUserSessionJoinStatus);
router.get("/:id/sessions/stats", user.getUserSessionStats);
  router.patch("/:id/enable", user.enableUserById);



// Route for fetching a single notification by ID
// router.get("/notifications/:id", user.getNotificationById);

router.get("/:id/sessions/ongoing", user.getUserOngoingSessions);
router.get("/:id/sessions/upcoming-slots", user.getUserUpcomingSessionSlots);


module.exports = router;
