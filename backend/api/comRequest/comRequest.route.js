const requests = require("../requests/requests.controller")
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middleware/authenticateToken");

// ===== GET ROUTES =====

// Get requests by community ID (pending only)
router.get("/:communityId", authenticateToken, requests.getRequestsByCommunity);

// Get approved requests by community ID
router.get("/:communityId/approved", authenticateToken, requests.getApprovedRequestsByCommunity);

// Get all requests by community ID (both pending and approved)
router.get("/:communityId/all", authenticateToken, requests.getAllRequestsByCommunity);

// Get requests by community ID for a specific user (community manager)
router.get("/:communityId/user/:userId", authenticateToken, requests.getRequestsByCommunityForUser);

// ===== POST ROUTES =====

// Create a new request for a community
router.post("/", authenticateToken, requests.createRequest);

// ===== PUT ROUTES =====

// Respond to a specific request (batch)
router.put("/respond", authenticateToken, requests.respondRequest);

// Update request status (approve/reject single request)
router.put("/:requestId/status", authenticateToken, requests.updateRequestStatus);

module.exports = router 