const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const huddleService = require('./huddle.service');
const activityGenerator = require('./activity-generator.service');
const huddleNotificationService = require('./huddle-notification.service');

/**
 * Calculate next scheduled time based on frequency
 * @param {Date} endTime - The time when current huddle ended
 * @param {string} frequency - The frequency type (DAILY, WEEKLY, FORTNIGHTLY, MONTHLY, ONE_TIME)
 * @param {Date} originalScheduledTime - The original scheduled time to maintain time of day
 * @returns {Date} - The next scheduled time
 */
function calculateNextScheduledTime(endTime, frequency, originalScheduledTime) {
    const nextTime = new Date(endTime);
    const originalTime = new Date(originalScheduledTime);
    
    // Extract time of day from original scheduled time
    const hours = originalTime.getHours();
    const minutes = originalTime.getMinutes();
    const seconds = originalTime.getSeconds();
    
    switch (frequency) {
        case 'DAILY':
            nextTime.setDate(nextTime.getDate() + 1);
            break;
        case 'WEEKLY':
            nextTime.setDate(nextTime.getDate() + 7);
            break;
        case 'FORTNIGHTLY':
            nextTime.setDate(nextTime.getDate() + 14);
            break;
        case 'MONTHLY':
            nextTime.setMonth(nextTime.getMonth() + 1);
            break;
        case 'ONE_TIME':
            // Don't create next instance for one-time huddles
            return null;
        default:
            return null;
    }
    
    // Set the time to match original scheduled time
    nextTime.setHours(hours, minutes, seconds, 0);
    
    return nextTime;
}

/**
 * Create next recurring huddle instance with NEW content
 * @param {object} completedHuddle - The completed huddle object
 * @returns {object|null} - The new huddle instance or null if not recurring
 */
async function createNextRecurringHuddle(completedHuddle) {
    try {
        // Check if huddle is recurring
        if (completedHuddle.frequency === 'ONE_TIME') {
            return null;
        }
        
        // Calculate next scheduled time
        const endTime = completedHuddle.endTime || new Date();
        const nextScheduledTime = calculateNextScheduledTime(
            endTime,
            completedHuddle.frequency,
            completedHuddle.scheduledTime
        );
        
        if (!nextScheduledTime) {
            return null;
        }
        
        // Check if there's already a scheduled huddle for this community
        const existingHuddle = await prisma.huddle.findFirst({
            where: {
                communityId: completedHuddle.communityId,
                isScheduled: true,
                OR: [
                    { isLive: true },
                    { scheduledTime: { gte: new Date() } }
                ]
            }
        });
        
        if (existingHuddle) {
            console.log(`Skipping next huddle creation - huddle ${existingHuddle.id} already exists for community ${completedHuddle.communityId}`);
            return null;
        }
        
        // Generate new 100ms room ID
        let roomId = null;
        try {
            roomId = await huddleService.generateHuddleRoomId(
                completedHuddle.communityId,
                completedHuddle.title
            );
        } catch (error) {
            console.warn("Failed to create 100ms room for next huddle, will create on-demand:", error.message);
        }
        
        // Determine leader for next huddle
        let nextLeaderId = completedHuddle.leaderId;
        if (completedHuddle.leaderSelectionType === 'RANDOM' || 
            completedHuddle.leaderSelectionType === 'ROUNDROBIN') {
            // Select new leader based on selection type
            nextLeaderId = await huddleService.selectLeader({
                ...completedHuddle,
                leaderId: null // Force re-selection
            });
        }
        
        // Create new huddle instance
        const newHuddle = await prisma.huddle.create({
            data: {
                title: completedHuddle.title,
                description: completedHuddle.description,
                communityId: completedHuddle.communityId,
                creatorId: completedHuddle.creatorId,
                frequency: completedHuddle.frequency,
                scheduledTime: nextScheduledTime,
                timezone: completedHuddle.timezone,
                selectedActivities: completedHuddle.selectedActivities,
                audienceType: completedHuddle.audienceType,
                selectedMemberIds: completedHuddle.selectedMemberIds,
                locationType: completedHuddle.locationType,
                offlineLocation: completedHuddle.offlineLocation,
                roomId: roomId,
                leaderId: nextLeaderId,
                leaderSelectionType: completedHuddle.leaderSelectionType,
                isScheduled: true,
                isLive: false
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
        
        console.log(`Created next recurring huddle ${newHuddle.id} for community ${completedHuddle.communityId}, scheduled for ${nextScheduledTime}`);
        
        // Create activities with NEW content (not copied from previous)
        await createNewHuddleActivities(newHuddle);
        
        // Send notification about new scheduled huddle
        try {
            await huddleNotificationService.sendHuddleCreatedNotification(newHuddle);
        } catch (notificationError) {
            console.error("Error sending notification for next huddle (non-critical):", notificationError);
        }
        
        return newHuddle;
        
    } catch (error) {
        console.error("Error creating next recurring huddle:", error);
        throw error;
    }
}

/**
 * Create new activities for huddle with fresh content generation
 * @param {object} huddle - The huddle object
 */
async function createNewHuddleActivities(huddle) {
    try {
        // Get community details for activity generation
        const community = await prisma.community.findUnique({
            where: { id: huddle.communityId }
        });
        
        if (!community) {
            console.error(`Community ${huddle.communityId} not found for activity generation`);
            return;
        }
        
        // Create activities for each selected activity type
        for (const activityType of huddle.selectedActivities) {
            try {
                // Get default activity data
                const defaultData = huddleService.getDefaultActivityData(activityType);
                const activityData = {
                    ...defaultData,
                    status: 'pending' // Mark as pending for generation
                };
                
                // Create activity record
                const activity = await prisma.huddleActivity.create({
                    data: {
                        huddleId: huddle.id,
                        activityType: activityType,
                        activityData: activityData,
                        isGenerated: false,
                        isActive: true
                    }
                });
                
                // Generate NEW content asynchronously (non-blocking)
                // This ensures each huddle gets fresh, unique content
                setImmediate(async () => {
                    try {
                        await activityGenerator.generateActivityContent(
                            activity,
                            huddle,
                            community
                        );
                        console.log(`Generated new content for activity ${activity.id} (${activityType}) in huddle ${huddle.id}`);
                    } catch (genError) {
                        console.error(`Error generating content for activity ${activity.id}:`, genError);
                        // Update status to failed
                        try {
                            await activityGenerator.updateActivityStatus(activity.id, 'failed', {
                                error: genError.message
                            });
                        } catch (updateError) {
                            console.error(`Failed to update activity status:`, updateError);
                        }
                    }
                });
                
            } catch (activityError) {
                console.error(`Error creating activity ${activityType} for huddle ${huddle.id}:`, activityError);
                // Continue with other activities even if one fails
            }
        }
        
        console.log(`Created ${huddle.selectedActivities.length} activities for next huddle ${huddle.id}`);
        
    } catch (error) {
        console.error(`Error creating activities for huddle ${huddle.id}:`, error);
        throw error;
    }
}

/**
 * Schedule next huddle using node-cron
 * This is called when a huddle ends to schedule the next one
 * @param {object} completedHuddle - The completed huddle
 */
async function scheduleNextHuddle(completedHuddle) {
    try {
        // Create next huddle immediately
        const nextHuddle = await createNextRecurringHuddle(completedHuddle);
        
        if (nextHuddle) {
            console.log(`Scheduled next huddle ${nextHuddle.id} for ${nextHuddle.scheduledTime}`);
            return nextHuddle;
        }
        
        return null;
    } catch (error) {
        console.error("Error scheduling next huddle:", error);
        throw error;
    }
}

module.exports = {
    calculateNextScheduledTime,
    createNextRecurringHuddle,
    createNewHuddleActivities,
    scheduleNextHuddle
};

