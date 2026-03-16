const { PrismaClient } = require("@prisma/client");
const { findUserByIdHelper, findCommunityByIdHelper } = require("../services/getById");
const prisma = new PrismaClient();
const { RewardType, RewardAction } = require('@prisma/client');
const { rewardsManagement } = require("../../services/rewards/rewards.service");

// Get Requests by User ID
exports.getRequests = async function (req, res, next) {
  const id = parseInt(req.params.userId);
  try {
    const request = await prisma.requests.findMany({
      where: { userId: id },
      include: {
        Community: true,
        unifiedUser: true,
      },
    });

    return res.status(200).json({
      success: true,
      request,
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

// Get Requests by Community ID
exports.getRequestsByCommunity = async function (req, res, next) {
  const communityId = parseInt(req.params.communityId);
  
  if (!communityId) {
    return res.status(400).json({
      success: false,
      message: "Invalid communityId.",
    });
  }

  // Check if user has permission to view requests (ADMIN or MODERATOR)
  try {
    const userSubscription = await prisma.subscription.findFirst({
      where: {
        unifiedUserId: req.user.unifiedUserId,
        communityId: communityId
      }
    });

    if (!userSubscription || (userSubscription.role !== 'ADMIN' && userSubscription.role !== 'MODERATOR')) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only administrators and moderators can view join requests.",
      });
    }
  } catch (authError) {
    console.error('Error checking user permissions:', authError);
    return res.status(500).json({
      success: false,
      message: "Error verifying user permissions.",
    });
  }

  try {
    const requests = await prisma.requests.findMany({
      where: { 
        communityId: communityId,
        status: false // Only pending requests
      },
      include: {
        Community: true,
        unifiedUser: {
          include: {
            user: true,
            expert: true,
            partner: true,
            admin: true
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

// Get Requests by Community ID for a specific user (community manager)
exports.getRequestsByCommunityForUser = async function (req, res, next) {
  const communityId = parseInt(req.params.communityId);
  const userId = parseInt(req.params.userId);
  
  if (!communityId || !userId) {
    return res.status(400).json({
      success: false,
      message: "Invalid communityId or userId.",
    });
  }

  try {
    // First check if the user is the creator of this community
    const community = await prisma.community.findFirst({
      where: {
        id: communityId,
        creatorId: userId
      }
    });

    if (!community) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view requests for this community.",
      });
    }

    const requests = await prisma.requests.findMany({
      where: { 
        communityId: communityId,
        status: false // Only pending requests
      },
      include: {
        Community: true,
        unifiedUser: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      data: requests,
      count: requests.length,
      community: {
        id: community.id,
        title: community.title,
        questions: community.questions
      }
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.createRequest = async (req, res, next) => {
  try {
    let { communityDetails } = req.body;

    if (!Array.isArray(communityDetails)) {
      if (typeof communityDetails === 'object' && communityDetails !== null) {
        communityDetails = [communityDetails];
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid request format. Expected an object or array under 'communityDetails'.",
        });
      }
    }
    

    const failedRequests = [];
    const successfulRequests = [];

    for (const request of communityDetails) {
      const { email, phone, name, q1, q2, q3, communityId, userId } = request;

      if (!userId || !communityId) {
        failedRequests.push({
          communityId,
          userId,
          message: "Invalid userId or communityId.",
        });
        continue;
      }

      const existingRequest = await prisma.requests.findFirst({
        where: {
          userId,
          communityId,
        },
      });

      if (existingRequest) {
        failedRequests.push({
          communityId,
          userId,
          message: "Request already exists for this user and community.",
        });
        continue;
      }

      const community = await findCommunityByIdHelper(communityId);
      if (!community) {
        failedRequests.push({ communityId, message: "Community not found. Invalid communityId." });
        continue;
      }

      const newRequest = await prisma.requests.create({
        data: {
          name,
          email,
          phone,
          q1,
          q2,
          q3,
          communityId,
          userId,
        },
      });

      successfulRequests.push(newRequest);
    }

    if (failedRequests.length > 0 && successfulRequests.length > 0) {
      return res.status(207).json({
        success: false,
        message: "Some requests could not be processed.",
        failedRequests,
        successfulRequests,
      });
    }

    if (failedRequests.length > 0) {
      return res.status(400).json({
        success: false,
        message: "All requests failed.",
        failedRequests,
      });
    }

    return res.status(201).json({
      success: true,
      message: "All requests processed successfully.",
      successfulRequests,
    });

  } catch (e) {
    console.error("Error in createRequest:", e);
    next(e);
  }
};




exports.respondRequest = async function (req, res, next) {
  if (!Array.isArray(req.body) || req.body.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Requests should be a non-empty array.",
    });
  }

  // Skip permission check since authentication middleware is removed
  // This allows admin frontend to approve requests without authentication

  try {
    for (const { requestId, communityId, userId } of req.body) { 
      let amount = 0;

      const unifiedUser = await prisma.unifiedUser.findUnique({
        where: { id: userId },
        select: { userId: true },
      });

      if (!unifiedUser || !unifiedUser.userId) {
        console.warn(`Invalid unifiedUserId for request ID: ${requestId}`);
        continue; 
      }

      const actualUserId = unifiedUser.userId;
      const user = await findUserByIdHelper(actualUserId);
      const community = await findCommunityByIdHelper(communityId);

      if (!user || !community) {
        console.warn(`Invalid user/community for request ID: ${requestId}`);
        continue; 
      }

      let now = new Date();
      const subObject = {
        startsAt: new Date(),
        expiresAt: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate()
        ),
      };

      await prisma.subscription.create({
        data: {
          ...subObject,
          community: { connect: { id: communityId } },
          unifiedUser: { connect: { id: userId } },
          transaction: {
            create: {
              amount,
              transactionId: `trans-${Date.now()}-${requestId}`,
              paymentId: `paym-${Date.now()}-${requestId}`
            },
          },
        },
      });

      await prisma.requests.update({
        where: { id: requestId },
        data: { status: true },
      });

      await rewardsManagement({
        userId: parseInt(userId),
        rewardRuleName: RewardAction.JOIN_COMMUNITY,
        type: RewardType.CREDIT,
      });
    }

    return res.status(200).json({
      success: true,
      message: "All requests processed.",
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

// Get All Pending Requests (for admin/community managers)
exports.getAllPendingRequests = async function (req, res, next) {
  try {
    const requests = await prisma.requests.findMany({
      where: { 
        status: false // Only pending requests
      },
      include: {
        Community: true,
        unifiedUser: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

// Get All Approved Requests (for admin)
exports.getAllApprovedRequests = async function (req, res, next) {
  try {
    const requests = await prisma.requests.findMany({
      where: { 
        status: true // Only approved requests
      },
      include: {
        Community: true,
        unifiedUser: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

// Get All Requests (both pending and approved) - for admin
exports.getAllRequests = async function (req, res, next) {
  try {
    const requests = await prisma.requests.findMany({
      include: {
        Community: true,
        unifiedUser: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const pendingRequests = requests.filter(req => !req.status);
    const approvedRequests = requests.filter(req => req.status);

    return res.status(200).json({
      success: true,
      data: {
        all: requests,
        pending: pendingRequests,
        approved: approvedRequests
      },
      count: {
        total: requests.length,
        pending: pendingRequests.length,
        approved: approvedRequests.length
      }
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

// Get a single request by ID
exports.getRequestById = async function (req, res, next) {
  const requestId = parseInt(req.params.requestId);
  
  if (!requestId) {
    return res.status(400).json({
      success: false,
      message: "Invalid requestId.",
    });
  }

  try {
    const request = await prisma.requests.findUnique({
      where: { id: requestId },
      include: {
        Community: true,
        unifiedUser: true,
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

// Update request status (approve/reject)
exports.updateRequestStatus = async function (req, res, next) {
  const requestId = parseInt(req.params.requestId);
  const { status, reason } = req.body;
  
  if (!requestId) {
    return res.status(400).json({
      success: false,
      message: "Invalid requestId.",
    });
  }

  if (typeof status !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: "Status must be a boolean value.",
    });
  }

  try {
    const request = await prisma.requests.findUnique({
      where: { id: requestId },
      include: {
        Community: true,
        unifiedUser: true,
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
      });
    }

    // If approving the request, create subscription
    if (status === true) {
      let amount = 0;
      let now = new Date();
      const subObject = {
        startsAt: new Date(),
        expiresAt: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate()
        ),
      };

      await prisma.subscription.create({
        data: {
          ...subObject,
          community: { connect: { id: request.communityId } },
          unifiedUser: { connect: { id: request.userId } },
          transaction: {
            create: {
              amount,
              transactionId: `trans-${Date.now()}-${requestId}`,
              paymentId: `paym-${Date.now()}-${requestId}`
            },
          },
        },
      });

      // Award points for joining community
      await rewardsManagement({
        userId: parseInt(request.userId),
        rewardRuleName: RewardAction.JOIN_COMMUNITY,
        type: RewardType.CREDIT,
      });
    }

    // Update the request status
    const updatedRequest = await prisma.requests.update({
      where: { id: requestId },
      data: { 
        status: status,
        // You could add a reason field to the schema if needed
      },
      include: {
        Community: true,
        unifiedUser: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Request ${status ? 'approved' : 'rejected'} successfully.`,
      data: updatedRequest,
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

// Get Approved Requests by Community ID
exports.getApprovedRequestsByCommunity = async function (req, res, next) {
  const communityId = parseInt(req.params.communityId);
  
  if (!communityId) {
    return res.status(400).json({
      success: false,
      message: "Invalid communityId.",
    });
  }

  try {
    const requests = await prisma.requests.findMany({
      where: { 
        communityId: communityId,
        status: true // Only approved requests
      },
      include: {
        Community: true,
        unifiedUser: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

// Get All Requests by Community ID (both pending and approved)
exports.getAllRequestsByCommunity = async function (req, res, next) {
  const communityId = parseInt(req.params.communityId);
  
  if (!communityId) {
    return res.status(400).json({
      success: false,
      message: "Invalid communityId.",
    });
  }

  try {
    const requests = await prisma.requests.findMany({
      where: { 
        communityId: communityId
      },
      include: {
        Community: true,
        unifiedUser: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const pendingRequests = requests.filter(req => !req.status);
    const approvedRequests = requests.filter(req => req.status);

    return res.status(200).json({
      success: true,
      data: {
        all: requests,
        pending: pendingRequests,
        approved: approvedRequests
      },
      count: {
        total: requests.length,
        pending: pendingRequests.length,
        approved: approvedRequests.length
      }
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

// Get Approved Requests by User ID
exports.getApprovedRequestsByUser = async function (req, res, next) {
  const userId = parseInt(req.params.userId);
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Invalid userId.",
    });
  }

  try {
    const requests = await prisma.requests.findMany({
      where: { 
        userId: userId,
        status: true // Only approved requests
      },
      include: {
        Community: true,
        unifiedUser: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

// Get Pending Requests by User ID
exports.getPendingRequestsByUser = async function (req, res, next) {
  const userId = parseInt(req.params.userId);
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Invalid userId.",
    });
  }

  try {
    const requests = await prisma.requests.findMany({
      where: { 
        userId: userId,
        status: false // Only pending requests
      },
      include: {
        Community: true,
        unifiedUser: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

// Get All Requests by User ID (both pending and approved)
exports.getAllRequestsByUser = async function (req, res, next) {
  const userId = parseInt(req.params.userId);
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Invalid userId.",
    });
  }

  try {
    const requests = await prisma.requests.findMany({
      where: { 
        userId: userId
      },
      include: {
        Community: true,
        unifiedUser: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const pendingRequests = requests.filter(req => !req.status);
    const approvedRequests = requests.filter(req => req.status);

    return res.status(200).json({
      success: true,
      data: {
        all: requests,
        pending: pendingRequests,
        approved: approvedRequests
      },
      count: {
        total: requests.length,
        pending: pendingRequests.length,
        approved: approvedRequests.length
      }
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

