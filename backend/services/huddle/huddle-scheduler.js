const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helper function to check if error is a database connection error
function isDatabaseConnectionError(error) {
    return error?.name === 'PrismaClientInitializationError' || 
           error?.message?.includes("Can't reach database server") ||
           error?.message?.includes("database server is running");
}

// Lazy load services to avoid circular dependencies
let huddleNotificationService = null;
let huddleEngagementService = null;
let huddleService = null;

function getHuddleNotificationService() {
    if (!huddleNotificationService) {
        huddleNotificationService = require('./huddle-notification.service');
    }
    return huddleNotificationService;
}

function getHuddleEngagementService() {
    if (!huddleEngagementService) {
        huddleEngagementService = require('./huddle-engagement.service');
    }
    return huddleEngagementService;
}

function getHuddleService() {
    if (!huddleService) {
        huddleService = require('./huddle.service');
    }
    return huddleService;
}

/**
 * Check if Huddle model exists in database (migration has been run)
 * @returns {boolean}
 */
async function isHuddleModelAvailable() {
    try {
        // Check if huddle model is available in Prisma client
        if (!prisma.huddle) {
            console.log('Huddle model not available - run "npx prisma generate" after migration');
            return false;
        }
        return true;
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            console.log('Database unavailable, skipping huddle model check');
            return false;
        }
        console.log('Huddle model check failed:', error.message);
        return false;
    }
}

/**
 * Check and send 1-day reminders for upcoming huddles
 * Should run once per day (e.g., at 9 AM)
 */
async function checkHuddleReminders1Day() {
    try {
        // Skip if Huddle model is not available yet
        if (!await isHuddleModelAvailable()) return;

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        // Find huddles scheduled for tomorrow
        const huddles = await prisma.huddle.findMany({
            where: {
                isScheduled: true,
                isLive: false,
                scheduledTime: {
                    gte: tomorrow,
                    lt: dayAfterTomorrow
                }
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

        console.log(`Found ${huddles.length} huddles for 1-day reminder`);

        const notifService = getHuddleNotificationService();
        for (const huddle of huddles) {
            if (!notifService.wasNotificationSent(huddle, 'reminder1Day')) {
                await notifService.sendHuddleReminder1Day(huddle);
            }
        }
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            console.log('Database unavailable, skipping huddle 1-day reminders check');
            return;
        }
        console.error('Error in checkHuddleReminders1Day:', error);
    }
}

/**
 * Check and send 2-hour reminders for upcoming huddles
 * Should run every 15 minutes
 */
async function checkHuddleReminders2Hours() {
    try {
        // Skip if Huddle model is not available yet
        if (!await isHuddleModelAvailable()) return;

        const now = new Date();
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const twoHours15MinLater = new Date(now.getTime() + 2.25 * 60 * 60 * 1000);

        // Find huddles starting in about 2 hours
        const huddles = await prisma.huddle.findMany({
            where: {
                isScheduled: true,
                isLive: false,
                scheduledTime: {
                    gte: twoHoursLater,
                    lt: twoHours15MinLater
                }
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

        console.log(`Found ${huddles.length} huddles for 2-hour reminder`);

        const notifService = getHuddleNotificationService();
        for (const huddle of huddles) {
            if (!notifService.wasNotificationSent(huddle, 'reminder2Hours')) {
                await notifService.sendHuddleReminder2Hours(huddle);
            }
        }
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            console.log('Database unavailable, skipping huddle 2-hour reminders check');
            return;
        }
        console.error('Error in checkHuddleReminders2Hours:', error);
    }
}

/**
 * Check and send 10-minute reminders for upcoming huddles
 * Should run every minute
 */
async function checkHuddleReminders10Min() {
    try {
        // Skip if Huddle model is not available yet
        if (!await isHuddleModelAvailable()) return;

        const now = new Date();
        const tenMinLater = new Date(now.getTime() + 10 * 60 * 1000);
        const elevenMinLater = new Date(now.getTime() + 11 * 60 * 1000);

        // Find huddles starting in about 10 minutes
        const huddles = await prisma.huddle.findMany({
            where: {
                isScheduled: true,
                isLive: false,
                scheduledTime: {
                    gte: tenMinLater,
                    lt: elevenMinLater
                }
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

        console.log(`Found ${huddles.length} huddles for 10-minute reminder`);

        const notifService = getHuddleNotificationService();
        for (const huddle of huddles) {
            if (!notifService.wasNotificationSent(huddle, 'reminder10Min')) {
                await notifService.sendHuddleReminder10Min(huddle);
            }
        }
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            console.log('Database unavailable, skipping huddle 10-minute reminders check');
            return;
        }
        console.error('Error in checkHuddleReminders10Min:', error);
    }
}

/**
 * Auto-launch huddles at their scheduled time
 * Should run every minute
 */
async function autoLaunchHuddles() {
    try {
        // Skip if Huddle model is not available yet
        if (!await isHuddleModelAvailable()) return;

        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

        // Find huddles that should start now
        const huddles = await prisma.huddle.findMany({
            where: {
                isScheduled: true,
                isLive: false,
                scheduledTime: {
                    gte: oneMinuteAgo,
                    lte: now
                }
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

        console.log(`Found ${huddles.length} huddles to auto-launch`);

        for (const huddle of huddles) {
            try {
                // Determine leader
                let leaderId = huddle.leaderId;
                if (!leaderId || huddle.leaderSelectionType !== 'USER') {
                    leaderId = await getHuddleService().selectLeader(huddle);
                }

                // Launch the huddle and get the updated record
                const updatedHuddle = await prisma.huddle.update({
                    where: { id: huddle.id },
                    data: {
                        isLive: true,
                        isScheduled: false,
                        startTime: now,
                        leaderId
                    },
                    include: {
                        community: true,
                        attendances: true
                    }
                });

                // Send start notification with the updated huddle
                await getHuddleNotificationService().sendHuddleStartedNotification(updatedHuddle);

                console.log(`Auto-launched huddle ${huddle.id}: ${huddle.title}`);
            } catch (launchError) {
                console.error(`Error auto-launching huddle ${huddle.id}:`, launchError);
            }
        }
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            console.log('Database unavailable, skipping auto-launch huddles check');
            return;
        }
        console.error('Error in autoLaunchHuddles:', error);
    }
}

/**
 * Check for huddles that have exceeded their duration and should end
 * Should run every 5 minutes
 */
async function checkEndedHuddles() {
    try {
        // Skip if Huddle model is not available yet
        if (!await isHuddleModelAvailable()) return;

        const now = new Date();
        
        // Default huddle duration is 1 hour
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Find live huddles that started more than 1 hour ago with no end time
        const huddles = await prisma.huddle.findMany({
            where: {
                isLive: true,
                startTime: {
                    lte: oneHourAgo
                },
                endTime: null
            },
            include: {
                attendances: true,
                community: true
            }
        });

        console.log(`Found ${huddles.length} huddles that may need to end`);

        const engagementService = getHuddleEngagementService();
        const notifService = getHuddleNotificationService();
        const huddleSvc = getHuddleService();

        for (const huddle of huddles) {
            try {
                // Update all attendances
                await prisma.huddleAttendance.updateMany({
                    where: {
                        huddleId: huddle.id,
                        leftAt: null
                    },
                    data: {
                        leftAt: now
                    }
                });

                // End the huddle and get the updated record
                const updatedHuddle = await prisma.huddle.update({
                    where: { id: huddle.id },
                    data: {
                        isLive: false,
                        endTime: now
                    },
                    include: {
                        attendances: true,
                        community: true
                    }
                });

                // Update streaks and assign points with the updated huddle
                await engagementService.updateStreaksForHuddle(updatedHuddle);
                await engagementService.assignPointsToAttendees(updatedHuddle);

                // Generate summary with the updated huddle
                await engagementService.generateHuddleSummary(updatedHuddle);

                // Send ended notification with the updated huddle
                await notifService.sendHuddleEndedNotification(updatedHuddle);

                // Create next recurring instance if applicable (with NEW content)
                if (updatedHuddle.frequency && updatedHuddle.frequency !== 'ONE_TIME') {
                    try {
                        const huddleRecurrenceService = require('./huddle-recurrence.service');
                        await huddleRecurrenceService.scheduleNextHuddle(updatedHuddle);
                    } catch (recurrenceError) {
                        console.error(`Error creating next huddle for ${updatedHuddle.id}:`, recurrenceError);
                    }
                }

                console.log(`Auto-ended huddle ${huddle.id}: ${huddle.title}`);
            } catch (endError) {
                console.error(`Error ending huddle ${huddle.id}:`, endError);
            }
        }
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            console.log('Database unavailable, skipping ended huddles check');
            return;
        }
        console.error('Error in checkEndedHuddles:', error);
    }
}

/**
 * Check for broken streaks and send notifications
 * Should run once per day (e.g., at 10 AM)
 */
async function checkStreakReminders() {
    try {
        // Skip if Huddle model is not available yet
        if (!await isHuddleModelAvailable()) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const twoDaysAgo = new Date(yesterday);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);

        // Find users with streaks who didn't attend yesterday
        const atRiskStreaks = await prisma.huddleStreak.findMany({
            where: {
                currentStreak: { gt: 0 },
                lastHuddleDate: {
                    gte: twoDaysAgo,
                    lt: yesterday
                }
            },
            include: {
                user: {
                    include: {
                        user: true
                    }
                },
                community: true
            }
        });

        console.log(`Found ${atRiskStreaks.length} users with streaks at risk`);

        const notificationService = require('../notification.service');

        for (const streak of atRiskStreaks) {
            try {
                // Check if there's an upcoming huddle today
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const upcomingHuddle = await prisma.huddle.findFirst({
                    where: {
                        communityId: streak.communityId,
                        isScheduled: true,
                        scheduledTime: {
                            gte: today,
                            lt: tomorrow
                        }
                    }
                });

                if (upcomingHuddle) {
                    await notificationService.createNotification({
                        recipientId: streak.userId,
                        senderId: null,
                        type: 'STREAK_AT_RISK',
                        title: `Don't lose your ${streak.currentStreak}-day streak!`,
                        message: `You have a huddle today in ${streak.community.title}. Join to keep your streak!`,
                        communityId: streak.communityId,
                        metadata: {
                            currentStreak: streak.currentStreak,
                            huddleId: upcomingHuddle.id
                        }
                    });
                }
            } catch (notifyError) {
                console.error(`Error sending streak reminder to user ${streak.userId}:`, notifyError);
            }
        }
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            console.log('Database unavailable, skipping streak reminders check');
            return;
        }
        console.error('Error in checkStreakReminders:', error);
    }
}

/**
 * Generate AI hook messages for live huddles with low attendance
 * Should run every 15 minutes
 */
async function generateAIHooks() {
    try {
        // Skip if Huddle model is not available yet
        if (!await isHuddleModelAvailable()) return;

        const now = new Date();
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

        // Find live huddles that started at least 15 minutes ago
        const huddles = await prisma.huddle.findMany({
            where: {
                isLive: true,
                startTime: {
                    lte: fifteenMinutesAgo
                },
                aiHook: null // Haven't sent AI hook yet
            },
            include: {
                attendances: {
                    where: { leftAt: null }
                },
                community: {
                    include: {
                        subscriptions: {
                            where: {
                                expiresAt: { gt: now }
                            }
                        }
                    }
                }
            }
        });

        for (const huddle of huddles) {
            const currentAttendees = huddle.attendances.length;
            const totalMembers = huddle.community.subscriptions.length;
            const attendanceRate = totalMembers > 0 ? currentAttendees / totalMembers : 1;

            // If less than 30% attendance, send AI hook
            if (attendanceRate < 0.3 && totalMembers > 3) {
                // Generate AI hook message (placeholder)
                const hookMessage = await generateAIHookMessage(huddle);
                
                await getHuddleNotificationService().sendAIHookNotification(huddle, hookMessage);
                
                console.log(`Sent AI hook for huddle ${huddle.id} with ${Math.round(attendanceRate * 100)}% attendance`);
            }
        }
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            console.log('Database unavailable, skipping AI hooks generation');
            return;
        }
        console.error('Error in generateAIHooks:', error);
    }
}

/**
 * Generate an AI hook message for a huddle (placeholder)
 * @param {object} huddle - The huddle object
 * @returns {string} - The hook message
 */
async function generateAIHookMessage(huddle) {
    // TODO: Implement ChatGPT API call for personalized hook messages
    
    const defaultMessages = [
        `🎉 Something exciting is happening in "${huddle.title}"! Join now and don't miss out!`,
        `👋 Your community is gathered in "${huddle.title}". Come say hello!`,
        `🌟 "${huddle.title}" is live! Great conversations are happening right now.`,
        `💡 Join "${huddle.title}" now - your community is waiting for you!`,
        `🚀 Don't miss "${huddle.title}"! The huddle is in full swing.`
    ];

    return defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
}

/**
 * Clean up old huddle data
 * Should run once per week
 */
async function cleanupOldHuddleData() {
    try {
        // Skip if Huddle model is not available yet
        if (!await isHuddleModelAvailable()) return;

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // Archive old huddles (don't delete, just mark for archival)
        const oldHuddles = await prisma.huddle.findMany({
            where: {
                isLive: false,
                isScheduled: false,
                endTime: {
                    lt: threeMonthsAgo
                }
            },
            select: { id: true }
        });

        console.log(`Found ${oldHuddles.length} old huddles for potential archival`);

        // For now, just log - implement archival logic as needed
    } catch (error) {
        if (isDatabaseConnectionError(error)) {
            console.log('Database unavailable, skipping huddle data cleanup');
            return;
        }
        console.error('Error in cleanupOldHuddleData:', error);
    }
}

module.exports = {
    checkHuddleReminders1Day,
    checkHuddleReminders2Hours,
    checkHuddleReminders10Min,
    autoLaunchHuddles,
    checkEndedHuddles,
    checkStreakReminders,
    generateAIHooks,
    generateAIHookMessage,
    cleanupOldHuddleData
};
