const { getCommunityByTagHelper } = require("../community/community");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getSessionByTagHelper } = require("../session/session");
const { getPostByTagHelper } = require("../thread/thread");
const { getExpertByTagHelper } = require("../expert/expert");
const { authenticateToken } = require("../../middleware/authenticateToken");

const router = require("express").Router();

// Input validation middleware
const validateSearchQuery = (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      status: 400,
      message: "Search query is required"
    });
  }

  if (typeof query !== 'string') {
    return res.status(400).json({
      status: 400,
      message: "Search query must be a string"
    });
  }

  // if (query.trim().length < 2) {
  //   return res.status(400).json({
  //     status: 400,
  //     message: "Search query must be at least 2 characters long"
  //   });
  // }

  // Sanitize the query
  req.query.query = query.trim();
  next();
};

router.get("/", authenticateToken, validateSearchQuery, async (req, res, next) => {
  try {
    const { query } = req.query;
    console.log("User", req.user)
    const userId = req.user?.id;
    // Assuming user ID is available in request

    // Get user's subscribed communities if user is logged in
    let subscribedCommunityIds = [];
    if (userId) {
      const subscriptions = await prisma.subscription.findMany({
        where: {
          unifiedUserId: userId
        },
        select: {
          communityId: true
        }
      });
      subscribedCommunityIds = subscriptions.map(sub => sub.communityId);
    }

    // Search across all major entities
    const [
      communities,
      sessions,
      posts,
      events,
      courses,
      users,
      services,
      resources,
      competitions
    ] = await Promise.all([
      // Communities search - show all communities
      prisma.community.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { desc: { contains: query, mode: 'insensitive' } }
          ],
          isArchived: false
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              userId: true,
              partnerId: true,
              expertId: true,
              adminId: true
            }
          }
        }
      }),

      // Sessions search
      prisma.session.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { desc: { contains: query, mode: 'insensitive' } }
          ],
          isArchived: false
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              userId: true,
              partnerId: true,
              expertId: true,
              adminId: true
            }
          }
        }
      }),

      // Posts search - filter by subscription if user is logged in
      prisma.post.findMany({
        where: {
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { title: { contains: query, mode: 'insensitive' } }
          ],
          isArchived: false,
          parentPostId: null, // Only top-level posts
          ...(userId ? {
            OR: [
              { communityId: { in: subscribedCommunityIds } },
              { community: { visibility: "PUBLIC" } }
            ]
          } : { community: { visibility: "PUBLIC" } })
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              userId: true,
              partnerId: true,
              expertId: true,
              adminId: true
            }
          },
          community: {
            select: {
              id: true,
              title: true,
              visibility: true
            }
          }
        }
      }),

      // Events search
      prisma.event.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { desc: { contains: query, mode: 'insensitive' } }
          ],
          isArchived: false
        }
      }),

      // Courses search
      prisma.course.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              userId: true,
              partnerId: true,
              expertId: true,
              adminId: true
            }
          }
        }
      }),

      // Users search
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          photoURL: true,
          currentPosition: true,
          unifiedUserId:true
        }
      }),

      // Services search
      prisma.service.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              userId: true,
              partnerId: true,
              expertId: true,
              adminId: true
            }
          }
        }
      }),

      // Resources search - filter by subscription if user is logged in
      prisma.resource.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } }
          ],
          ...(userId ? {
            OR: [
              { community: { some: { id: { in: subscribedCommunityIds } } } },
              { community: { some: { visibility: "PUBLIC" } } }
            ]
          } : { community: { some: { visibility: "PUBLIC" } } })
        },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              userId: true,
              partnerId: true,
              expertId: true,
              adminId: true
            }
          },
          community: {
            select: {
              id: true,
              title: true,
              visibility: true
            }
          }
        }
      }),

      // Competitions search
      prisma.competition.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          unifiedUser: {
            select: {
              id: true,
              email: true,
              userId: true,
              partnerId: true,
              expertId: true,
              adminId: true
            }
          }
        }
      })
    ]);

    // Calculate total results
    const totalResults =
      communities.length +
      sessions.length +
      posts.length +
      events.length +
      courses.length +
      users.length +
      services.length +
      resources.length +
      competitions.length;

    return res.status(200).json({
      status: 200,
      message: "Search completed successfully",
      data: {
        communities,
        sessions,
        posts,
        events,
        courses,
        users,
        services,
        resources,
        competitions,
        totalResults
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      status: 500,
      message: "An error occurred while performing the search",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
