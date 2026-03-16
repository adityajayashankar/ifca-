const express = require('express');
const { NotificationController } = require('./notification.controller');
const { authenticateToken } = require('../../middleware/authenticateToken');

const router = express.Router();
const notificationController = new NotificationController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get notifications for a user
router.get('/', notificationController.getNotifications.bind(notificationController));

// Mark notification as read
router.patch('/:notificationId/read', notificationController.markAsRead.bind(notificationController));

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead.bind(notificationController));

// Delete notification
router.delete('/:notificationId', notificationController.deleteNotification.bind(notificationController));

// Archive notification
router.patch('/:notificationId/archive', notificationController.archiveNotification.bind(notificationController));

// Get community notifications
router.get('/community/:communityId', notificationController.getCommunityNotifications.bind(notificationController));

// Create test notification
router.post('/test', notificationController.createTestNotification.bind(notificationController));

module.exports = router; 