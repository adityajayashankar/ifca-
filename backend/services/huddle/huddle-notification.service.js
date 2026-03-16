const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Notification types for huddles
 */
const HUDDLE_NOTIFICATION_TYPES = {
    HUDDLE_CREATED: 'HUDDLE_CREATED',
    HUDDLE_REMINDER_1_DAY: 'HUDDLE_REMINDER_1_DAY',
    HUDDLE_REMINDER_2_HOURS: 'HUDDLE_REMINDER_2_HOURS',
    HUDDLE_REMINDER_10_MIN: 'HUDDLE_REMINDER_10_MIN',
    HUDDLE_STARTED: 'HUDDLE_STARTED',
    HUDDLE_ENDED: 'HUDDLE_ENDED',
    HUDDLE_AI_HOOK: 'HUDDLE_AI_HOOK',
    HUDDLE_USER_JOINED: 'HUDDLE_USER_JOINED',
    HUDDLE_USER_LEFT: 'HUDDLE_USER_LEFT'
};

/**
 * Send notification to community members about a new huddle
 * @param {object} huddle - The huddle object
 */
async function sendHuddleCreatedNotification(huddle) {
    try {
        // Validate huddle object has required fields
        if (!huddle || !huddle.id || !huddle.communityId || !huddle.creatorId) {
            console.error('Invalid huddle object passed to sendHuddleCreatedNotification:', huddle);
            throw new Error('Invalid huddle object: missing required fields (id, communityId, creatorId)');
        }

        const notificationService = require('../notification.service');
        
        // Get community members based on audience type
        const recipients = await getHuddleRecipients(huddle);

        if (!recipients || recipients.length === 0) {
            console.warn(`No recipients found for huddle ${huddle.id} in community ${huddle.communityId}. Audience type: ${huddle.audienceType}, Selected members: ${huddle.selectedMemberIds?.length || 0}`);
            return;
        }

        console.log(`Preparing to send HUDDLE_CREATED notifications for huddle ${huddle.id} to ${recipients.length} recipients`);

        let successCount = 0;
        let errorCount = 0;

        for (const recipient of recipients) {
            try {
                if (!recipient || !recipient.unifiedUserId) {
                    console.warn(`Skipping recipient with missing unifiedUserId:`, recipient);
                    continue;
                }

                const notification = await notificationService.createNotification({
                    recipientId: recipient.unifiedUserId,
                    senderId: huddle.creatorId,
                    type: HUDDLE_NOTIFICATION_TYPES.HUDDLE_CREATED,
                    title: `New Huddle: ${huddle.title}`,
                    message: `A new huddle "${huddle.title}" has been scheduled for ${formatDateTime(huddle.scheduledTime)}`,
                    communityId: huddle.communityId,
                    huddleId: huddle.id,
                    metadata: {
                        scheduledTime: huddle.scheduledTime,
                        frequency: huddle.frequency,
                        activities: huddle.selectedActivities
                    }
                });

                if (notification && notification.id) {
                successCount++;
                } else {
                    errorCount++;
                    console.warn(`Notification created but missing ID for recipient ${recipient.unifiedUserId}`);
                }
            } catch (error) {
                errorCount++;
                console.error(`Error sending notification to user ${recipient.unifiedUserId} for huddle ${huddle.id}:`, error.message || error);
            }
        }

        // Update huddle notification status
        await updateNotificationStatus(huddle.id, 'created', true);

        console.log(`✓ Sent HUDDLE_CREATED notifications for huddle ${huddle.id}: ${successCount} successful, ${errorCount} failed out of ${recipients.length} recipients`);
        
        if (errorCount > 0) {
            console.warn(`⚠ Some notifications failed for huddle ${huddle.id}. Check logs above for details.`);
        }
    } catch (error) {
        console.error(`✗ Error sending huddle created notification for huddle ${huddle?.id}:`, error);
        throw error;
    }
}

/**
 * Send reminder notification 1 day before huddle
 * @param {object} huddle - The huddle object
 */
async function sendHuddleReminder1Day(huddle) {
    try {
        const notificationService = require('../notification.service');
        const recipients = await getHuddleRecipients(huddle);

        if (!recipients || recipients.length === 0) {
            console.warn(`No recipients found for 1-day reminder for huddle ${huddle.id}`);
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const recipient of recipients) {
            try {
                if (!recipient.unifiedUserId) {
                    console.warn(`Skipping recipient with missing unifiedUserId:`, recipient);
                    continue;
                }

                await notificationService.createNotification({
                    recipientId: recipient.unifiedUserId,
                    senderId: huddle.creatorId,
                    type: HUDDLE_NOTIFICATION_TYPES.HUDDLE_REMINDER_1_DAY,
                    title: `Huddle Tomorrow: ${huddle.title}`,
                    message: `Reminder: "${huddle.title}" is happening tomorrow at ${formatTime(huddle.scheduledTime)}`,
                    communityId: huddle.communityId,
                    huddleId: huddle.id,
                    metadata: {
                        scheduledTime: huddle.scheduledTime
                    }
                });
                successCount++;
            } catch (error) {
                errorCount++;
                console.error(`Error sending 1-day reminder to user ${recipient.unifiedUserId}:`, error);
            }
        }

        await updateNotificationStatus(huddle.id, 'reminder1Day', true);
        console.log(`Sent 1-day reminder for huddle ${huddle.id}: ${successCount} successful, ${errorCount} failed out of ${recipients.length} recipients`);
    } catch (error) {
        console.error('Error sending 1-day reminder:', error);
        throw error;
    }
}

/**
 * Send reminder notification 2 hours before huddle
 * @param {object} huddle - The huddle object
 */
async function sendHuddleReminder2Hours(huddle) {
    try {
        const notificationService = require('../notification.service');
        const recipients = await getHuddleRecipients(huddle);

        if (!recipients || recipients.length === 0) {
            console.warn(`No recipients found for 2-hour reminder for huddle ${huddle.id}`);
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const recipient of recipients) {
            try {
                if (!recipient.unifiedUserId) {
                    console.warn(`Skipping recipient with missing unifiedUserId:`, recipient);
                    continue;
                }

                await notificationService.createNotification({
                    recipientId: recipient.unifiedUserId,
                    senderId: huddle.creatorId,
                    type: HUDDLE_NOTIFICATION_TYPES.HUDDLE_REMINDER_2_HOURS,
                    title: `Huddle in 2 Hours: ${huddle.title}`,
                    message: `Get ready! "${huddle.title}" starts in 2 hours at ${formatTime(huddle.scheduledTime)}`,
                    communityId: huddle.communityId,
                    huddleId: huddle.id,
                    metadata: {
                        scheduledTime: huddle.scheduledTime
                    }
                });
                successCount++;
            } catch (error) {
                errorCount++;
                console.error(`Error sending 2-hour reminder to user ${recipient.unifiedUserId}:`, error);
            }
        }

        await updateNotificationStatus(huddle.id, 'reminder2Hours', true);
        console.log(`Sent 2-hour reminder for huddle ${huddle.id}: ${successCount} successful, ${errorCount} failed out of ${recipients.length} recipients`);
    } catch (error) {
        console.error('Error sending 2-hour reminder:', error);
        throw error;
    }
}

/**
 * Send reminder notification 10 minutes before huddle
 * @param {object} huddle - The huddle object
 */
async function sendHuddleReminder10Min(huddle) {
    try {
        // Check if notification was already sent
        if (wasNotificationSent(huddle, 'reminder10Min')) {
            console.log(`10-minute reminder already sent for huddle ${huddle.id}, skipping`);
            return;
        }

        const notificationService = require('../notification.service');
        const recipients = await getHuddleRecipients(huddle);

        if (!recipients || recipients.length === 0) {
            console.warn(`No recipients found for 10-minute reminder for huddle ${huddle.id}`);
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const recipient of recipients) {
            try {
                if (!recipient.unifiedUserId) {
                    console.warn(`Skipping recipient with missing unifiedUserId:`, recipient);
                    continue;
                }

                await notificationService.createNotification({
                    recipientId: recipient.unifiedUserId,
                    senderId: huddle.creatorId,
                    type: HUDDLE_NOTIFICATION_TYPES.HUDDLE_REMINDER_10_MIN,
                    title: `Huddle Starting Soon: ${huddle.title}`,
                    message: `"${huddle.title}" starts in 10 minutes! Join now to be ready.`,
                    communityId: huddle.communityId,
                    huddleId: huddle.id,
                    metadata: {
                        scheduledTime: huddle.scheduledTime,
                        roomId: huddle.roomId
                    }
                });
                successCount++;
            } catch (error) {
                errorCount++;
                console.error(`Error sending 10-min reminder to user ${recipient.unifiedUserId}:`, error);
            }
        }

        await updateNotificationStatus(huddle.id, 'reminder10Min', true);
        console.log(`Sent 10-minute reminder for huddle ${huddle.id}: ${successCount} successful, ${errorCount} failed out of ${recipients.length} recipients`);
    } catch (error) {
        console.error('Error sending 10-minute reminder:', error);
        throw error;
    }
}

/**
 * Send notification when huddle starts
 * @param {object} huddle - The huddle object
 */
async function sendHuddleStartedNotification(huddle) {
    try {
        // Check if notification was already sent
        if (wasNotificationSent(huddle, 'started')) {
            console.log(`HUDDLE_STARTED notification already sent for huddle ${huddle.id}, skipping`);
            return;
        }

        const notificationService = require('../notification.service');
        const recipients = await getHuddleRecipients(huddle);

        if (!recipients || recipients.length === 0) {
            console.warn(`No recipients found for started notification for huddle ${huddle.id}`);
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const recipient of recipients) {
            try {
                if (!recipient.unifiedUserId) {
                    console.warn(`Skipping recipient with missing unifiedUserId:`, recipient);
                    continue;
                }

                await notificationService.createNotification({
                    recipientId: recipient.unifiedUserId,
                    senderId: huddle.creatorId,
                    type: HUDDLE_NOTIFICATION_TYPES.HUDDLE_STARTED,
                    title: `Huddle Live Now: ${huddle.title}`,
                    message: `"${huddle.title}" is live! Join now to participate.`,
                    communityId: huddle.communityId,
                    huddleId: huddle.id,
                    metadata: {
                        roomId: huddle.roomId,
                        activities: huddle.selectedActivities
                    }
                });
                successCount++;
            } catch (error) {
                errorCount++;
                console.error(`Error sending started notification to user ${recipient.unifiedUserId}:`, error);
            }
        }

        await updateNotificationStatus(huddle.id, 'started', true);
        console.log(`Sent HUDDLE_STARTED notification for huddle ${huddle.id}: ${successCount} successful, ${errorCount} failed out of ${recipients.length} recipients`);
    } catch (error) {
        console.error('Error sending huddle started notification:', error);
        throw error;
    }
}

/**
 * Send notification when huddle ends
 * @param {object} huddle - The huddle object
 */
async function sendHuddleEndedNotification(huddle) {
    try {
        const notificationService = require('../notification.service');
        
        // Send to attendees
        const attendees = await prisma.huddleAttendance.findMany({
            where: { huddleId: huddle.id },
            select: { userId: true }
        });

        for (const attendee of attendees) {
            try {
                await notificationService.createNotification({
                    recipientId: attendee.userId,
                    senderId: huddle.creatorId,
                    type: HUDDLE_NOTIFICATION_TYPES.HUDDLE_ENDED,
                    title: `Huddle Ended: ${huddle.title}`,
                    message: `"${huddle.title}" has ended. Thank you for participating!`,
                    communityId: huddle.communityId,
                    huddleId: huddle.id,
                    metadata: {
                        duration: calculateDuration(huddle.startTime, huddle.endTime)
                    }
                });
            } catch (error) {
                console.error(`Error sending ended notification to user ${attendee.userId}:`, error);
            }
        }

        await updateNotificationStatus(huddle.id, 'ended', true);
        console.log(`Sent HUDDLE_ENDED notification for huddle ${huddle.id}`);
    } catch (error) {
        console.error('Error sending huddle ended notification:', error);
    }
}

/**
 * Send AI-generated "come back" hook message
 * @param {object} huddle - The huddle object
 * @param {string} hookMessage - The AI-generated hook message
 */
async function sendAIHookNotification(huddle, hookMessage) {
    try {
        const notificationService = require('../notification.service');
        const recipients = await getHuddleRecipients(huddle);

        // Exclude current attendees (they're already in the huddle)
        const currentAttendees = await prisma.huddleAttendance.findMany({
            where: {
                huddleId: huddle.id,
                leftAt: null
            },
            select: { userId: true }
        });
        const attendeeIds = new Set(currentAttendees.map(a => a.userId));

        const nonAttendees = recipients.filter(r => !attendeeIds.has(r.unifiedUserId));

        for (const recipient of nonAttendees) {
            try {
                await notificationService.createNotification({
                    recipientId: recipient.unifiedUserId,
                    senderId: huddle.creatorId,
                    type: HUDDLE_NOTIFICATION_TYPES.HUDDLE_AI_HOOK,
                    title: `Join the Huddle: ${huddle.title}`,
                    message: hookMessage || `Something exciting is happening in "${huddle.title}"! Join now!`,
                    communityId: huddle.communityId,
                    huddleId: huddle.id,
                    metadata: {
                        roomId: huddle.roomId,
                        isAIGenerated: true
                    }
                });
            } catch (error) {
                console.error(`Error sending AI hook to user ${recipient.unifiedUserId}:`, error);
            }
        }

        // Update huddle with the AI hook message
        await prisma.huddle.update({
            where: { id: huddle.id },
            data: { aiHook: hookMessage }
        });

        console.log(`Sent AI hook notification for huddle ${huddle.id} to ${nonAttendees.length} non-attendees`);
    } catch (error) {
        console.error('Error sending AI hook notification:', error);
    }
}

/**
 * Send notification when a user joins the huddle
 * @param {object} huddle - The huddle object
 * @param {number} userId - The user ID who joined
 */
async function sendUserJoinedNotification(huddle, userId) {
    try {
        const notificationService = require('../notification.service');

        // Only notify the huddle leader/creator
        if (huddle.leaderId && huddle.leaderId !== userId) {
            await notificationService.createNotification({
                recipientId: huddle.leaderId,
                senderId: userId,
                type: HUDDLE_NOTIFICATION_TYPES.HUDDLE_USER_JOINED,
                title: 'User Joined Huddle',
                message: `A user has joined "${huddle.title}"`,
                communityId: huddle.communityId,
                huddleId: huddle.id,
                metadata: {
                    userJoined: userId
                }
            });
        }
    } catch (error) {
        console.error('Error sending user joined notification:', error);
    }
}

/**
 * Send notification when a user leaves the huddle
 * @param {object} huddle - The huddle object
 * @param {number} userId - The user ID who left
 */
async function sendUserLeftNotification(huddle, userId) {
    try {
        const notificationService = require('../notification.service');

        // Only notify the huddle leader/creator
        if (huddle.leaderId && huddle.leaderId !== userId) {
            await notificationService.createNotification({
                recipientId: huddle.leaderId,
                senderId: userId,
                type: HUDDLE_NOTIFICATION_TYPES.HUDDLE_USER_LEFT,
                title: 'User Left Huddle',
                message: `A user has left "${huddle.title}"`,
                communityId: huddle.communityId,
                huddleId: huddle.id,
                metadata: {
                    userLeft: userId
                }
            });
        }
    } catch (error) {
        console.error('Error sending user left notification:', error);
    }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get huddle recipients based on audience type
 * @param {object} huddle - The huddle object
 * @returns {array} - Array of recipient objects with unifiedUserId
 */
async function getHuddleRecipients(huddle) {
    if (huddle.audienceType === 'SELECTED_MEMBERS' && huddle.selectedMemberIds?.length > 0) {
        // Validate that selected member IDs exist in unifiedUser table
        const validUsers = await prisma.unifiedUser.findMany({
            where: {
                id: { in: huddle.selectedMemberIds }
            },
            select: { id: true }
        });
        
        // Return only valid user IDs
        return validUsers.map(user => ({ unifiedUserId: user.id }));
    }

    // Send to all community members (including lifetime subscriptions where expiresAt is null)
    const subscriptions = await prisma.subscription.findMany({
        where: {
            communityId: parseInt(huddle.communityId),
            OR: [
                { expiresAt: { gt: new Date() } },
                { expiresAt: null }
            ]
        },
        select: {
            unifiedUserId: true
        }
    });

    console.log(`Found ${subscriptions.length} community members for huddle ${huddle.id} in community ${huddle.communityId} (audience: ${huddle.audienceType})`);
    
    if (subscriptions.length === 0) {
        console.warn(`⚠ No active subscriptions found for community ${huddle.communityId}. This might indicate:`);
        console.warn(`  1. Community has no members`);
        console.warn(`  2. All subscriptions have expired`);
        console.warn(`  3. Community ID is incorrect`);
    }
    
    return subscriptions;
}

/**
 * Update notification sent status for a huddle
 * @param {number} huddleId - The huddle ID
 * @param {string} notificationType - The type of notification
 * @param {boolean} sent - Whether it was sent
 */
async function updateNotificationStatus(huddleId, notificationType, sent) {
    try {
        const huddle = await prisma.huddle.findUnique({
            where: { id: huddleId },
            select: { notificationSent: true }
        });

        const currentStatus = huddle?.notificationSent || {};
        currentStatus[notificationType] = {
            sent,
            sentAt: new Date().toISOString()
        };

        await prisma.huddle.update({
            where: { id: huddleId },
            data: { notificationSent: currentStatus }
        });
    } catch (error) {
        console.error('Error updating notification status:', error);
    }
}

/**
 * Check if a notification type has been sent for a huddle
 * @param {object} huddle - The huddle object
 * @param {string} notificationType - The type of notification
 * @returns {boolean} - Whether the notification was sent
 */
function wasNotificationSent(huddle, notificationType) {
    const status = huddle.notificationSent || {};
    return status[notificationType]?.sent === true;
}

/**
 * Format date and time for display
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDateTime(date) {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Format time for display
 * @param {Date} date - The date to format
 * @returns {string} - Formatted time string
 */
function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Calculate duration in minutes
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @returns {number} - Duration in minutes
 */
function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    return Math.round((new Date(endTime) - new Date(startTime)) / 60000);
}

module.exports = {
    HUDDLE_NOTIFICATION_TYPES,
    sendHuddleCreatedNotification,
    sendHuddleReminder1Day,
    sendHuddleReminder2Hours,
    sendHuddleReminder10Min,
    sendHuddleStartedNotification,
    sendHuddleEndedNotification,
    sendAIHookNotification,
    sendUserJoinedNotification,
    sendUserLeftNotification,
    getHuddleRecipients,
    wasNotificationSent,
    formatDateTime,
    formatTime
};
