const { get } = require("../../services/email/config/email.config");
const {

  getActiveCommunitiesCount,
  getActiveSessionsCount,
  getTotalExpertsCount,
  getTotalActiveUsersCount,
  getAllAnalytics,
  getNumSessions,
  getSessionWithTime,
  getPeopleSession,
  getNumPeopleSessionSlotAgg,
  getNumUsers,
  getUsersWithTime,
  getNumCommunity,
  getCommunityWithTime,
  getPeopleByCommunity,
  getTotalRevenue,
  getTotalRevenueWithTime,
  getRevenueBySession,
  getNumPeopleSession,
  getNumPeopleSessionRSVP,
  getPeopleSessionSlot,
  getNumPeopleSessionSlot,
  getNumPeopleSessionSlotRSVP,
  getAllPartnerAnalytics,
  getPartnerRecentActivities,
} = require("./analytics.controller");

const router = require("express").Router();

// SESSION --------------------------------------------------
router.get("/session/", getNumSessions);
// number of sessions wrt time
router.get("/session/time", getSessionWithTime);
router.get("/session/:sessionId/people", getPeopleSession);
router.get("/session/:sessionId/people/summary", getNumPeopleSessionSlotAgg);

// overall
// USERS  --------------------------------------------------
// number of users
// number of users wrt time
router.get("/users", getNumUsers);
router.get("/users/time", getUsersWithTime);
// number of communities
// COMMUNITY --------------------------------------------------
router.get("/community", getNumCommunity);
router.get("/community/time", getCommunityWithTime);
router.get("/community/people", getPeopleByCommunity);

// revenue ------------------------------------
router.get("/revenue", getTotalRevenue);
router.get("/revenue/time", getTotalRevenueWithTime);
router.get("/revenue/session/:sessionId", getRevenueBySession);

// WASTE ENDPOINTS ----------------------------------------
router.get("/session/:sessionId/people/num", getNumPeopleSession);
router.get("/session/:sessionId/people/num/rsvp", getNumPeopleSessionRSVP);

router.get("/slot/:slotId/people", getPeopleSessionSlot);
router.get("/slot/:slotId/people/num", getNumPeopleSessionSlot);
router.get("/slot/:slotId/people/num/rsvp", getNumPeopleSessionSlotRSVP);

// New Analytics Endpoints
router.get("/communities/active", getActiveCommunitiesCount);
router.get("/sessions/active", getActiveSessionsCount);
router.get("/experts/total", getTotalExpertsCount);
router.get("/users/active", getTotalActiveUsersCount);

// Combined Analytics Endpoint
router.get("/dashboard", getAllAnalytics);

// Recent Activities Endpoint
router.get("/recent-activities", require("./analytics.controller").getRecentActivities);

router.get("/partner/dashboard",getAllPartnerAnalytics)

router.get("/partner/recent-activities", getPartnerRecentActivities);


module.exports = router;
