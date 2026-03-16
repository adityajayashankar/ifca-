const prisma = require('../../prisma/middleware');
const { createCustomError } = require("../../middleware/errorHandling");
const {
  getNumberAttendance,
  deleteRecordBundles,
} = require("../services/attendance");
const { getUserCommunitiesHelper } = require("../community/community");
const {
  findUserByIdHelper,
  findSessionByIdHelper,
} = require("../services/getById");
// const createError=require('http-errors');
const {
  getTiers,
  getSessionSlot,
} = require("../session/session");
const { getEventStdFormat } = require("../event/event.service");
const { sendEmail } = require("../../utils/sendMail");
const mailer = require("../../services/email/notificationMailer");
const { updateRewardPoints } = require("../rewards/rewards");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require('@prisma/client');
const notificationService = require('../../services/notification.service');
const { rewardsManagement } = require('../../services/rewards/rewards.service');
const { RewardType, RewardAction } = require('@prisma/client');
const generateDefaultPhotoURL = require('../../utils/generateDefaultPhotoURL');
const axios = require('axios');

const MOODLE_API_URL = process.env.MOODLE_API_URL || 'https://ifcaifcalms.cocreate.ventures/webservice/rest/server.php';
const MOODLE_API_TOKEN = process.env.MOODLE_API_TOKEN;

exports.getUserById = async function (req, res, next) {
  const { id } = req.params;
  try {
    const user = await findUserByIdHelper(parseInt(id));
    return res.status(200).json({ user });
  } catch (err) {
    console.log("Error while GETting user: " + id);
    console.log(err);
    next(err);
  }
};

exports.getUsers = async function () {
  try {
    const users = await prisma.user.findMany();
    return users;
  } catch (err) {
    console.log("Error while GETting users");
    console.log(err);
  }
};

exports.updateUserById = async function (req, res, next) {
  const { id } = req.params;
  const newData = req.body;

  try {
    // Find the existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user data
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        name: newData.name,
        preferredName: newData.preferredName,
        email: newData.email,
        phone: newData.phone,
        preferredContact: newData.preferredContact,
        photoURL: newData.photoURL || generateDefaultPhotoURL(newData.name),
        nationality: newData.nationality,
        state: newData.state,
        pincode: newData.pincode,
        location: newData.location,
        currentPosition: newData.currentPosition,
        employer: newData.employer,
        roleDescription: newData.roleDescription,
        careerHistory: newData.careerHistory,
        specializations: newData.specializations,
        certifications: newData.certifications,
        awards: newData.awards,
        culinaryPhilosophy: newData.culinaryPhilosophy,
        vision: newData.vision,
        sustainability: newData.sustainability,
        ifcaInvolvement: newData.ifcaInvolvement,
        industryContributions: newData.industryContributions,
        mentorship: newData.mentorship,
        publications: newData.publications,
        recipes: newData.recipes,
        tutorials: newData.tutorials,
        expertise: newData.expertise,
        professionalNetworks: newData.professionalNetworks,
        collaborations: newData.collaborations,
        eventsParticipation: newData.eventsParticipation,
        socialMediaLinks: newData.socialMediaLinks,
        website: newData.website,
        onlinePortfolios: newData.onlinePortfolios,
        availability: newData.availability,
        interests: newData.interests,
        mentorshipAvailability: newData.mentorshipAvailability,
        languageProficiency: newData.languageProficiency,
        technologySkills: newData.technologySkills,
      },
    });

    // --- ENHANCED LOGIC FOR userType 'user' ---
    // Check if all required fields are present
    if (user.name && user.email && user.phone) {
      // 0. If password is missing, set default and hash it
      let passwordToUse = user.password;
      let setPassword = false;
      if (!passwordToUse) {
        passwordToUse = 'Abcd@123';
        setPassword = true;
      }
      // If password needs to be set or updated, hash it and update DB
      if (setPassword) {
        const hashedPassword = await bcrypt.hash(passwordToUse, 10);
        await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
        user.password = hashedPassword;
      }
      // 1. Check for duplicate email in unifiedUser (excluding current user)
      const existingUnified = await prisma.unifiedUser.findUnique({ where: { email: user.email } });
      if (existingUnified && existingUnified.userId !== user.id) {
        return res.status(409).json({ message: 'Email already registered.' });
      }
      // 2. Check for duplicate phone in all user tables (excluding current user)
      const [userPhone, adminPhone, partnerPhone, expertPhone] = await prisma.$transaction([
        prisma.user.findFirst({ where: { phone: user.phone, NOT: { id: user.id } } }),
        prisma.admin.findFirst({ where: { phone: user.phone } }),
        prisma.partner.findFirst({ where: { phone: user.phone } }),
        prisma.expert.findFirst({ where: { phone: user.phone } }),
      ]);
      if (userPhone || adminPhone || partnerPhone || expertPhone) {
        return res.status(409).json({ message: 'Phone number already registered.' });
      }
      // 3. Check Moodle for email/phone (username) - but don't break the flow
      try {
        const axios = require('axios');
        // Check Moodle by email
        const moodleEmailRes = await axios.get(MOODLE_API_URL, {
          params: {
            wstoken: MOODLE_API_TOKEN,
            wsfunction: 'core_user_get_users_by_field',
            moodlewsrestformat: 'json',
            field: 'email',
            values: [user.email]
          }
        });
        if (Array.isArray(moodleEmailRes.data) && moodleEmailRes.data.length > 0) {
          const found = moodleEmailRes.data.find(u => u.id != user.moodleUserId);
          if (found) {
            console.log('Email already exists in Moodle, will update moodleUserId to existing user');
            // Instead of returning error, we'll update the moodleUserId to the existing user
            await prisma.user.update({
              where: { id: user.id },
              data: {
                moodleUserId: found.id,
                moodleUsername: found.username
              }
            });
            user.moodleUserId = found.id;
            user.moodleUsername = found.username;
          }
        }
        // Check Moodle by username (phone)
        const moodlePhoneRes = await axios.get(MOODLE_API_URL, {
          params: {
            wstoken: MOODLE_API_TOKEN,
            wsfunction: 'core_user_get_users_by_field',
            moodlewsrestformat: 'json',
            field: 'username',
            values: [user.phone]
          }
        });
        if (Array.isArray(moodlePhoneRes.data) && moodlePhoneRes.data.length > 0) {
          const found = moodlePhoneRes.data.find(u => u.id != user.moodleUserId);
          if (found) {
            console.log('Phone already exists in Moodle, will update moodleUserId to existing user');
            // Instead of returning error, we'll update the moodleUserId to the existing user
            await prisma.user.update({
              where: { id: user.id },
              data: {
                moodleUserId: found.id,
                moodleUsername: found.username
              }
            });
            user.moodleUserId = found.id;
            user.moodleUsername = found.username;
          }
        }
      } catch (moodleCheckErr) {
        console.error('Error checking Moodle for existing user:', moodleCheckErr);
        // Don't break the flow, just log the error and continue
        console.log('Continuing with user update despite Moodle check error');
      }
      // 4. Create or update unifiedUser if not present or email changed
      let unified = await prisma.unifiedUser.findUnique({ where: { userId: user.id } });
      let createdUnified = false;
      if (!unified) {
        unified = await prisma.unifiedUser.create({
          data: { email: user.email, userId: user.id },
        });
        createdUnified = true;
      } else if (unified.email !== user.email) {
        await prisma.unifiedUser.update({
          where: { id: unified.id },
          data: { email: user.email }
        });
      }
      // 5. Create or update Moodle account if not present or if email/phone exists in Moodle
      let createdMoodle = false;
      const moodleService = require('../../services/moodle/moodle.service');
      let moodleUserToUpdate = null;
      let moodleUserIdToUpdate = null;
      let moodleUsernameToUpdate = null;
      let moodleUserFound = false;
      
      // Only proceed with Moodle operations if we have a moodleUserId (from step 3)
      if (user.moodleUserId) {
        console.log('User already has Moodle account, skipping Moodle creation/update');
        createdMoodle = true;
      } else {
        try {
          // Check Moodle by email
          const moodleEmailRes = await axios.get(MOODLE_API_URL, {
            params: {
              wstoken: MOODLE_API_TOKEN,
              wsfunction: 'core_user_get_users_by_field',
              moodlewsrestformat: 'json',
              field: 'email',
              values: [user.email]
            }
          });
          if (Array.isArray(moodleEmailRes.data) && moodleEmailRes.data.length > 0) {
            const found = moodleEmailRes.data.find(u => u.id != user.moodleUserId);
            if (found) {
              moodleUserToUpdate = found;
              moodleUserIdToUpdate = found.id;
              moodleUsernameToUpdate = found.username;
              moodleUserFound = true;
            }
          }
          // Check Moodle by username (phone)
          if (!moodleUserFound) {
            const moodlePhoneRes = await axios.get(MOODLE_API_URL, {
              params: {
                wstoken: MOODLE_API_TOKEN,
                wsfunction: 'core_user_get_users_by_field',
                moodlewsrestformat: 'json',
                field: 'username',
                values: [user.phone]
              }
            });
            if (Array.isArray(moodlePhoneRes.data) && moodlePhoneRes.data.length > 0) {
              const found = moodlePhoneRes.data.find(u => u.id != user.moodleUserId);
              if (found) {
                moodleUserToUpdate = found;
                moodleUserIdToUpdate = found.id;
                moodleUsernameToUpdate = found.username;
                moodleUserFound = true;
              }
            }
          }
        } catch (moodleCheckErr) {
          console.error('Error checking Moodle for existing user:', moodleCheckErr);
          // Don't break the flow, just log and continue
          console.log('Continuing with user update despite Moodle check error');
        }
        
        if (!user.moodleUserId || !user.moodleUsername || moodleUserFound) {
          try {
            let moodleUser;
            if (moodleUserFound && moodleUserToUpdate) {
              // Update existing Moodle user
              moodleUser = await moodleService.updateUser({
                id: moodleUserIdToUpdate,
                username: user.phone,
                password: passwordToUse,
                firstname: user.name.split(' ')[0],
                lastname: user.name.split(' ').slice(1).join(' ') || user.name.split(' ')[0],
                email: user.email,
                name: user.name
              });
            } else {
              // Create new Moodle user
              moodleUser = await moodleService.createUser({
                username: user.phone,
                password: passwordToUse,
                firstname: user.name.split(' ')[0],
                lastname: user.name.split(' ').slice(1).join(' ') || user.name.split(' ')[0],
                email: user.email,
                name: user.name
              });
            }
            if (moodleUser && moodleUser.id) {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  moodleUserId: moodleUser.id,
                  moodleUsername: moodleUser.username,
                  moodlePassword: passwordToUse,
                },
              });
              createdMoodle = true;
            } else {
              // Log and continue if Moodle user creation/update failed
              console.error('Moodle account creation/update failed: No Moodle user returned');
            }
          } catch (error) {
            // Log and continue if Moodle user creation/update failed
            console.error('Moodle account creation/update failed:', error);
            console.log('Continuing with user update despite Moodle creation/update error');
          }
        }
      }
      // 6. Send welcome notification/email if just onboarded
      if (createdUnified || createdMoodle) {
        // Send notification (if notificationService exists)
        try {
          await notificationService.createNotification({
            recipientId: user.id,
            type: 'WELCOME',
            title: 'Welcome to IFCA',
            message: 'You have successfully joined IFCA! Start exploring the platform.',
            shouldEmail: true,
          });
        } catch (err) {
          console.error('Error sending welcome notification:', err);
        }
        // Send welcome email (if emailService exists)
        try {
          const emailService = require('../../services/email.service.js');
          await emailService.sendEmail({
            to: user.email,
            subject: 'Welcome to IFCA',
            template: 'welcome-email',
            context: {
              email: user.email,
              recipientName: user.name,
              username: user.phone,
              password: passwordToUse,
              actionUrl: `https://pvl.ifcaindia.com/onBoard`,
            },
          });
        } catch (err) {
          console.error('Error sending welcome email:', err);
        }
      }
    }
    // --- END ENHANCED LOGIC ---

    // After updating the user data
    // --- UNIFIEDUSER EMAIL SYNC LOGIC (case-insensitive, trimmed) ---
    if (newData.email) {
      const cleanEmail = newData.email.trim().toLowerCase();

      // Check for duplicate email in unifiedUser (excluding this user, case-insensitive)
      const existingUnifiedUser = await prisma.unifiedUser.findFirst({
        where: {
          email: cleanEmail,
          NOT: { userId: user.id }
        }
      });
      if (existingUnifiedUser) {
        return res.status(400).json({ status: 400, message: "Record Already Exists" });
      }

      // Update the User email with cleaned value
      if (user.email !== cleanEmail) {
        await prisma.user.update({
          where: { id: user.id },
          data: { email: cleanEmail }
        });
      }

      // Try to find the unifiedUser for this user
      let unifiedUser = await prisma.unifiedUser.findUnique({
        where: { userId: user.id }
      });
      if (unifiedUser) {
        // Update the email in unifiedUser
        await prisma.unifiedUser.update({
          where: { id: unifiedUser.id },
          data: { email: cleanEmail }
        });
      } else {
        // Create unifiedUser if not exists
        await prisma.unifiedUser.create({
          data: {
            email: cleanEmail,
            userId: user.id
          }
        });
      }
    }
    // --- END UNIFIEDUSER EMAIL SYNC LOGIC ---

    // Return the updated user
    return res.status(200).json({ message: 'User Details Updated Successfully', user: user });
  } catch (err) {
    console.error("Error while updating user:", id);
    console.error(err);
    next(err);
  }
};

exports.getUserRecentActivities = async function (req, res, next) {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    // 1. Get both userId and unifiedUserId
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { unifiedUserId: true }
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    const unifiedUserId = user.unifiedUserId?.id;

    // 2. Community joins (latest 100) - use unifiedUserId
    const communityJoins = await prisma.subscription.findMany({
      where: { unifiedUserId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { community: true }
    });

    // 3. Session subscriptions (latest 100) - use userId
    const sessionSubscriptions = await prisma.attendance.findMany({
      where: { userId: parseInt(id), paymentCompleted: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { session: true, sessionSlot: true }
    });

    // 4. Recent posts (posts) - use unifiedUserId, only top-level posts
    const posts = await prisma.post.findMany({
      where: {
        creatorId: unifiedUserId,
        parentPostId: null // Only top-level posts, not replies
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // 5. Get user's live and upcoming huddles from subscribed communities
    const subscriptions = await prisma.subscription.findMany({
      where: {
        unifiedUserId: unifiedUserId,
        OR: [
          { expiresAt: { gt: new Date() } },
          { expiresAt: null }
        ]
      },
      select: {
        communityId: true
      }
    });

    const communityIds = subscriptions.map(s => s.communityId);
    let huddles = [];
    
    if (communityIds.length > 0) {
      huddles = await prisma.huddle.findMany({
        where: {
          communityId: { in: communityIds },
          OR: [
            { isLive: true },
            { 
              isScheduled: true,
              isLive: false,
              scheduledTime: { gte: new Date() }
            }
          ]
        },
        include: {
          community: {
            select: {
              id: true,
              title: true,
              bannerImg: true
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
              }
            }
          }
        },
        orderBy: [
          { isLive: 'desc' }, // Live huddles first
          { scheduledTime: 'asc' } // Then upcoming by scheduled time
        ],
        take: 50 // Limit to 50 huddles
      });
    }

    // Merge and sort all activities by createdAt (descending)
    let activities = [
      ...communityJoins.map(a => ({ type: 'community_join', ...a })),
      ...sessionSubscriptions.map(a => ({ type: 'session_subscription', ...a })),
      ...posts.map(a => ({ type: 'post', ...a })),
      ...huddles.map(h => ({ 
        type: h.isLive ? 'huddle_live' : 'huddle_upcoming',
        id: h.id,
        title: h.title,
        description: h.description || '',
        communityId: h.communityId,
        communityTitle: h.community?.title,
        communityImg: h.community?.bannerImg,
        isLive: h.isLive,
        scheduledTime: h.scheduledTime,
        createdAt: h.isLive ? h.startTime || h.createdAt : h.scheduledTime || h.createdAt,
        creator: h.creator
      })),
    ];

    // Remove duplicates (e.g. same session in different types)
    const seen = new Set();
    activities = activities.filter(a => {
      const key = a.type + (a.id || a.sessionId || a.communityId || a.threadId);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort activities: live huddles first, then by date (descending)
    activities.sort((a, b) => {
      // Live huddles always come first
      if (a.type === 'huddle_live' && b.type !== 'huddle_live') return -1;
      if (b.type === 'huddle_live' && a.type !== 'huddle_live') return 1;
      
      // Then upcoming huddles
      if (a.type === 'huddle_upcoming' && b.type !== 'huddle_upcoming' && b.type !== 'huddle_live') return -1;
      if (b.type === 'huddle_upcoming' && a.type !== 'huddle_upcoming' && a.type !== 'huddle_live') return 1;
      
      // Then sort by createdAt (descending)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Pagination
    const total = activities.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedActivities = activities.slice(start, end);

    // Shape the response for frontend
    const shapedActivities = paginatedActivities.map(a => {
      if (a.type === 'session_subscription') {
        return {
          type: a.type,
          id: a.id,
          sessionId: a.sessionId,
          sessionTitle: a.session?.title,
          sessionImg: a.session?.infoImgs?.[0],
          startTime: a.sessionSlot?.startTime,
          endTime: a.sessionSlot?.endTime,
          isLive: a.sessionSlot?.isLive,
          createdAt: a.createdAt
        };
      }
      if (a.type === 'community_join') {
        return {
          type: a.type,
          id: a.id,
          communityId: a.communityId,
          communityTitle: a.community?.title,
          communityImg: a.community?.bannerImg,
          createdAt: a.createdAt
        };
      }
      if (a.type === 'post') {
        return {
          type: a.type,
          id: a.id,
          title: a.title,
          content: a.content,
          communityId: a.communityId,
          createdAt: a.createdAt
        };
      }
      if (a.type === 'huddle_live' || a.type === 'huddle_upcoming') {
        return {
          type: a.type,
          id: a.id,
          title: a.title,
          description: a.description,
          communityId: a.communityId,
          communityTitle: a.communityTitle,
          communityImg: a.communityImg,
          isLive: a.isLive,
          scheduledTime: a.scheduledTime,
          createdAt: a.createdAt,
          creator: a.creator
        };
      }
      return a;
    });

    return res.status(200).json({
      activities: shapedActivities,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserProfileProgress = async function (req, res, next) {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { 
        id: parseInt(id) 
      },
      select: {
        // Only select fields that should count towards profile completion
        name: true,
        email: true,
        phone: true,
        photoURL: true,
        careerHistory: true,
        certifications: true,
        languageProficiency: true,
        technologySkills: true,
        specializations: true,
        awards: true,
        publications: true,
        tutorials: true,
        website: true,
        socialMediaLinks: true,
        professionalNetworks: true,
        eventsParticipation: true,
        collaborations: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Count filled fields
    let filledFields = 0;
    const emptyFields = [];
    const totalFields = Object.keys(user).length;

    for (const [key, value] of Object.entries(user)) {
      if (value === null || value === undefined || value === "") {
        emptyFields.push(key);
        continue;
      }

      // Check arrays
      if (Array.isArray(value) && value.length === 0) {
        emptyFields.push(key);
        continue;
      }

      // Check JSON fields
      if (typeof value === 'object' && Object.keys(value).length === 0) {
        emptyFields.push(key);
        continue;
      }

      filledFields++;
    }

    const profileProgress = (filledFields / totalFields) * 100;
    const profile = Math.round(profileProgress)

    const unifiedId = await prisma.unifiedUser.findUnique({
      where:{
        userId:parseInt(id)
      }
    })

    if(profile === 100) {
      await rewardsManagement({
        userId: unifiedId?.id,
        rewardRuleName: RewardAction.PROFILE_COMPLETION,
        type: RewardType.CREDIT
      });
    }

    return res.status(200).json({ 
      profileProgress: Math.round(profileProgress), 
      emptyFields,
      totalFields,
      filledFields
    });
  } catch (err) {
    console.error("Error while calculating profile progress:", id);
    console.error(err);
    next(err);
  }
};


exports.deleteUserById = async function (req, res, next) {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ message: "User ID is required and must be a number" });
  }
  try {
    // First find the unified user associated with this user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        unifiedUserId: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all connections where this user is sender or receiver
    if (user.unifiedUserId) {
      await prisma.connection.deleteMany({
        where: {
          OR: [
            { receiverId: user.unifiedUserId.id },
            { senderId: user.unifiedUserId.id }
          ]
        }
      });

      // Now delete the unified user (which will cascade to user)
      await prisma.unifiedUser.update({
        where: { id: user.unifiedUserId.id },
        data: { isActive: false }

      });
    } else {
      // If no unified user exists, just delete the user
      await prisma.user.delete({
        where: { id: parseInt(id) }
      });
    }

    return res.status(200).json({ 
      status: 200, 
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.log(`Error while deleting user: ${id}`);
    console.log(err);
    res.status(400).json({ message: err.message || 'Failed to delete user' });
  }
};


exports.enableUserById = async function (req, res, next) {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        unifiedUserId: true
      }
    });

    if (!user || !user.unifiedUserId) {
      return res.status(404).json({ message: "User or UnifiedUser not found" });
    }

    await prisma.unifiedUser.update({
      where: { id: user.unifiedUserId.id },
      data: { isActive: true }
    });

    return res.status(200).json({ message: "User enabled successfully" });

  } catch (err) {
    console.log("Error enabling user:", err);
    next(err);
  }
};

exports.getUserAttendance = async function (req, res, next) {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { Attendance: true },
    });

    if (!user) {
      throw createCustomError({ status: 404, message: "user not found" });
    }

    return res.status(200).json({ attendance: user.Attendance });
  } catch (err) {
    console.log("Error while GETing user attendance: " + id);
    console.log(err);
    next(err);
  }
};







exports.getUsersByFilter = async function (req, res, next) {
  var filter = req.query.filter;
  var query = {};
  if (filter) {
    query = JSON.parse(filter);
  }

  try {
    
    const activeUsers = await prisma.user.findMany({
      where: {
        unifiedUserId: {
          isActive: true,
        },
      },
      include: {
        unifiedUserId: true,
      },
    });

    
    const disabledUsers = await prisma.user.findMany({
      where: {
        unifiedUserId: {
          isActive: false,
        },
      },
      include: {
        unifiedUserId: true,
      },
    });

    // Get statistics for all users
    const allUsers = [...activeUsers, ...disabledUsers];
    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        let communitiesCount = 0;
        let sessionsCount = 0;

        if (user.unifiedUserId) {
          // Get communities count
          const communities = await prisma.subscription.count({
            where: { unifiedUserId: user.unifiedUserId.id }
          });
          communitiesCount = communities;

          // Get sessions count
          const sessions = await prisma.attendance.count({
            where: { 
              userId: user.id,
              paymentCompleted: true
            }
          });
          sessionsCount = sessions;
        }

        return {
          ...user,
          statistics: {
            communities: { total: communitiesCount },
            sessions: { total: sessionsCount }
          }
        };
      })
    );

    // Separate back into active and disabled users
    const activeUsersWithStats = usersWithStats.filter(user => user.unifiedUserId?.isActive);
    const disabledUsersWithStats = usersWithStats.filter(user => !user.unifiedUserId?.isActive);

    return res.status(200).json({
      activeUsers: activeUsersWithStats,
      disabledUsers: disabledUsersWithStats,
    });
  } catch (err) {
    console.log("Error while fetching users by filter");
    console.log(err);
    next(err);
  }
};














// get user-subscriptions
exports.getUserSubscriptions = async function (req, res, next) {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        subscriptions: {
          include: {
            community: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw createCustomError({ status: 404, message: "user not found" });
    }

    return res.status(200).json({ subscription: user.subscriptions });
  } catch (err) {
    console.log(`Error while fetching subscriptions of user:${id}`);
    console.log(err);
    next(err);
  }
};

// get user-sessions
exports.getUserSessions = async function (req, res, next) {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        Attendance: {
          include: {
            session: true,
            sessionSlot: {
              include: {
                speakers: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw createCustomError({ status: 404, message: "user not found" });
    }
    const today = new Date();
    const attendance = user.Attendance;
    const sessions = [],
      completedSessions = [];
    const session_count = {},
      completedSessions_count = {};
    attendance
      .filter((item) => item.paymentCompleted)
      .forEach((item) => {
        if (new Date(item.sessionSlot.endTime) >= today) {
          sessions.push({
            ...item.session,
            title: `${item.session.title}-${session_count[item.sessionId] + 1
              }`,
            SessionSlot: [{ ...item.sessionSlot, link: item.link }],
          });
          session_count[item.sessionId]++;
        } else {
          if (completedSessions[item.sessionId]) {
            completedSessions.push({
              ...item.session,
              title: `${item.session.title}-${completedSessions_count[item.sessionId] + 1
                }`,
              SessionSlot: [{ ...item.sessionSlot, link: item.link }],
            });
            completedSessions_count[item.sessionId]++;
          } else {
            completedSessions.push({
              ...item.session,
              SessionSlot: [{ ...item.sessionSlot, link: item.link }],
            });
            completedSessions_count[item.sessionId] = 1;
          }
        }
      });
    return res.status(200).json({
      attendance,
      session: sessions,
      completedSessions,
    });
  } catch (err) {
    console.log(`Error while fetching sessions of user:${id}`);
    console.log(err);
    next(err);
  }
};

exports.getUserSessionsById = async (id) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        Attendance: {
          include: {
            session: true,
            sessionSlot: {
              include: {
                speakers: true,
              },
            },
          },
        },
      },
    });
    if (!user) {
      throw createCustomError({ status: 404, message: "user not found" });
    }
    const today = new Date();
    const attendance = user.Attendance;
    const sessions = [],
      completedSessions = [];
    const session_count = {},
      completedSessions_count = {};
    attendance
      .filter((item) => item.paymentCompleted)
      .forEach((item) => {
        if (new Date(item.sessionSlot.endTime) >= today) {
          sessions.push({
            ...item.session,
            title: `${item.session.title}-${session_count[item.sessionId] + 1
              }`,
            SessionSlot: [{ ...item.sessionSlot, link: item.link }],
          });
          session_count[item.sessionId]++;
        } else {
          if (completedSessions[item.sessionId]) {
            completedSessions.push({
              ...item.session,
              title: `${item.session.title}-${completedSessions_count[item.sessionId] + 1
                }`,
              SessionSlot: [{ ...item.sessionSlot, link: item.link }],
            });
            completedSessions_count[item.sessionId]++;
          } else {
            completedSessions.push({
              ...item.session,
              SessionSlot: [{ ...item.sessionSlot, link: item.link }],
            });
            completedSessions_count[item.sessionId] = 1;
          }
        }
      });
    return {
      attendance,
      session: sessions,
      completedSessions,
    };
  } catch (err) {
    console.log(`Error while fetching sessions of user:${id}`);
    console.log(err);
    next(err);
  }
};

// get user cart items
exports.getCartItems = async function (req, res, next) {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        Attendance: {
          include: {
            session: true,
            sessionSlot: true,
          },
        },
      },
    });
    const attendance = user?.Attendance; 
    const today = new Date();
    const cart = [],
      deleteIds = [];
    attendance && attendance.forEach((item) => {
      if (!item.paymentCompleted) {
        if (new Date(item.sessionSlot.endTime) < today) {
          deleteIds.push(
            prisma.attendance.delete({ where: { id: parseInt(item.id) } })
          );
        } else {
          cart.push(item);
        }
      }
    });

    await Promise.all(deleteIds);

    return res.status(200).json({ status: 200, cart });
  } catch (err) {
    console.log(`Error while fetching cart items of user:${id}`);
    console.log(err);
    next(err);
  }
};

// add an attendance record session
exports.addUserSession = async function (req, res, next) {
  const { id } = req.params;
  const { sessionId, price } = req.body;

  try {
    const session = await findSessionByIdHelper(sessionId);
    
    // First, check if the id is a unifiedUser ID or a regular user ID
    let unifiedUserId, userId;
    
    // Try to find as regular user ID first (most common case)
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (existingUser) {
      // It's a regular user ID
      userId = parseInt(id);
      // Find the unifiedUser that references this user
      const unifiedUserWithUser = await prisma.unifiedUser.findFirst({
        where: { userId: parseInt(id) }
      });
      
      if (unifiedUserWithUser) {
        unifiedUserId = unifiedUserWithUser.id;
      } else {
        throw new Error("User not found or not associated with any unifiedUser");
      }
    } else {
      // Try to find as unifiedUser ID
      const uniUser = await prisma.unifiedUser.findUnique({
        where: { id: parseInt(id) }
      });

      if (uniUser) {
        // It's a unifiedUser ID
        unifiedUserId = parseInt(id);
        // Find the actual user ID from the related user
        if (uniUser.userId) {
          userId = uniUser.userId;
        } else if (uniUser.expertId) {
          userId = uniUser.expertId;
        } else if (uniUser.partnerId) {
          userId = uniUser.partnerId;
        } else if (uniUser.adminId) {
          userId = uniUser.adminId;
        } else {
          throw new Error("No associated user found for the given unifiedUser ID");
        }
      } else {
        throw new Error("User not found or not associated with any unifiedUser");
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Attendance: true },
    });

    if (!user) {
      throw createCustomError({ status: 404, message: "User not found" });
    }

    const user_attendance = user.Attendance || [];

    const foundSession = user_attendance.find(
      (item) => item.sessionId === sessionId
    );
    if (foundSession) {
      throw createCustomError({ status: 400, message: "User owns session" });
    }

    const sessionSlots = await prisma.sessionSlot.findMany({
      where: { sessionId: parseInt(sessionId) },
      include: {
        session: true
      }
    });

    let promises = sessionSlots.map((slot) => {
      return prisma.attendance.create({
        data: {
          userId: userId,
          sessionSlotId: slot.id,
          sessionId,
          price: slot.price,
          paymentCompleted:true,
        },
      });
    });

    const attendance_records = await prisma.$transaction(promises);

    await rewardsManagement({
      userId: unifiedUserId,
      rewardRuleName: RewardAction.REGISTER_SESSION,
      type: RewardType.CREDIT
    });

    const formattedSlots = sessionSlots.map(slot => {
      const startDate = new Date(slot.startTime);
      const endDate = new Date(slot.endTime);
      return {
        topicName:slot.topicName,
        date: startDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        startTime: startDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        endTime: endDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      };
    });

    await notificationService.createSessionRegistrationNotification({
      recipientId: unifiedUserId,
      senderId: session.createdById,
      sessionId: session.id,
      sessionName: session.title,
      sessionImage: session.infoImgs[0],
      slots: formattedSlots,
      roomId: session.roomId
    });

    return res.status(201).json({ status: 201, attendance_records });
  } catch (err) {
    console.log(`Error while adding sessions(user) of user:${id}`);
    console.log(err);
    next(err);
  }
};

// mark attendance
// mark attendance
exports.addUserAttendence = async function (req, res, next) {
  const { id } = req.params;
  const { attendanceId, rsvp } = req.body;
  try {
    const pre = await prisma.attendance.findUnique({
      where: { id: parseInt(attendanceId) },
      include: {
        sessionSlot: true,
        user: true,
      },
    });
    if (pre.paymentCompleted) {
        const attendance = await prisma.attendance.update({
          where: { id: parseInt(attendanceId) },
          data: { rsvp: rsvp },
        });
        return res.status(200).json({ status: 200, attendance });
    } else {
      throw createCustomError({
        status: 400,
        message: "Please complete payment",
      });
    }
  } catch (err) {
    console.log(`Error while marking attendance of user:${id}`);
    console.log(err);
    next(err);
  }
};

// buy session

// ADD: check if exclusive session
exports.buySession = async function (req, res, next) {
  const { id } = req.params;
  const { transactionId, attendanceId } = req.body;

  try {
    if (!transactionId) {
      throw createCustomError({
        status: 400,
        message: "Transaction details not specified",
      });
    }
    // check if transactionId is valid
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(transactionId) },
    });
    if (!transaction)
      throw createCustomError({
        status: 400,
        message: "Invalid TransactionID",
      });

    const pre_check = await prisma.attendance.findUnique({
      where: {
        id: parseInt(attendanceId),
      },
      include: {
        session: true,
      },
    });
    // check if user owns an active subscription
    if (pre_check.session.isExclusive) {
      // check if user-community === pre_check.session.communityId
      const userCommunities = await getUserCommunitiesHelper(pre_check.userId);
      if (
        !userCommunities?.find(
          (item) => item.id === pre_check.session.communityId
        )
      ) {
        throw createCustomError({
          status: 400,
          message: "You should own subscription to attend the session",
        });
      }
    }

    const attendance = await prisma.attendance.update({
      where: { id: parseInt(attendanceId) },
      data: { paymentCompleted: true, transactionId: transactionId },
    });

    return res.status(200).json({ status: 200, attendance });
  } catch (err) {
    console.log(`Error while buying session of user:${id} @ ${__filename}`);
    console.log(err);
    next(err);
  }
};

// get user-communities
exports.getUserCommunities = async function (req, res, next) {
  const { id } = req.params;

  try {
    // First find the unified user ID for the user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { unifiedUserId: true }
    });
    
    if (!user || !user.unifiedUserId) {
      return res.status(404).json({ status: 404, message: "User not found or no unified user", communities: [] });
    }

    const unifiedUserId = user.unifiedUserId.id;
    const now = new Date();

    // Get all valid (not expired) subscriptions for this user
    const userSubscriptions = await prisma.subscription.findMany({
      where: {
        unifiedUserId: unifiedUserId,
      },
      select: {
        community: true
      }
    });

    // Map to just the community info
    const communities = userSubscriptions.map(sub => sub.community);

    return res.status(200).json({ status: 200, communities });
  } catch (err) {
    console.log(`Error while fetching subscriptions of user:${id}`);
    console.log(err);
    next(err);
  }
};

exports.getInitialCommunity = async function (req, res, next) {
  const { id } = req.params;

  try {
    // First find the unified user ID for the user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { unifiedUserId: true }
    });
    
    const unifiedUserId = user?.unifiedUserId?.id;

    const community = await prisma.Community.findMany({
      where: { initialCommunity: true },
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
        subscriptions: true
      }
    });

    const initialCommunity = community.map(community => ({
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
      initialCommunity: community.initialCommunity,
      communityType: community.communityType,
      isApproved: community.isApproved,
      isCatchupLive: community.isCatchupLive,
      parentCommunities: community.childCommunities.map(child => child.parentCommunity),
      childCommunities: community.parentCommunities.map(parent => parent.childCommunity),
      subscriptions: community.subscriptions?.length,
      userSubscribed: unifiedUserId ? community.subscriptions?.some(sub => sub.unifiedUserId === unifiedUserId) : false
    }));

    return res.status(200).json({ initialCommunity });
  } catch (err) {
    console.log(`Error while fetching initial community of user:${id}`);
    console.log(err);
    next(err);
  }
};

exports.getSessionsFromCommunity = async function (req, res, next) {
  const { id } = req.params;

  try {
    // First find the unified user ID for the user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { unifiedUserId: true }
    });
    
    if (!user || !user.unifiedUserId) {
      return res.status(404).json({ status: 404, message: "User not found or no unified user", sessions: [], completedSessions: [] });
    }

    // find communities using unifiedUserId
    const communities = await getUserCommunitiesHelper(user.unifiedUserId.id);

    let sessions = {};
    let completedSessions = {};
    let today = new Date();

    communities?.forEach((college) => {
      college.SessionTier.forEach((tier) => {
        if (new Date(tier.sessionSlot.endTime) >= today) {
          let obj = {
            session: JSON.parse(
              JSON.stringify({
                ...tier.sessionSlot.session,
                communityId: tier.communityId,
              })
            ),
          };
          delete tier.sessionSlot.session;
          if (sessions[tier.sessionSlot.sessionId]) {
            sessions[tier.sessionSlot.sessionId].SessionSlot.push(
              tier.sessionSlot
            );
          } else {
            sessions[tier.sessionSlot.sessionId] = {
              ...obj,
              SessionSlot: [tier.sessionSlot],
            };
          }
        } else {
          let obj = {
            session: JSON.parse(JSON.stringify(tier.sessionSlot.session)),
          };
          delete tier.sessionSlot.session;
          if (completedSessions[tier.sessionSlot.sessionId]) {
            completedSessions[tier.sessionSlot.sessionId].SessionSlot.push(
              tier.sessionSlot
            );
          } else {
            completedSessions[tier.sessionSlot.sessionId] = {
              ...obj,
              SessionSlot: [tier.sessionSlot],
            };
          }
        }
      });
      // sessions:[{session,sessionSlot}]
    });
    let finalSessions = Object.values(sessions).map(
      ({ session, SessionSlot }) => ({ ...session, SessionSlot })
    );
    let finalCompletedSessions = Object.values(completedSessions).map(
      ({ session, SessionSlot }) => ({ ...session, SessionSlot })
    );

    return res.status(200).json({
      sessions: finalSessions,
      completedSessions: finalCompletedSessions,
    });
  } catch (err) {
    console.log(`Error while fetching Sessions from community of user:${id}`);
    console.log(err);
    next(err);
  }
};

// delete user attendance record
exports.deleteUserSession = async function (req, res, next) {
  const { id } = req.params;
  try {
    const attendance = await prisma.attendance.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({ status: 200, attendance });
  } catch (err) {
    console.log(`Error while deleting sessions(user) of user:${id}`);
    console.log(err);
    next(err);
  }
};

// to delete sessions from cart
exports.deleteCartSessions = async function (req, res, next) {
  const { attendanceIds } = req.body; // receive an attendanceIDs array
  const { id } = req.params;

  try {
    await findUserByIdHelper(id);
    console.log(req.user.unifiedUserId);
    let results = await deleteRecordBundles(attendanceIds);
    return res.status(200).json({ status: 200, results });
  } catch (err) {
    console.log("Error while deleting cart sessions for user: " + id);
    console.log(err);
    next(err);
  }
};

exports.getUserEvents = async function (req, res, next) {
  const { id } = req.params;
  try {
    await findUserByIdHelper(id);
    const unifiedUserId = req.user.unifiedUserId;
    const allAttendance = await prisma.eventAttendance.findMany({
      where: {
        unifiedUserId: unifiedUserId,
      },
      include: {
        event: {
          include: {
            eventAttendance: {
              include: {
                unifiedUser: true,
              },
            },
          },
        },
      },
    });
    const { events, completedEvents } = getEventStdFormat(
      allAttendance.map((item) => item.event)
    );
    return res.status(200).json({ events, completedEvents });
  } catch (error) {
    console.log(`Error while fetching user events @ ${__filename}`);
    console.log(error);
    next(error);
  }
};

//user notification
exports.createNotification = async (req, res) => {
  try {
    const { fromId, toId, messageBody } = req.body;

    console.log("Received notification data:", req.body); // Log received data for debugging

    const newNotification = await prisma.chatNotifications.create({
      data: {
        fromId,
        toId,
        messageBody,
      },
    });

    res.status(201).json(newNotification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
};
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await prisma.chatNotifications.findMany();

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};
// exports.getNotificationById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const notification = await prisma.chatNotifications.findUnique({
//       where: { Id: parseInt(id) },
//     });

//     if (!notification) {
//       return res.status(404).json({ error: "Notification not found" });
//     }

//     res.status(200).json(notification);
//   } catch (error) {
//     console.error("Error fetching notification:", error);
//     res.status(500).json({ error: "Failed to fetch notification" });
//   }
// };
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        unifiedUserId: true,
      },
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

exports.isUserSubscribedToCommunity = async function (req, res, next) {
  const { userId, communityId } = req.params;
  try {
    // Find the unified user ID for the user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { unifiedUserId: true }
    });
    if (!user || !user.unifiedUserId) {
      return res.status(404).json({ subscribed: false, message: "User not found" });
    }
    // Check for subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        unifiedUserId: user.unifiedUserId.id,
        communityId: parseInt(communityId)
      }
    });
    return res.status(200).json({ subscribed: !!subscription });
  } catch (err) {
    next(err);
  }
};

exports.hasUserRequestedCommunity = async function (req, res, next) {
  const { userId, communityId } = req.params;
  try {
    // Find the unified user ID for the user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { unifiedUserId: true }
    });
    if (!user || !user.unifiedUserId) {
      return res.status(404).json({ requested: false, message: "User not found" });
    }
    // Check for a pending community join request (status: false means pending)
    const request = await prisma.requests.findFirst({
      where: {
        userId: user.unifiedUserId.id, // Use unifiedUser ID, not User ID
        communityId: parseInt(communityId),
        status: false
      }
    });
    return res.status(200).json({ requested: !!request });
  } catch (err) {
    next(err);
  }
};

exports.getAllRequestedCommunities = async function (req, res, next) {
  const { userId } = req.params;
  try {
    // First find the unified user ID for the user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { unifiedUserId: true }
    });
    
    if (!user || !user.unifiedUserId) {
      return res.status(404).json({ communities: [], message: "User not found" });
    }

    // Find all pending requests for this unified user
    const requests = await prisma.requests.findMany({
      where: {
        userId: user.unifiedUserId.id, // Use unifiedUser ID, not User ID
        status: false // pending
      },
      include: {
        Community: true
      }
    });
    
    // Map to just the community info
    const communities = requests.map(r => r.Community);
    return res.status(200).json({ communities });
  } catch (err) {
    next(err);
  }
};

// Get user subscribed communities with proper unifiedUserId handling
exports.getUserSubscribedCommunities = async function (req, res, next) {
  const { id } = req.params;

  try {
    // First find the unified user ID for the user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { unifiedUserId: true }
    });
    
    if (!user || !user.unifiedUserId) {
      return res.status(404).json({ status: 404, message: "User not found or no unified user", communities: [] });
    }

    const communities = await getUserCommunitiesHelper(user.unifiedUserId.id);
    
    // Filter out DEFAULT community type
    const filteredCommunities = communities.filter(community => community.communityType !== 'DEFAULT');
    
    return res.status(200).json({ status: 200, communities: filteredCommunities });
  } catch (err) {
    console.log(`Error while fetching subscribed communities of user:${id}`);
    console.log(err);
    next(err);
  }
};

// Get non-subscribed communities (excluding requested ones)
exports.getUserNonSubscribedCommunities = async function (req, res, next) {
  const { id } = req.params;

  try {
    // First find the unified user ID for the user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { unifiedUserId: true }
    });
    
    if (!user || !user.unifiedUserId) {
      return res.status(404).json({ status: 404, message: "User not found or no unified user", communities: [] });
    }

    const unifiedUserId = user.unifiedUserId.id;

    // Get all communities (with subscriptions and requests)
    const allCommunities = await prisma.community.findMany({
      include: {
        subscriptions: true,
        requests: {
          where: {
            userId: unifiedUserId,
            status: false // pending requests
          }
        }
      }
    });

    // Get user's currently valid (not expired) subscriptions
    const now = new Date();
    const userSubscriptions = await prisma.subscription.findMany({
      where: {
        unifiedUserId: unifiedUserId,
      },
      select: {
        communityId: true
      }
    });
    const subscribedCommunityIds = userSubscriptions.map(sub => sub.communityId);

    // Filter communities: exclude subscribed ones and requested ones
    const nonSubscribedCommunities = allCommunities.filter(community => {
      const isSubscribed = subscribedCommunityIds.includes(community.id);
      const isRequested = community.requests.length > 0;
      return !isSubscribed && !isRequested;
    });

    // Filter out DEFAULT type communities from the non-subscribed results
    const finalNonSubscribedCommunities = nonSubscribedCommunities.filter(community => community.communityType !== 'DEFAULT');

    // Format the response
    const formattedCommunities = finalNonSubscribedCommunities.map(community => ({
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
      initialCommunity: community.initialCommunity,
      isApproved: community.isApproved,
      isCatchupLive: community.isCatchupLive,
      subscriptionCount: community.subscriptions.length
    }));

    return res.status(200).json({ 
      status: 200, 
      communities: formattedCommunities,
      total: formattedCommunities.length
    });
  } catch (err) {
    console.log(`Error while fetching non-subscribed communities of user:${id}`);
    console.log(err);
    next(err);
  }
};

// Debug function to see all communities
exports.getAllCommunitiesDebug = async function (req, res, next) {
  try {
    const allCommunities = await prisma.community.findMany({
      select: {
        id: true,
        title: true,
        isApproved: true,
        isArchived: true,
        initialCommunity: true,
        communityType: true
      }
    });

    console.log('All communities in database:', allCommunities);
    
    return res.status(200).json({ 
      status: 200, 
      communities: allCommunities,
      total: allCommunities.length
    });
  } catch (err) {
    console.log(`Error while fetching all communities for debug`);
    console.log(err);
    next(err);
  }
};

// Get user subscribed sessions
exports.getUserSubscribedSessions = async function (req, res, next) {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    // First find the unified user ID for the user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { unifiedUserId: true }
    });
    
    if (!user || !user.unifiedUserId) {
      return res.status(404).json({ 
        status: 404, 
        message: "User not found or no unified user", 
        sessions: [],
        total: 0,
        page,
        limit,
        pages: 0
      });
    }

    // Get user's attendance records with payment completed
    const attendance = await prisma.attendance.findMany({
      where: {
        userId: parseInt(id),
        paymentCompleted: true
      },
      include: {
        session: {
          include: {
            creator: true,
            tags: {
              include: {
                tag: true
              }
            }
          }
        },
        sessionSlot: {
          include: {
            speakers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filter sessions that are not expired
    const today = new Date();
    const activeAttendance = attendance.filter(item => 
      new Date(item.sessionSlot.endTime) >= today
    );

    // Group by session
    const sessionsMap = new Map();
    activeAttendance.forEach(item => {
      const sessionId = item.session.id;
      if (!sessionsMap.has(sessionId)) {
        sessionsMap.set(sessionId, {
          ...item.session,
          sessionSlots: [],
          attendance: []
        });
      }
      const sessionData = sessionsMap.get(sessionId);
      sessionData.sessionSlots.push({
        ...item.sessionSlot,
        attendanceDetails: {
          id: item.id,
          rsvp: item.rsvp,
          link: item.link,
          price: item.price,
          paymentCompleted: item.paymentCompleted,
          createdAt: item.createdAt
        }
      });
    });

    const groupedSessions = Array.from(sessionsMap.values());
    
    // Pagination
    const total = groupedSessions.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedSessions = groupedSessions.slice(start, end);

    return res.status(200).json({
      status: 200,
      sessions: paginatedSessions,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.log(`Error while fetching subscribed sessions of user:${id}`);
    console.log(err);
    next(err);
  }
};

// Get user non-subscribed sessions
exports.getUserNonSubscribedSessions = async function (req, res, next) {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    // First find the unified user ID for the user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { unifiedUserId: true }
    });
    
    if (!user || !user.unifiedUserId) {
      return res.status(404).json({ 
        status: 404, 
        message: "User not found or no unified user", 
        sessions: [],
        total: 0,
        page,
        limit,
        pages: 0
      });
    }

    console.log(`Fetching non-subscribed sessions for user: ${id}`);

    // Get user's paid attendance records first
    const userPaidAttendance = await prisma.attendance.findMany({
      where: {
        userId: parseInt(id),
        paymentCompleted: true
      },
      select: {
        sessionId: true
      }
    });

    const userPaidSessionIds = userPaidAttendance.map(att => att.sessionId);
    // console.log(`User has paid attendance for sessions: ${userPaidSessionIds}`);

    // Get all sessions that are approved and not archived
    const allSessions = await prisma.session.findMany({
      where: {
        isArchived: false,
        isActive: true,
        // Exclude sessions where user has paid attendance
        id: {
          notIn: userPaidSessionIds
        }
      },
      include: {
        creator: true,
        tags: {
          include: {
            tag: true
          }
        },
        SessionSlot: {
          where: {
            isArchived: false
          },
          include: {
            speakers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // console.log(`Found ${allSessions.length} total sessions after filtering paid ones`);
    // console.log('Session details:', allSessions.map(s => ({
    //   id: s.id,
    //   title: s.title,
    //   isActive: s.isActive,
    //   isArchived: s.isArchived,
    //   sessionSlotsCount: s.SessionSlot.length
    // })));

    // Filter sessions that have active slots
    const today = new Date();
    const nonSubscribedSessions = allSessions.filter(session => {
      // Check if session has any active slots
      const hasActiveSlots = session.SessionSlot.some(slot => 
        new Date(slot.endTime) >= today
      );
      
      // console.log(`Session ${session.id} (${session.title}): hasActiveSlots=${hasActiveSlots}`);
      
      return hasActiveSlots;
    });

    // console.log(`Found ${nonSubscribedSessions.length} non-subscribed sessions with active slots`);

    // Pagination
    const total = nonSubscribedSessions.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedSessions = nonSubscribedSessions.slice(start, end);

    // Format response
    const formattedSessions = paginatedSessions.map(session => ({
      id: session.id,
      title: session.title,
      desc: session.desc,
      bannerImgs: session.bannerImgs,
      infoImgs: session.infoImgs,
      isCourse: session.isCourse,
      isRecurring: session.isRecurring,
      isExclusive: session.isExclusive,
      sessionType: session.sessionType,
      videoUrl: session.videoUrl,
      isActive: session.isActive,
      isApproved: session.isApproved,
      creator: session.creator,
      tags: session.tags.map(tag => tag.tag),
      sessionSlots: session.SessionSlot.filter(slot => 
        new Date(slot.endTime) >= today
      ).map(slot => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isOnline: slot.isOnline,
        participantLimit: slot.participantLimit,
        price: slot.price,
        credits: slot.credits,
        location: slot.location,
        topicName: slot.topicName,
        isRecorded: slot.isRecorded,
        isLive: slot.isLive,
        videoUrl: slot.videoUrl,
        speakers: slot.speakers
      }))
    }));

    // console.log(`Returning ${formattedSessions.length} formatted sessions`);

    return res.status(200).json({
      status: 200,
      sessions: formattedSessions,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.log(`Error while fetching non-subscribed sessions of user:${id}`);
    console.log(err);
    next(err);
  }
};

// Check if user is subscribed to a session
exports.isUserSubscribedToSession = async function (req, res, next) {
  const { userId, sessionId } = req.params;

  try {
    // Check if user has any attendance for this session
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: parseInt(userId),
        sessionId: parseInt(sessionId),
        paymentCompleted: true
      }
    });

    return res.status(200).json({ 
      subscribed: !!attendance,
      attendance: attendance || null
    });
  } catch (err) {
    console.log(`Error while checking session subscription: ${userId}, ${sessionId}`);
    console.log(err);
    next(err);
  }
};

// Get user session join status
exports.getUserSessionJoinStatus = async function (req, res, next) {
  const { userId, sessionId } = req.params;

  try {
    // Get all attendance records for this user and session
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        userId: parseInt(userId),
        sessionId: parseInt(sessionId)
      },
      include: {
        sessionSlot: true
      }
    });

    if (attendanceRecords.length === 0) {
      return res.status(200).json({
        status: 'not_joined',
        message: 'User has not joined this session',
        attendance: null
      });
    }

    // Check if any attendance is paid
    const paidAttendance = attendanceRecords.find(att => att.paymentCompleted);
    
    if (paidAttendance) {
      return res.status(200).json({
        status: 'subscribed',
        message: 'User is subscribed to this session',
        attendance: paidAttendance
      });
    }

    // Check if any attendance is pending payment
    const pendingAttendance = attendanceRecords.find(att => !att.paymentCompleted);
    
    if (pendingAttendance) {
      return res.status(200).json({
        status: 'pending_payment',
        message: 'User has joined but payment is pending',
        attendance: pendingAttendance
      });
    }

    return res.status(200).json({
      status: 'unknown',
      message: 'Unknown join status',
      attendance: attendanceRecords[0]
    });
  } catch (err) {
    console.log(`Error while checking session join status: ${userId}, ${sessionId}`);
    console.log(err);
    next(err);
  }
};

// Get user session statistics
exports.getUserSessionStats = async function (req, res, next) {
  const { id } = req.params;

  try {
    // Get user's attendance records
    const attendance = await prisma.attendance.findMany({
      where: {
        userId: parseInt(id)
      },
      include: {
        session: true,
        sessionSlot: true
      }
    });

    const today = new Date();
    
    // Calculate statistics
    const totalSessions = attendance.length;
    const subscribedSessions = attendance.filter(att => att.paymentCompleted).length;
    const pendingSessions = attendance.filter(att => !att.paymentCompleted).length;
    const completedSessions = attendance.filter(att => 
      att.paymentCompleted && new Date(att.sessionSlot.endTime) < today
    ).length;
    const upcomingSessions = attendance.filter(att => 
      att.paymentCompleted && new Date(att.sessionSlot.endTime) >= today
    ).length;
    const attendedSessions = attendance.filter(att => 
      att.paymentCompleted && att.rsvp
    ).length;

    // Calculate total spent
    const totalSpent = attendance
      .filter(att => att.paymentCompleted)
      .reduce((sum, att) => sum + att.price, 0);

    // Get session categories
    const sessionCategories = {};
    attendance.forEach(att => {
      if (att.session.sessionType) {
        sessionCategories[att.session.sessionType] = 
          (sessionCategories[att.session.sessionType] || 0) + 1;
      }
    });

    return res.status(200).json({
      status: 200,
      stats: {
        totalSessions,
        subscribedSessions,
        pendingSessions,
        completedSessions,
        upcomingSessions,
        attendedSessions,
        totalSpent,
        sessionCategories
      }
    });
  } catch (err) {
    console.log(`Error while fetching session stats for user:${id}`);
    console.log(err);
    next(err);
  }
};

exports.getUserOngoingSessions = async function (req, res, next) {
  const { id } = req.params;
  
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // This query fetches sessions that are currently ongoing or are starting in the next 5 minutes.
    // It is used by the frontend to display a global notification for upcoming sessions.
    const attendance = await prisma.attendance.findMany({
      where: {
        userId: parseInt(id),
        paymentCompleted: true,
        sessionSlot: {
          startTime: { lte: fiveMinutesFromNow.toISOString() },
          endTime: { gte: now.toISOString() }
        }
      },
      include: {
        session: {
          include: { creator: true, tags: { include: { tag: true } } }
        },
        sessionSlot: {
          include: { speakers: true }
        }
      },
      orderBy: {
        sessionSlot: { startTime: 'asc' }
      }
    });

    const sessionsMap = new Map();
    attendance.forEach(item => {
      // Guard against null relations
      if (!item.session || !item.sessionSlot) return;

      const sessionId = item.session.id;
      if (!sessionsMap.has(sessionId)) {
        sessionsMap.set(sessionId, {
          ...item.session,
          sessionSlots: []
        });
      }
      const sessionData = sessionsMap.get(sessionId);
      sessionData.sessionSlots.push({
        ...item.sessionSlot,
        attendanceDetails: {
          id: item.id,
          rsvp: item.rsvp,
          link: item.link
        }
      });
    });

    const ongoingSessions = Array.from(sessionsMap.values());

    return res.status(200).json({
      status: 200,
      sessions: ongoingSessions,
      total: ongoingSessions.length,
    });

  } catch (err) {
    console.log(`Error while fetching ongoing sessions for user:${id}`);
    console.error(err);
    next(err);
  }
};

exports.getUserUpcomingSessionSlots = async function (req, res, next) {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        userId: parseInt(id),
        paymentCompleted: true,
        sessionSlot: {
          endTime: {
            gte: new Date().toISOString()
          }
        }
      },
      include: {
        session: {
          include: { creator: true, tags: { include: { tag: true } } }
        },
        sessionSlot: {
          include: { speakers: true }
        }
      },
      orderBy: {
        sessionSlot: {
          startTime: 'asc'
        }
      }
    });

    const total = attendance.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedAttendance = attendance.slice(start, end);

    const formattedSessions = paginatedAttendance.map(item => ({
      ...(item.session || {}),
      sessionSlots: item.sessionSlot ? [{
        ...item.sessionSlot,
        attendanceDetails: {
          id: item.id,
          rsvp: item.rsvp,
          link: item.link,
        }
      }] : []
    }));

    return res.status(200).json({
      status: 200,
      sessions: formattedSessions,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.log(`Error while fetching upcoming session slots for user:${id}`);
    console.error(err);
    next(err);
  }
};
