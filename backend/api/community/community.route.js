const router = require("express").Router();
const community = require("./community.controller");
const {
  authenticateTokenPartner,
  authenticateToken,
} = require("../../middleware/authenticateToken");

// Public route - no authentication required
router.get("/public", community.getAllPublicCommunities);

// Community CRUD routes
router
  .route("/")
  .post(authenticateToken, community.createCommunity)
  .get(authenticateToken, community.getAllCommunities);

// Get recent communities by user
router.get("/recent", authenticateToken, community.getRecentCommunitiesByUser);

// Bulk upload route
router.post("/bulk-upload", authenticateToken, community.bulkUploadCommunities);

// Community management routes
router.get("/pending", authenticateToken, community.getAllPendingCommunities);
router.patch("/:id/approve", authenticateToken, community.approveCommunity);

// Search and tags routes
router.get("/search", community.getCommunitiesByTag);
router.get("/search-communities-public", community.searchCommunitiesPublic);
router.get("/search-communities", authenticateToken, community.searchCommunities);
router.get("/getalltags", community.getAllTags);
router.get("/all-tags-system", community.getAllTagsInSystem);
router.get("/by-tag/:tagId", community.getCommunitiesByTagId);

// Enhanced tag routes
router.get("/tags/popular", community.getPopularTags);
router.get("/tags/search", community.searchTags);
router.get("/tags/suggestions", community.getTagSuggestions);
router.post("/tags/bulk", authenticateToken, community.bulkCreateTags);

// Community-specific tag routes
router.get("/community-tags", authenticateToken, community.getCommunityTags);
router.post("/community-tags", authenticateToken, community.createCommunityTag);
router.get("/community-tags/popular", authenticateToken, community.getPopularCommunityTags);
router.get("/community-tags/search", authenticateToken, community.searchCommunityTags);
router.post("/community-tags/bulk", authenticateToken, community.bulkCreateCommunityTags);

// Tag management routes
router
  .route("/tags")
  .post(authenticateToken, community.createTag)
  .get(authenticateToken, community.getAllTags);

router
  .route("/tags/:id")
  .get(authenticateToken, community.getTagById)
  .patch(authenticateToken, community.updateTag)
  .delete(authenticateToken, community.deleteTag);

// Archive tag (soft delete)
router.patch("/tags/:id/archive", authenticateToken, community.archiveTag);
router.patch("/tags/:id/unarchive", authenticateToken, community.unarchiveTag);

// Get tag statistics
router.get("/tags/:tagId/statistics", authenticateToken, community.getTagStatistics);

// Parent selection route (must be before :id routes)
router.get("/parent-selection", authenticateToken, community.getCommunitiesForParentSelection);

// Community detail routes
router
  .route("/:id")
  .get(authenticateToken, community.getCommunityById)
  .patch(authenticateToken, community.updateCommunityById)
  .delete(authenticateToken, community.deleteCommunityById);

// Get tags for a community
router.get("/:id/tags", authenticateToken, community.getCommunityTags);

// Community subscription routes
router.get("/:id/subscription", authenticateTokenPartner, community.getCommunitySubscriptions);
router.get("/:id/users", authenticateToken, community.getCommunityUsers);
router.post("/:id/subscriptions", authenticateToken, community.manageSubscriptions);

// Community member role management routes
router.put("/:communityId/members/:userId/role", authenticateToken, community.manageMemberRole);
router.get("/:communityId/members", authenticateToken, community.getCommunityMembers);

// Get current user's role in a community
router.get("/:communityId/my-role", authenticateToken, community.getCurrentUserRole);

// Community content routes
router.get("/:id/people", authenticateToken, community.getPeople);
router.get("/:id/activities",  community.getCommunityActivities);
router.get("/:communityId/questions", authenticateToken, community.getCommunityQuestions);
router.get("/:id/session", authenticateToken, community.getSessions);
router.get('/:id/userss',  community.getCommunityUsershysubscription  );




//========================Partner  community Routes========================//
router.get("/partner/communities", community.getPartnerCommunities);


module.exports = router;
