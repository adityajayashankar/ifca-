const {
  getCommunityByTagHelper,
  getCommunitySubscriptionsHelper,
  getCommunitySessionsHelper,
  getCommunitySubsStdForm,
} = require("./community");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getTiers } = require("../session/session");
const { findCommunityByIdHelper } = require("../services/getById");
const XLSX = require("xlsx");
const notificationService = require("../../services/notification.service");

// Get all public communities - Public API (no auth required)
// Returns only required data for frontend display
exports.getAllPublicCommunities = async (req, res) => {
  try {
    const communities = await prisma.community.findMany({
      where: {
        visibility: 'PUBLIC',
        isApproved: true,
        isArchived: false,
        // Exclude DEFAULT communities
        communityType: {
          not: 'DEFAULT'
        }
      },
      select: {
        id: true,
        title: true,
        desc: true,
        bannerImg: true,
        price: true,
        // Get member count from subscriptions (all subscriptions count as members)
        _count: {
          select: {
            subscriptions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit to prevent large responses
    });

    // Map communities to include memberCount - format matches frontend expectations
    const formattedCommunities = communities.map(community => ({
      id: community.id,
      title: community.title,
      desc: community.desc,
      bannerImg: community.bannerImg,
      price: community.price || 0,
      memberCount: community._count.subscriptions || 0,
      // Add subscriptionTrue array for compatibility (empty for public endpoint)
      subscriptionTrue: []
    }));

    return res.status(200).json({
      success: true,
      communities: formattedCommunities
    });
  } catch (error) {
    console.error("Error fetching public communities:", error);
    // Return empty array on error to prevent frontend loading issues
    return res.status(200).json({
      success: true,
      communities: []
    });
  }
};

// Get all communities
exports.getAllCommunities = async (req, res) => {
  try {
    
    console.log('getAllCommunities called with:', {
      query: req.query,
      user: req.user ? { id: req.user.unifiedUserId, userType: req.user.userType } : null
    });

    const { communityType, initialcommunity } = req.query;
    const { unifiedUserId, userType } = req.user || {};
    const userRole = userType;

    // Get unified user ID if user is authenticated (optional for viewing)
    let finalUnifiedUserId = unifiedUserId;
    if (req.user?.userId && userRole && (userRole === 'user' || userRole === 'expert')) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(req.user.userId) },
        include: { unifiedUserId: true }
      });
      finalUnifiedUserId = user?.unifiedUserId?.id;
    }

    // Base where clause
    let where = {
      ...(communityType ? { communityType } : {})
    };

    // Add initialCommunity filter if requested
    if (initialcommunity === 'true') {
      where = { ...where, initialCommunity: true };
    }

    // No visibility restrictions - anyone can view all communities
    // Visibility restrictions removed as per user request

    const communities = await prisma.community.findMany({
      where,
      include: {
        parentCommunities: {
          include: {
            childCommunity: true,
          },
        },
        childCommunities: {
          include: {
            parentCommunity: true,
          },
        },
        subscriptions: {
          include: {
            unifiedUser: true,
          },
        },
        creator: true,
        FormCommunity: {
          include: {
            Community: true,
            Form: true
          }
        },
        CommunityTags: {
          include: {
            Tag: true
          }
        }
      }
    });


    // No subscription filtering - show all child communities for everyone
    // Child community filtering removed as per user request

    // Filter out DEFAULT communities from the mapped result
    const result = communities
      .filter(community => community.communityType !== 'DEFAULT')
      .map(community => {
      try {
        // Get all child communities from the database - no subscription filtering
        let filteredChildCommunities = (community.parentCommunities || [])
          .filter(child => child && child.childCommunity && child.childCommunity.id) // Filter out null mappings and null child communities
          .map(child => child.childCommunity)
          .filter(child => child && child.id); // Additional safety check

        // Show all child communities for everyone - no subscription restrictions
      
         let filteredParentCommunities = (community.childCommunities || [])
      .filter(mapping => mapping.parentCommunity && mapping.parentCommunity.id)
      .map(mapping => mapping.parentCommunity)
      .filter(parent => parent && parent.id);

        // Debug logging
        // console.log(`Community ${community.id} - childCommunities count: ${filteredChildCommunities.length}`);
        // console.log('Filtered child communities:', filteredChildCommunities.map(child => ({ id: child?.id, title: child?.title })));

        return {
          id: community.id,
          title: community.title,
          desc: community.desc,
          price: community.price,
          gold_price: community.gold_price,
          silver_price: community.silver_price,
          platinum_price: community.platinum_price,
          bannerImg: community.bannerImg,
          infoImgs: community.infoImgs,
          discountForCourses: community.discountForCourses,
          isArchived: community.isArchived,
          createdAt: community.createdAt,
          updatedAt: community.updatedAt,
          creatorId: community.creatorId,
          welcomeMsg: community.welcomeMsg,
          questions: community.questions,
          visibility: community.visibility,
          initialCommunity: community.initialCommunity,
          communityType: community.communityType,
          isApproved: community.isApproved,
          isCatchupLive: community.isCatchupLive,
          // Correct mapping: parentCommunities are the communities this community is a child of
          parentCommunities: community.parentCommunities,
          // Correct mapping: childCommunities are the communities this community is a parent of
          childCommunities: filteredChildCommunities,
          subscribedChildCommunities: filteredChildCommunities,
          subscriptionTrue: community.subscriptions || [],
          forms: (community.FormCommunity || []).map(form => form.Form),
          tags: (community.CommunityTags || []).map(t => t.Tag),
        };
      } catch (communityError) {
        console.error(`Error processing community ${community.id}:`, communityError);
        // Return a basic community object without relationships if there's an error
        return {
          id: community.id,
          title: community.title,
          desc: community.desc,
          price: community.price,
          gold_price: community.gold_price,
          silver_price: community.silver_price,
          platinum_price: community.platinum_price,
          bannerImg: community.bannerImg,
          infoImgs: community.infoImgs,
          discountForCourses: community.discountForCourses,
          isArchived: community.isArchived,
          createdAt: community.createdAt,
          updatedAt: community.updatedAt,
          creatorId: community.creatorId,
          welcomeMsg: community.welcomeMsg,
          questions: community.questions,
          visibility: community.visibility,
          initialCommunity: community.initialCommunity,
          communityType: community.communityType,
          isApproved: community.isApproved,
          isCatchupLive: community.isCatchupLive,
          parentCommunities: [],
          childCommunities: [],
          subscribedChildCommunities: [],
          subscriptionTrue: [],
          forms: [],
          tags: [],
        };
      }
    });

    return res.status(200).json({
      success: true,
      communities: result
    });

  } catch (error) {
    console.error("Error fetching communities:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch communities",
      error: error.message
    });
  }
};



// Get all pending communities
exports.getAllPendingCommunities = async (req, res) => {
  try {
    const { communityType } = req.query;
    const where = {
      isApproved: false,
      ...(communityType ? { communityType: communityType } : {})
    };

    const communities = await prisma.community.findMany({
      where,
    });

    res.json({
      success: true,
      communities
    });
  } catch (error) {
    console.error('Error fetching pending communities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending communities'
    });
  }
};

// Get community by tag
exports.getCommunitiesByTag = async (req, res) => {
  try {
    const { tag } = req.query;
    const communities = await getCommunityByTagHelper(tag);
    return res.status(200).json({
      success: true,
      communities
    });
  } catch (error) {
    console.error('Error searching communities by tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search communities'
    });
  }
};

// Get all tags
exports.getAllTags = async function (req, res, next) {
  try {
    const { includeArchived = false } = req.query;
    
    const where = includeArchived === 'true' ? {} : { isArchived: false };
    
    const tags = await prisma.tag.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });
    return res.status(200).json(tags);
  } catch (error) {
    console.log(`Error while fetching tags, ${__filename}`);
    console.log(error);
    next(error);
  }
};

// Get community sessions
exports.getSessions = async (req, res) => {
  try {
    const { id } = req.params;
    const sessions = await getCommunitySessionsHelper(id);
    return res.status(200).json({
      success: true,
      ...sessions
    });
  } catch (error) {
    console.error('Error fetching community sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
};

// Get community people
exports.getPeople = async (req, res) => {
  try {
    const { id } = req.params;
    const allSubscriptions = await prisma.subscription.findMany({
      where: {
        communityId: parseInt(id),
      },
      include: {
        unifiedUser: {
          include: {
            user: true,
            expert: true,
            partner: true,
            admin: true
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      users: allSubscriptions
    });
  } catch (error) {
    console.error('Error fetching community people:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community people'
    });
  }
};

// Get community questions
exports.getCommunityQuestions = async (req, res) => {
  try {
    const { communityId } = req.params;
    const community = await prisma.community.findUnique({
      where: {
        id: parseInt(communityId)
      },
      select: {
        questions: true
      }
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        error: 'Community not found'
      });
    }

    res.json({
      success: true,
      questions: community.questions
    });
  } catch (error) {
    console.error('Error fetching community questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community questions'
    });
  }
};

// Get community users
exports.getCommunityUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const users = await prisma.subscription.findMany({
      where: {
        communityId: parseInt(id)
      },
      include: {
        unifiedUser: {
          include: {
            user: true,
            expert: true,
            partner: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching community users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community users'
    });
  }
};


exports.getCommunityUsershysubscription = async (req, res) => {

  const communityId = parseInt(req.params.id);

  try {
    // Step 1: Check if this community is a parent (has children)
    const childMappings = await prisma.communityMapping.findMany({
      where: { parentCommunityId: communityId },
      select: { childCommunityId: true }
    });

    const isParent = childMappings.length > 0;

    let subscribers = [];
    let nonSubscribers = [];

    if (isParent) {
      // Fetch all users subscribed to this parent community
      const subscribed = await prisma.subscription.findMany({
        where: { communityId },
        include: {
          unifiedUser: {
            include: {
              user: true,
              expert: true,
              partner: true
            }
          }
        }
      });

      const subscribedUserIds = subscribed.map(s => s.unifiedUserId);

      // Fetch all users
      const allUsers = await prisma.unifiedUser.findMany({
        include: {
          user: true,
          expert: true,
          partner: true
        }
      });

      // Separate non-subscribers
      allUsers.forEach(u => {
        const base = {
          id: u.id,
          userId: u.userId || u.expertId || u.partnerId || u.adminId || null,
          name: u.user?.name || u.expert?.name || u.partner?.name || null,
          email: u.user?.email || u.expert?.email || u.partner?.email || u.email,
          userType: u.user ? 'user' : u.expert ? 'expert' : u.partner ? 'partner' : 'unknown',
          photoURL: u.user?.photoURL || u.expert?.photoURL || u.partner?.photoURL || null,
        };
        if (subscribedUserIds.includes(u.id)) {
          const sub = subscribed.find(s => s.unifiedUserId === u.id);
          subscribers.push({ ...base, isSubscribed: true, subscription: {
            startDate: sub.startsAt,
            endDate: sub.expiresAt,
            subscriptionId: sub.id,
            role: sub.role || 'MEMBER'
          }});
        } else {
          nonSubscribers.push({ ...base, isSubscribed: false });
        }
      });
    } else {
      // Child community logic

      // 1. Get users subscribed to this child community
      const subscribed = await prisma.subscription.findMany({
        where: { communityId },
        include: {
          unifiedUser: {
            include: {
              user: true,
              expert: true,
              partner: true
            }
          }
        }
      });
      const subscribedUserIds = subscribed.map(s => s.unifiedUserId);

      // 2. Find parent of this community
      const mapping = await prisma.communityMapping.findFirst({
        where: { childCommunityId: communityId },
        select: { parentCommunityId: true }
      });

      let parentSubscriberIds = [];

      if (mapping?.parentCommunityId) {
        const parentSubs = await prisma.subscription.findMany({
          where: { communityId: mapping.parentCommunityId }
        });
        parentSubscriberIds = parentSubs.map(s => s.unifiedUserId);
      }

      const allUsers = await prisma.unifiedUser.findMany({
        include: {
          user: true,
          expert: true,
          partner: true
        }
      });

      allUsers.forEach(u => {
        const base = {
          id: u.id,
          userId: u.userId || u.expertId || u.partnerId || u.adminId || null,
          name: u.user?.name || u.expert?.name || u.partner?.name || null,
          email: u.user?.email || u.expert?.email || u.partner?.email || u.email,
          userType: u.user ? 'user' : u.expert ? 'expert' : u.partner ? 'partner' : 'unknown',
          photoURL: u.user?.photoURL || u.expert?.photoURL || u.partner?.photoURL || null,
        };

        if (subscribedUserIds.includes(u.id)) {
          const sub = subscribed.find(s => s.unifiedUserId === u.id);
          subscribers.push({ ...base, isSubscribed: true, subscription: {
            startDate: sub.startsAt,
            endDate: sub.expiresAt,
            subscriptionId: sub.id,
            role: sub.role || 'MEMBER'
          }});
        } else if (parentSubscriberIds.includes(u.id)) {
          nonSubscribers.push({ ...base, isSubscribed: false });
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        total: {
          all: subscribers.length + nonSubscribers.length,
          subscribed: subscribers.length,
          nonSubscribed: nonSubscribers.length
        },
        subscribers,
        nonSubscribers
      }
    });
  } catch (err) {
    console.error("❌ Error in getCommunityUsershysubscription:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};


// Manage community subscriptions
exports.manageSubscriptions = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, action } = req.body;

    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        error: 'userId and action are required'
      });
    }

    // Get user details first to get the unified user ID
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { unifiedUserId: true }
    });

    if (!user || !user.unifiedUserId) {
      return res.status(404).json({
        success: false,
        error: 'User not found or no unified user ID'
      });
    }

    const unifiedUserId = user.unifiedUserId.id;

    if (action === 'subscribe') {
      const subscription = await prisma.subscription.create({
        data: {
          communityId: parseInt(id),
          unifiedUserId: unifiedUserId,
          startsAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      });

      return res.status(200).json({
        success: true,
        subscription
      });
    } else if (action === 'unsubscribe') {
      await prisma.subscription.deleteMany({
        where: {
          communityId: parseInt(id),
          unifiedUserId: unifiedUserId
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Successfully unsubscribed'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action'
      });
    }
  } catch (error) {
    console.error('Error managing subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to manage subscriptions'
    });
  }
};

exports.createCommunity = async (req, res) => {
  try {
    console.log('Received community creation request:', {
      body: req.body,
      parentCommunityId: req.body.parentCommunityId,
      parentCommunityIds: req.body.parentCommunityIds
    });

    const {
      title,
      desc,
      price,
      gold_price,
      silver_price,
      platinum_price,
      bannerImg,
      infoImgs,
      discountForCourses,
      welcomeMsg,
      questions,
      visibility,
      initialCommunity,
      communityType,
      parentCommunityIds,
      childCommunityIds,
      parentCommunityId,
      formIds,
      tagIds,
      creatorId,
      resource, // <-- add this
    } = req.body;

    // Check for duplicate title, except for DEFAULT communityType
    if (communityType !== 'DEFAULT') {
      const existingCommunity = await prisma.community.findFirst({
        where: {
          title: {
            equals: title,
            mode: 'insensitive' // Case-insensitive comparison
          }
        }
      });

      if (existingCommunity) {
        return res.status(409).json({
          success: false,
          message: "A community with this title already exists."
        });
      }
    }

    // Process tags - create new ones if they don't exist
    let processedTagIds = [];
    if (tagIds && tagIds.length > 0) {
      for (const tagInput of tagIds) {
        let tagId;
        
            // Check if tagInput is a number (existing tag ID) or string (new tag name)
    if (typeof tagInput === 'number' || !isNaN(tagInput)) {
      // It's an existing tag ID
      tagId = parseInt(tagInput);
      
      // Verify the tag exists
      const existingTag = await prisma.tag.findUnique({
        where: { id: tagId }
      });
      
      if (!existingTag) {
        return res.status(400).json({
          success: false,
          message: `Tag with ID ${tagId} does not exist.`
        });
      }
    } else {
      // It's a new tag name - create it
      const newTag = await prisma.tag.create({
        data: {
          name: tagInput,
          tagType: 'community'
        }
      });
      tagId = newTag.id;
      console.log(`Created new tag: ${tagInput} with ID: ${tagId}`);
    }
        
        processedTagIds.push(tagId);
      }
    }

    const newCommunity = await prisma.community.create({
      data: {
        title,
        desc,
        price,
        gold_price,
        silver_price,
        platinum_price,
        bannerImg,
        infoImgs,
        discountForCourses,
        welcomeMsg,
        questions,
        visibility,
        initialCommunity,
        communityType,
        isApproved: communityType === 'DEFAULT' ? true : false,
        creator: {
          connect: {
            id: creatorId || req.user.unifiedUserId
          }
        },
        // Connect child communities (this community becomes a parent of child communities)
        childCommunities: childCommunityIds && childCommunityIds.length > 0 ? {
          create: childCommunityIds.map(id => ({
            childCommunity: {
              connect: { id: parseInt(id) }
            }
          }))
        } : undefined,
        // Connect forms
        FormCommunity: formIds && formIds.length > 0 ? {
          create: formIds.map(id => ({
            Form: {
              connect: { id: parseInt(id) }
            }
          }))
        } : undefined,
        // Connect tags using processed tag IDs
        tags: processedTagIds.length > 0 ? {
          create: processedTagIds.map(id => ({
            tag: {
              connect: { id: parseInt(id) }
            }
          }))
        } : undefined,
      },
      include: {
        parentCommunities: {
          include: {
            parentCommunity: true,
          },
        },
        childCommunities: {
          include: {
            childCommunity: true,
          },
        },
        subscriptions: {
          include: {
            unifiedUser: true,
          },
        },
        creator: true,
        FormCommunity: {
          include: {
            Community: true,
            Form: true
          }
        },
        CommunityTags: {
          include: {
            Tag: true
          }
        }
      }
    });

    // Create parent community relationship if parentCommunityId is provided
    if (parentCommunityId && parentCommunityId > 0) {
      console.log('Creating parent community relationship:', {
        parentCommunityId: parseInt(parentCommunityId),
        childCommunityId: newCommunity.id
      });

      try {
        const mapping = await prisma.communityMapping.create({
          data: {
            parentCommunityId: parseInt(parentCommunityId),
            childCommunityId: newCommunity.id,
          },
        });
        console.log('Parent community relationship created successfully:', mapping);
      } catch (mappingError) {
        console.error('Error creating parent community relationship:', mappingError);
        // Continue with community creation even if mapping fails
      }
    } else {
      console.log('No valid parentCommunityId provided, skipping parent relationship creation. parentCommunityId:', parentCommunityId);
    }

    // Handle resources if provided
    if (Array.isArray(resource) && resource.length > 0) {
      await Promise.all(resource.map(async (item) => {
        await prisma.resource.create({
          data: {
            name: item.name,
            link: item.link,
            author: { connect: { id: parseInt(item.authorId) } },
            community: { connect: [{ id: newCommunity.id }] },
          },
        });
      }));
    }

    // Fetch the community again with updated relationships
    const communityWithRelationships = await prisma.community.findUnique({
      where: { id: newCommunity.id },
      include: {
        parentCommunities: {
          include: {
            parentCommunity: true,
          },
        },
        childCommunities: {
          include: {
            childCommunity: true,
          },
        },
        subscriptions: {
          include: {
            unifiedUser: true,
          },
        },
        creator: true,
        FormCommunity: {
          include: {
            Community: true,
            Form: true
          }
        },
        CommunityTags: {
          include: {
            Tag: true
          }
        }
      }
    });

    const result = {
      id: communityWithRelationships.id,
      title: communityWithRelationships.title,
      desc: communityWithRelationships.desc,
      price: communityWithRelationships.price,
      gold_price: communityWithRelationships.gold_price,
      silver_price: communityWithRelationships.silver_price,
      platinum_price: communityWithRelationships.platinum_price,
      bannerImg: communityWithRelationships.bannerImg,
      infoImgs: communityWithRelationships.infoImgs,
      discountForCourses: communityWithRelationships.discountForCourses,
      isArchived: communityWithRelationships.isArchived,
      createdAt: communityWithRelationships.createdAt,
      updatedAt: communityWithRelationships.updatedAt,
      creatorId: communityWithRelationships.creatorId,
      welcomeMsg: communityWithRelationships.welcomeMsg,
      questions: communityWithRelationships.questions,
      visibility: communityWithRelationships.visibility,
      initialCommunity: communityWithRelationships.initialCommunity,
      communityType: communityWithRelationships.communityType,
      isApproved: communityWithRelationships.isApproved,
      isCatchupLive: communityWithRelationships.isCatchupLive,
      parentCommunities: communityWithRelationships.parentCommunities.map(parent => parent.parentCommunity),
      childCommunities: communityWithRelationships.childCommunities.map(child => {
        const childCommunity = child.childCommunity;
        // Find the parent mapping for this child
        const parentMapping = (childCommunity.parentCommunities || []).find(pc => pc.parentCommunity);
        return {
          ...childCommunity,
          parentCommunity: parentMapping
            ? {
                id: parentMapping.parentCommunity.id,
                title: parentMapping.parentCommunity.title,
                bannerImg: parentMapping.parentCommunity.bannerImg,
              }
            : null,
        };
      }),
      subscriptionTrue: communityWithRelationships.subscriptions,
      forms: communityWithRelationships.FormCommunity.map(form => form.Form),
      tags: (communityWithRelationships.tags || []).map(t => t.tag),
    };

    return res.status(201).json({
      success: true,
      community: result
    });
  } catch (error) {
    console.error("Error creating community:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create community",
      error: error.message
    });
  }
};

exports.approveCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await prisma.community.update({
      where: { id: parseInt(id) },
      data: { isApproved: true },
    });

    res.json(community);
  } catch (error) {
    console.error('Error approving community:', error);
    res.status(500).json({ error: 'Failed to approve community' });
  }
};

exports.getCommunityById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("req.user", req.user);
    const { userId: userId, userType: userRole } = req.user;

    // Input validation
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid community ID'
      });
    }

    // Get unified user ID if user is authenticated (optional for viewing)
    let unifiedUserId = null;
    if (userId && userRole && (userRole === 'user' || userRole === 'expert')) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        include: { unifiedUserId: true }
      });
      unifiedUserId = user?.unifiedUserId?.id;
    }

    console.log("unifiedUserId", unifiedUserId);

    // Base where clause - no visibility restrictions, anyone can view
    const where = {
      id: parseInt(id)
    };

    console.log("----------------where--------------", where);
    // First check if the community exists with optimized includes
    const community = await prisma.community.findFirst({
      where,
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            link: true,
            isApproved: true
          }
        },
        parentCommunities: {
          include: {
            childCommunity: true,
             parentCommunity: true,
          },
        },
        childCommunities: {
          include: {
            parentCommunity: true,
          },
        },
        subscriptions: {
          include: {
            unifiedUser: true,
          },
        },
        FormCommunity: {
          include: {
            Community: true,
            Form: true
          }
        },
        creator: true
      }
    });


    if (!community) {
      return res.status(404).json({
        success: false,
        error: 'Community not found or you do not have access to it'
      });
    }


    // No subscription filtering - show all child communities for everyone
    // Child community filtering removed as per user request

    // Get all child communities from the database - no subscription filtering
    let filteredChildCommunities = (community.parentCommunities || [])
      .filter(child => child && child.childCommunity && child.childCommunity.id) // Filter out null mappings and null child communities
      .map(child => child.childCommunity)
      .filter(child => child && child.id); // Additional safety check

    // Show all child communities for everyone - no subscription restrictions


    // Transform the data into the desired structure
    const result = {
      id: community.id,
      title: community.title,
      desc: community.desc,
      price: community.price,
      gold_price: community.gold_price,
      silver_price: community.silver_price,
      platinum_price: community.platinum_price,
      bannerImg: community.bannerImg,
      infoImgs: community.infoImgs,
      discountForCourses: community.discountForCourses,
      isArchived: community.isArchived,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
      creatorId: community.creatorId,
      welcomeMsg: community.welcomeMsg,
      questions: community.questions,
      communityType: community.communityType,
      isApproved: community.isApproved,
      isCatchupLive: community.isCatchupLive,
      visibility: community.visibility,
      initialCommunity: community.initialCommunity,
      parentCommunities: community.childCommunities.map(parent => parent.parentCommunity),
      childCommunities: filteredChildCommunities,
      subscribedChildCommunities: filteredChildCommunities,
      subscriptionTrue: community.subscriptions,
      resource: community.resource,
      creatorId: community.creatorId,
      forms: community.FormCommunity.map(form => form.Form),
      tags: (community.CommunityTags || []).map(t => t.Tag),
    };

    res.status(200).json({
      success: true,
      community: result
    });

  } catch (error) {
    console.error('Error in getCommunityById:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community',
      message: error.message
    });
  }
};

/*req.body={price:INT,desc,bannerImg:STR,
infoImgs:[STR]} */
// update bannerImg/infoImgs
exports.updateCommunityById = async function (req, res, next) {
  const { id } = req.params;

  console.log(req.body); // Log the incoming request body for debugging

  try {
    const existingCommunity = await findCommunityByIdHelper(id);

    if (!existingCommunity) {
      return res.status(404).json({ error: 'Community not found' });
    }

    let data = req.body;
    let parentCommunityId = data.parentCommunityId;
    let resourceData = data.resourceData;
    let tagIds = data.tagIds;
    let resourceArr = data.resource; // <-- add this
    
    // Remove fields that should not be included in the Prisma update
    delete data["parentCommunityId"];
    delete data["resourceData"];
    delete data["subscribedChildCommunities"];
    delete data["childCommunities"];
    delete data["parentCommunities"];
    delete data["creator"];
    delete data["id"];
    delete data["createdAt"];
    delete data["updatedAt"];
    delete data["role"];
    delete data["forms"];
    delete data["services"];
    delete data["subscriptionTrue"];
    delete data["subscriptions"];
    delete data["FormCommunity"];
    delete data["tagIds"];
    delete data["tags"];
    delete data["resource"];

    const updatedCommunity = await prisma.community.update({
      where: { id: parseInt(id) },
      data: data,
    });

    // Update tags if tagIds is present
    if (Array.isArray(tagIds)) {
      // Remove all existing tags
      await prisma.communityTags.deleteMany({
        where: { communityId: parseInt(id) }
      });
      
      // Process tags - create new ones if they don't exist
      for (const tagInput of tagIds) {
        let tagId;
        
        // Check if tagInput is a number (existing tag ID) or string (new tag name)
        if (typeof tagInput === 'number' || !isNaN(tagInput)) {
          // It's an existing tag ID
          tagId = parseInt(tagInput);
          
          // Verify the tag exists
          const existingTag = await prisma.tag.findUnique({
            where: { id: tagId }
          });
          
          if (!existingTag) {
            return res.status(400).json({
              success: false,
              message: `Tag with ID ${tagId} does not exist.`
            });
          }
        } else {
          // It's a new tag name - create it
          const newTag = await prisma.tag.create({
            data: {
              name: tagInput,
              tagType: 'community'
            }
          });
          tagId = newTag.id;
          console.log(`Created new tag: ${tagInput} with ID: ${tagId}`);
        }
        
        // Create the community-tag relationship
        await prisma.communityTags.create({
          data: {
            communityId: parseInt(id),
            tagId: tagId
          }
        });
      }
    }

    if (parentCommunityId !== undefined && parentCommunityId !== null) {
      // First, delete any existing parent-child relationships for this community
      await prisma.communityMapping.deleteMany({
        where: {
          childCommunityId: parseInt(id),
        },
      });

      // Then create the new parent-child relationship
      if (parentCommunityId > 0) {
        await prisma.communityMapping.create({
          data: {
            parentCommunityId: parseInt(parentCommunityId),
            childCommunityId: parseInt(id),
          },
        });
      }

      console.log(`Parent-child relationship updated for community ${id}`);
    }

    if (resourceData) {
      resourceData?.map(async (data) => {

        if (data.resourceId) {
          await prisma.resource.update({
            where: { id: data.resourceId },
            data: {
              name: data.name,
              link: data.link,
              authorId: data.authorId,
              isApproved: data.isApproved || false,
              community: {
                connect: { id: updatedCommunity.id },
              },
            },
          });
        } else {
          // Create a new resource if no resourceId is provided
          await prisma.resource.create({
            data: {
              name: data.name,
              link: data.link,
              authorId: data.authorId,
              isApproved: data.isApproved || false,
              community: {
                connect: { id: updatedCommunity.id },
              },
            },
          });
        }
      })
    }

    // Handle resources if provided
    if (Array.isArray(resourceArr) && resourceArr.length > 0) {
      await Promise.all(resourceArr.map(async (item) => {
        if (item.id) {
          // Update existing resource
          await prisma.resource.update({
            where: { id: item.id },
            data: {
              name: item.name,
              link: item.link,
              authorId: item.authorId,
            },
          });
        } else {
          // Create new resource and associate with community
          await prisma.resource.create({
            data: {
              name: item.name,
              link: item.link,
              author: { connect: { id: parseInt(item.authorId) } },
              community: { connect: [{ id: parseInt(id) }] },
            },
          });
        }
      }));
    }

    // Step 6: Return the updated community information along with success status
    return res.status(202).json({
      community: updatedCommunity,
      success: true,
    });
  } catch (error) {
    // Error handling and logging
    console.log(`Error while updating community id: ${id} @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

exports.deleteCommunityById = async function (req, res, next) {
  const { id } = req.params;

  try {
    // First, check if the community exists
    const community = await findCommunityByIdHelper(id);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Start a transaction to delete community and handle cascading deletions
    const deletedCommunity = await prisma.$transaction(async (prisma) => {
      // Delete child and parent community mappings first, to avoid constraint issues
      await prisma.communityMapping.deleteMany({
        where: {
          OR: [
            { parentCommunityId: parseInt(id) },
            { childCommunityId: parseInt(id) }
          ]
        }
      });

      // Delete all related entities for the community
      await prisma.post.deleteMany({
        where: { communityId: parseInt(id) }
      });

      await prisma.subscription.deleteMany({
        where: { communityId: parseInt(id) }
      });

      await prisma.communityBlog.deleteMany({
        where: { communityId: parseInt(id) }
      });

      await prisma.catchUp.deleteMany({
        where: { communityId: parseInt(id) }
      });

      // Delete the community itself
      return prisma.community.delete({
        where: { id: parseInt(id) },
      });
    });

    return res.status(200).json({ community: deletedCommunity });

  } catch (error) {
    console.log(`Error while deleting community id: ${id} @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

exports.getCommunitySubscriptions = async function (req, res, next) {
  const { id } = req.params;
  try {
    await findCommunityByIdHelper(id);
    let allSubscriptions = await getCommunitySubscriptionsHelper(id);
    let { subscriptions, expiredSubscriptions } =
      getCommunitySubsStdForm(allSubscriptions);
    return res.status(200).json({ subscriptions, expiredSubscriptions });
  } catch (error) {
    console.log(
      `Error while fetching subscriptions of community:${id} @ ${__filename}`
    );
    console.log(error);
    next(error);
  }
};

// get people in the community
exports.getPeople = async function (req, res, next) {
  const { id } = req.params;
  try {
    await findCommunityByIdHelper(id);

    const allSubscriptions = await prisma.subscription.findMany({
      where: {
        communityId: parseInt(id),
      },
      include: {
        unifiedUser: {
          include: {
            user: true,
            expert: true,
            partner: true,
            admin: true
          },
        },
      },
    });

    return res.status(200).json({ users: allSubscriptions });
  } catch (error) {
    console.error(
      `Error while fetching users in community: ${id} @ ${__filename}`
    );
    console.error(error);
    next(error);
  }
};

// get community-sessions
exports.getSessions = async function (req, res, next) {
  const { id } = req.params;
  try {
    await findCommunityByIdHelper(id);

    // Get all sessions with their slots for the community
    const sessions = await prisma.session.findMany({
      where: {
        communityId: parseInt(id),
        isArchived: false
      },
      include: {
        SessionSlot: {
          include: {
            speakers: {
              select: {
                id: true,
                email: true,
                user: {
                  select: {
                    name: true,
                    photoURL: true
                  }
                },
                expert: {
                  select: {
                    name: true,
                    photoURL: true
                  }
                },
                partner: {
                  select: {
                    name: true,
                    photoURL: true
                  }
                },
                admin: {
                  select: {
                    name: true,
                    photoURL: true
                  }
                }
              }
            }
          },
          orderBy: {
            startTime: 'asc'
          }
        },
        creator: {
          select: {
            id: true,
            email: true,
            user: {
              select: {
                name: true,
                photoURL: true
              }
            },
            expert: {
              select: {
                name: true,
                photoURL: true
              }
            },
            partner: {
              select: {
                name: true,
                photoURL: true
              }
            }
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!sessions || sessions.length === 0) {
      return res.status(200).json({
        sessions: [],
        completedSessions: [],
        allSlots: [],
        upcomingSlots: [],
        completedSlots: [],
        total: 0,
        upcomingCount: 0,
        completedCount: 0
      });
    }

    // Current timestamp for comparison
    const now = new Date();

    // Process all slots across all sessions
    const allSlots = sessions.flatMap(session =>
      session.SessionSlot.map(slot => ({
        ...slot,
        sessionId: session.id,
        sessionTitle: session.title,
        sessionDesc: session.desc,
        isCompleted: new Date(slot.endTime) < now,
        isUpcoming: new Date(slot.endTime) >= now
      }))
    );

    // Sort all slots by start time
    allSlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Separate upcoming and completed slots
    const upcomingSlots = allSlots.filter(slot => !slot.isCompleted);
    const completedSlots = allSlots.filter(slot => slot.isCompleted);

    // Process sessions with their slots
    const processedSessions = sessions.map(session => {
      const sessionSlots = session.SessionSlot.map(slot => ({
        ...slot,
        isCompleted: new Date(slot.endTime) < now,
        isUpcoming: new Date(slot.endTime) >= now
      }));

      return {
        ...session,
        SessionSlot: sessionSlots,
        // A session is completed if all its slots are completed
        isCompleted: sessionSlots.every(slot => slot.isCompleted),
        // A session is upcoming if it has at least one upcoming slot
        isUpcoming: sessionSlots.some(slot => slot.isUpcoming),
        // Add next upcoming slot if any
        nextSlot: sessionSlots.find(slot => slot.isUpcoming)
      };
    });

    // Separate completed and upcoming sessions
    const completedSessions = processedSessions.filter(session => session.isCompleted);
    const upcomingSessions = processedSessions.filter(session => !session.isCompleted);

    // Sort upcoming sessions by their next slot's start time
    upcomingSessions.sort((a, b) => {
      const aTime = a.nextSlot ? new Date(a.nextSlot.startTime) : new Date('9999');
      const bTime = b.nextSlot ? new Date(b.nextSlot.startTime) : new Date('9999');
      return aTime - bTime;
    });

    return res.status(200).json({
      sessions: upcomingSessions,
      completedSessions,
      allSlots,
      upcomingSlots,
      completedSlots,
      total: sessions.length,
      totalSlots: allSlots.length,
      upcomingCount: upcomingSessions.length,
      completedCount: completedSessions.length,
      upcomingSlotsCount: upcomingSlots.length,
      completedSlotsCount: completedSlots.length
    });

  } catch (err) {
    console.error(`Error while fetching sessions for community: ${id}`, err);
    next(err);
  }
};

// get community by tag
exports.getCommunitiesByTag = async function (req, res, next) {
  const { tag } = req.query; // key-value pair dictionary
  try {
    const communities = await getCommunityByTagHelper(tag); // expects a string: returns an array of communities
    return res.status(200).json({ communities });
  } catch (err) {
    console.log(
      `Error searching for communities with tag: ${tag} @ ${__filename}`
    );
    console.log(err);
    next(err);
  }
};

// Bulk upload communities using XLSX
exports.bulkUploadCommunities = async function (req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an Excel file' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const results = {
      successful: [],
      failed: []
    };

    for (const row of data) {
      try {
        // Convert string arrays to actual arrays if they exist
        const infoImgs = row.infoImgs ? JSON.parse(row.infoImgs) : [];
        const questions = row.questions ? JSON.parse(row.questions) : [];

        const community = await prisma.community.create({
          data: {
            title: row.title,
            desc: row.desc,
            price: parseInt(row.price) || 0,
            gold_price: parseInt(row.gold_price) || 0,
            silver_price: parseInt(row.silver_price) || 0,
            platinum_price: parseInt(row.platinum_price) || 0,
            bannerImg: row.bannerImg || '',
            infoImgs: infoImgs,
            discountForCourses: parseInt(row.discountForCourses) || 0,
            creatorId: parseInt(row.creatorId),
            welcomeMsg: row.welcomeMsg || '',
            questions: questions,
            communityType: row.communityType || 'GENERAL',
            isApproved: row.isApproved === 'true',
            isCatchupLive: row.isCatchupLive === 'false',
          }
        });

        // If parentCommunityId is provided, create the mapping
        if (row.parentCommunityId) {
          await prisma.communityMapping.create({
            data: {
              parentCommunityId: parseInt(row.parentCommunityId),
              childCommunityId: community.id,
            },
          });
        }

        results.successful.push({
          row: row.title,
          id: community.id
        });
      } catch (error) {
        results.failed.push({
          row: row.title,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      message: 'Bulk upload completed',
      results: {
        totalProcessed: data.length,
        successful: results.successful.length,
        failed: results.failed.length,
        successfulEntries: results.successful,
        failedEntries: results.failed
      }
    });
  } catch (error) {
    console.log('Error in bulk upload:', error);
    next(error);
  }
};

// Get community activities with pagination
exports.getCommunityActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, type } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Validate community exists
    const community = await prisma.community.findUnique({
      where: { id: parseInt(id) }
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        error: 'Community not found'
      });
    }

    // Build activity queries based on type filter
    let activities = [];
    let totalCount = 0;

    if (!type || type === 'all') {
      // Get all activities
      const [
        posts,
        sessions,
        services,
        forms,
        resources,
        blogs,
        catchups,
        subscriptions
      ] = await Promise.all([
        // Posts
        prisma.post.findMany({
          where: { communityId: parseInt(id) },
          include: {
            creator: {
              include: {
                user: { select: { name: true, photoURL: true } },
                expert: { select: { name: true, photoURL: true } },
                partner: { select: { name: true, photoURL: true } },
                admin: { select: { name: true, photoURL: true } }
              }
            },
            childrenPosts: {
              include: {
                creator: {
                  include: {
                    user: { select: { name: true, photoURL: true } },
                    expert: { select: { name: true, photoURL: true } },
                    partner: { select: { name: true, photoURL: true } },
                    admin: { select: { name: true, photoURL: true } }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        // Sessions
        prisma.session.findMany({
          where: { communityId: parseInt(id) },
          include: {
            creator: {
              include: {
                user: { select: { name: true, photoURL: true } },
                expert: { select: { name: true, photoURL: true } },
                partner: { select: { name: true, photoURL: true } },
                admin: { select: { name: true, photoURL: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        // Services
        prisma.service.findMany({
          where: { communityId: parseInt(id) },
          include: {
            creator: {
              include: {
                user: { select: { name: true, photoURL: true } },
                expert: { select: { name: true, photoURL: true } },
                partner: { select: { name: true, photoURL: true } },
                admin: { select: { name: true, photoURL: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        // Forms
        prisma.form.findMany({
          where: {
            FormCommunity: {
              some: { communityId: parseInt(id) }
            }
          },
          include: {
            unifiedUser: {
              include: {
                user: { select: { name: true, photoURL: true } },
                expert: { select: { name: true, photoURL: true } },
                partner: { select: { name: true, photoURL: true } },
                admin: { select: { name: true, photoURL: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        // Resources
        prisma.resource.findMany({
          where: {
            community: {
              some: { id: parseInt(id) }
            }
          },
          include: {
            author: {
              include: {
                user: { select: { name: true, photoURL: true } },
                expert: { select: { name: true, photoURL: true } },
                partner: { select: { name: true, photoURL: true } },
                admin: { select: { name: true, photoURL: true } }
              }
            }
          },
          orderBy: { uploadedAt: 'desc' }
        }),
        // Blogs
        prisma.blog.findMany({
          where: { communityId: parseInt(id) },
          include: {
            author: {
              include: {
                user: { select: { name: true, photoURL: true } },
                expert: { select: { name: true, photoURL: true } },
                partner: { select: { name: true, photoURL: true } },
                admin: { select: { name: true, photoURL: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        // CatchUps
        prisma.catchUp.findMany({
          where: { communityId: parseInt(id) },
          include: {
            creator: {
              include: {
                user: { select: { name: true, photoURL: true } },
                expert: { select: { name: true, photoURL: true } },
                partner: { select: { name: true, photoURL: true } },
                admin: { select: { name: true, photoURL: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        // Subscriptions (new members)
        prisma.subscription.findMany({
          where: { communityId: parseInt(id) },
          include: {
            unifiedUser: {
              include: {
                user: { select: { name: true, photoURL: true } },
                expert: { select: { name: true, photoURL: true } },
                partner: { select: { name: true, photoURL: true } },
                admin: { select: { name: true, photoURL: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      // Transform posts into activities
      const postActivities = posts.map(post => ({
        id: `post_${post.id}`,
        type: 'post',
        title: post.title || 'New Post',
        description: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        creator: post.creator,
        metadata: {
          postId: post.id,
          isPoll: post.isPoll,
          isAsk: post.isAsk,
          isGreeting: post.isGreeting,
          replyCount: post.childrenPosts.length,
          hasParent: !!post.parentPostId
        }
      }));

      // Transform sessions into activities
      const sessionActivities = sessions.map(session => ({
        id: `session_${session.id}`,
        type: 'session',
        title: session.title,
        description: session.desc,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        creator: session.creator,
        metadata: {
          sessionId: session.id,
          isCourse: session.isCourse,
          isRecurring: session.isRecurring,
          isExclusive: session.isExclusive
        }
      }));

      // Transform services into activities
      const serviceActivities = services.map(service => ({
        id: `service_${service.id}`,
        type: 'service',
        title: service.title,
        description: service.description,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        creator: service.creator,
        metadata: {
          serviceId: service.id,
          imageUrl: service.imageUrl,
          videoUrl: service.videoUrl
        }
      }));

      // Transform forms into activities
      const formActivities = forms.map(form => ({
        id: `form_${form.id}`,
        type: 'form',
        title: form.formName,
        description: `Form created for community`,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        creator: form.unifiedUser,
        metadata: {
          formId: form.id,
          isGlobal: form.isGlobal
        }
      }));

      // Transform resources into activities
      const resourceActivities = resources.map(resource => ({
        id: `resource_${resource.id}`,
        type: 'resource',
        title: resource.name,
        description: `Resource shared: ${resource.name}`,
        createdAt: resource.uploadedAt,
        updatedAt: resource.uploadedAt,
        creator: resource.author,
        metadata: {
          resourceId: resource.id,
          link: resource.link,
          isApproved: resource.isApproved,
          isPostSession: resource.isPostSession,
          isPreSession: resource.isPreSession
        }
      }));

      // Transform blogs into activities
      const blogActivities = blogs.map(blog => ({
        id: `blog_${blog.id}`,
        type: 'blog',
        title: blog.title,
        description: blog.glance || blog.content.substring(0, 100),
        createdAt: blog.createdAt,
        updatedAt: blog.createdAt,
        creator: blog.author,
        metadata: {
          blogId: blog.id,
          isPrivate: blog.isPrivate,
          draft: blog.draft
        }
      }));

      // Transform catchups into activities
      const catchupActivities = catchups.map(catchup => ({
        id: `catchup_${catchup.id}`,
        type: 'catchup',
        title: catchup.title,
        description: catchup.desc,
        createdAt: catchup.createdAt,
        updatedAt: catchup.updatedAt,
        creator: catchup.creator,
        metadata: {
          catchupId: catchup.id,
          isLive: catchup.isLive,
          isCourse: catchup.isCourse
        }
      }));

      // Transform subscriptions into activities
      const subscriptionActivities = subscriptions.map(subscription => ({
        id: `subscription_${subscription.id}`,
        type: 'subscription',
        title: 'New Member Joined',
        description: `${subscription.unifiedUser.user?.name || subscription.unifiedUser.expert?.name || subscription.unifiedUser.partner?.name || subscription.unifiedUser.admin?.name} joined the community`,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        creator: subscription.unifiedUser,
        metadata: {
          subscriptionId: subscription.id,
          category: subscription.category,
          expiresAt: subscription.expiresAt
        }
      }));

      // Combine all activities and sort by creation date
      activities = [
        ...postActivities,
        ...sessionActivities,
        ...serviceActivities,
        ...formActivities,
        ...resourceActivities,
        ...blogActivities,
        ...catchupActivities,
        ...subscriptionActivities
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      totalCount = activities.length;
    } else {
      // Filter by specific type
      switch (type) {
        case 'posts':
          // Exclude archived posts and posts linked to huddle activities (announcements)
          const posts = await prisma.post.findMany({
            where: { 
              communityId: parseInt(id),
              isArchived: false,
              // Exclude posts that are linked to huddle activities (announcements)
              huddleActivities: {
                none: {}
              }
            },
            include: {
              creator: {
                include: {
                  user: { select: { name: true, photoURL: true } },
                  expert: { select: { name: true, photoURL: true } },
                  partner: { select: { name: true, photoURL: true } },
                  admin: { select: { name: true, photoURL: true } }
                }
              },
              childrenPosts: {
                include: {
                  creator: {
                    include: {
                      user: { select: { name: true, photoURL: true } },
                      expert: { select: { name: true, photoURL: true } },
                      partner: { select: { name: true, photoURL: true } },
                      admin: { select: { name: true, photoURL: true } }
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limitNum
          });

          const totalPosts = await prisma.post.count({
            where: { 
              communityId: parseInt(id),
              isArchived: false,
              // Exclude posts that are linked to huddle activities (announcements)
              huddleActivities: {
                none: {}
              }
            }
          });

          activities = posts.map(post => ({
            id: `post_${post.id}`,
            type: 'post',
            title: post.title || 'New Post',
            description: post.content,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            creator: post.creator,
            metadata: {
              postId: post.id,
              isPoll: post.isPoll,
              isAsk: post.isAsk,
              isGreeting: post.isGreeting,
              replyCount: post.childrenPosts.length,
              hasParent: !!post.parentPostId
            }
          }));

          totalCount = totalPosts;
          break;

        case 'sessions':
          const sessions = await prisma.session.findMany({
            where: { communityId: parseInt(id) },
            include: {
              creator: {
                include: {
                  user: { select: { name: true, photoURL: true } },
                  expert: { select: { name: true, photoURL: true } },
                  partner: { select: { name: true, photoURL: true } },
                  admin: { select: { name: true, photoURL: true } }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limitNum
          });

          const totalSessions = await prisma.session.count({
            where: { communityId: parseInt(id) }
          });

          activities = sessions.map(session => ({
            id: `session_${session.id}`,
            type: 'session',
            title: session.title,
            description: session.desc,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            creator: session.creator,
            metadata: {
              sessionId: session.id,
              isCourse: session.isCourse,
              isRecurring: session.isRecurring,
              isExclusive: session.isExclusive
            }
          }));

          totalCount = totalSessions;
          break;

        case 'services':
          const services = await prisma.service.findMany({
            where: { communityId: parseInt(id) },
            include: {
              creator: {
                include: {
                  user: { select: { name: true, photoURL: true } },
                  expert: { select: { name: true, photoURL: true } },
                  partner: { select: { name: true, photoURL: true } },
                  admin: { select: { name: true, photoURL: true } }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limitNum
          });

          const totalServices = await prisma.service.count({
            where: { communityId: parseInt(id) }
          });

          activities = services.map(service => ({
            id: `service_${service.id}`,
            type: 'service',
            title: service.title,
            description: service.description,
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
            creator: service.creator,
            metadata: {
              serviceId: service.id,
              imageUrl: service.imageUrl,
              videoUrl: service.videoUrl
            }
          }));

          totalCount = totalServices;
          break;

        case 'forms':
          const forms = await prisma.form.findMany({
            where: {
              FormCommunity: {
                some: { communityId: parseInt(id) }
              }
            },
            include: {
              unifiedUser: {
                include: {
                  user: { select: { name: true, photoURL: true } },
                  expert: { select: { name: true, photoURL: true } },
                  partner: { select: { name: true, photoURL: true } },
                  admin: { select: { name: true, photoURL: true } }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limitNum
          });

          const totalForms = await prisma.form.count({
            where: {
              FormCommunity: {
                some: { communityId: parseInt(id) }
              }
            }
          });

          activities = forms.map(form => ({
            id: `form_${form.id}`,
            type: 'form',
            title: form.formName,
            description: `Form created for community`,
            createdAt: form.createdAt,
            updatedAt: form.updatedAt,
            creator: form.unifiedUser,
            metadata: {
              formId: form.id,
              isGlobal: form.isGlobal
            }
          }));

          totalCount = totalForms;
          break;

        case 'resources':
          const resources = await prisma.resource.findMany({
            where: {
              community: {
                some: { id: parseInt(id) }
              }
            },
            include: {
              author: {
                include: {
                  user: { select: { name: true, photoURL: true } },
                  expert: { select: { name: true, photoURL: true } },
                  partner: { select: { name: true, photoURL: true } },
                  admin: { select: { name: true, photoURL: true } }
                }
              }
            },
            orderBy: { uploadedAt: 'desc' },
            skip: offset,
            take: limitNum
          });

          const totalResources = await prisma.resource.count({
            where: {
              community: {
                some: { id: parseInt(id) }
              }
            }
          });

          activities = resources.map(resource => ({
            id: `resource_${resource.id}`,
            type: 'resource',
            title: resource.name,
            description: `Resource shared: ${resource.name}`,
            createdAt: resource.uploadedAt,
            updatedAt: resource.uploadedAt,
            creator: resource.author,
            metadata: {
              resourceId: resource.id,
              link: resource.link,
              isApproved: resource.isApproved,
              isPostSession: resource.isPostSession,
              isPreSession: resource.isPreSession
            }
          }));

          totalCount = totalResources;
          break;

        case 'blogs':
          const blogs = await prisma.blog.findMany({
            where: { communityId: parseInt(id) },
            include: {
              author: {
                include: {
                  user: { select: { name: true, photoURL: true } },
                  expert: { select: { name: true, photoURL: true } },
                  partner: { select: { name: true, photoURL: true } },
                  admin: { select: { name: true, photoURL: true } }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limitNum
          });

          const totalBlogs = await prisma.blog.count({
            where: { communityId: parseInt(id) }
          });

          activities = blogs.map(blog => ({
            id: `blog_${blog.id}`,
            type: 'blog',
            title: blog.title,
            description: blog.glance || blog.content.substring(0, 100),
            createdAt: blog.createdAt,
            updatedAt: blog.createdAt,
            creator: blog.author,
            metadata: {
              blogId: blog.id,
              isPrivate: blog.isPrivate,
              draft: blog.draft
            }
          }));

          totalCount = totalBlogs;
          break;

        case 'catchups':
          const catchups = await prisma.catchUp.findMany({
            where: { communityId: parseInt(id) },
            include: {
              creator: {
                include: {
                  user: { select: { name: true, photoURL: true } },
                  expert: { select: { name: true, photoURL: true } },
                  partner: { select: { name: true, photoURL: true } },
                  admin: { select: { name: true, photoURL: true } }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limitNum
          });

          const totalCatchups = await prisma.catchUp.count({
            where: { communityId: parseInt(id) }
          });

          activities = catchups.map(catchup => ({
            id: `catchup_${catchup.id}`,
            type: 'catchup',
            title: catchup.title,
            description: catchup.desc,
            createdAt: catchup.createdAt,
            updatedAt: catchup.updatedAt,
            creator: catchup.creator,
            metadata: {
              catchupId: catchup.id,
              isLive: catchup.isLive,
              isCourse: catchup.isCourse
            }
          }));

          totalCount = totalCatchups;
          break;

        case 'subscriptions':
          const subscriptions = await prisma.subscription.findMany({
            where: { communityId: parseInt(id) },
            include: {
              unifiedUser: {
                include: {
                  user: { select: { name: true, photoURL: true } },
                  expert: { select: { name: true, photoURL: true } },
                  partner: { select: { name: true, photoURL: true } },
                  admin: { select: { name: true, photoURL: true } }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limitNum
          });

          const totalSubscriptions = await prisma.subscription.count({
            where: { communityId: parseInt(id) }
          });

          activities = subscriptions.map(subscription => ({
            id: `subscription_${subscription.id}`,
            type: 'subscription',
            title: 'New Member Joined',
            description: `${subscription.unifiedUser.user?.name || subscription.unifiedUser.expert?.name || subscription.unifiedUser.partner?.name || subscription.unifiedUser.admin?.name} joined the community`,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
            creator: subscription.unifiedUser,
            metadata: {
              subscriptionId: subscription.id,
              category: subscription.category,
              expiresAt: subscription.expiresAt
            }
          }));

          totalCount = totalSubscriptions;
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid activity type. Valid types: all, posts, sessions, services, forms, resources, blogs, catchups, subscriptions'
          });
      }
    }

    // Apply pagination for 'all' type
    if (!type || type === 'all') {
      activities = activities.slice(offset, offset + limitNum);
    }

    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.status(200).json({
      success: true,
      activities,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error fetching community activities:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch community activities',
      message: error.message
    });
  }
};

// Get communities for parent selection (filtered)
exports.getCommunitiesForParentSelection = async (req, res) => {
  try {
    // First get all communities with their parent relationships
    const allCommunities = await prisma.community.findMany({

      include: {
        parentCommunities: {
          include: {
            parentCommunity: true,
          },
        }
      },
      orderBy: {
        title: 'asc'
      }
    });

    console.log('All communities:', allCommunities.length);

    // Filter out communities that already have parent communities
    const communities = allCommunities.filter(community => {
      // Check if this community has any parent communities (is a child) OR is DEFAULT type
      const hasParents = community.parentCommunities && community.parentCommunities.length > 0;
      const isDefault = community.communityType === 'DEFAULT';
      return !hasParents && !isDefault;
    }).map(community => ({
      id: community.id,
      title: community.title,
      desc: community.desc,
      bannerImg: community.bannerImg,
      communityType: community.communityType,
      isApproved: community.isApproved
    }));

    return res.status(200).json({
      success: true,
      communities
    });
  } catch (error) {
    console.error("Error fetching communities for parent selection:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch communities for parent selection",
      error: error.message
    });
  }
};

/////////////////////=====================Partner community controllers======================/////////////////////



exports.getPartnerCommunities = async (req, res) => {
  try {
    const { partnerId } = req.query;

    if (!partnerId) {
      return res.status(400).json({ success: false, message: "partnerId is required" });
    }

    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(partnerId) },
      include: { unifiedUserId: true }
    });

    if (!partner || !partner.unifiedUserId) {
      return res.status(404).json({ success: false, message: "Partner not found or unified user missing" });
    }

    const unifiedId = partner.unifiedUserId.id;

    const communities = await prisma.community.findMany({
      where: {
        creatorId: unifiedId,
        isArchived: false
      },
      include: {
        parentCommunities: {
          include: {
            childCommunity: true,
          },
        },
        childCommunities: {
          include: {
            parentCommunity: true,
          },
        },
        subscriptions: {
          include: {
            unifiedUser: true,
          },
        },
        creator: true,
        FormCommunity: {
          include: {
            Community: true,
            Form: true
          }
        }
      }
    });

    const result = communities.map(community => ({
      id: community.id,
      title: community.title,
      desc: community.desc,
      price: community.price,
      gold_price: community.gold_price,
      silver_price: community.silver_price,
      platinum_price: community.platinum_price,
      bannerImg: community.bannerImg,
      infoImgs: community.infoImgs,
      discountForCourses: community.discountForCourses,
      isArchived: community.isArchived,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
      creatorId: community.creatorId,
      welcomeMsg: community.welcomeMsg,
      questions: community.questions,
      visibility: community.visibility,
      initialCommunity: community.initialCommunity,
      communityType: community.communityType,
      isApproved: community.isApproved,
      isCatchupLive: community.isCatchupLive,
      parentCommunities: (community.childCommunities || []).filter(p => p?.parentCommunity?.id).map(p => p.parentCommunity),
      childCommunities: (community.parentCommunities || []).filter(c => c?.childCommunity?.id).map(c => c.childCommunity),
      subscriptionTrue: community.subscriptions || [],
      forms: (community.FormCommunity || []).map(f => f.Form),
    }));

    return res.status(200).json({
      success: true,
      communities: result
    });
  } catch (error) {
    console.error("Error fetching partner communities:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch partner communities",
      error: error.message
    });
  }
};

// New endpoint: getCommunityTags
exports.getCommunityTags = async function (req, res, next) {
  try {
    const { includeArchived = false } = req.query;
    
    const where = {
      tagType: 'community',
      ...(includeArchived === 'true' ? {} : { isArchived: false })
    };
    
    const tags = await prisma.tag.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });
    return res.status(200).json({ tags });
  } catch (error) {
    console.log(`Error while fetching community tags, ${__filename}`);
    console.log(error);
    next(error);
  }
};

// Create a community tag (automatically sets tagType to 'community')
exports.createCommunityTag = async function (req, res) {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required'
      });
    }

    // Check if tag already exists
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });

    if (existingTag) {
      return res.status(409).json({
        success: false,
        message: 'Tag with this name already exists'
      });
    }

    const newTag = await prisma.tag.create({
      data: {
        name,
        description,
        tagType: 'community'
      }
    });

    res.status(201).json({
      success: true,
      tag: newTag
    });
  } catch (error) {
    console.error('Error creating community tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create community tag',
      message: error.message
    });
  }
};

// Get popular community tags only
exports.getPopularCommunityTags = async function (req, res, next) {
  try {
    const { limit = 10, includeArchived = false } = req.query;
    
    const where = {
      tagType: 'community',
      ...(includeArchived === 'true' ? {} : { isArchived: false })
    };
    
    const popularTags = await prisma.tag.findMany({
      where,
      include: {
        _count: {
          select: {
            CommunityTags: true
          }
        }
      },
      orderBy: {
        CommunityTags: {
          _count: 'desc'
        }
      },
      take: parseInt(limit)
    });

    const tagsWithCount = popularTags.map(tag => ({
      id: tag.id,
      name: tag.name,
      description: tag.description,
      tagType: tag.tagType,
      createdAt: tag.createdAt,
      isArchived: tag.isArchived,
      communityCount: tag._count.CommunityTags
    }));

    return res.status(200).json({
      success: true,
      tags: tagsWithCount,
      total: tagsWithCount.length
    });
  } catch (error) {
    console.error('Error fetching popular community tags:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch popular community tags',
      message: error.message
    });
  }
};

// Search community tags by name
exports.searchCommunityTags = async function (req, res, next) {
  try {
    const { q, limit = 20, includeArchived = false } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const where = {
      AND: [
        {
          name: {
            contains: q.trim(),
            mode: 'insensitive'
          }
        },
        {
          tagType: 'community'
        },
        ...(includeArchived === 'true' ? [] : [{ isArchived: false }])
      ]
    };

    const tags = await prisma.tag.findMany({
      where,
      include: {
        _count: {
          select: {
            CommunityTags: true
          }
        }
      },
      orderBy: [
        {
          CommunityTags: {
            _count: 'desc'
          }
        },
        {
          name: 'asc'
        }
      ],
      take: parseInt(limit)
    });

    const tagsWithCount = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      description: tag.description,
      tagType: tag.tagType,
      createdAt: tag.createdAt,
      isArchived: tag.isArchived,
      communityCount: tag._count.CommunityTags
    }));

    return res.status(200).json({
      success: true,
      tags: tagsWithCount,
      total: tagsWithCount.length,
      query: q.trim()
    });
  } catch (error) {
    console.error('Error searching community tags:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search community tags',
      message: error.message
    });
  }
};

// Bulk create community tags
exports.bulkCreateCommunityTags = async function (req, res, next) {
  try {
    const { tags } = req.body;
    
    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tags array is required and must not be empty'
      });
    }

    const results = {
      created: [],
      skipped: [],
      errors: []
    };

    for (const tagName of tags) {
      try {
        if (!tagName || typeof tagName !== 'string' || tagName.trim().length === 0) {
          results.errors.push({
            tag: tagName,
            error: 'Invalid tag name'
          });
          continue;
        }

        const trimmedName = tagName.trim();
        
        // Check if tag already exists
        const existingTag = await prisma.tag.findFirst({
          where: {
            name: {
              equals: trimmedName,
              mode: 'insensitive'
            }
          }
        });

        if (existingTag) {
          results.skipped.push({
            id: existingTag.id,
            name: existingTag.name,
            reason: 'Tag already exists'
          });
        } else {
          const newTag = await prisma.tag.create({
            data: {
              name: trimmedName,
              tagType: 'community'
            }
          });
          results.created.push(newTag);
        }
      } catch (error) {
        results.errors.push({
          tag: tagName,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      results,
      summary: {
        total: tags.length,
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      }
    });
  } catch (error) {
    console.error('Error bulk creating community tags:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to bulk create community tags',
      message: error.message
    });
  }
};

// Get detailed tag statistics
exports.getTagStatistics = async function (req, res, next) {
  try {
    const { tagId } = req.params;
    
    if (!tagId) {
      return res.status(400).json({
        success: false,
        message: 'Tag ID is required'
      });
    }

    const tag = await prisma.tag.findUnique({
      where: { id: parseInt(tagId) },
      include: {
        CommunityTags: {
          include: {
            community: {
              select: {
                id: true,
                title: true,
                isApproved: true,
                isArchived: true
              }
            }
          }
        },
        BlogTags: {
          include: {
            blog: {
              select: {
                id: true,
                title: true,
                isArchived: true
              }
            }
          }
        },
        postTag: {
          include: {
            post: {
              select: {
                id: true,
                title: true,
                isArchived: true
              }
            }
          }
        },
        sessionTags: {
          include: {
            session: {
              select: {
                id: true,
                title: true,
                isArchived: true
              }
            }
          }
        }
      }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Calculate statistics
    const stats = {
      id: tag.id,
      name: tag.name,
      description: tag.description,
      color: tag.color,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      usage: {
        communities: {
          total: tag.CommunityTags.length,
          active: tag.CommunityTags.filter(ct => ct.community.isApproved && !ct.community.isArchived).length,
          archived: tag.CommunityTags.filter(ct => ct.community.isArchived).length,
          pending: tag.CommunityTags.filter(ct => !ct.community.isApproved).length
        },
        blogs: {
          total: tag.BlogTags.length,
          active: tag.BlogTags.filter(bt => !bt.blog.isArchived).length,
          archived: tag.BlogTags.filter(bt => bt.blog.isArchived).length
        },
        posts: {
          total: tag.postTag.length,
          active: tag.postTag.filter(pt => !pt.post.isArchived).length,
          archived: tag.postTag.filter(pt => pt.post.isArchived).length
        },
        sessions: {
          total: tag.sessionTags.length,
          active: tag.sessionTags.filter(st => !st.session.isArchived).length,
          archived: tag.sessionTags.filter(st => st.session.isArchived).length
        }
      },
      totalUsage: tag.CommunityTags.length + tag.BlogTags.length + tag.postTag.length + tag.sessionTags.length
    };

    return res.status(200).json({
      success: true,
      tag: stats
    });
  } catch (error) {
    console.error('Error fetching tag statistics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tag statistics',
      message: error.message
    });
  }
};

// Get tags of a specific community
exports.getCommunityTagsById = async function (req, res) {
  const { id } = req.params;
  try {
    const tags = await prisma.communityTags.findMany({
      where: { communityId: parseInt(id) },
      include: { tag: true }
    });
    res.status(200).json({
      success: true,
      tags: tags.map(t => t.tag)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community tags',
      message: error.message
    });
  }
};

// Create a new tag (general tag management)
exports.createTag = async function (req, res) {
  try {
    const { name, description, tagType } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required'
      });
    }

    // Validate tagType if provided
    const validTagTypes = ['community', 'post', 'blog', 'session', 'general'];
    if (tagType && !validTagTypes.includes(tagType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid tagType. Must be one of: ${validTagTypes.join(', ')}`
      });
    }

    // Check if tag already exists
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });

    if (existingTag) {
      return res.status(409).json({
        success: false,
        message: 'Tag with this name already exists'
      });
    }

    const newTag = await prisma.tag.create({
      data: {
        name,
        description,
        tagType: tagType || 'general'
      }
    });

    res.status(201).json({
      success: true,
      tag: newTag
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create tag',
      message: error.message
    });
  }
};

// Update a tag
exports.updateTag = async function (req, res) {
  try {
    const { id } = req.params;
    const { name, description, tagType } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required'
      });
    }

    // Validate tagType if provided
    const validTagTypes = ['community', 'post', 'blog', 'session', 'general'];
    if (tagType && !validTagTypes.includes(tagType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid tagType. Must be one of: ${validTagTypes.join(', ')}`
      });
    }

    // Check if tag exists and is not archived
    const existingTag = await prisma.tag.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    if (existingTag.isArchived) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update an archived tag'
      });
    }

    // Check if new name conflicts with existing tag
    const conflictingTag = await prisma.tag.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        id: {
          not: parseInt(id)
        }
      }
    });

    if (conflictingTag) {
      return res.status(409).json({
        success: false,
        message: 'Tag with this name already exists'
      });
    }

    const updatedTag = await prisma.tag.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        tagType: tagType || existingTag.tagType || 'general'
      }
    });

    res.status(200).json({
      success: true,
      tag: updatedTag
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tag',
      message: error.message
    });
  }
};

// Delete a tag
exports.deleteTag = async function (req, res) {
  try {
    const { id } = req.params;

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id: parseInt(id) },
      include: {
        CommunityTags: true,
        BlogTags: true,
        postTag: true,
        sessionTags: true
      }
    });

    if (!existingTag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Check if tag is being used anywhere
    const totalUsage = (existingTag.CommunityTags?.length || 0) + 
                      (existingTag.BlogTags?.length || 0) + 
                      (existingTag.postTag?.length || 0) + 
                      (existingTag.sessionTags?.length || 0);

    if (totalUsage > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete tag that is being used',
        usage: {
          communities: existingTag.CommunityTags?.length || 0,
          blogs: existingTag.BlogTags?.length || 0,
          posts: existingTag.postTag?.length || 0,
          sessions: existingTag.sessionTags?.length || 0,
          total: totalUsage
        }
      });
    }

    await prisma.tag.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tag',
      message: error.message
    });
  }
};

// Get tag by ID
exports.getTagById = async function (req, res) {
  try {
    const { id } = req.params;

    const tag = await prisma.tag.findUnique({
      where: { id: parseInt(id) },
      include: {
        CommunityTags: {
          include: {
            community: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    res.status(200).json({
      success: true,
      tag
    });
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tag',
      message: error.message
    });
  }
};

// Archive a tag (soft delete)
exports.archiveTag = async function (req, res) {
  try {
    const { id } = req.params;

    const tag = await prisma.tag.findUnique({
      where: { id: parseInt(id) }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    if (tag.isArchived) {
      return res.status(400).json({
        success: false,
        message: 'Tag is already archived'
      });
    }

    const archivedTag = await prisma.tag.update({
      where: { id: parseInt(id) },
      data: { isArchived: true }
    });

    res.status(200).json({
      success: true,
      message: 'Tag archived successfully',
      tag: archivedTag
    });
  } catch (error) {
    console.error('Error archiving tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive tag',
      message: error.message
    });
  }
};

// Unarchive a tag
exports.unarchiveTag = async function (req, res) {
  try {
    const { id } = req.params;

    const tag = await prisma.tag.findUnique({
      where: { id: parseInt(id) }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    if (!tag.isArchived) {
      return res.status(400).json({
        success: false,
        message: 'Tag is not archived'
      });
    }

    const unarchivedTag = await prisma.tag.update({
      where: { id: parseInt(id) },
      data: { isArchived: false }
    });

    res.status(200).json({
      success: true,
      message: 'Tag unarchived successfully',
      tag: unarchivedTag
    });
  } catch (error) {
    console.error('Error unarchiving tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unarchive tag',
      message: error.message
    });
  }
};

// Get communities by tag ID
exports.getCommunitiesByTagId = async function (req, res, next) {
  try {
    const { tagId } = req.params;
    
    if (!tagId) {
      return res.status(400).json({
        success: false,
        message: 'Tag ID is required'
      });
    }

    const communities = await prisma.community.findMany({
      where: {
        CommunityTags: {
          some: {
            tagId: parseInt(tagId)
          }
        },
        isArchived: false
      },
      include: {
        parentCommunities: {
          include: {
            parentCommunity: true,
          },
        },
        childCommunities: {
          include: {
            childCommunity: true,
          },
        },
        subscriptions: {
          include: {
            unifiedUser: true,
          },
        },
        creator: true,
        FormCommunity: {
          include: {
            Community: true,
            Form: true
          }
        },
        CommunityTags: {
          include: {
            Tag: true
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    });

    return res.status(200).json({
      success: true,
      communities: communities,
      tagId: parseInt(tagId)
    });
  } catch (error) {
    console.error('Error fetching communities by tag ID:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch communities by tag',
      message: error.message
    });
  }
};

// Get all community tags (tags that are associated with communities)
exports.getCommunityTagsOnly = async function (req, res, next) {
  try {
    // Get all tags that are associated with communities
    const communityTags = await prisma.communityTags.findMany({
      include: {
        tag: true,
        community: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        tag: {
          name: 'asc'
        }
      }
    });

    // Group by tag and count communities
    const tagStats = {};
    communityTags.forEach(ct => {
      const tagId = ct.tag.id;
      if (!tagStats[tagId]) {
        tagStats[tagId] = {
          id: ct.tag.id,
          name: ct.tag.name,
          createdAt: ct.tag.createdAt,
          communities: [],
          communityCount: 0
        };
      }
      tagStats[tagId].communities.push({
        id: ct.community.id,
        title: ct.community.title
      });
      tagStats[tagId].communityCount++;
    });

    const uniqueTags = Object.values(tagStats);

    return res.status(200).json({
      success: true,
      tags: uniqueTags,
      totalTags: uniqueTags.length,
      totalAssociations: communityTags.length
    });
  } catch (error) {
    console.error('Error fetching community tags:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch community tags',
      message: error.message
    });
  }
};

// Get all tags in the system (including those not used by communities)
exports.getAllTagsInSystem = async function (req, res, next) {
  try {
    // Get all tags with basic info first
    const allTags = await prisma.tag.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    // Get usage counts separately to avoid complex joins
    const usageStats = await Promise.all(
      allTags.map(async (tag) => {
        const [communityCount, blogCount, postCount, sessionCount] = await Promise.all([
          prisma.communityTags.count({ where: { tagId: tag.id } }),
          prisma.blogTags.count({ where: { tagId: tag.id } }),
          prisma.postTag.count({ where: { tagId: tag.id } }),
          prisma.sessionTags.count({ where: { tagId: tag.id } })
        ]);

        return {
          id: tag.id,
          name: tag.name,
          description: tag.description,
          tagType: tag.tagType,
          createdAt: tag.createdAt,
          usage: {
            communities: communityCount,
            blogs: blogCount,
            posts: postCount,
            sessions: sessionCount,
            total: communityCount + blogCount + postCount + sessionCount
          }
        };
      })
    );

    // Calculate summary statistics
    const summary = {
      tagsWithCommunities: usageStats.filter(t => t.usage.communities > 0).length,
      tagsWithBlogs: usageStats.filter(t => t.usage.blogs > 0).length,
      tagsWithPosts: usageStats.filter(t => t.usage.posts > 0).length,
      tagsWithSessions: usageStats.filter(t => t.usage.sessions > 0).length,
      unusedTags: usageStats.filter(t => t.usage.total === 0).length
    };

    return res.status(200).json({
      success: true,
      tags: usageStats,
      totalTags: usageStats.length,
      summary
    });
  } catch (error) {
    console.error('Error fetching all tags:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch all tags',
      message: error.message
    });
  }
};

// Get popular tags (most used by communities)
exports.getPopularTags = async function (req, res, next) {
  try {
    const { limit = 10 } = req.query;
    
    const popularTags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            CommunityTags: true
          }
        }
      },
      orderBy: {
        CommunityTags: {
          _count: 'desc'
        }
      },
      take: parseInt(limit)
    });

    const tagsWithCount = popularTags.map(tag => ({
      id: tag.id,
      name: tag.name,
      description: tag.description,
      tagType: tag.tagType,
      createdAt: tag.createdAt,
      communityCount: tag._count.CommunityTags
    }));

    return res.status(200).json({
      success: true,
      tags: tagsWithCount,
      total: tagsWithCount.length
    });
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch popular tags',
      message: error.message
    });
  }
};

// Search tags by name
exports.searchTags = async function (req, res, next) {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const tags = await prisma.tag.findMany({
      where: {
        name: {
          contains: q.trim(),
          mode: 'insensitive'
        }
      },
      include: {
        _count: {
          select: {
            CommunityTags: true
          }
        }
      },
      orderBy: [
        {
          CommunityTags: {
            _count: 'desc'
          }
        },
        {
          name: 'asc'
        }
      ],
      take: parseInt(limit)
    });

    const tagsWithCount = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      description: tag.description,
      tagType: tag.tagType,
      createdAt: tag.createdAt,
      communityCount: tag._count.CommunityTags
    }));

    return res.status(200).json({
      success: true,
      tags: tagsWithCount,
      total: tagsWithCount.length,
      query: q.trim()
    });
  } catch (error) {
    console.error('Error searching tags:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search tags',
      message: error.message
    });
  }
};

// Get tag suggestions for communities
exports.getTagSuggestions = async function (req, res, next) {
  try {
    const { communityId, limit = 10 } = req.query;
    
    let suggestions = [];
    
    if (communityId) {
      // Get tags from similar communities
      const community = await prisma.community.findUnique({
        where: { id: parseInt(communityId) },
        include: {
          CommunityTags: {
            include: {
              Tag: true
            }
          }
        }
      });

      if (community) {
        // Get tags from communities with similar tags
        const similarCommunities = await prisma.community.findMany({
          where: {
            id: { not: parseInt(communityId) },
            CommunityTags: {
              some: {
                tagId: {
                  in: community.CommunityTags.map(t => t.tagId)
                }
              }
            },
            isArchived: false,
            isApproved: true
          },
          include: {
            CommunityTags: {
              include: {
                Tag: true
              }
            }
          }
        });

        // Collect all tags from similar communities
        const allTags = similarCommunities.flatMap(c => c.CommunityTags.map(t => t.Tag));
        
        // Count tag frequency
        const tagCount = {};
        allTags.forEach(tag => {
          tagCount[tag.id] = (tagCount[tag.id] || 0) + 1;
        });

        // Convert to array and sort by frequency
        suggestions = Object.entries(tagCount)
          .map(([id, count]) => ({
            id: parseInt(id),
            name: allTags.find(t => t.id === parseInt(id)).name,
            frequency: count
          }))
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, parseInt(limit));
      }
    } else {
      // Get most popular tags if no community ID provided
      const popularTags = await prisma.tag.findMany({
        include: {
          _count: {
            select: {
              CommunityTags: true
            }
          }
        },
        orderBy: {
          CommunityTags: {
            _count: 'desc'
          }
        },
        take: parseInt(limit)
      });

      suggestions = popularTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        frequency: tag._count.CommunityTags
      }));
    }

    return res.status(200).json({
      success: true,
      suggestions,
      total: suggestions.length
    });
  } catch (error) {
    console.error('Error getting tag suggestions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get tag suggestions',
      message: error.message
    });
  }
};

// Bulk create tags
exports.bulkCreateTags = async function (req, res, next) {
  try {
    const { tags } = req.body;
    
    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tags array is required and must not be empty'
      });
    }

    const results = {
      created: [],
      skipped: [],
      errors: []
    };

    for (const tagName of tags) {
      try {
        if (!tagName || typeof tagName !== 'string' || tagName.trim().length === 0) {
          results.errors.push({
            tag: tagName,
            error: 'Invalid tag name'
          });
          continue;
        }

        const trimmedName = tagName.trim();
        
        // Check if tag already exists
        const existingTag = await prisma.tag.findFirst({
          where: {
            name: {
              equals: trimmedName,
              mode: 'insensitive'
            }
          }
        });

        if (existingTag) {
          results.skipped.push({
            id: existingTag.id,
            name: existingTag.name,
            reason: 'Tag already exists'
          });
        } else {
          const newTag = await prisma.tag.create({
            data: {
              name: trimmedName
            }
          });
          results.created.push(newTag);
        }
      } catch (error) {
        results.errors.push({
          tag: tagName,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      results,
      summary: {
        total: tags.length,
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      }
    });
  } catch (error) {
    console.error('Error bulk creating tags:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to bulk create tags',
      message: error.message
    });
  }
};

// Get recent communities created by the authenticated user
exports.getRecentCommunitiesByUser = async (req, res) => {
  try {
    const { userId, userType } = req.user;
    
    if (!userId || !userType) {
      return res.status(400).json({
        success: false,
        error: 'userId and userType are required'
      });
    }

    // Get unified user ID
    let unifiedUserId = null;
    if (userId && (userType === 'user' || userType === 'expert' || userType === 'partner' || userType === 'admin')) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        include: { unifiedUserId: true }
      });
      unifiedUserId = user?.unifiedUserId?.id;
    }

    if (!unifiedUserId) {
      return res.status(400).json({
        success: false,
        error: 'Unified user ID not found'
      });
    }

    const recentCommunities = await prisma.community.findMany({
      where: {
        creatorId: unifiedUserId,
        isArchived: false
      },
      include: {
        parentCommunities: {
          include: {
            parentCommunity: true,
          },
        },
        childCommunities: {
          include: {
            childCommunity: true,
          },
        },
        subscriptions: {
          include: {
            unifiedUser: true,
          },
        },
        creator: true,
        FormCommunity: {
          include: {
            Community: true,
            Form: true
          }
        },
        CommunityTags: {
          include: {
            Tag: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to 10 most recent
    });

    const result = recentCommunities.map(community => ({
      id: community.id,
      title: community.title,
      desc: community.desc,
      price: community.price,
      gold_price: community.gold_price,
      silver_price: community.silver_price,
      platinum_price: community.platinum_price,
      bannerImg: community.bannerImg,
      infoImgs: community.infoImgs,
      discountForCourses: community.discountForCourses,
      isArchived: community.isArchived,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
      creatorId: community.creatorId,
      welcomeMsg: community.welcomeMsg,
      questions: community.questions,
      visibility: community.visibility,
      initialCommunity: community.initialCommunity,
      communityType: community.communityType,
      isApproved: community.isApproved,
      isCatchupLive: community.isCatchupLive,
      parentCommunities: (community.parentCommunities || [])
        .filter(pc => pc && pc.parentCommunity)
        .map(pc => pc.parentCommunity),
      childCommunities: (community.childCommunities || [])
        .filter(cc => cc && cc.childCommunity)
        .map(cc => cc.childCommunity),
      subscriptionTrue: community.subscriptions || [],
      forms: (community.FormCommunity || []).map(form => form.Form),
      tags: (community.CommunityTags || []).map(t => t.Tag),
    }));

    return res.status(200).json({
      success: true,
      communities: result
    });

  } catch (error) {
    console.error("Error fetching recent communities by user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent communities",
      error: error.message
    });
  }
};

// Search communities by title, description, or tags
exports.searchCommunities = async (req, res) => {
  try {
    console.log('Authenticated search endpoint called with query:', req.query);
    console.log('User info:', req.user);
    
    const { q, page = 1, limit = 12 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Check if user is authenticated
    if (!req.user || !req.user.unifiedUserId || !req.user.userType) {
      console.log('Authentication failed - missing user info');
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id, userType } = req.user;
    const searchQuery = q.trim();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Get unified user ID if user is authenticated
    let unifiedUserId = null;
    if (id && (userType === 'user' || userType === 'expert')) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: { unifiedUserId: true }
      });
      unifiedUserId = user?.unifiedUserId?.id;
    }

    // Base where clause for search
    let where = {
      OR: [
        {
          title: {
            contains: searchQuery,
            mode: 'insensitive'
          }
        },
        {
          desc: {
            contains: searchQuery,
            mode: 'insensitive'
          }
        },
        {
          CommunityTags: {
            some: {
              Tag: {
                name: {
                  contains: searchQuery,
                  mode: 'insensitive'
                }
              }
            }
          }
        }
      ],
      isArchived: false
    };

    // No visibility restrictions - anyone can search all communities
    // Visibility restrictions removed as per user request

    // Get total count for pagination
    const totalCount = await prisma.community.count({ where });

    // Get communities with pagination
    const communities = await prisma.community.findMany({
      where,
      include: {
        parentCommunities: {
          include: {
            parentCommunity: true,
          },
        },
        childCommunities: {
          include: {
            childCommunity: true,
          },
        },
        subscriptions: {
          include: {
            unifiedUser: true,
          },
        },
        creator: true,
        FormCommunity: {
          include: {
            Community: true,
            Form: true
          }
        },
        CommunityTags: {
          include: {
            Tag: true
          }
        }
      },
      skip: offset,
      take: limitNum,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const result = communities.map(community => ({
      id: community.id,
      title: community.title,
      desc: community.desc,
      price: community.price,
      gold_price: community.gold_price,
      silver_price: community.silver_price,
      platinum_price: community.platinum_price,
      bannerImg: community.bannerImg,
      infoImgs: community.infoImgs,
      discountForCourses: community.discountForCourses,
      isArchived: community.isArchived,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
      creatorId: community.creatorId,
      welcomeMsg: community.welcomeMsg,
      questions: community.questions,
      visibility: community.visibility,
      initialCommunity: community.initialCommunity,
      communityType: community.communityType,
      isApproved: community.isApproved,
      isCatchupLive: community.isCatchupLive,
      parentCommunities: (community.parentCommunities || [])
        .filter(pc => pc && pc.parentCommunity)
        .map(pc => pc.parentCommunity),
      childCommunities: (community.childCommunities || [])
        .filter(cc => cc && cc.childCommunity)
        .map(cc => cc.childCommunity),
      subscriptionTrue: community.subscriptions || [],
      forms: (community.FormCommunity || []).map(form => form.Form),
      tags: (community.CommunityTags || []).map(t => t.Tag),
    }));

    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.status(200).json({
      success: true,
      communities: result,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      },
      searchQuery
    });

  } catch (error) {
    console.error("Error searching communities:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search communities",
      error: error.message
    });
  }
};

// Public search communities (no authentication required)
exports.searchCommunitiesPublic = async (req, res) => {
  try {
    console.log('Public search endpoint called with query:', req.query);
    const { q, page = 1, limit = 12 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchQuery = q.trim();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Base where clause for search - only public communities
    const where = {
      OR: [
        {
          title: {
            contains: searchQuery,
            mode: 'insensitive'
          }
        },
        {
          desc: {
            contains: searchQuery,
            mode: 'insensitive'
          }
        },
        {
          CommunityTags: {
            some: {
              Tag: {
                name: {
                  contains: searchQuery,
                  mode: 'insensitive'
                }
              }
            }
          }
        }
      ],
      isArchived: false,
      visibility: 'PUBLIC' // Only search public communities
    };

    // Get total count for pagination
    const totalCount = await prisma.community.count({ where });

    // Get communities with pagination
    const communities = await prisma.community.findMany({
      where,
      include: {
        parentCommunities: {
          include: {
            parentCommunity: true,
          },
        },
        childCommunities: {
          include: {
            childCommunity: true,
          },
        },
        subscriptions: {
          include: {
            unifiedUser: true,
          },
        },
        creator: true,
        FormCommunity: {
          include: {
            Community: true,
            Form: true
          }
        },
        CommunityTags: {
          include: {
            Tag: true
          }
        }
      },
      skip: offset,
      take: limitNum,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const result = communities.map(community => ({
      id: community.id,
      title: community.title,
      desc: community.desc,
      price: community.price,
      gold_price: community.gold_price,
      silver_price: community.silver_price,
      platinum_price: community.platinum_price,
      bannerImg: community.bannerImg,
      infoImgs: community.infoImgs,
      discountForCourses: community.discountForCourses,
      isArchived: community.isArchived,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
      creatorId: community.creatorId,
      welcomeMsg: community.welcomeMsg,
      questions: community.questions,
      visibility: community.visibility,
      initialCommunity: community.initialCommunity,
      communityType: community.communityType,
      isApproved: community.isApproved,
      isCatchupLive: community.isCatchupLive,
      parentCommunities: (community.parentCommunities || [])
        .filter(pc => pc && pc.parentCommunity)
        .map(pc => pc.parentCommunity),
      childCommunities: (community.childCommunities || [])
        .filter(cc => cc && cc.childCommunity)
        .map(cc => cc.childCommunity),
      subscriptionTrue: community.subscriptions || [],
      forms: (community.FormCommunity || []).map(form => form.Form),
      tags: (community.CommunityTags || []).map(t => t.Tag),
    }));

    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.status(200).json({
      success: true,
      communities: result,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      },
      searchQuery
    });

  } catch (error) {
    console.error("Error searching communities:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search communities",
      error: error.message
    });
  }
};

// Manage community member roles
exports.manageMemberRole = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { userId, role } = req.body;

    // Validate required fields
    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'userId and role are required'
      });
    }

    // Validate role
    const validRoles = ['MEMBER', 'ADMIN', 'MODERATOR'];
    if (!validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: MEMBER, ADMIN, MODERATOR'
      });
    }

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: parseInt(communityId) }
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Get user details to find unified user ID
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { unifiedUserId: true }
    });

    if (!user || !user.unifiedUserId) {
      return res.status(404).json({
        success: false,
        message: 'User not found or no unified user ID'
      });
    }

    const unifiedUserId = user.unifiedUserId.id;

    // Check if user is subscribed to the community
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        unifiedUserId_communityId: {
          unifiedUserId: unifiedUserId,
          communityId: parseInt(communityId)
        }
      }
    });

    if (!existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'User must be subscribed to the community before changing their role'
      });
    }

    // Get the old role before updating
    const oldRole = existingSubscription.role || 'MEMBER';

    // Update the subscription with the new role
    const updatedSubscription = await prisma.subscription.update({
      where: {
        unifiedUserId_communityId: {
          unifiedUserId: unifiedUserId,
          communityId: parseInt(communityId)
        }
      },
      data: {
        role: role.toUpperCase()
      },
      include: {
        unifiedUser: {
          include: {
            user: true,
            expert: true,
            partner: true,
            admin: true
          }
        }
      }
    });

    // Get user details for response
    const userDetails = updatedSubscription.unifiedUser;
    let userName = 'Unknown User';
    let userEmail = '';

    if (userDetails.user) {
      userName = userDetails.user.name || 'User';
      userEmail = userDetails.user.email || '';
    } else if (userDetails.expert) {
      userName = userDetails.expert.name || 'Expert';
      userEmail = userDetails.expert.email || '';
    } else if (userDetails.partner) {
      userName = userDetails.partner.name || 'Partner';
      userEmail = userDetails.partner.email || '';
    } else if (userDetails.admin) {
      userName = userDetails.admin.name || 'Admin';
      userEmail = userDetails.admin.email || '';
    }

    // Create notification for the user about role change
    try {
      const roleDisplayNames = {
        'ADMIN': 'Community Administrator',
        'MODERATOR': 'Community Moderator',
        'MEMBER': 'Community Member'
      };

      const oldRoleDisplay = roleDisplayNames[oldRole] || 'Member';
      const newRoleDisplay = roleDisplayNames[role.toUpperCase()] || 'Member';

      await notificationService.createNotification({
        recipientId: unifiedUserId,
        senderId: req.user?.unifiedUserId, // The admin who made the change
        type: 'ROLE_CHANGE',
        title: `Role Updated in ${community.title}`,
        message: `Your role in "${community.title}" has been changed from ${oldRoleDisplay} to ${newRoleDisplay}.`,
        communityId: parseInt(communityId),
        metadata: {
          oldRole: oldRole,
          newRole: role.toUpperCase(),
          oldRoleDisplay: oldRoleDisplay,
          newRoleDisplay: newRoleDisplay,
          communityName: community.title,
          communityId: parseInt(communityId),
          changedBy: req.user?.unifiedUserId,
          changedAt: new Date().toISOString()
        },
        shouldEmail: true,
        emailTemplate: 'role-change',
        actionUrl: `/comHome/${communityId}`
      });

      console.log(`Notification created for user ${userName} about role change to ${role.toUpperCase()}`);

      // If the user is being made an admin, notify other admins in the community
      if (role.toUpperCase() === 'ADMIN') {
        try {
          const otherAdmins = await prisma.subscription.findMany({
            where: {
              communityId: parseInt(communityId),
              role: 'ADMIN',
              unifiedUserId: {
                not: unifiedUserId // Exclude the new admin
              }
            },
            include: {
              unifiedUser: {
                include: {
                  user: true,
                  expert: true,
                  partner: true,
                  admin: true
                }
              }
            }
          });

          // Send notifications to other admins
          for (const adminSubscription of otherAdmins) {
            const adminUnifiedUserId = adminSubscription.unifiedUser.id;
            
            await notificationService.createNotification({
              recipientId: adminUnifiedUserId,
              senderId: req.user?.unifiedUserId,
              type: 'ROLE_CHANGE',
              title: `New Admin Added to ${community.title}`,
              message: `${userName} has been promoted to Community Administrator in "${community.title}".`,
              communityId: parseInt(communityId),
              metadata: {
                newAdminName: userName,
                newAdminId: userId,
                communityName: community.title,
                communityId: parseInt(communityId),
                promotedBy: req.user?.unifiedUserId,
                promotedAt: new Date().toISOString()
              },
              shouldEmail: false, // Don't email other admins for this
              actionUrl: `/comHome/${communityId}`
            });
          }

          console.log(`Notified ${otherAdmins.length} other admins about new admin ${userName}`);
        } catch (adminNotificationError) {
          console.error('Error notifying other admins:', adminNotificationError);
          // Don't fail the main operation if admin notifications fail
        }
      }
    } catch (notificationError) {
      console.error('Error creating role change notification:', notificationError);
      // Don't fail the role update if notification fails
    }

    return res.status(200).json({
      success: true,
      message: `Successfully updated ${userName}'s role to ${role.toUpperCase()}`,
      data: {
        subscription: updatedSubscription,
        user: {
          id: userId,
          name: userName,
          email: userEmail,
          role: role.toUpperCase()
        }
      }
    });

  } catch (error) {
    console.error('Error managing member role:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to manage member role',
      error: error.message
    });
  }
};

// Get community members with roles
exports.getCommunityMembers = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { role } = req.query; // Optional filter by role

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: parseInt(communityId) }
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Build where clause
    let whereClause = {
      communityId: parseInt(communityId)
    };

    // Add role filter if provided
    if (role) {
      const validRoles = ['MEMBER', 'ADMIN', 'MODERATOR'];
      if (validRoles.includes(role.toUpperCase())) {
        whereClause.role = role.toUpperCase();
      }
    }

    // Get subscriptions with user details
    const subscriptions = await prisma.subscription.findMany({
      where: whereClause,
      include: {
        unifiedUser: {
          include: {
            user: true,
            expert: true,
            partner: true,
            admin: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // Admins first, then moderators, then members
        { createdAt: 'asc' }
      ]
    });

    // Transform the data
    const members = subscriptions.map(subscription => {
      const userDetails = subscription.unifiedUser;
      let userName = 'Unknown User';
      let userEmail = '';
      let userType = 'unknown';
      let userId = null;

      if (userDetails.user) {
        userName = userDetails.user.name || 'User';
        userEmail = userDetails.user.email || '';
        userType = 'user';
        userId = userDetails.user.id;
      } else if (userDetails.expert) {
        userName = userDetails.expert.name || 'Expert';
        userEmail = userDetails.expert.email || '';
        userType = 'expert';
        userId = userDetails.expert.id;
      } else if (userDetails.partner) {
        userName = userDetails.partner.name || 'Partner';
        userEmail = userDetails.partner.email || '';
        userType = 'partner';
        userId = userDetails.partner.id;
      } else if (userDetails.admin) {
        userName = userDetails.admin.name || 'Admin';
        userEmail = userDetails.admin.email || '';
        userType = 'admin';
        userId = userDetails.admin.id;
      }

      return {
        id: userId,
        unifiedUserId: userDetails.id,
        name: userName,
        email: userEmail,
        userType: userType,
        role: subscription.role || 'MEMBER',
        joinedAt: subscription.createdAt,
        subscriptionStart: subscription.startsAt,
        subscriptionEnd: subscription.expiresAt
      };
    });

    // Get role counts
    const roleCounts = {
      total: members.length,
      admins: members.filter(m => m.role === 'ADMIN').length,
      moderators: members.filter(m => m.role === 'MODERATOR').length,
      members: members.filter(m => m.role === 'MEMBER').length
    };

    return res.status(200).json({
      success: true,
      data: {
        members,
        roleCounts,
        community: {
          id: community.id,
          title: community.title
        }
      }
    });

  } catch (error) {
    console.error('Error getting community members:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get community members',
      error: error.message
    });
  }
};

// Get current user's role in a community
exports.getCurrentUserRole = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { userId, userType } = req.user;

    // Validate required fields
    if (!userId || !userType) {
      return res.status(400).json({
        success: false,
        message: 'User authentication required'
      });
    }

    if (!communityId || isNaN(parseInt(communityId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid community ID required'
      });
    }

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: parseInt(communityId) }
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Get unified user ID
    let unifiedUserId = null;
    if (userType === 'user' || userType === 'expert') {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        include: { unifiedUserId: true }
      });
      unifiedUserId = user?.unifiedUserId?.id;
    } else if (userType === 'partner') {
      const partner = await prisma.partner.findUnique({
        where: { id: parseInt(userId) },
        include: { unifiedUserId: true }
      });
      unifiedUserId = partner?.unifiedUserId?.id;
    } else if (userType === 'admin') {
      const admin = await prisma.admin.findUnique({
        where: { id: parseInt(userId) },
        include: { unifiedUserId: true }
      });
      unifiedUserId = admin?.unifiedUserId?.id;
    }

    if (!unifiedUserId) {
      return res.status(404).json({
        success: false,
        message: 'Unified user not found'
      });
    }

    // Check if user is subscribed to the community
    const subscription = await prisma.subscription.findUnique({
      where: {
        unifiedUserId_communityId: {
          unifiedUserId: unifiedUserId,
          communityId: parseInt(communityId)
        }
      },
      select: {
        role: true,
        createdAt: true,
        startsAt: true,
        expiresAt: true
      }
    });

    if (!subscription) {
      return res.status(200).json({
        success: true,
        data: {
          role: 'NONE',
          isMember: false,
          joinedAt: null,
          subscriptionStart: null,
          subscriptionEnd: null
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        role: subscription.role || 'MEMBER',
        isMember: true,
        joinedAt: subscription.createdAt,
        subscriptionStart: subscription.startsAt,
        subscriptionEnd: subscription.expiresAt
      }
    });

  } catch (error) {
    console.error('Error getting current user role:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user role',
      error: error.message
    });
  }
};
