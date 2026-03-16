const express = require('express');
const { sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  getPendingRequests,
  getUserConnections,
  getConnectionStatus,
  getProfileDetails,
  updateConnectionPrivacy,
  updateFollowStatus,
  updateUserPrivacy,
  getConnectionVisibility, 
  getPrivacySettings,
  getSelectedViewers,
  getNetworkConnections,
  syncAllUsersFollowersFollowing,
  debugUserArrays,
  testConnectionStatus,
  debugConnectionCategorization,
  debugPendingRequests,
  testPendingRequests,
  createTestIncomingRequests} = require('./connection.controller');
const { authenticateToken } = require('../../middleware/authenticateToken');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Send a connection request to another user
router.post('/send-request', sendConnectionRequest);

// Accept an incoming connection request
router.put('/accept/:connectionId', acceptConnection);

// Reject/cancel a connection request
router.delete('/:connectionId', rejectConnection);

// Get all pending incoming connection requests for a user
router.get('/:userId/pending-requests', getPendingRequests);

// Get all connections (following and followers) for a user
router.get('/:userId/connections', getUserConnections);

// Get bi-directional connection status between two users
router.get('/status/:userId1/:userId2', getConnectionStatus);

// Get user profile with connection-based visibility
router.get('/profile/:userId', getProfileDetails);

// Update connection privacy settings
router.put('/privacy/:userId', updateConnectionPrivacy);

// Update follow status
router.put('/follow-status', updateFollowStatus);

// Get user privacy settings
router.get('/user/:userId/privacy', getPrivacySettings);

// Update user privacy settings
router.put('/user/:userId/privacy', updateUserPrivacy);

// Get connection visibility settings
router.get('/visibility/:connectionId', getConnectionVisibility);

// Get selected viewers
router.get('/selected-viewers/:userId', getSelectedViewers);

// Get network connections
router.get('/network-connections/:userId', getNetworkConnections);

// Sync all users' followers/following arrays (admin utility)
router.post('/sync-followers-following', syncAllUsersFollowersFollowing);

// Debug user arrays
router.get('/debug-user-arrays/:userId', debugUserArrays);

// Test connection status logic
router.get('/test-connection-status/:userId', testConnectionStatus);

// Debug connection categorization
router.get('/debug-categorization/:userId', debugConnectionCategorization);

// Debug pending requests
router.get('/debug-pending-requests/:userId', debugPendingRequests);

// Test pending requests
router.get('/test-pending-requests/:userId', testPendingRequests);

// Create test incoming requests
router.post('/create-test-incoming/:userId', createTestIncomingRequests);

module.exports = router; 