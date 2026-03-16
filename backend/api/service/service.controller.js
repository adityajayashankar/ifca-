const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { RewardType, RewardAction } = require('@prisma/client');
const { rewardsManagement } = require('../../services/rewards/rewards.service');

/**
 * Service Interest/Subscription APIs:
 * - GET /getServicesByCommunityId/:communityId (returns all services for a community, with interestedCount and alreadyResponded for current user)
 * - POST /subscribeToService (subscribe current user to a service)
 * - GET /getResponseForCreator/:creatorId (get all responses for a creator's services)
 * - GET /getServiceResponsesWithRole/:serviceId (get responses for a service, role-based)
 * - GET /getAllResponsesByCommunityId/:communityId (get all responses for all services in a community)
 *
 * For each service, if the user has already subscribed (serviceResponse exists for user and service),
 * the response includes alreadyResponded: true. This disables the Interested button in the frontend.
 */

exports.createService=async (req, res)=>{
    try {
        const { title, description, communityId, creatorId, imageUrl, videoUrl } = req.body;

        const newService = await prisma.service.create({
            data: {
                title,
                description,
                communityId,
                creatorId,
                imageUrl,
                videoUrl
            },
        });

        await rewardsManagement({
          userId: parseInt(creatorId),
          rewardRuleName: RewardAction.CREATE_SERVICE,
          type: RewardType.CREDIT
        });

        return res.status(201).json({ success: true, data: newService });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.getServiceById=async(req, res)=>{
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({
      where:{
        id:parseInt(id)
      }
    });


    if (!service) {
      return res.status(400).json({ message: "Service not found" });
    }

    return res.status(200).json(service);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server Error" });
  }
}

exports.subscribeToService=async(req, res)=>{
  let { userId, serviceId } = req.body;

  // Ensure both IDs are present and are numbers
  if (!userId || !serviceId) {
    return res.status(400).json({ message: "Both userId and serviceId are required" });
  }
  userId = parseInt(userId);
  serviceId = parseInt(serviceId);
  if (isNaN(userId) || isNaN(serviceId)) {
    return res.status(400).json({ message: "userId and serviceId must be valid numbers" });
  }

  try {
    const existingSubscription = await prisma.serviceResponse.findFirst({
      where: { userId, serviceId }
    });

    if (existingSubscription) {
      return res.status(400).json({ message: "You have already subscribed to this service" });
    }

    const subscription = await prisma.serviceResponse.create({
      data: { userId, serviceId }
    });

    await rewardsManagement({
      userId: userId,
      rewardRuleName: RewardAction.OPT_FOR_SERVICE,
      type: RewardType.CREDIT
    });

    return res.json({ message: "Subscription successful", subscription });
  } catch (error) {
    return res.status(500).json({ error: "Subscription failed", details: error.message });
  }
}

exports.getResponseForCreator = async (req, res) => {
  const { creatorId } = req.params;

  try {
    const services = await prisma.service.findMany({
      where: { creatorId: Number(creatorId) },
      select: { id: true, title: true, description: true, imageUrl: true, videoUrl:true, communityId: true },
    });

    if (!services.length) {
      return res.status(200).json({ message: "No services found for this creator", data: [] });
    }

    const serviceIds = services.map((service) => service.id);

    const responses = await prisma.serviceResponse.findMany({
      where: { serviceId: { in: serviceIds } },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            videoUrl: true,
          },
        },
        user: {
          select: {
            id: true,
            user: { select: { name: true, email: true, photoURL: true } },
            admin: { select: { name: true, email: true, photoURL: true } },
            expert: { select: { name: true, email: true, photoURL: true } },
            partner: { select: { name: true, email: true, photoURL: true } },
          },
        },
      },
    });

    const data = services.map((service) => {
      const interestedUsers = responses
        .filter((response) => response.service.id === service.id)
        .map((response) => ({
          userId: response.user?.id || null,
          name: getUserName(response.user),
          email: getUserEmail(response.user),
          profileImage: getUserPhoto(response.user),
        }));

      return {
        serviceId: service.id,
        communityId: service.communityId,
        title: service.title,
        description: service.description,
        imageUrl: service.imageUrl,
        videoUrl: service.videoUrl,
        users: interestedUsers,
      };
    });

    res.json({
      message: "Users interested in creator's services fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching users interested in services:", error);
    res.status(500).json({ error: "Failed to fetch data", details: error.message });
  }
};

// Helper to get name/email/photoURL from any user type
function getUserName(u) {
  return u.user?.name || u.admin?.name || u.expert?.name || u.partner?.name || "Unknown";
}
function getUserEmail(u) {
  return u.user?.email || u.admin?.email || u.expert?.email || u.partner?.email || "N/A";
}
function getUserPhoto(u) {
  return u.user?.photoURL || u.admin?.photoURL || u.expert?.photoURL || u.partner?.photoURL || null;
}

exports.getAllResponsesByCommunityId = async (req, res) => {
  const { communityId } = req.params;

  try {
    const services = await prisma.service.findMany({
      where: { communityId: Number(communityId) },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        videoUrl: true,
        communityId: true,
      },
    });

    if (!services.length) {
      return res.status(200).json({ data:[], message: "No services found for this community" });
    }

    const serviceIds = services.map((service) => service.id);

    const responses = await prisma.serviceResponse.findMany({
      where: { serviceId: { in: serviceIds } },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            videoUrl: true,
          },
        },
        user: {
          select: {
            id: true,
            user: { select: { name: true, email: true, photoURL: true } },
            admin: { select: { name: true, email: true, photoURL: true } },
            expert: { select: { name: true, email: true, photoURL: true } },
            partner: { select: { name: true, email: true, photoURL: true } },
          },
        },
      },
    });

    const data = services.map((service) => {
      const interestedUsers = responses
        .filter((response) => response.service.id === service.id)
        .map((response) => ({
          userId: response.user?.id || null,
          name: getUserName(response.user),
          email: getUserEmail(response.user),
          profileImage: getUserPhoto(response.user),
        }));

      return {
        serviceId: service.id,
        communityId: service.communityId,
        title: service.title,
        description: service.description,
        imageUrl: service.imageUrl,
        videoUrl: service.videoUrl,
        users: interestedUsers,
      };
    });

    res.json({
      message: "Users interested in community's services fetched successfully",
      data,
    });

  } catch (error) {
    console.error("Error fetching service responses by community:", error);
    res.status(500).json({ error: "Failed to fetch data", details: error.message });
  }
};

// New endpoint: check if user has already shown interest in a service
exports.hasUserInterested = async (req, res) => {
  const { serviceId, userId } = req.params;
  try {
    const response = await prisma.serviceResponse.findFirst({
      where: { serviceId: Number(serviceId), userId: Number(userId) }
    });
    res.json({ alreadyResponded: !!response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check interest', details: error.message });
  }
};

// Update: Get all services for a community with role-based interested user info
exports.getServicesByCommunityId = async (req, res) => {
  const { communityId } = req.params;
  const user = req.user;
  try {
    const services = await prisma.service.findMany({
      where: { communityId: Number(communityId) },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        videoUrl: true,
        communityId: true,
        creatorId: true
      },
    });
    // For each service, fetch interested user info based on role
    const result = await Promise.all(services.map(async (service) => {
      const responses = await prisma.serviceResponse.findMany({
        where: { serviceId: service.id },
        select: { userId: true },
      });
      const interestedCount = responses.length;
      const alreadyResponded = user && user.unifiedUser ? responses.some(r => r.userId === user.unifiedUser.id) : false;
      if (user && user.unifiedUser && (user.userType === 'admin' || service.creatorId === user.unifiedUser.id)) {
        return {
          ...service,
          interestedCount,
          alreadyResponded,
        };
      } else if (user && user.unifiedUser) {
        return {
          ...service,
          interestedCount,
          alreadyResponded,
        };
      } else {
        // Not logged in or missing unifiedUser, just show count
        return {
          ...service,
          interestedCount,
        };
      }
    }));
    return res.status(200).json({ message: "Services fetched successfully", data: result });
  } catch (error) {
    console.error("Error fetching services by community:", error);
    res.status(500).json({ error: "Failed to fetch services", details: error.message });
  }
};

// New: Get service responses with role-based details
exports.getServiceResponsesWithRole = async (req, res) => {
  const { serviceId } = req.params;
  const user = req.user; // from authenticateToken middleware

  try {
    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
      select: {
        id: true,
        title: true,
        creatorId: true,
        communityId: true,
      },
    });
    if (!service) return res.status(404).json({ message: "Service not found" });

    const responses = await prisma.serviceResponse.findMany({
      where: { serviceId: service.id },
      include: {
        user: {
          select: {
            id: true,
            user: { select: { name: true, email: true, photoURL: true } },
            admin: { select: { name: true, email: true, photoURL: true } },
            expert: { select: { name: true, email: true, photoURL: true } },
            partner: { select: { name: true, email: true, photoURL: true } },
          },
        },
      },
    });

    // If user or user.unifiedUser is missing, only show count
    if (!user || !user.unifiedUser) {
      return res.json({
        serviceId: service.id,
        title: service.title,
        interestedCount: responses.length,
      });
    }

    // Admin: show all interested user details
    if (user.userType === 'admin') {
      return res.json({
        serviceId: service.id,
        title: service.title,
        interestedUsers: responses.map(r => ({
          userId: r.user?.id || null,
          name: getUserName(r.user),
          email: getUserEmail(r.user),
          profileImage: getUserPhoto(r.user),
        })),
        interestedCount: responses.length,
        alreadyResponded: responses.some(r => r.userId === user.unifiedUser.id),
      });
    }

    // Creator: show all interested user details
    if (service.creatorId === user.unifiedUser.id) {
      return res.json({
        serviceId: service.id,
        title: service.title,
        interestedUsers: responses.map(r => ({
          userId: r.user?.id || null,
          name: getUserName(r.user),
          email: getUserEmail(r.user),
          profileImage: getUserPhoto(r.user),
        })),
        interestedCount: responses.length,
        alreadyResponded: responses.some(r => r.userId === user.unifiedUser.id),
      });
    }

    // Other users: only count and alreadyResponded
    return res.json({
      serviceId: service.id,
      title: service.title,
      interestedCount: responses.length,
      alreadyResponded: responses.some(r => r.userId === user.unifiedUser.id),
    });
  } catch (error) {
    console.error("Error in getServiceResponsesWithRole:", error);
    res.status(500).json({ error: "Failed to fetch service responses", details: error.message });
  }
};

// New endpoint: Get all services a user has shown interest in
exports.getUserInterests = async (req, res) => {
  const { userId } = req.params; // This is actually unifiedUserId from frontend
  try {
    console.log('getUserInterests called with userId:', userId);
    
    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({ error: 'Invalid userId parameter' });
    }

    // First, let's test with a simple query
    const responses = await prisma.serviceResponse.findMany({
      where: { userId: Number(userId) },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            videoUrl: true,
            communityId: true,
            creatorId: true,
          },
        },
      },
    });

    console.log('Found responses:', responses.length);

    if (responses.length === 0) {
      return res.json({ data: [] });
    }

    // Get creator information separately to avoid potential relationship issues
    const creatorIds = [...new Set(responses.map(r => r.service.creatorId))];
    const creators = await prisma.unifiedUser.findMany({
      where: { id: { in: creatorIds } },
      include: {
        user: {
          select: {
            name: true,
            photoURL: true,
          },
        },
        partner: {
          select: {
            name: true,
            photoURL: true,
          },
        },
        expert: {
          select: {
            name: true,
            photoURL: true,
          },
        },
        admin: {
          select: {
            name: true,
            photoURL: true,
          },
        },
      },
    });

    const creatorMap = {};
    creators.forEach(creator => {
      // Get name and photoURL from the appropriate related model
      const userInfo = creator.user || creator.partner || creator.expert || creator.admin;
      creatorMap[creator.id] = {
        name: userInfo?.name || 'Unknown',
        photoURL: userInfo?.photoURL || '',
      };
    });

    // Get all interested users for each service
    const serviceIds = responses.map(r => r.service.id);
    const allResponses = await prisma.serviceResponse.findMany({
      where: { serviceId: { in: serviceIds } },
      include: {
        user: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
                photoURL: true,
              },
            },
            admin: {
              select: {
                name: true,
                email: true,
                photoURL: true,
              },
            },
            expert: {
              select: {
                name: true,
                email: true,
                photoURL: true,
              },
            },
            partner: {
              select: {
                name: true,
                email: true,
                photoURL: true,
              },
            },
          },
        },
      },
    });

    console.log('Found all responses:', allResponses.length);

    // Group responses by serviceId
    const responsesByService = {};
    allResponses.forEach(response => {
      if (!responsesByService[response.serviceId]) {
        responsesByService[response.serviceId] = [];
      }
      responsesByService[response.serviceId].push(response);
    });

    const data = responses.map(r => {
      const interestedUsers = responsesByService[r.service.id]?.map(response => ({
        userId: response.user?.id || null,
        name: getUserName(response.user),
        email: getUserEmail(response.user),
        profileImage: getUserPhoto(response.user),
      })) || [];

      const creator = creatorMap[r.service.creatorId];

      return {
        serviceId: r.service.id,
        title: r.service.title,
        description: r.service.description,
        imageUrl: r.service.imageUrl,
        videoUrl: r.service.videoUrl,
        communityId: r.service.communityId,
        creatorId: r.service.creatorId,
        creatorName: creator?.name || '',
        creatorPhotoURL: creator?.photoURL || '',
        interestedCount: interestedUsers.length,
        users: interestedUsers, // Add the users array that frontend expects
      };
    });
    
    console.log('Returning data with', data.length, 'services');
    res.json({ data });
  } catch (error) {
    console.error('Error in getUserInterests:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch user interests', details: error.message });
  }
};
