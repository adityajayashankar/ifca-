const router = require("express").Router();
const {
    createHuddle,
    getHuddleById,
    updateHuddle,
    deleteHuddle,
    launchHuddle,
    endHuddle,
    joinHuddle,
    leaveHuddle,
    getHuddleAttendees,
    getHuddleActivities,
    getCommunityHuddles,
    getUserUpcomingHuddles,
    getUserActiveHuddles,
    getAllHuddles,
    generateHuddleSummary,
    getHuddleStats,
    getCommunityHuddleLeaderboard,
    getUserHuddleStreaks,
    acceptInvitation,
    declineInvitation,
    getUserInvitations,
    getHuddleToken,
    getCurrentActivity,
    setCurrentActivity
} = require("./huddle.controller");
const {
    submitVote,
    submitQuizAnswers,
    regenerateActivity,
    getActivityStatus,
    getActivityDetails,
    markActivityComplete,
    getUserActivityCompletions,
    toggleActivityComplete,
    updateVideoPlaybackState,
    getVideoPlaybackState,
    addDiscussionMessage,
    getDiscussionMessages,
    getDebate,
    addDebateArgument,
    getContest,
    submitContestEntry,
    updateGuidedSessionState,
    getGuidedSessionState,
    updateSlideshowState,
    getSlideshowState
} = require("./activity.controller");

// ==================== HUDDLE CRUD ====================

// Create a new huddle
router.route('/create').post(createHuddle);

// ==================== HUDDLE MANAGEMENT (specific routes BEFORE /:id) ====================

// Get all huddles (for admin)
router.route('/all').get(getAllHuddles);

// Get all huddles for a community
router.route('/community/:communityId').get(getCommunityHuddles);

// Get community huddle leaderboard
router.route('/community/:communityId/leaderboard').get(getCommunityHuddleLeaderboard);

// Get user's upcoming huddles
router.route('/user/:userId/upcoming').get(getUserUpcomingHuddles);

// Get user's active (live) huddles
router.route('/user/:userId/active').get(getUserActiveHuddles);

// Get user's huddle streaks
router.route('/user/:userId/streaks').get(getUserHuddleStreaks);

// Get user's huddle invitations
router.route('/user/:userId/invitations').get(getUserInvitations);

// ==================== HUDDLE EXECUTION (/:id/* routes) ====================

// Launch/Start a huddle
router.route('/:id/launch').post(launchHuddle);

// End a huddle
router.route('/:id/end').post(endHuddle);

// Join a huddle
router.route('/:id/join').post(joinHuddle);

// Leave a huddle
router.route('/:id/leave').post(leaveHuddle);

// Accept invitation
router.route('/:id/invitation/accept').post(acceptInvitation);

// Decline invitation
router.route('/:id/invitation/decline').post(declineInvitation);

// Get huddle attendees
router.route('/:id/attendees').get(getHuddleAttendees);

// Get huddle activities
router.route('/:id/activities').get(getHuddleActivities);

// Generate AI summary for huddle
router.route('/:id/generate-summary').post(generateHuddleSummary);

// Get huddle statistics
router.route('/:id/stats').get(getHuddleStats);

// Get 100ms token for huddle
router.route('/:id/token').post(getHuddleToken);

// Get current activity index
router.route('/:id/current-activity').get(getCurrentActivity);

// Set current activity index (host only)
router.route('/:id/current-activity').post(setCurrentActivity);

// ==================== ACTIVITY ENDPOINTS ====================

// Activity routes (must be before /:id routes)
router.route('/activity/:activityId/vote').post(submitVote);
router.route('/activity/:activityId/quiz/submit').post(submitQuizAnswers);
router.route('/activity/:activityId/regenerate').post(regenerateActivity);
router.route('/activity/:activityId/status').get(getActivityStatus);
router.route('/activity/:activityId/complete').post(markActivityComplete);
router.route('/activity/:activityId/toggle-complete').post(toggleActivityComplete);
router.route('/activity/:activityId/video-state').get(getVideoPlaybackState);
router.route('/activity/:activityId/video-state').post(updateVideoPlaybackState);
router.route('/activity/:activityId/discussion/message').post(addDiscussionMessage);
router.route('/activity/:activityId/discussion/messages').get(getDiscussionMessages);
router.route('/activity/:activityId/debate').get(getDebate);
router.route('/activity/:activityId/debate/argument').post(addDebateArgument);
router.route('/activity/:activityId/contest').get(getContest);
router.route('/activity/:activityId/contest/entry').post(submitContestEntry);
router.route('/activity/:activityId/guided-session-state').get(getGuidedSessionState);
router.route('/activity/:activityId/guided-session-state').post(updateGuidedSessionState);
router.route('/activity/:activityId/slideshow-state').get(getSlideshowState);
router.route('/activity/:activityId/slideshow-state').post(updateSlideshowState);
router.route('/activity/:activityId').get(getActivityDetails);

// User activity completions
router.route('/:huddleId/user/:userId/completions').get(getUserActivityCompletions);

// ==================== HUDDLE CRUD (catch-all /:id MUST be last) ====================

// Get, update, delete huddle by ID
router.route('/:id')
    .get(getHuddleById)
    .put(updateHuddle)
    .delete(deleteHuddle);

module.exports = router;
