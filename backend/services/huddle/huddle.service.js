const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require('crypto');
const activityGenerator = require('./activity-generator.service');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const uuid4 = require('uuid4');

/**
 * Generate a unique 100ms room ID for a huddle
 * @param {number} communityId - The community ID
 * @param {string} huddleTitle - The huddle title
 * @returns {string} - The generated 100ms room ID
 */
async function generateHuddleRoomId(communityId, huddleTitle) {
    try {
        const app_access_key = process.env.MS_APP_ACCESS_KEY;
        const app_secret_key = process.env.MS_APP_SECRET_KEY;

        if (!app_access_key || !app_secret_key) {
            console.warn("100ms credentials not configured, using fallback room ID");
            const timestamp = Date.now();
            const randomPart = crypto.randomBytes(4).toString('hex');
            return `huddle-${communityId}-${timestamp}-${randomPart}`;
        }

        // Generate management token
        const payload = {
            access_key: app_access_key,
            type: "management",
            version: 2,
            iat: Math.floor(Date.now() / 1000) - 60,
            nbf: Math.floor(Date.now() / 1000) - 60,
        };

        const token = jwt.sign(payload, app_secret_key, {
            algorithm: "HS256",
            expiresIn: "24h",
            jwtid: uuid4(),
        });

        // Create room via 100ms API
        const roomName = `Huddle-${communityId}-${huddleTitle?.substring(0, 30) || 'Ritual'}`.replace(/[^a-zA-Z0-9-_]/g, '-');
        const response = await axios.post('https://api.100ms.live/v2/rooms', {
            name: roomName,
            description: `Ritual room for ${huddleTitle || 'Huddle'}`
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.id;
    } catch (error) {
        console.error("Error creating 100ms room for huddle:", error);
        console.error("Error details:", error.response?.data || error.message);
        // Throw error instead of returning fallback - let caller handle it
        // The token endpoint will create the room on-demand if needed
        throw new Error(`Failed to create 100ms room: ${error.response?.data?.message || error.message}`);
    }
}

/**
 * Create huddle activities based on selected activity types
 * @param {number} huddleId - The huddle ID
 * @param {string[]} selectedActivities - Array of activity types
 * @param {number} creatorId - The creator's user ID
 */
async function createHuddleActivities(huddleId, selectedActivities, creatorId) {
    const activityPromises = selectedActivities.map(async (activityType) => {
        const defaultData = getDefaultActivityData(activityType);
        const activityData = {
            ...defaultData,
            status: 'pending' // Initial status for generation tracking
        };
        
        const activity = await prisma.huddleActivity.create({
            data: {
                huddleId,
                activityType,
                activityData,
                isGenerated: false,
                isActive: true
            }
        });

        // Trigger async generation (non-blocking)
        generateActivityContentAsync(activity, huddleId);
        
        return activity;
    });

    await Promise.all(activityPromises);
}

/**
 * Generate activity content asynchronously (non-blocking)
 * @param {object} activity - The activity object
 * @param {number} huddleId - The huddle ID
 */
async function generateActivityContentAsync(activity, huddleId) {
    // Run in background without blocking huddle creation
    setImmediate(async () => {
        try {
            const huddle = await prisma.huddle.findUnique({
                where: { id: huddleId },
                include: { 
                    community: true 
                }
            });

            if (huddle && huddle.community) {
                await activityGenerator.generateActivityContent(
                    activity,
                    huddle,
                    huddle.community
                );
            } else {
                console.error(`Huddle ${huddleId} or community not found for activity generation`);
            }
        } catch (error) {
            console.error(`Background generation failed for activity ${activity.id}:`, error);
            // Update status to failed
            try {
                await activityGenerator.updateActivityStatus(activity.id, 'failed', { 
                    error: error.message 
                });
            } catch (updateError) {
                console.error(`Failed to update activity status:`, updateError);
            }
        }
    });
}

/**
 * Get default activity data based on activity type
 * @param {string} activityType - The activity type
 * @returns {object} - Default activity configuration
 */
function getDefaultActivityData(activityType) {
    const defaults = {
        'AI_SLIDESHOW': {
            prompt: "",
            slideCount: 5,
            style: "professional",
            provider: "chatgpt"
        },
        'AI_VIDEO_MESSAGE': {
            prompt: "",
            duration: 30,
            voice: "default",
            provider: "gemini"
        },
        'DISCUSSION_TOPIC': {
            topic: "",
            discussionPoints: []
        },
        'QUIZ': {
            questions: [],
            timeLimit: 60,
            showAnswers: true
        },
        'DEBATE': {
            topic: "",
            sides: ["For", "Against"],
            duration: 300
        },
        'CONTEST': {
            type: "",
            rules: [],
            prizes: []
        },
        'VOTING_SURVEY': {
            question: "",
            options: [],
            allowMultiple: false
        },
        'REFLECTION': {
            prompt: "",
            duration: 60
        },
        'GUIDED_SESSION': {
            type: "breathing",
            duration: 300,
            instructions: []
        },
        'STORY_SPOTLIGHT': {
            prompt: "",
            maxDuration: 120
        },
        'ANNOUNCEMENT': {
            title: "",
            content: "",
            allowReactions: true
        }
    };

    return defaults[activityType] || {};
}

/**
 * Select a leader based on the selection type
 * @param {object} huddle - The huddle object
 * @returns {number|null} - The selected leader's user ID
 */
async function selectLeader(huddle) {
    const { leaderSelectionType, communityId, id: huddleId } = huddle;

    switch (leaderSelectionType) {
        case 'USER':
            // Leader was already specified
            return huddle.leaderId;

        case 'RANDOM':
            // Select random from attendees or community members
            return await selectRandomLeader(communityId, huddleId);

        case 'FIRST_LOGIN':
            // First person to join becomes the leader
            return await selectFirstLoginLeader(huddleId);

        case 'ROUNDROBIN':
            // Rotate through community members
            return await selectRoundRobinLeader(communityId);

        default:
            return huddle.leaderId;
    }
}

/**
 * Select a random leader from community members
 * @param {number} communityId - The community ID
 * @param {number} huddleId - The huddle ID
 * @returns {number|null} - The selected leader's user ID
 */
async function selectRandomLeader(communityId, huddleId) {
    // First try to select from current attendees
    const attendees = await prisma.huddleAttendance.findMany({
        where: {
            huddleId,
            leftAt: null
        },
        select: {
            userId: true
        }
    });

    if (attendees.length > 0) {
        const randomIndex = Math.floor(Math.random() * attendees.length);
        return attendees[randomIndex].userId;
    }

    // If no attendees, select from community members
    const subscriptions = await prisma.subscription.findMany({
        where: {
            communityId,
            expiresAt: { gt: new Date() }
        },
        select: {
            unifiedUserId: true
        }
    });

    if (subscriptions.length > 0) {
        const randomIndex = Math.floor(Math.random() * subscriptions.length);
        return subscriptions[randomIndex].unifiedUserId;
    }

    return null;
}

/**
 * Select the first person to join as leader
 * @param {number} huddleId - The huddle ID
 * @returns {number|null} - The selected leader's user ID
 */
async function selectFirstLoginLeader(huddleId) {
    const firstAttendee = await prisma.huddleAttendance.findFirst({
        where: { huddleId },
        orderBy: { joinedAt: 'asc' },
        select: { userId: true }
    });

    return firstAttendee?.userId || null;
}

/**
 * Select leader using round-robin from community members
 * @param {number} communityId - The community ID
 * @returns {number|null} - The selected leader's user ID
 */
async function selectRoundRobinLeader(communityId) {
    // Get all community members
    const subscriptions = await prisma.subscription.findMany({
        where: {
            communityId,
            expiresAt: { gt: new Date() }
        },
        select: {
            unifiedUserId: true
        }
    });

    if (subscriptions.length === 0) return null;

    // Get the last huddle's leader for this community
    const lastHuddle = await prisma.huddle.findFirst({
        where: {
            communityId,
            leaderId: { not: null },
            endTime: { not: null }
        },
        orderBy: { endTime: 'desc' },
        select: { leaderId: true }
    });

    if (!lastHuddle) {
        // No previous leader, select first member
        return subscriptions[0].unifiedUserId;
    }

    // Find the index of the last leader and select the next one
    const lastLeaderIndex = subscriptions.findIndex(s => s.unifiedUserId === lastHuddle.leaderId);
    const nextIndex = (lastLeaderIndex + 1) % subscriptions.length;
    
    return subscriptions[nextIndex].unifiedUserId;
}

/**
 * Generate activity link based on activity type
 * @param {object} activity - The huddle activity object
 * @param {object} huddle - The huddle object
 * @returns {string} - The generated link URL
 */
async function generateActivityLink(activity, huddle) {
    const { activityType, activityData, id } = activity;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    switch (activityType) {
        case 'AI_SLIDESHOW':
            // Placeholder for AI slideshow generation via ChatGPT API
            return `${baseUrl}/huddle/${huddle.id}/activity/${id}/slideshow`;

        case 'AI_VIDEO_MESSAGE':
            // Placeholder for AI video generation via Gemini API
            return `${baseUrl}/huddle/${huddle.id}/activity/${id}/video`;

        case 'DISCUSSION_TOPIC':
            // Create a thread/post for discussion
            return `${baseUrl}/huddle/${huddle.id}/activity/${id}/discussion`;

        case 'QUIZ':
        case 'DEBATE':
        case 'CONTEST':
            return `${baseUrl}/huddle/${huddle.id}/activity/${id}/${activityType.toLowerCase()}`;

        case 'VOTING_SURVEY':
            // Create a poll
            return `${baseUrl}/huddle/${huddle.id}/activity/${id}/poll`;

        case 'REFLECTION':
            // Link to form
            return `${baseUrl}/huddle/${huddle.id}/activity/${id}/reflection`;

        case 'GUIDED_SESSION':
            // Link to guided session
            return `${baseUrl}/huddle/${huddle.id}/activity/${id}/guided`;

        case 'STORY_SPOTLIGHT':
            // Link to resource sharing
            return `${baseUrl}/huddle/${huddle.id}/activity/${id}/story`;

        case 'ANNOUNCEMENT':
            // Link to announcement post
            return `${baseUrl}/huddle/${huddle.id}/activity/${id}/announcement`;

        default:
            return `${baseUrl}/huddle/${huddle.id}/activity/${id}`;
    }
}

/**
 * Generate AI content for an activity
 * @param {object} activity - The huddle activity object
 * @returns {object} - Generated content details
 */
async function generateAIContent(activity) {
    const { activityType, activityData, aiPrompt } = activity;

    try {
        switch (activityType) {
            case 'AI_SLIDESHOW':
                // Call ChatGPT API to generate slideshow
                return await generateSlideshowWithChatGPT(aiPrompt || activityData?.prompt);

            case 'AI_VIDEO_MESSAGE':
                // Call Gemini API to generate video (30 sec limit)
                return await generateVideoWithGemini(aiPrompt || activityData?.prompt);

            default:
                return null;
        }
    } catch (error) {
        console.error(`Error generating AI content for ${activityType}:`, error);
        return null;
    }
}

/**
 * Generate slideshow using ChatGPT API (placeholder)
 * @param {string} prompt - The prompt for slideshow generation
 * @returns {object} - Generated slideshow data
 */
async function generateSlideshowWithChatGPT(prompt) {
    // TODO: Implement actual ChatGPT API call
    // This is a placeholder implementation
    
    console.log('Generating slideshow with ChatGPT for prompt:', prompt);
    
    // Placeholder response
    return {
        success: true,
        provider: 'chatgpt',
        url: null, // Will be set when actual API is implemented
        slides: [],
        message: 'Slideshow generation pending - ChatGPT API integration required'
    };
}

/**
 * Generate video using Gemini API (placeholder)
 * @param {string} prompt - The prompt for video generation
 * @returns {object} - Generated video data
 */
async function generateVideoWithGemini(prompt) {
    // TODO: Implement actual Gemini API call
    // Video is limited to 30 seconds
    
    console.log('Generating video with Gemini for prompt:', prompt);
    
    // Placeholder response
    return {
        success: true,
        provider: 'gemini',
        url: null, // Will be set when actual API is implemented
        duration: 30,
        message: 'Video generation pending - Gemini API integration required'
    };
}

/**
 * Check for scheduling conflicts
 * @param {number} communityId - The community ID
 * @param {Date} scheduledTime - The scheduled time
 * @param {string} frequency - The frequency type
 * @param {number} excludeHuddleId - Huddle ID to exclude (for updates)
 * @returns {boolean} - True if there's a conflict
 */
async function hasSchedulingConflict(communityId, scheduledTime, frequency, excludeHuddleId = null) {
    const scheduledDate = new Date(scheduledTime);
    
    // Check for huddles within 1 hour of the scheduled time
    const oneHourBefore = new Date(scheduledDate.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(scheduledDate.getTime() + 60 * 60 * 1000);

    const whereClause = {
        communityId,
        scheduledTime: {
            gte: oneHourBefore,
            lte: oneHourAfter
        }
    };

    if (excludeHuddleId) {
        whereClause.id = { not: excludeHuddleId };
    }

    const conflictingHuddle = await prisma.huddle.findFirst({
        where: whereClause
    });

    return !!conflictingHuddle;
}

/**
 * Get next scheduled time based on frequency
 * @param {Date} currentTime - The current scheduled time
 * @param {string} frequency - The frequency type (DAILY, WEEKLY, FORTNIGHTLY)
 * @returns {Date} - The next scheduled time
 */
function getNextScheduledTime(currentTime, frequency) {
    const date = new Date(currentTime);

    switch (frequency) {
        case 'DAILY':
            date.setDate(date.getDate() + 1);
            break;
        case 'WEEKLY':
            date.setDate(date.getDate() + 7);
            break;
        case 'FORTNIGHTLY':
            date.setDate(date.getDate() + 14);
            break;
    }

    return date;
}

/**
 * Create a recurring instance of a huddle
 * @param {object} originalHuddle - The original huddle object
 * @returns {object} - The new huddle instance
 */
async function createRecurringHuddleInstance(originalHuddle) {
    const nextScheduledTime = getNextScheduledTime(originalHuddle.scheduledTime, originalHuddle.frequency);
    const newRoomId = await generateHuddleRoomId(originalHuddle.communityId, originalHuddle.title);

    const newHuddle = await prisma.huddle.create({
        data: {
            title: originalHuddle.title,
            description: originalHuddle.description,
            communityId: originalHuddle.communityId,
            creatorId: originalHuddle.creatorId,
            frequency: originalHuddle.frequency,
            scheduledTime: nextScheduledTime,
            timezone: originalHuddle.timezone,
            selectedActivities: originalHuddle.selectedActivities,
            audienceType: originalHuddle.audienceType,
            selectedMemberIds: originalHuddle.selectedMemberIds,
            locationType: originalHuddle.locationType,
            offlineLocation: originalHuddle.offlineLocation,
            roomId: newRoomId,
            leaderSelectionType: originalHuddle.leaderSelectionType,
            isScheduled: true,
            isLive: false
        }
    });

    // Create activities for the new instance
    await createHuddleActivities(newHuddle.id, originalHuddle.selectedActivities, originalHuddle.creatorId);

    return newHuddle;
}

module.exports = {
    generateHuddleRoomId,
    createHuddleActivities,
    getDefaultActivityData,
    selectLeader,
    selectRandomLeader,
    selectFirstLoginLeader,
    selectRoundRobinLeader,
    generateActivityLink,
    generateAIContent,
    generateSlideshowWithChatGPT,
    generateVideoWithGemini,
    hasSchedulingConflict,
    getNextScheduledTime,
    createRecurringHuddleInstance
};
