const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// search communities by tag
exports.getCommunityByTagHelper = async function (tag) {
  const communities = await prisma.community.findMany({
    where: {
      OR: [
        {
          title: {
            contains: tag,
            mode: "insensitive",
          },
        },
        {
          desc: {
            contains: tag,
            mode: "insensitive",
          },
        },
        {
          // Search by associated tags
          tags: {
            some: {
              tag: {
                name: {
                  contains: tag,
                  mode: "insensitive",
                }
              }
            }
          }
        }
      ],
      isArchived: false,
      isApproved: true,
    },
    include: {
      tags: {
        include: {
          tag: true
        }
      },
      creator: {
        include: {
          user: true,
          expert: true,
          partner: true,
          admin: true
        }
      },
      subscriptions: {
        include: {
          unifiedUser: true
        }
      }
    },
    orderBy: {
      title: 'asc'
    }
  });

  return communities;
};

exports.getCommunitySubscriptionsHelper = function (id) {
  let allSubscriptions = prisma.subscription.findMany({
    where: { communityId: parseInt(id) },
    include: {
      unifiedUser: true,
    },
  });
  return allSubscriptions;
};

exports.getCommunitySubsStdForm = function (allSubscriptions) {
  let subscriptions = [],
    expiredSubscriptions = [];
  let today = new Date();
  allSubscriptions.forEach((item) => {
    if (new Date(item.expiresAt) >= today) {
      subscriptions.push(item);
    } else {
      expiredSubscriptions.push(item);
    }
  });

  return { subscriptions, expiredSubscriptions };
};

exports.getUserCommunitiesHelper = function (id) {
  const today = new Date();

  return new Promise((resolve, reject) => {
    prisma.subscription
      .findMany({
        where: {
          unifiedUserId: parseInt(id),
        },
        include: {
          community: {
            include: {
              subscriptions: true,
              SessionTier: {
                include: {
                  sessionSlot: {
                    include: {
                      session: true,
                      speakers: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
      .then((subscription) => {
        resolve(
          subscription.map((item) => ({
            ...item.community,
            category: item.category,
            expiresAt: item.expiresAt,
            subscriptionId: item.id,
          }))
        );
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.getExpertCommunitiesHelper = function (id) {
  const today = new Date();

  return new Promise((resolve, reject) => {
    prisma.subscription
      .findMany({
        where: {
          unifiedUserId: parseInt(id),
          expiresAt: {
            gte: today,
          },
        },
        include: {
          community: true,
        },
      })
      .then((subscription) => {
        resolve(
          subscription.map((item) => ({
            ...item.community,
            category: item.category,
            expiresAt: item.expiresAt,
            subscriptionId: item.id,
          }))
        );
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.getCommunitySessionsHelper = function (id) {
  return new Promise((resolve, reject) => {
    prisma.community
      .findUnique({
        where: { id: parseInt(id) },
        include: {
          SessionTier: {
            include: {
              sessionSlot: { include: { session: true, speakers: true } },
            },
          },
        },
      })
      .then((college) => {
        if (!college)
          reject(
            createCustomError({ status: 404, message: "Community not found" })
          );
        let sessions = {};
        let completedSessions = {};
        let today = new Date();
        college.SessionTier.forEach((tier) => {
          if (new Date(tier.sessionSlot.endTime) >= today) {
            let obj = {
              session: JSON.parse(JSON.stringify(tier.sessionSlot.session)),
            };
            delete tier.sessionSlot.session;
            if (sessions[tier.sessionSlot.sessionId]) {
              sessions[tier.sessionSlot.sessionId].sessionSlot.push(
                tier.sessionSlot
              );
            } else {
              sessions[tier.sessionSlot.sessionId] = {
                ...obj,
                sessionSlot: [tier.sessionSlot],
              };
            }
          } else {
            let obj = {
              session: JSON.parse(JSON.stringify(tier.sessionSlot.session)),
            };
            delete tier.sessionSlot.session;
            if (completedSessions[tier.sessionSlot.sessionId]) {
              completedSessions[tier.sessionSlot.sessionId].sessionSlot.push(
                tier.sessionSlot
              );
            } else {
              completedSessions[tier.sessionSlot.sessionId] = {
                ...obj,
                sessionSlot: [tier.sessionSlot],
              };
            }
          }
        });
        // sessions:[{session,sessionSlot}]
        let finalSessions = Object.values(sessions).map(
          ({ session, sessionSlot }) => ({
            ...session,
            SessionSlot: sessionSlot,
          })
        );
        let finalCompletedSessions = Object.values(completedSessions).map(
          ({ session, sessionSlot }) => ({
            ...session,
            SessionSlot: sessionSlot,
          })
        );
        resolve({
          sessions: finalSessions,
          completedSessions: finalCompletedSessions,
        });
      })
      .catch((err) => {
        reject(err);
      });
  });
};
