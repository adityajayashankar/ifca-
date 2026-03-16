const router = require("express").Router();
const thread = require("./thread.controller");
const {
  authenticateTokenPartner,
  authenticateToken,
  authenticateTokenWithoutReject,
} = require("../../middleware/authenticateToken");

router
  .route("/")
  .post(thread.createPost)
  .get([authenticateTokenWithoutReject, thread.getAllPosts]);
router
  .route("/:postId")
  .get([thread.getPostById])
  .patch([thread.updatePost])
  .delete([thread.deletePostById]);

router.route("/:postId/tag").patch([thread.updatePostTags]);

// New route to get users who liked a post
router.route("/:postId/likes").get([thread.getPostLikes]);

// New route to get poll voters
router.route("/:postId/poll-voters").get([authenticateTokenWithoutReject, thread.getPollVoters]);

// New route to get comments for a post
router.route("/:postId/comments").get([authenticateTokenWithoutReject, thread.getPostComments]);

// Archive/Unarchive a post (Admin only)
router.route("/:threadId/archive").patch([authenticateToken, thread.archivePost]);

router.route("/session/:sessionId").get(thread.getPostsBySession);
router.route("/event/:eventId").get(thread.getPostsByEvent);
router
  .route("/community/:communityId")
  .get([authenticateTokenWithoutReject, thread.getPostsByCommunity]);

router.route("/user/:userId").get([thread.getPostsByUser]);

router
  .route("/:postId/user/:userId")
  .patch([thread.likePost]);

router
  .route("/:postId/user/:userId/option/:optionId")
  .patch([thread.createUserPollReaction]);

router.route("/user/:userId/community").get(thread.getUserCommunityPosts);
module.exports = router;
