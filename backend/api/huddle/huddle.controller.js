const { PrismaClient, RewardType, RewardAction } = require("@prisma/client");
const prisma = new PrismaClient();
const { rewardsManagement } = require("../../services/rewards/rewards.service");
const huddleService = require("../../services/huddle/huddle.service");
const huddleEngagementService = require("../../services/huddle/huddle-engagement.service");
const huddleNotificationService = require("../../services/huddle/huddle-notification.service");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const uuid4 = require("uuid4");

// ==================== HUDDLE CRUD ====================

/**
 * Create a new huddle
 * POST /api/v1/huddle/create
 */
exports.createHuddle = async function (req, res) {
    try {
        const {
            title,
            description,
            communityId,
            creatorId,
            frequency,
            scheduledTime,
            timezone,
            selectedActivities,
            audienceType,
            selectedMemberIds,
            locationType,
            offlineLocation,
            leaderId,
            leaderSelectionType
        } = req.body;

        // Validate required fields
        if (!title || !communityId || !creatorId || !frequency || !scheduledTime || !selectedActivities) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: title, communityId, creatorId, frequency, scheduledTime, selectedActivities"
            });
        }

        // Check if community exists
        const community = await prisma.community.findUnique({
            where: { id: parseInt(communityId) }
        });

        if (!community) {
            return res.status(404).json({
                success: false,
                message: "Community not found"
            });
        }

        // Check if there's already a huddle for this community (only one ritual per community)
        const existingHuddle = await prisma.huddle.findFirst({
            where: {
                communityId: parseInt(communityId),
                isScheduled: true,
                OR: [
                    { isLive: true },
                    { scheduledTime: { gte: new Date() } }
                ]
            }
        });

        if (existingHuddle) {
            return res.status(400).json({
                success: false,
                message: "Only one ritual/huddle can exist per community at a time. Please wait for the current ritual to complete or cancel it first."
            });
        }

        // Validate scheduled time is in the future
        const scheduledDateTime = new Date(scheduledTime);
        if (scheduledDateTime <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Scheduled time must be in the future"
            });
        }

        // Generate 100ms room ID for huddle (will be created on-demand if this fails)
        let roomId = null;
        try {
            roomId = await huddleService.generateHuddleRoomId(communityId, title);
        } catch (error) {
            console.warn("Failed to create 100ms room during huddle creation, will create on-demand:", error.message);
            // roomId remains null - will be created when user joins
        }

            // Create huddle
        const huddle = await prisma.huddle.create({
                data: {
                title,
                description: description || "",
                    communityId: parseInt(communityId),
                    creatorId: parseInt(creatorId),
                    frequency,
                    scheduledTime: scheduledDateTime,
                    timezone: timezone || "UTC",
                    selectedActivities,
                    audienceType: audienceType || "ALL_MEMBERS",
                    selectedMemberIds: selectedMemberIds || [],
                    locationType: locationType || "DIGITAL",
                offlineLocation: offlineLocation || null,
                    roomId,
                    leaderId: leaderId ? parseInt(leaderId) : null,
                    leaderSelectionType: leaderSelectionType || "USER",
                    isScheduled: true,
                    isLive: false
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
                    },
                    leader: {
                        select: {
                            id: true,
                            email: true,
                            user: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            });

            // Create huddle activities based on selected types
        await huddleService.createHuddleActivities(huddle.id, selectedActivities, creatorId);

        // Create invitations for selected members or all members
        let membersToInvite = [];
            if (audienceType === 'ALL_MEMBERS') {
                // Get all community members
                const subscriptions = await prisma.subscription.findMany({
                    where: { communityId: parseInt(communityId) },
                    select: { userId: true }
                });
                membersToInvite = subscriptions.map(sub => sub.userId);
            } else if (audienceType === 'SELECTED_MEMBERS' && selectedMemberIds && selectedMemberIds.length > 0) {
                membersToInvite = selectedMemberIds.map(id => parseInt(id));
            }

            // Create invitations (exclude creator as they're automatically accepted)
            if (membersToInvite.length > 0) {
                const invitations = membersToInvite
                    .filter(userId => userId !== parseInt(creatorId))
                    .map(userId => ({
                        huddleId: huddle.id,
                        userId: userId,
                        status: 'PENDING'
                    }));

                if (invitations.length > 0) {
                    await prisma.huddleInvitation.createMany({
                        data: invitations,
                        skipDuplicates: true
                    });
                }
        }

        // Send notification about new huddle (non-blocking)
        try {
        await huddleNotificationService.sendHuddleCreatedNotification(huddle);
        } catch (notificationError) {
            console.error("Notification error (non-critical - huddle created successfully):", notificationError);
            // Don't fail huddle creation if notifications fail
        }

        // Handle rewards (non-blocking)
        try {
            await rewardsManagement({
                userId: parseInt(creatorId),
                rewardRuleName: RewardAction.CREATE_HUDDLE,
                type: RewardType.CREDIT
            });
        } catch (rewardError) {
            console.log("Reward error (non-critical):", rewardError);
        }

        return res.status(201).json({
            success: true,
            message: "Huddle created successfully",
            huddle
        });

    } catch (error) {
        console.error("Error creating huddle:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create huddle",
            error: error.message
        });
    }
};

/**
 * Get huddle by ID
 * GET /api/v1/huddle/:id
 */
exports.getHuddleById = async function (req, res) {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid huddle ID"
            });
        }

        const huddle = await prisma.huddle.findUnique({
            where: { id: parseInt(id) },
            include: {
                community: {
                    select: {
                        id: true,
                        title: true,
                        bannerImg: true,
                        desc: true
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
                },
                leader: {
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
                },
                attendances: {
                    include: {
                        user: {
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
                    }
                },
                activities: {
                    select: {
                        id: true,
                        activityType: true,
                        activityData: true,
                        linkUrl: true,
                        isActive: true,
                        isGenerated: true,
                        postId: true,
                        pollId: true,
                        threadId: true
                    },
                    orderBy: {
                        id: 'asc'
                    }
                },
                summaries: true
            }
        });

        if (!huddle) {
            return res.status(404).json({
                success: false,
                message: "Huddle not found"
            });
        }

        // Ensure activityData is properly formatted (handle JSON strings)
        if (huddle.activities) {
            huddle.activities = huddle.activities.map(activity => {
                if (activity.activityData && typeof activity.activityData === 'string') {
                    try {
                        activity.activityData = JSON.parse(activity.activityData);
                    } catch (e) {
                        console.error(`Error parsing activityData for activity ${activity.id}:`, e);
                        activity.activityData = {};
                    }
                }
                return activity;
            });
        }

        return res.status(200).json({
            success: true,
            huddle
        });

    } catch (error) {
        console.error("Error getting huddle:", error);
        console.error("Error stack:", error.stack);
        return res.status(500).json({
            success: false,
            message: "Failed to get huddle",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Update huddle
 * PUT /api/v1/huddle/:id
 */
exports.updateHuddle = async function (req, res) {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Check if huddle exists
        const existingHuddle = await prisma.huddle.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingHuddle) {
            return res.status(404).json({
                success: false,
                message: "Huddle not found"
            });
        }

        // Don't allow updating a live huddle's core properties
        if (existingHuddle.isLive) {
            const restrictedFields = ['frequency', 'scheduledTime', 'selectedActivities'];
            const hasRestrictedField = restrictedFields.some(field => updateData[field] !== undefined);
            if (hasRestrictedField) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot update scheduling properties of a live huddle"
                });
            }
        }

        // Parse date if provided
        if (updateData.scheduledTime) {
            updateData.scheduledTime = new Date(updateData.scheduledTime);
        }

        // If selectedActivities is being updated, sync HuddleActivity records
        if (updateData.selectedActivities && Array.isArray(updateData.selectedActivities)) {
            // Delete existing activities
            await prisma.huddleActivity.deleteMany({
                where: { huddleId: parseInt(id) }
            });

            // Create new activities based on selectedActivities
            if (updateData.selectedActivities.length > 0) {
                await huddleService.createHuddleActivities(
                    parseInt(id),
                    updateData.selectedActivities,
                    existingHuddle.creatorId
                );
            }
        }

        const huddle = await prisma.huddle.update({
            where: { id: parseInt(id) },
            data: updateData,
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
                                name: true
                            }
                        }
                    }
                },
                activities: {
                    select: {
                        id: true,
                        activityType: true,
                        activityData: true,
                        linkUrl: true,
                        isActive: true,
                        isGenerated: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Huddle updated successfully",
            huddle
        });

    } catch (error) {
        console.error("Error updating huddle:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update huddle",
            error: error.message
        });
    }
};

/**
 * Delete huddle
 * DELETE /api/v1/huddle/:id
 */
exports.deleteHuddle = async function (req, res) {
    try {
        const { id } = req.params;

        // Check if huddle exists
        const existingHuddle = await prisma.huddle.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingHuddle) {
            return res.status(404).json({
                success: false,
                message: "Huddle not found"
            });
        }

        // Don't allow deleting a live huddle
        if (existingHuddle.isLive) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete a live huddle. End it first."
            });
        }

        await prisma.huddle.delete({
            where: { id: parseInt(id) }
        });

        return res.status(200).json({
            success: true,
            message: "Huddle deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting huddle:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete huddle",
            error: error.message
        });
    }
};

// ==================== HUDDLE EXECUTION ====================

/**
 * Launch/Start a huddle
 * POST /api/v1/huddle/:id/launch
 */
exports.launchHuddle = async function (req, res) {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const huddle = await prisma.huddle.findUnique({
            where: { id: parseInt(id) },
            include: {
                community: true,
                creator: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!huddle) {
            return res.status(404).json({
                success: false,
                message: "Huddle not found"
            });
        }

        // REMOVED: isLive check for testing - allow launching even if already live
        // if (huddle.isLive) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Huddle is already live"
        //     });
        // }

        // Determine the leader if using random/first_login/roundrobin
        let actualLeaderId = huddle.leaderId;
        if (!actualLeaderId || huddle.leaderSelectionType !== 'USER') {
            actualLeaderId = await huddleService.selectLeader(huddle);
        }

        // Update huddle to live
        const updatedHuddle = await prisma.huddle.update({
            where: { id: parseInt(id) },
            data: {
            isLive: true,
            isScheduled: false,
            startTime: new Date(),
            leaderId: actualLeaderId
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
                                name: true
                            }
                        }
                    }
                },
                leader: {
                    select: {
                        id: true,
                        email: true,
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        // Send start notification
        await huddleNotificationService.sendHuddleStartedNotification(updatedHuddle);

        return res.status(200).json({
            success: true,
            message: "Huddle launched successfully",
            huddle: updatedHuddle
        });

    } catch (error) {
        console.error("Error launching huddle:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to launch huddle",
            error: error.message
        });
    }
};

/**
 * End a huddle
 * POST /api/v1/huddle/:id/end
 */
exports.endHuddle = async function (req, res) {
    try {
        const { id } = req.params;

        const huddle = await prisma.huddle.findUnique({
            where: { id: parseInt(id) },
            include: {
                attendances: true
            }
        });

        if (!huddle) {
            return res.status(404).json({
                success: false,
                message: "Huddle not found"
            });
        }

        if (!huddle.isLive) {
            return res.status(400).json({
                success: false,
                message: "Huddle is not live"
            });
        }

        // Update all attendances with leftAt time
        await prisma.huddleAttendance.updateMany({
            where: {
                huddleId: parseInt(id),
                leftAt: null
            },
            data: {
                leftAt: new Date()
            }
        });

        // Update huddle status
        const updatedHuddle = await prisma.huddle.update({
            where: { id: parseInt(id) },
            data: {
                isLive: false,
                endTime: new Date()
            }
        });

        // Update streaks for all attendees
        await huddleEngagementService.updateStreaksForHuddle(huddle);

        // Assign points to attendees
        await huddleEngagementService.assignPointsToAttendees(huddle);

        // Schedule next recurring huddle if applicable (non-blocking)
        // This creates the next huddle with NEW content immediately
        if (updatedHuddle.frequency && updatedHuddle.frequency !== 'ONE_TIME') {
            setImmediate(async () => {
                try {
                    const huddleRecurrenceService = require('../../services/huddle/huddle-recurrence.service');
                    const nextHuddle = await huddleRecurrenceService.scheduleNextHuddle(updatedHuddle);
                    if (nextHuddle) {
                        console.log(`Next huddle ${nextHuddle.id} scheduled for ${nextHuddle.scheduledTime}`);
                    }
                } catch (recurrenceError) {
                    console.error("Error scheduling next huddle (non-critical):", recurrenceError);
                    // Don't fail the end huddle request if scheduling next one fails
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Huddle ended successfully",
            huddle: updatedHuddle
        });

    } catch (error) {
        console.error("Error ending huddle:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to end huddle",
            error: error.message
        });
    }
};

/**
 * Join a huddle
 * POST /api/v1/huddle/:id/join
 */
exports.joinHuddle = async function (req, res) {
    try {
        const { id } = req.params;
        // Accept either userId or unifiedUserId from request body
        // But always resolve to unifiedUserId for consistency
        const { userId, unifiedUserId: reqUnifiedUserId } = req.body;
        const inputUserId = reqUnifiedUserId || userId;

        if (!inputUserId) {
            return res.status(400).json({
                success: false,
                message: "userId or unifiedUserId is required"
            });
        }

        const huddle = await prisma.huddle.findUnique({
            where: { id: parseInt(id) }
        });

        if (!huddle) {
            return res.status(404).json({
                success: false,
                message: "Huddle not found"
            });
        }

        // REMOVED: Invitation check for testing - allow all users to join
        // if (huddle.creatorId !== parseInt(userId)) {
        //     const invitation = await prisma.huddleInvitation.findUnique({
        //         where: {
        //             huddleId_userId: {
        //                 huddleId: parseInt(id),
        //                 userId: parseInt(userId)
        //             }
        //         }
        //     });

        //     if (!invitation) {
        //         return res.status(403).json({
        //             success: false,
        //             message: "You must be invited to join this ritual"
        //         });
        //     }

        //     if (invitation.status !== 'ACCEPTED') {
        //         return res.status(403).json({
        //             success: false,
        //             message: "You must accept the invitation before joining this ritual"
        //         });
        //     }
        // }

        // Resolve incoming userId (can be unifiedUser.id OR user.id OR admin.id OR expert.id OR partner.id)
        // into unifiedUser.id because huddle attendance and all huddle operations use unifiedUserId
        const rawUserId = parseInt(inputUserId);
        if (Number.isNaN(rawUserId)) {
            return res.status(400).json({
                success: false,
                message: "userId must be a number"
            });
        }

        // Try to find unifiedUser by various possible IDs
        const unifiedUser = await prisma.unifiedUser.findFirst({
            where: {
                OR: [
                    { id: rawUserId },           // Direct unifiedUser.id
                    { userId: rawUserId },      // User.id -> unifiedUser.userId
                    { adminId: rawUserId },      // Admin.id -> unifiedUser.adminId
                    { expertId: rawUserId },    // Expert.id -> unifiedUser.expertId
                    { partnerId: rawUserId }     // Partner.id -> unifiedUser.partnerId
                ]
            }
        });

        if (!unifiedUser) {
            return res.status(404).json({
                success: false,
                message: `User with id ${inputUserId} not found. Please ensure the userId exists in unifiedUser, User, Partner, Expert, or Admin tables.`
            });
        }

        // IMPORTANT: Always use unifiedUser.id for all huddle operations
        const unifiedUserId = unifiedUser.id;

        // Check if already attending
        const existingAttendance = await prisma.huddleAttendance.findUnique({
            where: {
                huddleId_userId: {
                    huddleId: parseInt(id),
                    userId: unifiedUserId
                }
            }
        });

        if (existingAttendance) {
            // If they left before, update the record and return the updated version
            if (existingAttendance.leftAt) {
                const updatedAttendance = await prisma.huddleAttendance.update({
                    where: { id: existingAttendance.id },
                    data: {
                        joinedAt: new Date(),
                        leftAt: null
                    }
                });
                return res.status(200).json({
                    success: true,
                    message: "Successfully re-joined huddle",
                    attendance: updatedAttendance
                });
            }
            // User is already in the huddle (not left)
            return res.status(200).json({
                success: true,
                message: "Already joined this huddle",
                attendance: existingAttendance
            });
        }

        // Create attendance record
        const attendance = await prisma.huddleAttendance.create({
            data: {
                huddleId: parseInt(id),
                userId: unifiedUserId,
                joinedAt: new Date()
            }
        });

        // Handle rewards (use unifiedUserId for rewards)
        try {
            await rewardsManagement({
                userId: unifiedUserId,
                rewardRuleName: RewardAction.JOIN_HUDDLE,
                type: RewardType.CREDIT
            });
        } catch (rewardError) {
            console.log("Reward error (non-critical):", rewardError);
        }

        return res.status(200).json({
            success: true,
            message: "Successfully joined huddle",
            attendance
        });

    } catch (error) {
        console.error("Error joining huddle:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to join huddle",
            error: error.message
        });
    }
};

/**
 * Leave a huddle
 * POST /api/v1/huddle/:id/leave
 */
exports.leaveHuddle = async function (req, res) {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }

        const attendance = await prisma.huddleAttendance.findUnique({
            where: {
                huddleId_userId: {
                    huddleId: parseInt(id),
                    userId: parseInt(userId)
                }
            }
        });

        // If user is not in attendance, return success anyway (they might have joined 100ms but not recorded attendance)
        if (!attendance) {
            console.warn(`User ${userId} tried to leave huddle ${id} but was not in attendance records`);
            return res.status(200).json({
                success: true,
                message: "User was not in attendance records, but leave operation completed",
                wasInAttendance: false
            });
        }

        // Update attendance with leave time
        const updatedAttendance = await prisma.huddleAttendance.update({
            where: { id: attendance.id },
            data: {
                leftAt: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Successfully left huddle",
            attendance: updatedAttendance,
            wasInAttendance: true
        });

    } catch (error) {
        console.error("Error leaving huddle:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to leave huddle",
            error: error.message
        });
    }
};

/**
 * Get huddle attendees
 * GET /api/v1/huddle/:id/attendees
 */
exports.getHuddleAttendees = async function (req, res) {
    try {
        const { id } = req.params;

        const attendances = await prisma.huddleAttendance.findMany({
            where: {
                huddleId: parseInt(id),
                leftAt: null // Currently in huddle
            },
            include: {
                user: {
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
                }
            }
        });

        const formattedAttendees = attendances.map(a => ({
            id: a.user.id,
            email: a.user.email,
            name: a.user.user?.name || a.user.expert?.name || a.user.partner?.name || "Unknown",
            photoURL: a.user.user?.photoURL || a.user.expert?.photoURL || a.user.partner?.photoURL || "",
            joinedAt: a.joinedAt,
            pointsEarned: a.pointsEarned
        }));

        return res.status(200).json({
            success: true,
            attendees: formattedAttendees,
            count: formattedAttendees.length
        });

    } catch (error) {
        console.error("Error getting huddle attendees:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get huddle attendees",
            error: error.message
        });
    }
};

/**
 * Get huddle activities
 * GET /api/v1/huddle/:id/activities
 */
exports.getHuddleActivities = async function (req, res) {
    try {
        const { id } = req.params;

        const activities = await prisma.huddleActivity.findMany({
            where: { huddleId: parseInt(id) },
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        content: true
                    }
                },
                thread: {
                    select: {
                        id: true,
                        title: true,
                        content: true
                    }
                },
                form: {
                    select: {
                        id: true,
                        formName: true
                    }
                },
                session: {
                    select: {
                        id: true,
                        title: true,
                        desc: true
                    }
                },
                resource: {
                    select: {
                        id: true,
                        name: true,
                        link: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            activities
        });

    } catch (error) {
        console.error("Error getting huddle activities:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get huddle activities",
            error: error.message
        });
    }
};

// ==================== HUDDLE MANAGEMENT ====================

/**
 * Get all huddles for a community
 * GET /api/v1/community/:communityId/huddles
 */
exports.getCommunityHuddles = async function (req, res) {
    try {
        const { communityId } = req.params;
        const { status } = req.query; // upcoming, live, completed

        let whereClause = {
            communityId: parseInt(communityId)
        };

        if (status === 'upcoming') {
            whereClause.isScheduled = true;
            whereClause.isLive = false;
        } else if (status === 'live') {
            whereClause.isLive = true;
        } else if (status === 'completed') {
            whereClause.isLive = false;
            whereClause.isScheduled = false;
            whereClause.endTime = { not: null };
        }

        const huddles = await prisma.huddle.findMany({
            where: whereClause,
            include: {
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
                },
                leader: {
                    select: {
                        id: true,
                        email: true,
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        attendances: true
                    }
                }
            },
            orderBy: {
                scheduledTime: 'asc'
            }
        });

        return res.status(200).json({
            success: true,
            huddles: huddles.map(h => ({
                ...h,
                attendeesCount: h._count.attendances
            }))
        });

    } catch (error) {
        console.error("Error getting community huddles:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get community huddles",
            error: error.message
        });
    }
};

/**
 * Get user's upcoming huddles
 * GET /api/v1/huddle/user/:userId/upcoming
 * Query params: page (default: 1), limit (default: 10)
 */
exports.getUserUpcomingHuddles = async function (req, res) {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get user's subscribed communities (including lifetime subscriptions)
        const subscriptions = await prisma.subscription.findMany({
            where: {
                unifiedUserId: parseInt(userId),
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

        if (communityIds.length === 0) {
            return res.status(200).json({
                success: true,
                huddles: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0
                }
            });
        }

        // Get total count for pagination
        const total = await prisma.huddle.count({
            where: {
                communityId: { in: communityIds },
                OR: [
                    { isScheduled: true },
                    { isLive: true }
                ]
            }
        });

        // Get upcoming huddles from those communities with pagination
        const huddles = await prisma.huddle.findMany({
            where: {
                communityId: { in: communityIds },
                OR: [
                    { isScheduled: true },
                    { isLive: true }
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
                                name: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        attendances: true
                    }
                }
            },
            orderBy: {
                scheduledTime: 'asc'
            },
            skip,
            take: limit
        });

        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            success: true,
            huddles,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });

    } catch (error) {
        console.error("Error getting user upcoming huddles:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get user upcoming huddles",
            error: error.message
        });
    }
};

/**
 * Get active (live) huddles from user's joined communities
 * GET /api/v1/huddle/user/:userId/active
 */
exports.getUserActiveHuddles = async function (req, res) {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 5; // Limit to 5 active huddles

        // Get user's subscribed communities
        const subscriptions = await prisma.subscription.findMany({
            where: {
                unifiedUserId: parseInt(userId),
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

        if (communityIds.length === 0) {
            return res.status(200).json({
                success: true,
                huddles: []
            });
        }

        // Get active (live) huddles from those communities
        const now = new Date();
        const activeHuddles = await prisma.huddle.findMany({
            where: {
                communityId: { in: communityIds },
                isLive: true,
                AND: [
                    { startTime: { lte: now } },
                    { 
                        OR: [
                            { endTime: null },
                            { endTime: { gt: now } }
                        ]
                    }
                ]
            },
            take: limit,
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
                },
                _count: {
                    select: {
                        attendances: true
                    }
                }
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        // Format the response
        const formattedHuddles = activeHuddles.map(huddle => ({
            id: huddle.id,
            title: huddle.title,
            description: huddle.description,
            community: {
                id: huddle.community.id,
                title: huddle.community.title,
                bannerImg: huddle.community.bannerImg
            },
            creator: {
                id: huddle.creator.id,
                name: huddle.creator.user?.name || 'Unknown',
                photoURL: huddle.creator.user?.photoURL
            },
            attendeeCount: huddle._count.attendances,
            startTime: huddle.startTime,
            endTime: huddle.endTime,
            isLive: true
        }));

        return res.status(200).json({
            success: true,
            huddles: formattedHuddles
        });
    } catch (error) {
        console.error("Error fetching user active huddles:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch active huddles"
        });
    }
}

/**
 * Get all huddles (for admin)
 * GET /api/v1/huddle/all
 * Query params: page (default: 1), limit (default: 10), status (optional: upcoming, live, completed)
 */
exports.getAllHuddles = async function (req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { status } = req.query; // upcoming, live, completed

        // Build where clause based on status filter
        let whereClause = {};
        
        if (status === 'upcoming') {
            whereClause.isScheduled = true;
            whereClause.isLive = false;
        } else if (status === 'live') {
            whereClause.isLive = true;
        } else if (status === 'completed') {
            whereClause.isLive = false;
            whereClause.isScheduled = false;
            whereClause.endTime = { not: null };
        }

        // Get total count for pagination
        const total = await prisma.huddle.count({
            where: whereClause
        });

        // Get all huddles with pagination
        const huddles = await prisma.huddle.findMany({
            where: whereClause,
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
                                name: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        attendances: true
                    }
                }
            },
            orderBy: {
                scheduledTime: 'desc'
            },
            skip,
            take: limit
        });

        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            success: true,
            huddles,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });

    } catch (error) {
        console.error("Error getting all huddles:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get all huddles",
            error: error.message
        });
    }
};

/**
 * Generate AI summary for huddle
 * POST /api/v1/huddle/:id/generate-summary
 */
exports.generateHuddleSummary = async function (req, res) {
    try {
        const { id } = req.params;

        const huddle = await prisma.huddle.findUnique({
            where: { id: parseInt(id) },
            include: {
                attendances: {
                    include: {
                        user: {
                            include: {
                                user: true
                            }
                        }
                    }
                },
                activities: true
            }
        });

        if (!huddle) {
            return res.status(404).json({
                success: false,
                message: "Huddle not found"
            });
        }

        // Generate summary using engagement service
        const summary = await huddleEngagementService.generateHuddleSummary(huddle);

        return res.status(200).json({
            success: true,
            summary
        });

    } catch (error) {
        console.error("Error generating huddle summary:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate huddle summary",
            error: error.message
        });
    }
};

// ==================== ENGAGEMENT & ANALYTICS ====================

/**
 * Get huddle statistics
 * GET /api/v1/huddle/:id/stats
 */
exports.getHuddleStats = async function (req, res) {
    try {
        const { id } = req.params;

        const huddle = await prisma.huddle.findUnique({
            where: { id: parseInt(id) },
            include: {
                attendances: true,
                activities: {
                    select: {
                        id: true,
                        activityType: true,
                        activityData: true,
                        linkUrl: true,
                        isActive: true,
                        isGenerated: true
                    }
                },
                summaries: true
            }
        });

        if (!huddle) {
            return res.status(404).json({
                success: false,
                message: "Huddle not found"
            });
        }

        const stats = {
            totalAttendees: huddle.attendances.length,
            currentAttendees: huddle.attendances.filter(a => !a.leftAt).length,
            totalPointsAwarded: huddle.attendances.reduce((sum, a) => sum + a.pointsEarned, 0),
            activitiesCount: huddle.activities.length,
            duration: huddle.endTime && huddle.startTime 
                ? Math.round((new Date(huddle.endTime) - new Date(huddle.startTime)) / 60000) 
                : null,
            hasSummary: huddle.summaries.length > 0
        };

        return res.status(200).json({
            success: true,
            stats
        });

    } catch (error) {
        console.error("Error getting huddle stats:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get huddle stats",
            error: error.message
        });
    }
};

/**
 * Get current activity index for a huddle
 * GET /api/v1/huddle/:id/current-activity
 */
exports.getCurrentActivity = async function (req, res) {
    try {
        const { id } = req.params;

        const huddle = await prisma.huddle.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                activities: {
                    select: {
                        id: true
                    },
                    orderBy: {
                        id: 'asc'
                    }
                }
            }
        });

        if (!huddle) {
            return res.status(404).json({
                success: false,
                message: "Huddle not found"
            });
        }

        // Get currentActivityIndex from database (using raw query since Prisma client not regenerated yet)
        let currentActivityIndex = 0;
        try {
            const result = await prisma.$queryRaw`
                SELECT "currentActivityIndex" FROM "Huddle" WHERE id = ${parseInt(id)}
            `;
            if (result && result.length > 0 && result[0].currentActivityIndex !== null) {
                currentActivityIndex = result[0].currentActivityIndex;
            }
        } catch (error) {
            console.warn('Could not fetch currentActivityIndex, defaulting to 0:', error);
            currentActivityIndex = 0;
        }
        
        // Validate index is within bounds
        const validIndex = Math.max(0, Math.min(currentActivityIndex, huddle.activities.length - 1));

        return res.status(200).json({
            success: true,
            currentActivityIndex: validIndex,
            totalActivities: huddle.activities.length
        });

    } catch (error) {
        console.error("Error getting current activity:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get current activity",
            error: error.message
        });
    }
};

/**
 * Set current activity index for a huddle (host only)
 * POST /api/v1/huddle/:id/current-activity
 */
exports.setCurrentActivity = async function (req, res) {
    try {
        const { id } = req.params;
        const { activityIndex, userId } = req.body;

        if (activityIndex === undefined || activityIndex === null) {
            return res.status(400).json({
                success: false,
                message: "activityIndex is required"
            });
        }

        const huddle = await prisma.huddle.findUnique({
            where: { id: parseInt(id) },
            include: {
                activities: {
                    select: {
                        id: true
                    },
                    orderBy: {
                        id: 'asc'
                    }
                }
            }
        });

        if (!huddle) {
            return res.status(404).json({
                success: false,
                message: "Huddle not found"
            });
        }

        // Resolve userId to unifiedUserId (same pattern as getHuddleToken)
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }

        const rawUserId = parseInt(userId);
        if (Number.isNaN(rawUserId)) {
            return res.status(400).json({
                success: false,
                message: "userId must be a number"
            });
        }

        // Resolve to unifiedUserId
        const resolvedUnifiedUser = await prisma.unifiedUser.findFirst({
            where: {
                OR: [
                    { id: rawUserId },
                    { userId: rawUserId },
                    { adminId: rawUserId },
                    { expertId: rawUserId },
                    { partnerId: rawUserId }
                ]
            },
            select: {
                id: true,
                adminId: true
            }
        });

        if (!resolvedUnifiedUser?.id) {
            return res.status(404).json({
                success: false,
                message: "User not found (could not resolve to unified user)"
            });
        }

        const userUnifiedId = resolvedUnifiedUser.id;
        const isCreator = huddle.creatorId === userUnifiedId;
        const isLeader = huddle.leaderId === userUnifiedId;

        // Check community role via Subscription (same logic as getHuddleToken)
        let isCommunityAdminOrModerator = false;
        if (userUnifiedId && huddle.communityId) {
            const subscription = await prisma.subscription.findUnique({
                where: {
                    unifiedUserId_communityId: {
                        unifiedUserId: userUnifiedId,
                        communityId: huddle.communityId
                    }
                },
                select: { role: true }
            });
            isCommunityAdminOrModerator = subscription?.role === 'ADMIN' || subscription?.role === 'MODERATOR';
        }

        // Check if user is a platform admin
        const isPlatformAdmin =
            req.user?.userType === 'admin' ||
            req.user?.role === 'admin' ||
            req.user?.adminId !== undefined ||
            resolvedUnifiedUser.adminId !== null;

        // Allow creator, leader, community admin/moderator, or platform admin
        if (!isCreator && !isLeader && !isCommunityAdminOrModerator && !isPlatformAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only huddle creator, leader, community admin/moderator, or platform admin can change current activity"
            });
        }

        // Validate index is within bounds
        const validIndex = Math.max(0, Math.min(parseInt(activityIndex), huddle.activities.length - 1));

        // Update huddle with new activity index (using raw query since Prisma client not regenerated yet)
        await prisma.$executeRaw`
            UPDATE "Huddle" SET "currentActivityIndex" = ${validIndex} WHERE id = ${parseInt(id)}
        `;
        
        const updatedHuddle = await prisma.huddle.findUnique({
            where: { id: parseInt(id) }
        });

        return res.status(200).json({
            success: true,
            message: "Current activity updated successfully",
            currentActivityIndex: validIndex,
            huddle: updatedHuddle
        });

    } catch (error) {
        console.error("Error setting current activity:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to set current activity",
            error: error.message
        });
    }
};

/**
 * Get community huddle leaderboard
 * GET /api/v1/community/:communityId/huddle-leaderboard
 */
exports.getCommunityHuddleLeaderboard = async function (req, res) {
    try {
        const { communityId } = req.params;
        const { limit = 10 } = req.query;

        const leaderboard = await huddleEngagementService.getCommunityLeaderboard(
            parseInt(communityId),
            parseInt(limit)
        );

        return res.status(200).json({
            success: true,
            leaderboard
        });

    } catch (error) {
        console.error("Error getting community huddle leaderboard:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get community huddle leaderboard",
            error: error.message
        });
    }
};

/**
 * Get user's huddle streaks
 * GET /api/v1/user/:userId/huddle-streaks
 */
exports.getUserHuddleStreaks = async function (req, res) {
    try {
        const { userId } = req.params;

        const streaks = await prisma.huddleStreak.findMany({
            where: { userId: parseInt(userId) },
            include: {
                community: {
                    select: {
                        id: true,
                        title: true,
                        bannerImg: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            streaks
        });

    } catch (error) {
        console.error("Error getting user huddle streaks:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get user huddle streaks",
            error: error.message
        });
    }
};

/**
 * Accept a huddle invitation
 * POST /api/v1/huddle/:id/invitation/accept
 */
exports.acceptInvitation = async function (req, res) {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }

        const invitation = await prisma.huddleInvitation.findUnique({
            where: {
                huddleId_userId: {
                    huddleId: parseInt(id),
                    userId: parseInt(userId)
                }
            },
            include: {
                huddle: true
            }
        });

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found"
            });
        }

        if (invitation.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `Invitation already ${invitation.status.toLowerCase()}`
            });
        }

        const updatedInvitation = await prisma.huddleInvitation.update({
            where: { id: invitation.id },
            data: {
                status: 'ACCEPTED',
                respondedAt: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Invitation accepted successfully",
            invitation: updatedInvitation
        });

    } catch (error) {
        console.error("Error accepting invitation:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to accept invitation",
            error: error.message
        });
    }
};

/**
 * Decline a huddle invitation
 * POST /api/v1/huddle/:id/invitation/decline
 */
exports.declineInvitation = async function (req, res) {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }

        const invitation = await prisma.huddleInvitation.findUnique({
            where: {
                huddleId_userId: {
                    huddleId: parseInt(id),
                    userId: parseInt(userId)
                }
            }
        });

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found"
            });
        }

        if (invitation.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `Invitation already ${invitation.status.toLowerCase()}`
            });
        }

        const updatedInvitation = await prisma.huddleInvitation.update({
            where: { id: invitation.id },
            data: {
                status: 'DECLINED',
                respondedAt: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Invitation declined",
            invitation: updatedInvitation
        });

    } catch (error) {
        console.error("Error declining invitation:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to decline invitation",
            error: error.message
        });
    }
};

/**
 * Get 100ms auth token for huddle
 * POST /api/v1/huddle/:id/token
 */
exports.getHuddleToken = async function (req, res) {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }

        // Resolve incoming userId (can be unifiedUser.id OR user.id OR admin.id OR expert.id OR partner.id)
        // into unifiedUser.id because huddle.creatorId/leaderId and subscriptions use unifiedUserId.
        const rawUserId = parseInt(userId);
        if (Number.isNaN(rawUserId)) {
            return res.status(400).json({
                success: false,
                message: "userId must be a number"
            });
        }

        const resolvedUnifiedUser = await prisma.unifiedUser.findFirst({
            where: {
                OR: [
                    { id: rawUserId },
                    { userId: rawUserId },
                    { adminId: rawUserId },
                    { expertId: rawUserId },
                    { partnerId: rawUserId }
                ]
            },
            select: {
                id: true,
                adminId: true
            }
        });

        if (!resolvedUnifiedUser?.id) {
            return res.status(404).json({
                success: false,
                message: "User not found (could not resolve to unified user)"
            });
        }

        const huddle = await prisma.huddle.findUnique({
            where: { id: parseInt(id) }
        });

        if (!huddle) {
            return res.status(404).json({
                success: false,
                message: "Huddle not found"
            });
        }

        const app_access_key = process.env.MS_APP_ACCESS_KEY;
        const app_secret_key = process.env.MS_APP_SECRET_KEY;

        if (!app_access_key || !app_secret_key) {
            return res.status(500).json({
                success: false,
                message: "100ms credentials not configured"
            });
        }

        // Check if roomId is a fallback ID (starts with "huddle-") or doesn't exist
        // If so, create a real 100ms room
        let roomId = huddle.roomId;
        if (!roomId || roomId.startsWith('huddle-')) {
            try {
                // Generate management token
                const managementPayload = {
                    access_key: app_access_key,
                    type: "management",
                    version: 2,
                    iat: Math.floor(Date.now() / 1000) - 60,
                    nbf: Math.floor(Date.now() / 1000) - 60,
                };

                const managementToken = jwt.sign(managementPayload, app_secret_key, {
                    algorithm: "HS256",
                    expiresIn: "24h",
                    jwtid: uuid4(),
                });

                // Create room via 100ms API
                const roomName = `Huddle-${huddle.communityId}-${huddle.title?.substring(0, 30) || 'Ritual'}`.replace(/[^a-zA-Z0-9-_]/g, '-');
                const roomResponse = await axios.post('https://api.100ms.live/v2/rooms', {
                    name: roomName,
                    description: `Ritual room for ${huddle.title || 'Huddle'}`
                }, {
                    headers: {
                        Authorization: `Bearer ${managementToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                roomId = roomResponse.data.id;

                // Update huddle with real room ID
                await prisma.huddle.update({
                    where: { id: huddle.id },
                    data: { roomId: roomId }
                });

                console.log(`Created 100ms room for huddle ${huddle.id}: ${roomId}`);
            } catch (error) {
                console.error("Error creating 100ms room for huddle:", error);
                return res.status(500).json({
                    success: false,
                    message: "Failed to create 100ms room",
                    error: error.response?.data?.message || error.message
                });
            }
        }

        // ---------------------------
        // Determine 100ms role server-side
        // Users with huddle rights should become host ("moderator") automatically.
        // ---------------------------
        const userUnifiedId = resolvedUnifiedUser.id;
        const isCreator = huddle.creatorId === userUnifiedId;
        const isLeader = huddle.leaderId === userUnifiedId;

        // Check community role via Subscription
        let isCommunityAdminOrModerator = false;
        let hasCommunityAccess = false;
        if (userUnifiedId && huddle.communityId) {
            const subscription = await prisma.subscription.findUnique({
                where: {
                    unifiedUserId_communityId: {
                        unifiedUserId: userUnifiedId,
                        communityId: huddle.communityId
                    }
                },
                select: { role: true }
            });
            // User has access if they have a subscription (regardless of role)
            hasCommunityAccess = subscription !== null;
            isCommunityAdminOrModerator = subscription?.role === 'ADMIN' || subscription?.role === 'MODERATOR';
        }

        // Check if user is a platform admin (admin-frontend user)
        const isPlatformAdmin =
            req.user?.userType === 'admin' ||
            req.user?.role === 'admin' ||
            req.user?.adminId !== undefined ||
            // Also treat unified users linked to an Admin record as platform admins
            resolvedUnifiedUser.adminId !== null;
        
        // IMPORTANT: Role assignment logic:
        // 1. Creator always gets host (they created the huddle)
        // 2. Non-platform-admin users: Leader or Community Admin/Moderator → host
        // 3. Platform admin users: Only get host if they are BOTH community admin/moderator AND huddle leader
        // 4. Otherwise → guest/participant

        // IMPORTANT: role must exist in 100ms dashboard for this app.
        // Many setups use roles like: guest, stage, host (but not "moderator").
        // Default host role to "stage" (existing in this repo's UI checks), and guest to "guest".
        // Most 100ms templates use roles like "host" and "guest".
        // If your dashboard uses a different host role, set MS_HUDDLE_HOST_ROLE accordingly.
        const HOST_ROLE = process.env.MS_HUDDLE_HOST_ROLE || 'host';
        const GUEST_ROLE = process.env.MS_HUDDLE_GUEST_ROLE || 'guest';

        // Determine effective role
        let effectiveRole = GUEST_ROLE;
        
        if (isCreator) {
            // Creator always gets host
            effectiveRole = HOST_ROLE;
        } else if (isPlatformAdmin) {
            // Platform admin: Only get host if they are community admin/moderator AND huddle leader
            if (isCommunityAdminOrModerator && isLeader) {
                effectiveRole = HOST_ROLE;
            } else {
                effectiveRole = GUEST_ROLE;
            }
        } else {
            // Non-platform-admin users: Leader or Community Admin/Moderator → host
            if (isLeader || isCommunityAdminOrModerator) {
                effectiveRole = HOST_ROLE;
            } else {
                effectiveRole = GUEST_ROLE;
            }
        }

        // Generate auth token for user
        // IMPORTANT: Always use unifiedUserId for 100ms user_id to ensure consistency
        const payload = {
            access_key: app_access_key,
            room_id: roomId,
            user_id: userUnifiedId.toString(), // Using unifiedUserId, not userId from User table
            role: effectiveRole,
            type: "app",
            version: 2,
            iat: Math.floor(Date.now() / 1000) - 60,
            nbf: Math.floor(Date.now() / 1000) - 60,
        };

        const token = jwt.sign(payload, app_secret_key, {
            algorithm: "HS256",
            expiresIn: "24h",
            jwtid: uuid4(),
        });

        return res.status(200).json({
            success: true,
            token: token,
            roomId: roomId,
            role: effectiveRole,
            unifiedUserId: userUnifiedId
        });

    } catch (error) {
        console.error("Error generating huddle token:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate token",
            error: error.message
        });
    }
};

/**
 * Get user's huddle invitations
 * GET /api/v1/huddle/user/:userId/invitations
 */
exports.getUserInvitations = async function (req, res) {
    try {
        const { userId } = req.params;

        const invitations = await prisma.huddleInvitation.findMany({
            where: {
                userId: parseInt(userId),
                status: 'PENDING'
            },
            include: {
                huddle: {
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
                                user: {
                                    select: {
                                        name: true,
                                        photoURL: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                invitedAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            invitations
        });

    } catch (error) {
        console.error("Error getting user invitations:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get invitations",
            error: error.message
        });
    }
};

// Export all functions
module.exports = {
    // CRUD
    createHuddle: exports.createHuddle,
    getHuddleById: exports.getHuddleById,
    updateHuddle: exports.updateHuddle,
    deleteHuddle: exports.deleteHuddle,
    // Execution
    launchHuddle: exports.launchHuddle,
    endHuddle: exports.endHuddle,
    joinHuddle: exports.joinHuddle,
    leaveHuddle: exports.leaveHuddle,
    getHuddleAttendees: exports.getHuddleAttendees,
    getHuddleActivities: exports.getHuddleActivities,
    // Invitations
    acceptInvitation: exports.acceptInvitation,
    declineInvitation: exports.declineInvitation,
    getUserInvitations: exports.getUserInvitations,
    // 100ms Token
    getHuddleToken: exports.getHuddleToken,
    // Management
    getCommunityHuddles: exports.getCommunityHuddles,
    getUserUpcomingHuddles: exports.getUserUpcomingHuddles,
    getUserActiveHuddles: exports.getUserActiveHuddles,
    getAllHuddles: exports.getAllHuddles,
    generateHuddleSummary: exports.generateHuddleSummary,
    // Analytics
    getHuddleStats: exports.getHuddleStats,
    getCommunityHuddleLeaderboard: exports.getCommunityHuddleLeaderboard,
    getUserHuddleStreaks: exports.getUserHuddleStreaks,
    // Activity State
    getCurrentActivity: exports.getCurrentActivity,
    setCurrentActivity: exports.setCurrentActivity
};
