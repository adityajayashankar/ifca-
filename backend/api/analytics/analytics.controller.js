// SESSION
// get number of people who bought the session
// number of rsvp
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  findSessionByIdHelper,
  findSessionSlotByIdHelper,
} = require("../services/getById");

const getNumPeopleSession = async (req, res, next) => {
  try {
    let { sessionId } = req.params;
    sessionId = parseInt(sessionId);
    await findSessionByIdHelper(sessionId);
    const numPeople = await prisma.attendance.aggregate({
      where: {
        sessionId,
      },
      _count: {
        userId: true,
      },
    });
    return res.status(200).json({ numPeople });
  } catch (error) {
    console.log(
      `Error occured while getting num people_session @ ${__filename}`
    );
    console.log(error);
    next(error);
  }
};

const getNumPeopleSessionRSVP = async (req, res, next) => {
  try {
    let { sessionId } = req.params;
    sessionId = parseInt(sessionId);
    await findSessionByIdHelper(sessionId);
    const numPeople = await prisma.attendance.aggregate({
      where: {
        sessionId,
      },
      _count: {
        rsvp: true,
      },
    });
    return res.status(200).json({ numPeople });
  } catch (error) {
    console.log(
      `Error occured while getting num people_session RSVP @ ${__filename}`
    );
    console.log(error);
    next(error);
  }
};

const getPeopleSession = async (req, res, next) => {
  try {
    let { sessionId } = req.params;
    sessionId = parseInt(sessionId);
    await findSessionByIdHelper(sessionId);
    const people = await prisma.attendance.findMany({
      where: {
        sessionId,
      },
      include: {
        user: true,
      },
    });
    return res.status(200).json({ people });
  } catch (error) {
    console.log(
      `Error occured while getting num people_session @ ${__filename}`
    );
    console.log(error);
    next(error);
  }
};

const getNumPeopleSessionSlot = async (req, res, next) => {
  try {
    let { slotId } = req.params;
    slotId = parseInt(slotId);
    await findSessionSlotByIdHelper(slotId);
    const numPeople = await prisma.attendance.aggregate({
      where: {
        sessionSlotId: slotId,
      },
      _count: {
        userId: true,
      },
    });
    return res.status(200).json({ numPeople });
  } catch (error) {
    console.log(`Error occured while getting num people_slot @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

const getNumPeopleSessionSlotRSVP = async (req, res, next) => {
  try {
    let { slotId } = req.params;
    slotId = parseInt(slotId);
    await findSessionSlotByIdHelper(slotId);
    const numPeople = await prisma.attendance.aggregate({
      where: {
        sessionSlotId: slotId,
      },
      _count: {
        rsvp: true,
      },
    });
    return res.status(200).json({ numPeople });
  } catch (error) {
    console.log(
      `Error occured while getting num people_slot RSVP @ ${__filename}`
    );
    console.log(error);
    next(error);
  }
};

const getPeopleSessionSlot = async (req, res, next) => {
  try {
    let { slotId } = req.params;
    slotId = parseInt(slotId);
    await findSessionSlotByIdHelper(slotId);
    const people = await prisma.attendance.findMany({
      where: {
        sessionSlotId: slotId,
      },
      include: {
        user: true,
      },
    });
    return res.status(200).json({ people });
  } catch (error) {
    console.log(`Error occured while getting num people_slot @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

const getNumPeopleSessionSlotAgg = async (req, res, next) => {
  try {
    let { sessionId } = req.params;
    sessionId = parseInt(sessionId);
    const session = await findSessionByIdHelper(sessionId);

    let summary = {};
    let today = new Date();
    session.SessionSlot.forEach((item, index) => {
      summary[item.id] = {
        index: index + 1,
        startTime: item.startTime,
        endTime: item.endTime,
      };
    });

    if (Object.keys(summary).length === 0) {
      return res.status(200).json({ summary: [] });
    }

    const numPeople = await prisma.attendance.groupBy({
      by: ["sessionSlotId"],
      where: {
        sessionId,
      },
      _count: {
        userId: true,
      },
    });

    numPeople.forEach((item) => {
      if (summary[item.sessionSlotId]) {
        summary[item.sessionSlotId] = {
          ...summary[item.sessionSlotId],
          numPeople: item._count.userId,
        };
      }
    });

    const numPeopleRSVP = await prisma.attendance.groupBy({
      by: ["sessionSlotId"],
      where: {
        sessionId,
        rsvp: true,
      },
      _count: {
        userId: true,
      },
    });

    numPeopleRSVP.forEach((item) => {
      if (summary[item.sessionSlotId]) {
        summary[item.sessionSlotId] = {
          ...summary[item.sessionSlotId],
          numPeopleRSVP: item._count.userId,
        };
      }
    });

    return res.status(200).json({ summary: Object.values(summary) });
  } catch (error) {
    console.log(`Error occured while getting num people_slot @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

// USERS --------------------------
const getNumUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.aggregate({
      _count: {
        id: true,
      },
    });
    return res.status(200).json({ users: users._count.id });
  } catch (error) {
    console.log(`Error while fetching num users @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

const getUsersWithTime = async (req, res, next) => {
  try {
    const tempTime = await prisma.user.groupBy({
      by: ["createdAt"],
      _count: {
        id: true,
      },
    });
    let sum = 0;
    const userTime = tempTime
      ?.map(({ createdAt, _count }) => ({
        createdAt,
        count: _count.id,
      }))
      ?.map(({ createdAt, count }) => {
        sum = sum + count;
        return { createdAt, sum };
      });
    return res.status(200).json({ userTime });
  } catch (error) {
    console.log(
      `Error occured while getting data of users with time @${__filename}`
    );
    console.log(error);
    next(error);
  }
};

// SESSION-----------------------------------
const getNumSessions = async (req, res, next) => {
  try {
    const sessions = await prisma.session.aggregate({
      where: {
        isArchived: false,
      },
      _count: {
        id: true,
      },
    });
    return res.status(200).json({ sessions: sessions._count.id });
  } catch (error) {
    console.log(`Error while fetching num sessions @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

const getSessionWithTime = async (req, res, next) => {
  try {
    const tempTime = await prisma.session.groupBy({
      by: ["createdAt"],
      _count: {
        id: true,
      },
    });
    let sum = 0;
    const sessionTime = tempTime
      ?.map(({ createdAt, _count }) => ({
        createdAt,
        count: _count.id,
      }))
      ?.map(({ createdAt, count }) => {
        sum = sum + count;
        return { createdAt, sum };
      });
    return res.status(200).json({ sessionTime });
  } catch (error) {
    console.log(
      `Error occured while getting data of session with time @${__filename}`
    );
    console.log(error);
    next(error);
  }
};

// COMMUNITY -----------------------------------
const getNumCommunity = async (req, res, next) => {
  try {
    const community = await prisma.community.aggregate({
      where: {
        isArchived: false,
      },
      _count: {
        id: true,
      },
    });
    return res.status(200).json({ community: community._count.id });
  } catch (error) {
    console.log(`Error while fetching num users @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

const getCommunityWithTime = async (req, res, next) => {
  try {
    const tempTime = await prisma.community.groupBy({
      by: ["createdAt"],
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    let sum = 0;
    const communityTime = tempTime
      ?.map(({ createdAt, _count }) => ({
        createdAt,
        count: _count.id,
      }))
      ?.map(({ createdAt, count }) => {
        sum = sum + count;
        return { createdAt, sum };
      });
    return res.status(200).json({ communityTime });
  } catch (error) {
    console.log(
      `Error occured while getting data of community with time @${__filename}`
    );
    console.log(error);
    next(error);
  }
};

const getPeopleByCommunity = async (req, res, next) => {
  let { communityId } = req.params;
  communityId = parseInt(communityId);
  try {
    const peopleUnformatted = await prisma.subscription.groupBy({
      by: ["communityId"],
      _count: {
        userId: true,
      },
    });
    const allCommunities = await prisma.community.findMany({});
    let communityMap = {};
    allCommunities?.forEach((item) => {
      communityMap[item.id] = item.title;
    });
    const allPeople = peopleUnformatted
      .map(({ communityId, _count }) => ({
        communityId,
        people: _count.userId,
      }))
      ?.map(({ communityId, people }) => ({
        communityId,
        communityName: communityMap[communityId],
        people,
      }));
    return res.status(200).json({ people: allPeople });
  } catch (error) {
    console.log(
      `Error occured while getting community with time @${__filename}`
    );
    console.log(error);
    next(error);
  }
};

// REVENUE --------------------------------------
const getTotalRevenue = async (req, res, next) => {
  try {
    const revenue = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
    });
    return res.status(200).json({ revenue: revenue._sum.amount });
  } catch (error) {
    console.log(`Error occured while getting total revenue @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

const getTotalRevenueWithTime = async (req, res, next) => {
  try {
    const revenue = await prisma.transaction.groupBy({
      by: ["createdAt"],
      _sum: {
        amount: true,
      },
    });
    let sum = 0;
    const revenueTime = revenue
      ?.map(({ createdAt, _sum }) => ({
        createdAt,
        total: _sum.amount,
      }))
      ?.map(({ createdAt, total }) => {
        sum = sum + total;
        return { createdAt, sum };
      });
    return res.status(200).json({ revenueTime });
  } catch (error) {
    console.log(`Error occured while getting total revenue @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

// REVENUE BY SESSION
const getRevenueBySession = async (req, res, next) => {
  let { sessionId } = req.params;
  sessionId = parseInt(sessionId);
  try {
    await findSessionByIdHelper(sessionId);
    const revenue = await prisma.attendance.findMany({
      where: {
        sessionId,
      },
      include: {
        transaction: true,
      },
    });
    let totalRev = 0;
    revenue.forEach((item) => {
      totalRev += item.transaction.amount;
    });
    return res.status(200).json({ revenue: totalRev });
  } catch (error) {
    console.log(
      `Error occured while getting total revenue by session @ ${__filename}`
    );
    console.log(error);
    next(error);
  }
};

// Get active communities count
const getActiveCommunitiesCount = async (req, res) => {
  try {
    const count = await prisma.community.count({
      where: {
        isArchived: false,
        isApproved: true
      }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get active sessions count
const getActiveSessionsCount = async (req, res) => {
  try {
    const count = await prisma.session.count({
      where: {
        isActive: true,
        isArchived: false
      }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get total experts count
const getTotalExpertsCount = async (req, res) => {
  try {
    const count = await prisma.expert.count({
      where: {
        isActive: true
      }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get total active users count
const getTotalActiveUsersCount = async (req, res) => {
  try {
    const count = await prisma.user.count({
      where: {
        // Users who have logged in within the last 30 days
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all analytics metrics in one endpoint
const getAllAnalytics = async (req, res) => {
  try {
    // Date helpers for month ranges
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Helper to calculate percent change
    const calcPercent = (thisMonth, lastMonth) => {
      if (lastMonth === 0) return thisMonth === 0 ? 0 : 100;
      return ((thisMonth - lastMonth) / lastMonth) * 100;
    };

    // USERS
    const usersThisMonth = await prisma.user.count({
      where: { createdAt: { gte: startOfThisMonth } }
    });
    const usersLastMonth = await prisma.user.count({
      where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } }
    });
    const usersPercent = calcPercent(usersThisMonth, usersLastMonth);

    // COMMUNITIES
    const communitiesThisMonth = await prisma.community.count({
      where: { createdAt: { gte: startOfThisMonth }, isArchived: false }
    });
    const communitiesLastMonth = await prisma.community.count({
      where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth }, isArchived: false }
    });
    const communitiesPercent = calcPercent(communitiesThisMonth, communitiesLastMonth);

    // SESSIONS
    const sessionsThisMonth = await prisma.session.count({
      where: { createdAt: { gte: startOfThisMonth }, isArchived: false }
    });
    const sessionsLastMonth = await prisma.session.count({
      where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth }, isArchived: false }
    });
    const sessionsPercent = calcPercent(sessionsThisMonth, sessionsLastMonth);

    // REQUESTS
    const requestsThisMonth = await prisma.requests.count({
      where: { createdAt: { gte: startOfThisMonth } }
    });
    const requestsLastMonth = await prisma.requests.count({
      where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } }
    });
    const requestsPercent = calcPercent(requestsThisMonth, requestsLastMonth);

    // Get active communities count
    const activeCommunities = await prisma.community.count({
      where: {
        isArchived: false,
        isApproved: true
      }
    });

    // Get active sessions count
    const activeSessions = await prisma.session.count({
      where: {
        isActive: true,
        isArchived: false
      }
    });

    // Get total experts count
    const totalExperts = await prisma.expert.count({
      where: {
        isActive: true
      }
    });

    // Get total active users count (last 30 days)
    const activeUsers = await prisma.user.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Get total revenue
    const revenue = await prisma.transaction.aggregate({
      _sum: {
        amount: true
      }
    });

    // Get total communities count
    const totalCommunities = await prisma.community.count({
      where: {
        isArchived: false
      }
    });

    // Get total users count
    const totalUsers = await prisma.user.count();

    // Get total sessions count
    const totalSessions = await prisma.session.count({
      where: {
        isArchived: false
      }
    });
    // Get total posts count
    const totalPosts = await prisma.post.count({
      where: {
        isArchived: false
      }
    });

   
const totalPendingRequests = await prisma.requests.count({
  where: { status: false }
});


    res.json({
      communities: {
        active: activeCommunities,
        total: totalCommunities,
        thisMonth: communitiesThisMonth,
        lastMonth: communitiesLastMonth,
        percentChange: communitiesPercent
      },
      sessions: {
        active: activeSessions,
        total: totalSessions,
        thisMonth: sessionsThisMonth,
        lastMonth: sessionsLastMonth,
        percentChange: sessionsPercent
      },
      experts: {
        total: totalExperts
      },
      users: {
        active: activeUsers,
        total: totalUsers,
        thisMonth: usersThisMonth,
        lastMonth: usersLastMonth,
        percentChange: usersPercent
      },
      requests: {
        thisMonth: requestsThisMonth,
        lastMonth: requestsLastMonth,
        percentChange: requestsPercent,
        totalPending: totalPendingRequests
      },
      revenue: {
        total: revenue._sum.amount || 0
      },
      posts: {
        total: totalPosts
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get recent activities (posts, communities, sessions, requests)
const getRecentActivities = async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const end = endDate ? new Date(endDate) : now;
    const take = Math.min(Number(limit) || 10, 50);

    // Fetch activities from different tables
    const [users, experts, communities, sessions, requests, forms, competitions] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, createdAt: true, name: true },
      }),
      prisma.expert.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, createdAt: true, name: true },
      }),
      prisma.community.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, createdAt: true, title: true },
      }),
      prisma.session.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, createdAt: true, title: true },
      }),
      prisma.requests.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, createdAt: true, name: true },
      }),
      prisma.form.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, createdAt: true, formName: true },
      }),
      prisma.competition.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, createdAt: true, title: true },
      }),
    ]);

    // Map to unified activity format
    const activities = [
      ...users.map(u => ({ type: 'user', title: u.name ? `New user registered: ${u.name}` : 'New user registered', timestamp: u.createdAt })),
      ...experts.map(e => ({ type: 'expert', title: e.name ? `New expert registered: ${e.name}` : 'New expert registered', timestamp: e.createdAt })),
      ...communities.map(c => ({ type: 'community', title: c.title ? `New community created: ${c.title}` : 'New community created', timestamp: c.createdAt })),
      ...sessions.map(s => ({ type: 'session', title: s.title ? `New session scheduled: ${s.title}` : 'New session scheduled', timestamp: s.createdAt })),
      ...requests.map(r => ({ type: 'request', title: r.name ? `New request received: ${r.name}` : 'New request received', timestamp: r.createdAt })),
      ...forms.map(f => ({ type: 'form', title: f.formName ? `New form created: ${f.formName}` : 'New form created', timestamp: f.createdAt })),
      ...competitions.map(cmp => ({ type: 'competition', title: cmp.title ? `New competition created: ${cmp.title}` : 'New competition created', timestamp: cmp.createdAt })),
    ];

    // Sort by timestamp descending and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const topActivities = activities.slice(0, take);

    res.json({ activities: topActivities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getAllPartnerAnalytics = async (req, res) => {
  try {
    const { partnerId } = req.query;
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    let partnerUserIds = [];

    if (partnerId) {
      const partner = await prisma.partner.findUnique({
        where: { id: parseInt(partnerId) },
        select: { unifiedUserId: true }
      });
      if (!partner || !partner.unifiedUserId) {
        return res.status(404).json({ error: "Partner not found or no linked unifiedUserId" });
      }
      partnerUserIds = [partner.unifiedUserId];
    } else {
      const allPartners = await prisma.partner.findMany({
        select: { unifiedUserId: true }
      });
      partnerUserIds = allPartners
        .map(p => p.unifiedUserId)
        .filter(id => typeof id === 'number' && id > 0);
    }

    const [communitiesThisMonth, communitiesLastMonth, totalCommunities] = await Promise.all([
      prisma.community.count({
        where: {
          creatorId: { in: partnerUserIds },
          isArchived: false,
          createdAt: { gte: startOfThisMonth }
        }
      }),
      prisma.community.count({
        where: {
          creatorId: { in: partnerUserIds },
          isArchived: false,
          createdAt: { gte: startOfLastMonth, lt: startOfThisMonth }
        }
      }),
      prisma.community.count({
        where: {
          creatorId: { in: partnerUserIds },
          isArchived: false
        }
      })
    ]);

    const [sessionsThisMonth, sessionsLastMonth, totalSessions] = await Promise.all([
      prisma.session.count({
        where: {
          creatorId: { in: partnerUserIds },
          isArchived: false,
          createdAt: { gte: startOfThisMonth }
        }
      }),
      prisma.session.count({
        where: {
          creatorId: { in: partnerUserIds },
          isArchived: false,
          createdAt: { gte: startOfLastMonth, lt: startOfThisMonth }
        }
      }),
      prisma.session.count({
        where: {
          creatorId: { in: partnerUserIds },
          isArchived: false
        }
      })
    ]);

    const totalPartners = partnerId ? 1 : await prisma.partner.count();

    res.json({
      communities: {
        total: totalCommunities,
        thisMonth: communitiesThisMonth,
        lastMonth: communitiesLastMonth
      },
      sessions: {
        total: totalSessions,
        thisMonth: sessionsThisMonth,
        lastMonth: sessionsLastMonth
      },
      partners: {
        total: totalPartners
      }
    });
  } catch (error) {
    console.error("Error fetching Partner Analytics:", error);
    res.status(500).json({ error: error.message });
  }
};

const getPartnerRecentActivities = async (req, res) => {
  try {
    const { partnerId, startDate, endDate, limit } = req.query;
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const end = endDate ? new Date(endDate) : now;
    const take = Math.min(Number(limit) || 10, 50);

    let partnerUserIds = [];
    if (partnerId) {
      const partner = await prisma.partner.findUnique({
        where: { id: parseInt(partnerId) },
        select: { unifiedUserId: true }
      });
      if (!partner || !partner.unifiedUserId) {
        return res.status(404).json({ error: "Partner not found or no linked unifiedUserId" });
      }
      partnerUserIds = [partner.unifiedUserId];
    } else {
      const allPartners = await prisma.partner.findMany({
        select: { unifiedUserId: true }
      });
      partnerUserIds = allPartners
        .map(p => p.unifiedUserId)
        .filter(id => typeof id === 'number' && id > 0);
    }

    const [communities, sessions] = await Promise.all([
      prisma.community.findMany({
        where: {
          creatorId: { in: partnerUserIds },
          createdAt: { gte: start, lte: end }
        },
        select: { id: true, createdAt: true, title: true }
      }),
      prisma.session.findMany({
        where: {
          creatorId: { in: partnerUserIds },
          createdAt: { gte: start, lte: end }
        },
        select: { id: true, createdAt: true, title: true }
      })
    ]);

    const activities = [
      ...communities.map(c => ({ type: 'community', title: c.title, timestamp: c.createdAt })),
      ...sessions.map(s => ({ type: 'session', title: s.title, timestamp: s.createdAt }))
    ];

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ activities: activities.slice(0, take) });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({ error: error.message });
  }
};









module.exports = {
  getNumPeopleSession,
  getPeopleSession,
  getNumPeopleSessionRSVP,
  getNumPeopleSessionSlot,
  getPeopleSessionSlot,
  getNumPeopleSessionSlotRSVP,
  getNumPeopleSessionSlotAgg,
  getNumSessions,
  getNumUsers,
  getUsersWithTime,
  getNumCommunity,
  getCommunityWithTime,
  getSessionWithTime,
  getPeopleByCommunity,
  getTotalRevenue,
  getRevenueBySession,
  getTotalRevenueWithTime,
  getActiveCommunitiesCount,
  getActiveSessionsCount,
  getTotalExpertsCount,
  getTotalActiveUsersCount,
  getAllAnalytics,
  getRecentActivities,
  getAllPartnerAnalytics,
  getPartnerRecentActivities,
};
