const requests = require("./requests.controller")
const express = require("express");
const router = express.Router();

// ===== GET ROUTES =====

// Get all requests (admin) - both pending and approved
router.get("/", requests.getAllRequests);

// Get all pending requests (for admin/community managers)
router.get("/pending", requests.getAllPendingRequests);

// Get all approved requests (for admin)
router.get("/approved", requests.getAllApprovedRequests);

// Get requests by user ID (all requests)
router.get("/user/:userId", requests.getRequests);

// Get pending requests by user ID
router.get("/user/:userId/pending", requests.getPendingRequestsByUser);

// Get approved requests by user ID
router.get("/user/:userId/approved", requests.getApprovedRequestsByUser);

// Get all requests by user ID (both pending and approved)
router.get("/user/:userId/all", requests.getAllRequestsByUser);

// Get requests by community ID (pending only)
router.get("/community/:communityId", requests.getRequestsByCommunity);

// Get approved requests by community ID
router.get("/community/:communityId/approved", requests.getApprovedRequestsByCommunity);

// Get all requests by community ID (both pending and approved)
router.get("/community/:communityId/all", requests.getAllRequestsByCommunity);

// Get requests by community ID for a specific user (community manager)
router.get("/community/:communityId/user/:userId", requests.getRequestsByCommunityForUser);

// Get a single request by ID
router.get("/:requestId", requests.getRequestById);

// ===== POST ROUTES =====

// Create a new request
router.post("/", requests.createRequest);

// ===== PUT ROUTES =====

// Respond to a specific request (batch)
router.put("/respond", requests.respondRequest);

// Update request status (approve/reject single request)
router.put("/:requestId/status", requests.updateRequestStatus);

module.exports = router