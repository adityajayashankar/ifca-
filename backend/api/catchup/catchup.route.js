const { createCatchUp, verifyCommunityMember, verifyCommunityHavingCatchup, getCatchupByCommunity, leaveCatchup, returnRoomId, verifyLeader, getUserActiveCatchups, createScheduledCatchUp, getScheduledCatchups, startScheduledCatchUp, updateCatchupRoom, createTestLiveCatchup, debugCatchupState, joinCatchUp, leaveCatchUp, getCatchupAttendees, joinCatchupOnEnter, getCatchupStatus } = require("./catchup.controller")

const router = require("express").Router()

// Specific routes first (no parameters)
router.route('/join-on-enter').post(joinCatchupOnEnter)
router.route('/join').post(joinCatchUp)
router.route('/leave').post(leaveCatchUp)
router.route('/create').post(createCatchUp)
router.route('/test/create-live').post(createTestLiveCatchup)

// Scheduled routes
router.route('/scheduled/create').post(createScheduledCatchUp)
router.route('/scheduled/start/:scheduledCatchupId').post(startScheduledCatchUp)

// Routes with specific patterns
router.route('/verifyMember/:comId/:userId').get(verifyCommunityMember)
router.route('/community/:comId').get(verifyCommunityHavingCatchup)
router.route('/leave/:roomId/:comId/:userId').patch(verifyLeader,leaveCatchup)
router.route('/room/:comId/:email').get(verifyCommunityMember,returnRoomId)
router.route('/user/:userId/active-catchups').get(getUserActiveCatchups)
router.route('/debug/:communityId').get(debugCatchupState)
router.route('/status/:roomId/:communityId').get(getCatchupStatus)

// Parameterized routes last
router.route('/scheduled/:communityId').get(getScheduledCatchups)
router.route('/:catchupId/room').patch(updateCatchupRoom)
router.route('/:catchupId/attendees').get(getCatchupAttendees)
router.route('/:roomId').get(getCatchupByCommunity)

module.exports = router