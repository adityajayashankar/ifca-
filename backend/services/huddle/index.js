/**
 * Huddle Services Index
 * 
 * Export all huddle-related services for easy importing
 */

const huddleService = require('./huddle.service');
const huddleNotificationService = require('./huddle-notification.service');
const huddleEngagementService = require('./huddle-engagement.service');
const huddleScheduler = require('./huddle-scheduler');

module.exports = {
    huddleService,
    huddleNotificationService,
    huddleEngagementService,
    huddleScheduler
};
