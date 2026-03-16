const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const generator = require("generate-password");
const { createCustomError } = require("../../middleware/errorHandling");
const bcrypt = require("bcryptjs");
const { validateUser } = require("./admin");
const { findAdminByIdHelper } = require("../services/getById");
const { getSessionStdFormat } = require("../session/session");
const generateDefaultPhotoURL = require('../../utils/generateDefaultPhotoURL');

// if superAdmin
exports.getAllAdmins = async function (req, res, next) {
  try {
    // if(!(req?.user?.userType==='SuperAdmin')) throw createCustomError({status:403,message:"Unauthorized"});
    const admins = await prisma.admin.findMany({});
    return res.status(200).json({ admins });
  } catch (err) {
    console.log("Error occured while GETting all admins");
    console.log(err);
    next(err);
  }
};

exports.getAdminById = async function (req, res, next) {
  const { id } = req.params;

  try {
    const admin = await findAdminByIdHelper(id);
    return res.status(200).json({ admin });
  } catch (error) {
    console.log(`Error while fetching admin ${id}`);
    console.log(error);
    next(error);
  }
};

//update admin
exports.updateAdminById = async function (req, res, next) {
  const { id } = req.params;

  try {
    await findAdminByIdHelper(id);
    const updatedAdmin = await prisma.admin.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    return res.status(200).json({ admin: updatedAdmin });
  } catch (err) {
    console.log("Error occured while GETting all admins");
    console.log(err);
    next(err);
  }
};

// Add one admin
// {email,name,phone,address,pincode,password}
exports.addAdmin = async function (req, res, next) {
  try {
    let { admin } = req.body;
    if (!admin || !validateUser(admin)) {
      throw createCustomError({ status: 400, message: "Admin data not found" });
    }

    let password = generator.generate({
      length: 10,
      numbers: true,
    });
    let obj = { ...admin };
    if (!admin.password) {
      obj = { ...obj, password };
    }
    let created = JSON.parse(JSON.stringify(obj));
    obj.password = await bcrypt.hash(obj.password, 10);
    let created_admin = await prisma.admin.create({ data: obj });
    return res.status(201).json({ admin: created, created_admin });
  } catch (err) {
    console.log("Error occured while Creating admin");
    console.log(err);
    next(err);
  }
};

// method to create a bunch of users: assigns a random password
/*
    req.body={users:[email,name,phone,address,pincode]}

*/

exports.createUsersBulk = async function (req, res, next) {
  const { users } = req.body;
  try {
    if (!users) {
      throw createCustomError({ message: "Users not found", status: 400 });
    }
    // validate input

    let promises = [];
    let created = [];
    let user_err = false;
    users.every((user) => {
      if (validateUser(user)) {
        if (
          typeof user.password === "undefined" ||
          user.password === null ||
          user.password === ""
        ) {
          let password = generator.generate({
            length: 10,
            numbers: true,
          });
          let obj = { ...user, password };
          created.push(JSON.parse(JSON.stringify(obj)));
          obj.password = bcrypt.hashSync(obj.password, 10);
          promises.push(prisma.user.create({ data: obj }));
          return true;
        } else {
          let hashedPassword = bcrypt.hashSync(user.password, 10);
          user.password = hashedPassword;
          let data = user;
          promises.push(prisma.user.create({ data }));
          return true;
        }
      }
      user_err = true;
      return false;
    });
    if (user_err) {
      throw createCustomError({
        message: "Invalid user found, candidates after are not created.",
        status: 400,
      });
    }

    const created_users = await prisma.$transaction([...promises]);
    return res.status(200).json({ users: created, result: created_users });
  } catch (err) {
    console.log("Error while creating users in bulk");
    console.log(err);
    next(err);
  }
};

// method to create a bunch of users: assigns a random password
/*
    req.body={expert:[email,name,phone,address,pincode,desc]}

*/
exports.createExpertsBulk = async function (req, res, next) {
  const { expert } = req.body;
  try {
    if (!expert) {
      throw createCustomError({ message: "experts not found", status: 400 });
    }
    // validate input

    let promises = [];
    let created = [];
    let user_err = false;
    expert.every((user) => {
      if (validateUser(user)) {
        let password = generator.generate({
          length: 10,
          numbers: true,
        });
        let obj = { ...user, password };
        created.push(JSON.parse(JSON.stringify(obj)));
        obj.password = bcrypt.hashSync(obj.password, 10);

        promises.push(prisma.expert.create({ data: obj }));
        return true;
      }
      user_err = true;
      return false;
    });
    if (user_err) {
      throw createCustomError({
        message: "Invalid expert found, candidates after are not created.",
        status: 400,
      });
    }

    const created_expert = await Promise.all(promises);
    return res.status(200).json({ expert: created, result: created_expert });
  } catch (err) {
    console.log("Error while creating expert in bulk");
    console.log(err);
    next(err);
  }
};

// get admin sessions
exports.getAdminSessions = async function (req, res, next) {
  let { id } = req.params;
  try {
    id = parseInt(id);
    const allSessions = await prisma.session.findMany({
      include: { SessionSlot: { include: { speakers: true } } },
    });
    const adminSessions = allSessions.filter((item) => item.creatorId === id);
    let { recentSessions, completedSessions } =
      getSessionStdFormat(adminSessions);
    return res
      .status(200)
      .json({ sessions: recentSessions, completedSessions });
  } catch (err) {
    console.log("Error while getting all sessions");
    console.log(err);
    next(err);
  }
};

//admin form
exports.createForm = async (req, res) => {
  try {
    const { formName, adminId, formLink, formImg, formDesc } = req.body;

    console.log("Received form data:", req.body); // Log received form data for debugging

    const newForm = await prisma.customForm.create({
      data: {
        formName,
        adminId,
        formLink,
        formImg,
        formDesc,
      },
    });

    res.status(201).json(newForm);
  } catch (error) {
    console.error("Error creating form:", error);
    res.status(500).json({ error: "Failed to create form" });
  }
};

// Get community subscribers and non-subscribers
exports.getCommunityUsers = async (req, res) => {
  try {
    const { communityId } = req.params;


    // Get all unified users

    const allUsers = await prisma.unifiedUser.findMany({
      include: {
        user: true,
        expert: true,
        partner: true,
        subscriptions: {
          where: {
            communityId: parseInt(communityId)
          }
        }
      }
    });

    // Transform and separate users into subscribers and non-subscribers
    const users = allUsers.map(user => {
      const isSubscribed = user.subscriptions.length > 0;
      const subscription = isSubscribed ? user.subscriptions[0] : null;
      
      return {
        id: user.id,
        name: user.user?.name || user.expert?.name || user.partner?.name,
        email: user.user?.email || user.expert?.email || user.partner?.email,
        userType: user.user ? 'user' : user.expert ? 'expert' : 'partner',
        isSubscribed,
        photoURL: user.user?.photoURL || user.expert?.photoURL || user.partner?.photoURL || generateDefaultPhotoURL(user.user?.name || user.expert?.name || user.partner?.name),
        subscription: subscription ? {
          startDate: subscription.startsAt,
          endDate: subscription.expiresAt,
          subscriptionId: subscription.id
        } : null
      };
    });

    const subscribers = users.filter(user => user.isSubscribed);
    const nonSubscribers = users.filter(user => !user.isSubscribed);

    return res.status(200).json({
      success: true,
      data: {
        subscribers,
        nonSubscribers,
        total: {
          all: users.length,
          subscribed: subscribers.length,
          nonSubscribed: nonSubscribers.length
        }
      }
    });

  } catch (error) {
    console.error("Error fetching community users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message
    });
  }
};

// Manage community subscriptions (add/remove)
exports.manageCommunitySubscriptions = async (req, res) => {
  const { action } = req.body;
  
  try {
    const { communityId } = req.params;
    // const { id: adminId } = req.user;
    const { userIds, durationInMonths = 1 } = req.body;

    // Input validation
    if (!communityId || isNaN(parseInt(communityId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid community ID"
      });
    }

    if (!['add', 'remove'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'add' or 'remove'"
      });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "userIds must be a non-empty array"
      });
    }

    // Validate each userId
    const invalidUserIds = userIds.filter(id => isNaN(parseInt(id)));
    if (invalidUserIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user IDs found",
        invalidUserIds
      });
    }

    // Validate duration for add action
    if (action === 'add' && (isNaN(durationInMonths) || durationInMonths < 1)) {
      return res.status(400).json({
        success: false,
        message: "durationInMonths must be a positive number"
      });
    }

    // Verify community exists
    const community = await prisma.community.findUnique({
      where: { id: parseInt(communityId) },
      select: {
        id: true,
        title: true
      }
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found"
      });
    }

    const results = {
      successful: [],
      failed: [],
      summary: {
        total: userIds.length,
        successful: 0,
        failed: 0
      }
    };

    if (action === 'add') {
      // Add subscriptions
      for (const userId of userIds) {
        try {
          // Verify user exists
          const user = await prisma.unifiedUser.findUnique({
            where: { id: parseInt(userId) },
            select: { id: true }
          });

          if (!user) {
            results.failed.push({
              userId,
              message: "User not found"
            });
            continue;
          }

          // Check if subscription already exists
          const existingSubscription = await prisma.subscription.findFirst({
            where: {
              communityId: parseInt(communityId),
              unifiedUserId: parseInt(userId)
            }
          });

          if (existingSubscription) {
            results.failed.push({
              userId,
              message: "User already subscribed to this community"
            });
            continue;
          }

          // Calculate subscription dates
          const now = new Date();
          const expiresAt = new Date(
            now.getFullYear(),
            now.getMonth() + durationInMonths,
            now.getDate()
          );

          // Create subscription
          const subscription = await prisma.subscription.create({
            data: {
              startsAt: now,
              expiresAt,
              community: { connect: { id: parseInt(communityId) } },
              unifiedUser: { connect: { id: parseInt(userId) } },
              transaction: {
                create: {
                  amount: 0,
                  transactionId: `admin-${Date.now()}-${userId}`,
                  paymentId: `admin-${Date.now()}-${userId}`
                }
              }
            }
          });

          results.successful.push({
            userId,
            subscriptionId: subscription.id,
            startDate: now,
            endDate: expiresAt,
            communityId: parseInt(communityId),
            communityTitle: community.title
          });

        } catch (error) {
          results.failed.push({
            userId,
            message: error.message
          });
        }
      }
    } else {
      // Remove subscriptions
      for (const userId of userIds) {
        try {
          // Verify user exists
          const user = await prisma.unifiedUser.findUnique({
            where: { id: parseInt(userId) },
            select: { id: true }
          });

          if (!user) {
            results.failed.push({
              userId,
              message: "User not found"
            });
            continue;
          }

          const subscription = await prisma.subscription.findFirst({
            where: {
              communityId: parseInt(communityId),
              unifiedUserId: parseInt(userId)
            }
          });

          if (!subscription) {
            results.failed.push({
              userId,
              message: "User is not subscribed to this community"
            });
            continue;
          }

          await prisma.subscription.delete({
            where: { id: subscription.id }
          });

          results.successful.push({
            userId,
            message: "Subscription removed successfully",
            communityId: parseInt(communityId),
            communityTitle: community.title
          });

        } catch (error) {
          results.failed.push({
            userId,
            message: error.message
          });
        }
      }
    }

    // Update summary
    results.summary.successful = results.successful.length;
    results.summary.failed = results.failed.length;

    return res.status(200).json({
      success: true,
      message: `Bulk ${action} process completed`,
      community: {
        id: community.id,
        title: community.title
      },
      results
    });

  } catch (error) {
    console.error(`Error in bulk ${action} operation:`, error);
    return res.status(500).json({
      success: false,
      message: `Failed to process bulk ${action} operation`,
      error: error.message
    });
  }
};
