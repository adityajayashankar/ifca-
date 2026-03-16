const { PrismaClient } = require("@prisma/client");
const { getCommunitySubscriptionsHelper, getCommunitySubsStdForm } = require("../community/community");
const { findCommunityByIdHelper } = require("../services/getById");
const prisma = new PrismaClient();
const { RewardType, RewardAction } = require('@prisma/client');
const { rewardsManagement } = require("../../services/rewards/rewards.service");
// Temporarily comment out notification service to test if it's causing the issue
// const notificationService = require('../../services/notification.service');

exports.getCatchupByCommunity = async function (req, res, next) {
    console.log(req.params.roomId);
    try {
        const catchup = await prisma.catchUp.findMany({
            where: {
                communityId: parseInt(req.params.comId)
            }
        })

        if (catchup) return res.status(200).json({
            success: true,
            catchup: catchup
        })
        return res.status(400).json({
            success: false,
            catchup: "failed"
        })
    } catch (e) {
        console.log(e);
    }
}

exports.verifyCommunityMember = async function(req,res,next){
    const userId = parseInt(req.params.userId)
    const comId = parseInt(req.params.comId)
    const email = req.params.email

    console.log("^^^^^^^^^^^^^^");
    // const { id } = req.params;
  try {
    await findCommunityByIdHelper(comId);
    const allSubscriptions = await getCommunitySubscriptionsHelper(comId);
    let { subscriptions } = getCommunitySubsStdForm(allSubscriptions);
    const users = subscriptions.map(
      ({ user, expert, expertId, expiresAt, startsAt, category, id }) => ({
        ...user,
        ...expert,
        expertId,
        expiresAt,
        startsAt,
        category,
        subscriptionId: id,
      })
    );
    console.log(users);
    users.forEach(item=>{
        if(item.email === email) next()
    })
    // next()
  }catch(e){
    console.log(e);
  }

}
exports.createCatchUp = async function (req, res) {
    try {
        const { communityId, userId, unifiedUserId } = req.body;
        
        // Validate required fields
        if (!communityId || (!userId && !unifiedUserId)) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: communityId, and either userId or unifiedUserId"
            });
        }

        let _unifiedUserId = unifiedUserId;
        let _userId = userId;

        // If only userId is provided, look up unifiedUserId
        if (!_unifiedUserId && _userId) {
            const user = await prisma.user.findUnique({
                where: { id: parseInt(_userId) },
                select: { id: true, unifiedUserId: true }
            });
            if (!user || !user.unifiedUserId) {
                return res.status(404).json({
                    success: false,
                    message: "User not found or no unified user ID"
                });
            }
            _unifiedUserId = user.unifiedUserId;
        }

        // Check if community exists
        const community = await prisma.community.findFirst({
            where: {
                id: parseInt(communityId)
            }
        });

        if (!community) {
            return res.status(404).json({
                success: false,
                message: "Community not found"
            });
        }

        // For now, skip subscription check to allow testing
        // TODO: Re-enable subscription check in production
        console.log("Community found:", community.id);
        console.log("User ID:", _unifiedUserId);

        // Use the community's fixed room ID or create one if it doesn't exist
        let roomId = community.catchupRoomId;
        
        console.log("Current community catchupRoomId:", roomId);
        
        if (!roomId) {
            // Create actual 100ms room for the community
            console.log("Creating new 100ms room for community");
            
            // Use the session API to create 100ms room
            const axios = require('axios');
            
            const roomResponse = await axios.post('http://localhost:5000/api/v1/session/create-room', {
                name: `Community-${communityId}-Catchup`,
                description: `Catchup room for community ${communityId}`
            });
            
            if (roomResponse.data.success) {
                roomId = roomResponse.data.roomId;
                console.log("Created 100ms room with ID:", roomId);
                
                // Update the community with the 100ms room ID
                await prisma.community.update({
                    where: {
                        id: parseInt(communityId)
                    },
                    data: {
                        catchupRoomId: roomId
                    }
                });
                
                console.log("Updated community with 100ms room ID");
            } else {
                throw new Error("Failed to create 100ms room via API");
            }
        }
        
        console.log("Using 100ms room ID:", roomId);

        // Check if catchup already exists for this community (either live or scheduled)
        const existingCatchup = await prisma.catchUp.findFirst({
            where: {
                communityId: parseInt(communityId),
                OR: [
                    { isLive: true },
                    { 
                        isScheduled: true,
                        startTime: {
                            lte: new Date(Date.now() + 10 * 60 * 1000) // Within next 10 minutes
                        }
                    }
                ]
            },
            include: {
                community: {
                    select: {
                        id: true,
                        title: true,
                        bannerImg: true,
                        catchupRoomId: true
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
                }
            }
        });

        console.log("Checking for existing catchup in community:", communityId);
        console.log("Existing catchup found:", existingCatchup);

        if (existingCatchup) {
            console.log("Found existing catchup, returning it instead of creating new one");
            console.log("Existing catchup details:", {
                id: existingCatchup.id,
                roomId: existingCatchup.roomId,
                creatorId: existingCatchup.creatorId,
                isLive: existingCatchup.isLive
            });
            
            // If the existing catchup is not live, make it live
            if (!existingCatchup.isLive) {
                console.log("Making existing catchup live");
                await prisma.catchUp.update({
                    where: { id: existingCatchup.id },
                    data: { isLive: true }
                });
                
                // Update community status
                await prisma.community.update({
                    where: { id: parseInt(communityId) },
                    data: { isCatchupLive: true }
                });
            }
            
            return res.status(200).json({
                success: true,
                message: "Join existing catchup",
                catchup: {
                    id: existingCatchup.id,
                    roomId: existingCatchup.roomId || existingCatchup.community.catchupRoomId,
                    communityId: existingCatchup.communityId,
                    communityName: existingCatchup.community.title,
                    communityBanner: existingCatchup.community.bannerImg,
                    creatorId: existingCatchup.creatorId,
                    creatorName: existingCatchup.creator?.user?.name || "Unknown",
                    creatorEmail: existingCatchup.creator?.email || "Unknown",
                    isHost: existingCatchup.creatorId === parseInt(_unifiedUserId),
                    startTime: existingCatchup.createdAt
                }
            });
        }

        // Create new catchup with the fixed room ID
        console.log("Creating catchup with data:", {
            roomId,
            communityId: parseInt(communityId),
            creatorId: parseInt(_unifiedUserId)
        });
        
        const now = new Date();
        const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
        
        const catchUp = await prisma.catchUp.create({
            data: {
                roomId: roomId,
                isLive: true,
                startTime: now,
                endTime: endTime,
                attendees: [parseInt(_unifiedUserId)], // Creator is automatically an attendee
                community: {
                    connect: {
                        id: parseInt(communityId)
                    }
                },
                creator: {
                    connect: {
                        id: parseInt(_unifiedUserId)
                    }
                }
            },
            include: {
                community: {
                    select: {
                        id: true,
                        title: true,
                        bannerImg: true,
                        catchupRoomId: true
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
                }
            }
        });
        
        console.log("Catchup created successfully:", catchUp.id);

        // Update community status
        console.log("Updating community status to live");
        await prisma.community.update({
            where: {
                id: parseInt(communityId)
            },
            data: {
                isCatchupLive: true
            }
        });
        console.log("Community status updated successfully");

        // Handle rewards if userId is available
        if (_userId) {
            try {
                await rewardsManagement({
                    userId: parseInt(_userId),
                    rewardRuleName: RewardAction.START_CATCHUP,
                    type: RewardType.CREDIT
                });
            } catch (rewardError) {
                console.log("Reward error (non-critical):", rewardError);
            }
        }

        // Send notification to community members about live catchup
        try {
            await sendLiveCatchupNotification(catchUp);
        } catch (notificationError) {
            console.log("Notification error (non-critical):", notificationError);
        }

        return res.status(200).json({
            success: true,
            message: "CatchUp started successfully",
            catchup: {
                id: catchUp.id,
                roomId: catchUp.roomId,
                communityId: catchUp.communityId,
                communityName: catchUp.community.title,
                communityBanner: catchUp.community.bannerImg,
                creatorId: catchUp.creatorId,
                creatorName: catchUp.creator?.user?.name || "Unknown",
                creatorEmail: catchUp.creator?.email || "Unknown",
                isHost: true,
                startTime: catchUp.createdAt
            }
        });

    } catch (error) {
        console.error("Error creating catchup:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create catchup",
            error: error.message
        });
    }
};

exports.verifyCommunityHavingCatchup = async function (req, res, next) {
    const comId = parseInt(req.params.comId)
    try {
        // Check for any catchup with a roomId (live or scheduled)
        const catchup = await prisma.catchUp.findFirst({
            where: { 
                communityId: comId,
                roomId: {
                    not: null
                }
            },
            include: {
                community: {
                    select: {
                        id: true,
                        title: true,
                        catchupRoomId: true
                    }
                },
                creator: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });

        console.log('Checking for catchup in community:', comId);
        console.log('Catchup found:', catchup);
        if (catchup) {
            console.log('Catchup details:', {
                id: catchup.id,
                roomId: catchup.roomId || catchup.community.catchupRoomId,
                creatorId: catchup.creatorId,
                isLive: catchup.isLive,
                isScheduled: catchup.isScheduled
            });
        }

        if (catchup) {
            return res.status(200).json({
                success: true,
                msg: 'Join the catchup',
                catchupId: catchup.id,
                creatorId: catchup.creatorId,
                creatorEmail: catchup.creator.email,
                roomId: catchup.roomId || catchup.community.catchupRoomId,
                isLive: catchup.isLive,
                isScheduled: catchup.isScheduled
            });
        }

        // If no live catchup found, check community status
        const community = await prisma.community.findFirst({
            where: {
                id: comId
            }
        });

        console.log('community status:', community);

        if (community && community.isCatchupLive) {
            // Community says it's live but no catchup found - this is an inconsistency
            console.log('Community marked as live but no catchup found - cleaning up');
            
            // Clean up the community status
            await prisma.community.update({
                where: { id: comId },
                data: { isCatchupLive: false }
            });
        }

        return res.status(200).json({
            success: false,
            msg: "No catchup found"
        });
    } catch (e) {
        console.log('Error in verifyCommunityHavingCatchup:', e);
        return res.status(500).json({
            success: false,
            msg: "Error checking catchup status"
        });
    }
}

//new change

exports.verifyLeader = async function(req,res,next){
    const comId = parseInt(req.params.comId)
    const roomId = req.params.roomId
    try {
        const catchup = await prisma.catchUp.findMany({
            where: {
                isLive:true
            }
        })
        // console.log(catchup);
        // console.log(comId);
        let catchupIdvl={}
        catchup.forEach(item=>{
            if(item.communityId == comId)
            catchupIdvl = item
        })
        // console.log(catchupIdvl);
        if(parseInt(req.params.userId) == catchupIdvl?.creatorId)
            next()
        else return res.status(200).json({success:true})
    } catch (e) {
        console.log(e);
    }
}

exports.leaveCatchup = async function (req, res, next) {
    const comId = parseInt(req.params.comId)
    const roomId = req.params.roomId
    const userId = parseInt(req.params.userId)
    console.log("LEAVE CATCHUP");
    console.log("Community ID:", comId);
    console.log("Room ID:", roomId);
    console.log("User ID:", userId);
    
    try {
        // First, find the catchup
        const catchup = await prisma.catchUp.findFirst({
            where: {
                roomId: roomId,
                communityId: comId
            }
        });

        if (!catchup) {
            return res.status(404).json({
                success: false,
                msg: "Catchup not found"
            });
        }

        // Get user's unified ID
        let unifiedUserId = userId;
        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { unifiedUserId: true }
            });
            if (user && user.unifiedUserId) {
                unifiedUserId = user.unifiedUserId;
            }
        }

        // Remove user from attendees if they're in the list
        let updatedAttendees = catchup.attendees || [];
        if (unifiedUserId && updatedAttendees.includes(unifiedUserId)) {
            updatedAttendees = updatedAttendees.filter(id => id !== unifiedUserId);
            console.log("Removed user from attendees:", unifiedUserId);
        }

        // Check if this is the creator leaving (host leaving)
        const isHostLeaving = catchup.creatorId === unifiedUserId;
        
        if (isHostLeaving) {
            // Host is leaving - end the catchup for everyone
            console.log("Host is leaving - ending catchup for everyone");

        const community = await prisma.community.update({
            where: {
                id: comId
            },
            data: {
                isCatchupLive: false
            }
            });

            const updatedCatchup = await prisma.catchUp.update({
            where: {
                    id: catchup.id
            },
            data: {
                    isLive: false,
                    attendees: updatedAttendees
                }
            });

            // Send notification to all attendees that catchup ended
            if (updatedAttendees.length > 0) {
                for (const attendeeId of updatedAttendees) {
                    try {
            await notificationService.createNotification({
                            recipientId: attendeeId,
                            senderId: unifiedUserId,
                            type: 'CATCHUP_ENDED',
                title: 'Catchup Ended',
                            message: `The catchup "${catchup.title || 'Community Catchup'}" has ended because the host left.`,
                communityId: comId,
                            metadata: { 
                                catchupId: catchup.id, 
                                roomId: roomId,
                                reason: 'host_left'
                            },
                        });
                    } catch (notificationError) {
                        console.log("Notification error:", notificationError);
                    }
                }
            }

            return res.status(200).json({
            success: true,
                msg: "Catchup ended by host",
                catchupEnded: true
            });
        } else {
            // Regular user leaving - just remove them from attendees
            console.log("Regular user leaving - removing from attendees");
            
            const updatedCatchup = await prisma.catchUp.update({
                where: {
                    id: catchup.id
                },
                data: {
                    attendees: updatedAttendees
                }
            });

            // Send notification to host that user left
            if (catchup.creatorId) {
                try {
                    await notificationService.createNotification({
                        recipientId: catchup.creatorId,
                        senderId: unifiedUserId,
                        type: 'CATCHUP_USER_LEFT',
                        title: 'User Left Catchup',
                        message: `A user has left the catchup.`,
                        communityId: comId,
                        metadata: { 
                            catchupId: catchup.id, 
                            roomId: roomId,
                            userLeft: unifiedUserId
                        },
                    });
                } catch (notificationError) {
                    console.log("Notification error:", notificationError);
                }
            }

            return res.status(200).json({
                success: true,
                msg: "User left catchup",
                catchupEnded: false,
                attendeesCount: updatedAttendees.length
            });
        }

    } catch (e) {
        console.error("Error in leaveCatchup:", e);
        return res.status(500).json({
            success: false,
            msg: "Error processing leave request"
        });
    }
}

exports.returnRoomId = async function (req, res, next) {
    const comId = parseInt(req.params.comId)
    try {
        // First check for live catchup
        const liveCatchup = await prisma.catchUp.findFirst({
            where: {
                communityId: comId,
                isLive: true
            },
            include: {
                community: {
                    select: {
                        id: true,
                        title: true,
                        catchupRoomId: true
                    }
                }
            }
        });

        if (liveCatchup) {
            return res.status(200).json({
            success: true,
                room: liveCatchup.roomId || liveCatchup.community.catchupRoomId,
            msg: "Join the Catchup"
            });
        }

        // If no live catchup, check if community has a fixed room ID
        const community = await prisma.community.findFirst({
            where: {
                id: comId
            },
            select: {
                id: true,
                catchupRoomId: true
            }
        });

        if (community && community.catchupRoomId) {
            return res.status(200).json({
                success: true,
                room: community.catchupRoomId,
                msg: "Community has fixed room ID"
            });
        }

        return res.status(400).json({
            success: false,
            msg: "ERROR IN FETCHING ROOMID"
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            success: false,
            msg: "Error fetching room ID"
        });
    }
}

exports.getUserActiveCatchups = async function (req, res) {
    try {
        const userId = parseInt(req.params.userId);
        
        // Get active catchups for user's communities
        const activeCatchups = await prisma.catchUp.findMany({
            where: {
                isLive: true,
                community: {
                    subscriptions: {
                        some: {
                            unifiedUserId: userId,
                            expiresAt: {
                                gt: new Date()
                            }
                        }
                    }
                }
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
                    },
                }
            }
        });

        // Format response
        const formattedCatchups = activeCatchups.map(catchup => ({
            id: catchup.id,
            roomId: catchup.roomId,
            communityId: catchup.communityId,
            communityName: catchup.community.title,
            communityBanner: catchup.community.bannerImg,
            creatorId: catchup.creatorId,
            creatorName: catchup.creator.user.name,
            creatorEmail: catchup.creator.email,
            isHost: catchup.creatorId === userId,
            startTime: catchup.createdAt
        }));

        return res.status(200).json({
            success: true,
            catchups: formattedCatchups
        });

    } catch (error) {
        console.error("Error getting user active catchups:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get active catchups",
            error: error.message
        });
    }
};

// Create scheduled catchup
exports.createScheduledCatchUp = async function (req, res) {
    try {
        const { 
            communityId, 
            userId, 
            unifiedUserId, 
            title, 
            desc, 
            startTime, 
            endTime,
            sessionType = "catchup",
            isVideoChannel = false
        } = req.body;
        
        // Validate required fields
        if (!communityId || (!userId && !unifiedUserId) || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: communityId, startTime, endTime, and either userId or unifiedUserId"
            });
        }

        let _unifiedUserId = unifiedUserId;
        let _userId = userId;

        // If only userId is provided, look up unifiedUserId
        if (!_unifiedUserId && _userId) {
            const user = await prisma.user.findUnique({
                where: { id: parseInt(_userId) },
                select: { id: true, unifiedUserId: true }
            });
            if (!user || !user.unifiedUserId) {
                return res.status(404).json({
                    success: false,
                    message: "User not found or no unified user ID"
                });
            }
            _unifiedUserId = user.unifiedUserId;
        }

        // Check if community exists
        const community = await prisma.community.findFirst({
            where: { id: parseInt(communityId) }
        });

        if (!community) {
            return res.status(404).json({
                success: false,
                message: "Community not found"
            });
        }

        // Parse dates
        const startDateTime = new Date(startTime);
        const endDateTime = new Date(endTime);
        const now = new Date();

        // Validate dates
        if (startDateTime <= now) {
            return res.status(400).json({
                success: false,
                message: "Start time must be in the future"
            });
        }

        if (endDateTime <= startDateTime) {
            return res.status(400).json({
                success: false,
                message: "End time must be after start time"
            });
        }

        // Check for overlapping catchups in the same community
        const overlappingCatchup = await prisma.catchUp.findFirst({
            where: {
                communityId: parseInt(communityId),
                OR: [
                    {
                        startTime: {
                            lte: endDateTime
                        },
                        endTime: {
                            gte: startDateTime
                        }
                    },
                    {
                        isLive: true
                    }
                ]
            }
        });

        if (overlappingCatchup) {
            return res.status(400).json({
                success: false,
                message: "There is already a catchup scheduled or live during this time"
            });
        }

        // Create scheduled catchup
        const catchUp = await prisma.catchUp.create({
            data: {
                title: title || "Scheduled CatchUp",
                desc: desc || "Scheduled catchup for community members",
                startTime: startDateTime,
                endTime: endDateTime,
                isScheduled: true,
                isLive: false,
                sessionType,
                isVideoChannel,
                community: {
                    connect: { id: parseInt(communityId) }
                },
                creator: {
                    connect: { id: parseInt(_unifiedUserId) }
                }
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
                }
            }
        });
        
        // Send notification to community members
        await sendCatchupScheduledNotification(catchUp);

        return res.status(200).json({
            success: true,
            message: "Scheduled catchup created successfully",
            catchup: {
                id: catchUp.id,
                title: catchUp.title,
                desc: catchUp.desc,
                startTime: catchUp.startTime,
                endTime: catchUp.endTime,
                communityId: catchUp.communityId,
                communityName: catchUp.community.title,
                creatorId: catchUp.creatorId,
                creatorName: catchUp.creator?.user?.name || "Unknown",
                isScheduled: true
            }
        });

    } catch (error) {
        console.error("Error creating scheduled catchup:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create scheduled catchup",
            error: error.message
        });
    }
};

// Join catchup (add to attendees)
exports.joinCatchUp = async function (req, res) {
    try {
        const { catchupId, unifiedUserId } = req.body;

        if (!catchupId || !unifiedUserId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: catchupId and unifiedUserId"
            });
        }

        const catchup = await prisma.catchUp.findUnique({
            where: { id: parseInt(catchupId) },
            include: {
                community: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        if (!catchup) {
            return res.status(404).json({
                success: false,
                message: "Catchup not found"
            });
        }

        // Check if catchup is live or scheduled
        if (!catchup.isLive && !catchup.isScheduled) {
            return res.status(400).json({
                success: false,
                message: "Catchup is not active"
            });
        }

        // Check if user is already in attendees
        if (catchup.attendees.includes(parseInt(unifiedUserId))) {
            return res.status(200).json({
                success: true,
                message: "Already joined this catchup",
                catchup
            });
        }

        // Add user to attendees
        const updatedCatchup = await prisma.catchUp.update({
            where: { id: parseInt(catchupId) },
            data: {
                attendees: {
                    push: parseInt(unifiedUserId)
                }
            },
            include: {
                community: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Successfully joined catchup",
            catchup: updatedCatchup
        });

    } catch (error) {
        console.error("Error joining catchup:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to join catchup",
            error: error.message
        });
    }
};

// Leave catchup (remove from attendees)
exports.leaveCatchUp = async function (req, res) {
    try {
        const { catchupId, unifiedUserId } = req.body;

        if (!catchupId || !unifiedUserId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: catchupId and unifiedUserId"
            });
        }

        const catchup = await prisma.catchUp.findUnique({
            where: { id: parseInt(catchupId) }
        });

        if (!catchup) {
            return res.status(404).json({
                success: false,
                message: "Catchup not found"
            });
        }

        // Remove user from attendees
        const updatedAttendees = catchup.attendees.filter(id => id !== parseInt(unifiedUserId));
        
        const updatedCatchup = await prisma.catchUp.update({
            where: { id: parseInt(catchupId) },
            data: {
                attendees: updatedAttendees
            }
        });

        return res.status(200).json({
            success: true,
            message: "Successfully left catchup",
            catchup: updatedCatchup
        });

    } catch (error) {
        console.error("Error leaving catchup:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to leave catchup",
            error: error.message
        });
    }
};

// Get catchup attendees
exports.getCatchupAttendees = async function (req, res) {
    try {
        const { catchupId } = req.params;

        const catchup = await prisma.catchUp.findUnique({
            where: { id: parseInt(catchupId) },
            include: {
                community: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        if (!catchup) {
            return res.status(404).json({
                success: false,
                message: "Catchup not found"
            });
        }

        // Get attendee details
        const attendees = await prisma.unifiedUser.findMany({
            where: {
                id: {
                    in: catchup.attendees
                }
            },
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
        });

        return res.status(200).json({
            success: true,
            catchup: {
                id: catchup.id,
                title: catchup.title,
                startTime: catchup.startTime,
                endTime: catchup.endTime,
                isLive: catchup.isLive,
                isScheduled: catchup.isScheduled,
                community: catchup.community,
                attendees: attendees.map(attendee => ({
                    id: attendee.id,
                    email: attendee.email,
                    name: attendee.user?.name || attendee.expert?.name || attendee.partner?.name || "Unknown",
                    photoURL: attendee.user?.photoURL || attendee.expert?.photoURL || attendee.partner?.photoURL || ""
                }))
            }
        });

    } catch (error) {
        console.error("Error getting catchup attendees:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get catchup attendees",
            error: error.message
        });
    }
};

// Helper function to send catchup scheduled notification
async function sendCatchupScheduledNotification(catchup) {
    try {
        const notificationService = require('../../services/notification.service');
        
        // Get community members
        const subscriptions = await prisma.subscription.findMany({
            where: {
                communityId: catchup.communityId
            },
            include: {
                unifiedUser: {
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

        // Send notification to each member
        for (const subscription of subscriptions) {
            await notificationService.createNotification({
                recipientId: subscription.unifiedUserId,
                senderId: catchup.creatorId,
                type: 'CATCHUP_SCHEDULED',
                title: `New Catchup Scheduled: ${catchup.title}`,
                message: `A new catchup "${catchup.title}" has been scheduled for ${new Date(catchup.startTime).toLocaleString()}`,
                communityId: catchup.communityId,
                metadata: {
                    catchupId: catchup.id,
                    startTime: catchup.startTime,
                    endTime: catchup.endTime
                }
            });
        }
    } catch (error) {
        console.error("Error sending catchup scheduled notification:", error);
    }
}

// Helper function to send catchup reminder notification
async function sendCatchupReminderNotification(catchup) {
    try {
        const notificationService = require('../../services/notification.service');
        
        // Get community members
        const subscriptions = await prisma.subscription.findMany({
            where: {
                communityId: catchup.communityId
            },
            include: {
                unifiedUser: {
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

        // Send notification to each member
        for (const subscription of subscriptions) {
            await notificationService.createNotification({
                recipientId: subscription.unifiedUserId,
                senderId: catchup.creatorId,
                type: 'CATCHUP_REMINDER',
                title: `Catchup Reminder: ${catchup.title}`,
                message: `Your catchup "${catchup.title}" starts in 10 minutes!`,
                communityId: catchup.communityId,
                metadata: {
                    catchupId: catchup.id,
                    startTime: catchup.startTime,
                    endTime: catchup.endTime
                }
            });
        }
    } catch (error) {
        console.error("Error sending catchup reminder notification:", error);
    }
}

// Helper function to send live catchup notification
async function sendLiveCatchupNotification(catchup) {
    try {
        const notificationService = require('../../services/notification.service');
        
        // Get community members
        const subscriptions = await prisma.subscription.findMany({
            where: {
                communityId: catchup.communityId
            },
            include: {
                unifiedUser: {
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

        // Send notification to each member
        for (const subscription of subscriptions) {
            await notificationService.createNotification({
                recipientId: subscription.unifiedUserId,
                senderId: catchup.creatorId,
                type: 'CATCHUP_STARTED',
                title: `Live Catchup Started: ${catchup.title || 'Community Catchup'}`,
                message: `A live catchup has started in your community! Join now to participate.`,
                communityId: catchup.communityId,
                metadata: {
                    catchupId: catchup.id,
                    startTime: catchup.startTime,
                    endTime: catchup.endTime,
                    roomId: catchup.roomId
                }
            });
        }
    } catch (error) {
        console.error("Error sending live catchup notification:", error);
    }
}

// Helper function to send catchup ended notification
async function sendCatchupEndedNotification(catchup) {
    try {
        const notificationService = require('../../services/notification.service');
        
        // Send notification to attendees
        for (const attendeeId of catchup.attendees) {
            await notificationService.createNotification({
                recipientId: attendeeId,
                senderId: catchup.creatorId,
                type: 'CATCHUP_ENDED',
                title: `Catchup Ended: ${catchup.title}`,
                message: `The catchup "${catchup.title}" has ended. Thank you for participating!`,
                communityId: catchup.communityId,
                metadata: {
                    catchupId: catchup.id,
                    startTime: catchup.startTime,
                    endTime: catchup.endTime,
                    attendeesCount: catchup.attendees.length
                }
            });
        }
    } catch (error) {
        console.error("Error sending catchup ended notification:", error);
    }
}

// New function to start a scheduled catchup
exports.startScheduledCatchUp = async function (req, res) {
    try {
        const { scheduledCatchupId } = req.params;
        
        // Find the scheduled catchup
        const scheduledCatchup = await prisma.catchUp.findUnique({
            where: {
                id: parseInt(scheduledCatchupId)
            },
            include: {
                community: true,
                creator: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!scheduledCatchup) {
            return res.status(404).json({
                success: false,
                message: "Scheduled catchup not found"
            });
        }

        if (!scheduledCatchup.isScheduled) {
            return res.status(400).json({
                success: false,
                message: "This is not a scheduled catchup"
            });
        }

        // Check if there's already a live catchup for this community
        const existingLiveCatchup = await prisma.catchUp.findFirst({
            where: {
                communityId: scheduledCatchup.communityId,
                isLive: true
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
                }
            }
        });

        if (existingLiveCatchup) {
            console.log("Found existing live catchup for scheduled catchup, returning it");
            // Return the existing live catchup instead of creating a new one
            return res.status(200).json({
                success: true,
                message: "Scheduled catchup already started",
                catchup: {
                    id: existingLiveCatchup.id,
                    title: existingLiveCatchup.title,
                    desc: existingLiveCatchup.desc,
                    communityId: existingLiveCatchup.communityId,
                    communityName: existingLiveCatchup.community.title,
                    communityBanner: existingLiveCatchup.community.bannerImg,
                    creatorId: existingLiveCatchup.creatorId,
                    creatorName: existingLiveCatchup.creator?.user?.name || "Unknown",
                    creatorEmail: existingLiveCatchup.creator?.email || "Unknown",
                    roomId: existingLiveCatchup.roomId,
                    isLive: true,
                    isHost: existingLiveCatchup.creatorId === parseInt(req.user?.unifiedUserId)
                }
            });
        }

        // Get the community's fixed room ID
        const community = await prisma.community.findFirst({
            where: {
                id: scheduledCatchup.communityId
            },
            select: {
                id: true,
                catchupRoomId: true
            }
        });

        // Use the community's fixed room ID or create one if it doesn't exist
        let roomId = community?.catchupRoomId;
        
        if (!roomId) {
            // Generate a fixed room ID for the community
            roomId = `community-${scheduledCatchup.communityId}-catchup`;
            
            // Update the community with the fixed room ID
            await prisma.community.update({
                where: {
                    id: scheduledCatchup.communityId
                },
                data: {
                    catchupRoomId: roomId
                }
            });
        }

        // Check if there's already a catchup with this roomId (to prevent unique constraint violation)
        const existingCatchupWithRoomId = await prisma.catchUp.findFirst({
            where: {
                roomId: roomId
            }
        });

        if (existingCatchupWithRoomId) {
            console.log("Found existing catchup with same roomId, returning it");
            return res.status(200).json({
                success: true,
                message: "Catchup already exists with this room",
                catchup: {
                    id: existingCatchupWithRoomId.id,
                    title: existingCatchupWithRoomId.title,
                    desc: existingCatchupWithRoomId.desc,
                    communityId: existingCatchupWithRoomId.communityId,
                    communityName: scheduledCatchup.community.title,
                    communityBanner: scheduledCatchup.community.bannerImg,
                    creatorId: existingCatchupWithRoomId.creatorId,
                    creatorName: scheduledCatchup.creator?.user?.name || "Unknown",
                    creatorEmail: scheduledCatchup.creator?.email || "Unknown",
                    roomId: existingCatchupWithRoomId.roomId,
                    isLive: existingCatchupWithRoomId.isLive,
                    isHost: existingCatchupWithRoomId.creatorId === parseInt(req.user?.unifiedUserId)
                }
            });
        }

            // Create a new live catchup based on the scheduled one
            console.log("Creating new live catchup from scheduled catchup");
        let liveCatchup;
        
        try {
            liveCatchup = await prisma.catchUp.create({
                data: {
                    title: scheduledCatchup.title,
                    desc: scheduledCatchup.desc,
                    isLive: true,
                    isScheduled: false,
                    communityId: scheduledCatchup.communityId,
                    creatorId: scheduledCatchup.creatorId,
                    roomId: roomId
                },
                include: {
                    community: {
                        select: {
                            id: true,
                            title: true,
                            bannerImg: true,
                            catchupRoomId: true
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
                    }
                }
            });
        } catch (createError) {
            // If there's a unique constraint violation, try to find the existing catchup
            if (createError.code === 'P2002' && createError.meta?.target?.includes('roomId')) {
                console.log("Unique constraint violation on roomId, finding existing catchup");
                const existingCatchup = await prisma.catchUp.findFirst({
                    where: {
                        roomId: roomId
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
                    }
                }
            });
                
                if (existingCatchup) {
                    return res.status(200).json({
                        success: true,
                        message: "Catchup already exists with this room",
                        catchup: {
                            id: existingCatchup.id,
                            title: existingCatchup.title,
                            desc: existingCatchup.desc,
                            communityId: existingCatchup.communityId,
                            communityName: existingCatchup.community.title,
                            communityBanner: existingCatchup.community.bannerImg,
                            creatorId: existingCatchup.creatorId,
                            creatorName: existingCatchup.creator?.user?.name || "Unknown",
                            creatorEmail: existingCatchup.creator?.email || "Unknown",
                            roomId: existingCatchup.roomId,
                            isLive: existingCatchup.isLive,
                            isHost: existingCatchup.creatorId === parseInt(req.user?.unifiedUserId)
                        }
                    });
                }
            }
            throw createError; // Re-throw if it's not a unique constraint error
        }
        
        console.log("Created live catchup:", {
            id: liveCatchup.id,
            roomId: liveCatchup.roomId,
            isLive: liveCatchup.isLive,
            communityId: liveCatchup.communityId
        });

        // Update community status
        await prisma.community.update({
            where: {
                id: scheduledCatchup.communityId
            },
            data: {
                isCatchupLive: true
            }
        });

        return res.status(200).json({
            success: true,
            message: "Scheduled catchup started successfully",
            catchup: {
                id: liveCatchup.id,
                title: liveCatchup.title,
                desc: liveCatchup.desc,
                communityId: liveCatchup.communityId,
                communityName: liveCatchup.community.title,
                communityBanner: liveCatchup.community.bannerImg,
                creatorId: liveCatchup.creatorId,
                creatorName: liveCatchup.creator?.user?.name || "Unknown",
                creatorEmail: liveCatchup.creator?.email || "Unknown",
                roomId: liveCatchup.roomId,
                isLive: true,
                isHost: liveCatchup.creatorId === parseInt(req.user?.unifiedUserId)
            }
        });

    } catch (error) {
        console.error("Error starting scheduled catchup:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to start scheduled catchup",
            error: error.message
        });
    }
};

// Function to update room ID for a catchup
exports.updateCatchupRoom = async function (req, res) {
    try {
        const { catchupId } = req.params;
        const { roomId } = req.body;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: "Room ID is required"
            });
        }

        const updatedCatchup = await prisma.catchUp.update({
            where: {
                id: parseInt(catchupId)
            },
            data: {
                roomId: roomId
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
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Catchup room updated successfully",
            catchup: updatedCatchup
        });

    } catch (error) {
        console.error("Error updating catchup room:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update catchup room",
            error: error.message
        });
    }
};

exports.getScheduledCatchups = async function (req, res) {
    try {
        const { communityId } = req.params;
        
        // Get all scheduled catchups for the community
        const scheduledCatchups = await prisma.catchUp.findMany({
            where: {
                communityId: parseInt(communityId),
                isScheduled: true
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
                }
            },
            orderBy: {
                startTime: 'desc' // Show newest first
            }
        });

        console.log(`Found ${scheduledCatchups.length} scheduled catchups for community ${communityId}`);
        scheduledCatchups.forEach(catchup => {
            console.log(`Catchup ID: ${catchup.id}, Start: ${catchup.startTime}, End: ${catchup.endTime}, Is Live: ${catchup.isLive}`);
        });

        // Process catchups to add completion status
        const processedCatchups = scheduledCatchups.map(catchup => {
            const startTime = new Date(catchup.startTime);
            const endTime = new Date(catchup.endTime);
            const now = new Date();
            const isCompleted = endTime < now && !catchup.isLive;
            const isUpcoming = startTime > now;
            const isInProgress = catchup.isLive || (startTime <= now && endTime >= now);
            
            return {
                id: catchup.id,
                title: catchup.title,
                desc: catchup.desc,
                communityId: catchup.communityId,
                communityName: catchup.community.title,
                communityBanner: catchup.community.bannerImg,
                creatorId: catchup.creatorId,
                creatorName: catchup.creator?.user?.name || "Unknown",
                creatorEmail: catchup.creator?.email || "Unknown",
                startTime: catchup.startTime,
                endTime: catchup.endTime,
                isScheduled: true,
                isCompleted,
                isUpcoming,
                isInProgress,
                status: isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'upcoming'
            };
        });

        return res.status(200).json({
            success: true,
            scheduledCatchups: processedCatchups
        });

    } catch (error) {
        console.error("Error getting scheduled catchups:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get scheduled catchups",
            error: error.message
        });
    }
};

// Test function to create a live catchup for testing popup
exports.createTestLiveCatchup = async function (req, res) {
    try {
        const { communityId, unifiedUserId } = req.body;
        
        // Validate required fields
        if (!communityId || !unifiedUserId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: communityId and unifiedUserId"
            });
        }

        // Check if community exists
        const community = await prisma.community.findFirst({
            where: {
                id: parseInt(communityId)
            }
        });

        if (!community) {
            return res.status(404).json({
                success: false,
                message: "Community not found"
            });
        }

        // Get unified user
        const unifiedUser = await prisma.unifiedUser.findUnique({
            where: {
                id: parseInt(unifiedUserId)
            },
            include: {
                user: true
            }
        });

        if (!unifiedUser) {
            return res.status(404).json({
                success: false,
                message: "Unified user not found"
            });
        }

        // Create a test live catchup
        const testCatchup = await prisma.catchUp.create({
            data: {
                title: "Test Live Catchup",
                desc: "This is a test live catchup for popup testing",
                isLive: true,
                isScheduled: false,
                communityId: parseInt(communityId),
                creatorId: parseInt(unifiedUserId),
                roomId: `test-${Date.now()}`
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
                }
            }
        });

        // Update community status
        await prisma.community.update({
            where: {
                id: parseInt(communityId)
            },
            data: {
                isCatchupLive: true
            }
        });

        return res.status(200).json({
            success: true,
            message: "Test live catchup created successfully",
            catchup: {
                id: testCatchup.id,
                title: testCatchup.title,
                desc: testCatchup.desc,
                communityId: testCatchup.communityId,
                communityName: testCatchup.community.title,
                communityBanner: testCatchup.community.bannerImg,
                creatorId: testCatchup.creatorId,
                creatorName: testCatchup.creator?.user?.name || "Unknown",
                creatorEmail: testCatchup.creator?.email || "Unknown",
                roomId: testCatchup.roomId,
                isLive: true
            }
        });

    } catch (error) {
        console.error("Error creating test live catchup:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create test live catchup",
            error: error.message
        });
    }
};

// Debug endpoint to check catchup state
exports.debugCatchupState = async function (req, res) {
    try {
        const { communityId } = req.params;
        
        // Get all catchups for the community
        const allCatchups = await prisma.catchUp.findMany({
            where: {
                communityId: parseInt(communityId)
            },
            include: {
                community: {
                    select: {
                        id: true,
                        title: true,
                        isCatchupLive: true,
                        catchupRoomId: true
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
                }
            }
        });

        // Get live catchups specifically
        const liveCatchups = await prisma.catchUp.findMany({
            where: {
                communityId: parseInt(communityId),
                isLive: true
            }
        });

        // Get community status
        const community = await prisma.community.findFirst({
            where: {
                id: parseInt(communityId)
            }
        });

        return res.status(200).json({
            success: true,
            debug: {
                communityId: parseInt(communityId),
                communityStatus: community,
                communityFixedRoomId: community?.catchupRoomId,
                totalCatchups: allCatchups.length,
                liveCatchups: liveCatchups.length,
                allCatchups: allCatchups.map(c => ({
                    id: c.id,
                    isLive: c.isLive,
                    isScheduled: c.isScheduled,
                    roomId: c.roomId,
                    communityFixedRoomId: c.community.catchupRoomId,
                    creatorId: c.creatorId,
                    createdAt: c.createdAt
                })),
                liveCatchups: liveCatchups.map(c => ({
                    id: c.id,
                    roomId: c.roomId,
                    creatorId: c.creatorId,
                    createdAt: c.createdAt
                }))
            }
        });

    } catch (error) {
        console.error("Error in debug endpoint:", error);
        return res.status(500).json({
            success: false,
            message: "Error checking catchup state",
            error: error.message
        });
    }
};

// Helper function to check if error is a database connection error
function isDatabaseConnectionError(error) {
    return error?.name === 'PrismaClientInitializationError' || 
           error?.message?.includes("Can't reach database server") ||
           error?.message?.includes("database server is running");
}

// Cron job function to check for catchup reminders
exports.checkCatchupReminders = async function () {
    try {
        const now = new Date();
        const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

        // Find scheduled catchups that start in 10 minutes and haven't sent reminders
        const catchupsNeedingReminders = await prisma.catchUp.findMany({
            where: {
                isScheduled: true,
                isLive: false,
                reminderSent: false,
                startTime: {
                    gte: now,
                    lte: tenMinutesFromNow
                }
            },
            include: {
                community: {
                    select: {
                        id: true,
                        title: true
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
                }
            }
        });

        console.log(`Found ${catchupsNeedingReminders.length} catchups needing reminders`);

        for (const catchup of catchupsNeedingReminders) {
            try {
                // Send reminder notification
                await sendCatchupReminderNotification(catchup);

                // Mark reminder as sent
                await prisma.catchUp.update({
                    where: { id: catchup.id },
                    data: { reminderSent: true }
                });

                console.log(`Sent reminder for catchup ${catchup.id}: ${catchup.title}`);
            } catch (error) {
                console.error(`Error sending reminder for catchup ${catchup.id}:`, error);
            }
        }
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            console.log('Database unavailable, skipping catchup reminders check');
            return;
        }
        console.error('Error in checkCatchupReminders:', error);
    }
};

// Cron job function to check for ended catchups
exports.checkEndedCatchups = async function () {
    try {
        const now = new Date();

        // Find catchups that have ended but are still marked as live or scheduled
        const endedCatchups = await prisma.catchUp.findMany({
            where: {
                endTime: {
                    lte: now
                },
                OR: [
                    { isLive: true },
                    { isScheduled: true }
                ]
            },
            include: {
                community: {
                    select: {
                        id: true,
                        title: true
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
                }
            }
        });

        console.log(`Found ${endedCatchups.length} ended catchups`);

        for (const catchup of endedCatchups) {
            try {
                // Send ended notification to attendees
                if (catchup.attendees && catchup.attendees.length > 0) {
                    await sendCatchupEndedNotification(catchup);
                }

                // Mark catchup as ended
                await prisma.catchUp.update({
                    where: { id: catchup.id },
                    data: {
                        isLive: false,
                        isScheduled: false
                    }
                });

                // Update community status if this was a live catchup
                if (catchup.isLive) {
                    await prisma.community.update({
                        where: { id: catchup.communityId },
                        data: { isCatchupLive: false }
                    });
                }

                console.log(`Marked catchup ${catchup.id} as ended: ${catchup.title}`);
            } catch (error) {
                console.error(`Error processing ended catchup ${catchup.id}:`, error);
            }
        }
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            console.log('Database unavailable, skipping ended catchups check');
            return;
        }
        console.error('Error in checkEndedCatchups:', error);
    }
};



// Function to handle user joining catchup when they enter 100ms room
exports.joinCatchupOnEnter = async function (req, res) {
    try {
        const { roomId, unifiedUserId, communityId } = req.body;

        if (!roomId || !unifiedUserId || !communityId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: roomId, unifiedUserId, communityId"
            });
        }

        console.log(`Looking for catchup with roomId: ${roomId}, communityId: ${communityId}`);
        
        // Find any catchup by room ID and community (don't check if it's live)
        const catchup = await prisma.catchUp.findFirst({
            where: {
                roomId: roomId,
                communityId: parseInt(communityId)
            }
        });

        console.log(`Found catchup:`, catchup);

        if (!catchup) {
            return res.status(404).json({
                success: false,
                message: "Catchup not found"
            });
        }

        // Check if user is already in attendees
        const currentAttendees = catchup.attendees || [];
        if (currentAttendees.includes(parseInt(unifiedUserId))) {
            return res.status(200).json({
                success: true,
                message: "User already in attendees",
                catchup: {
                    id: catchup.id,
                    title: catchup.title,
                    attendeesCount: currentAttendees.length
                }
            });
        }

        // Add user to attendees
        const updatedAttendees = [...currentAttendees, parseInt(unifiedUserId)];
        
        const updatedCatchup = await prisma.catchUp.update({
            where: { id: catchup.id },
            data: {
                attendees: updatedAttendees
            },
            include: {
                community: {
                    select: {
                        id: true,
                        title: true
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
                }
            }
        });

        // Send notification to host that user joined
        if (catchup.creatorId && catchup.creatorId !== parseInt(unifiedUserId)) {
            try {
                const notificationService = require('../../services/notification.service');
                await notificationService.createNotification({
                    recipientId: catchup.creatorId,
                    senderId: parseInt(unifiedUserId),
                    type: 'CATCHUP_USER_JOINED',
                    title: 'User Joined Catchup',
                    message: `A user has joined the catchup.`,
                    communityId: parseInt(communityId),
                    metadata: { 
                        catchupId: catchup.id, 
                        roomId: roomId,
                        userJoined: parseInt(unifiedUserId),
                        attendeesCount: updatedAttendees.length
                    },
                });
            } catch (notificationError) {
                console.log("Notification error:", notificationError);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Successfully joined catchup",
            catchup: {
                id: updatedCatchup.id,
                title: updatedCatchup.title,
                attendeesCount: updatedAttendees.length,
                community: updatedCatchup.community,
                creator: updatedCatchup.creator
            }
        });

    } catch (error) {
        console.error("Error joining catchup on enter:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to join catchup",
            error: error.message
        });
    }
};

// Function to get catchup status and attendees
exports.getCatchupStatus = async function (req, res) {
    try {
        const { roomId, communityId } = req.params;

        if (!roomId || !communityId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: roomId, communityId"
            });
        }

        const catchup = await prisma.catchUp.findFirst({
            where: {
                roomId: roomId,
                communityId: parseInt(communityId)
            },
            include: {
                community: {
                    select: {
                        id: true,
                        title: true
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
                }
            }
        });

        if (!catchup) {
            return res.status(404).json({
                success: false,
                message: "Catchup not found"
            });
        }

        // Get attendee details
        const attendees = await prisma.unifiedUser.findMany({
            where: {
                id: {
                    in: catchup.attendees || []
                }
            },
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
        });

        return res.status(200).json({
            success: true,
            catchup: {
                id: catchup.id,
                title: catchup.title,
                desc: catchup.desc,
                startTime: catchup.startTime,
                endTime: catchup.endTime,
                isLive: catchup.isLive,
                isScheduled: catchup.isScheduled,
                roomId: catchup.roomId,
                community: catchup.community,
                creator: catchup.creator,
                attendees: attendees.map(attendee => ({
                    id: attendee.id,
                    email: attendee.email,
                    name: attendee.user?.name || attendee.expert?.name || attendee.partner?.name || "Unknown",
                    photoURL: attendee.user?.photoURL || attendee.expert?.photoURL || attendee.partner?.photoURL || ""
                })),
                attendeesCount: attendees.length
            }
        });

    } catch (error) {
        console.error("Error getting catchup status:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get catchup status",
            error: error.message
        });
    }
};

// Export all functions including the new ones
module.exports = {
    getCatchupByCommunity: exports.getCatchupByCommunity,
    verifyCommunityMember: exports.verifyCommunityMember,
    createCatchUp: exports.createCatchUp,
    verifyCommunityHavingCatchup: exports.verifyCommunityHavingCatchup,
    verifyLeader: exports.verifyLeader,
    leaveCatchup: exports.leaveCatchup,
    returnRoomId: exports.returnRoomId,
    getUserActiveCatchups: exports.getUserActiveCatchups,
    createScheduledCatchUp: exports.createScheduledCatchUp,
    startScheduledCatchUp: exports.startScheduledCatchUp,
    updateCatchupRoom: exports.updateCatchupRoom,
    getScheduledCatchups: exports.getScheduledCatchups,
    createTestLiveCatchup: exports.createTestLiveCatchup,
    debugCatchupState: exports.debugCatchupState,
    joinCatchUp: exports.joinCatchUp,
    leaveCatchUp: exports.leaveCatchUp,
    getCatchupAttendees: exports.getCatchupAttendees,
    joinCatchupOnEnter: exports.joinCatchupOnEnter,
    getCatchupStatus: exports.getCatchupStatus,
    checkCatchupReminders: exports.checkCatchupReminders,
    checkEndedCatchups: exports.checkEndedCatchups
};