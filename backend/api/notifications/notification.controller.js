const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NotificationController {
  // Get notifications for a user
  async getNotifications(req, res) {
    try {
      const { userId, limit = 10, page = 1 } = req.query;
      
      // If no userId is provided, return empty response instead of error
      if (!userId) {
        return res.status(200).json({ 
          notifications: [], 
          total: 0,
          message: 'No user ID provided'
        });
      }
      
      const userIdInt = parseInt(userId);

      if (isNaN(userIdInt)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const limitInt = parseInt(limit);
      const pageInt = parseInt(page);
      const skip = (pageInt - 1) * limitInt;

      const notifications = await prisma.notification.findMany({
        where: {
          recipientId: userIdInt
        },
        skip: skip,
        take: limitInt,
        include: {
          unifiedUser_Notification_senderIdTounifiedUser: {
            select: {
              id: true,
              email: true,
              user: {
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
              },
              expert: {
                select: {
                  name: true,
                  photoURL: true
                }
              },
              admin: {
                select: {
                  name: true,
                  photoURL: true
                }
              }
            }
          },
          Message: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Get total count for pagination
      const total = await prisma.notification.count({
        where: {
          recipientId: userIdInt
        }
      });

      res.status(200).json({
        notifications,
        count: notifications.length,
        total,
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil(total / limitInt),
        unreadCount: notifications.filter(n => !n.isRead).length
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const { userId } = req.query;
      const notificationIdInt = parseInt(notificationId);
      const userIdInt = parseInt(userId);

      if (isNaN(notificationIdInt) || isNaN(userIdInt)) {
        return res.status(400).json({ message: 'Invalid notification ID or user ID' });
      }

      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationIdInt,
          recipientId: userIdInt
        }
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      const updatedNotification = await prisma.notification.update({
        where: { id: notificationIdInt },
        data: { isRead: true }
      });

      res.status(200).json({
        message: 'Notification marked as read',
        notification: updatedNotification
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      const { userId } = req.query;
      const userIdInt = parseInt(userId);

      if (isNaN(userIdInt)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      await prisma.notification.updateMany({
        where: {
          recipientId: userIdInt,
          isRead: false
        },
        data: { isRead: true }
      });

      res.status(200).json({
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const { userId } = req.query;
      const notificationIdInt = parseInt(notificationId);
      const userIdInt = parseInt(userId);

      if (isNaN(notificationIdInt) || isNaN(userIdInt)) {
        return res.status(400).json({ message: 'Invalid notification ID or user ID' });
      }

      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationIdInt,
          recipientId: userIdInt
        }
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      await prisma.notification.delete({
        where: { id: notificationIdInt }
      });

      res.status(200).json({
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Archive notification
  async archiveNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const { userId } = req.query;
      const notificationIdInt = parseInt(notificationId);
      const userIdInt = parseInt(userId);

      if (isNaN(notificationIdInt) || isNaN(userIdInt)) {
        return res.status(400).json({ message: 'Invalid notification ID or user ID' });
      }

      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationIdInt,
          recipientId: userIdInt
        }
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      const updatedNotification = await prisma.notification.update({
        where: { id: notificationIdInt },
        data: { status: 'ARCHIVED' }
      });

      res.status(200).json({
        message: 'Notification archived successfully',
        notification: updatedNotification
      });
    } catch (error) {
      console.error('Archive notification error:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Create notification (static method for use by other services)
  static async createNotification(data) {
    try {
      const notification = await prisma.notification.create({
        data: {
          recipientId: data.recipientId,
          senderId: data.senderId,
          type: data.type,
          title: data.title,
          message: data.message,
          communityId: data.communityId,
          sessionId: data.sessionId,
          postId: data.postId,
          blogId: data.blogId,
          eventId: data.eventId,
          competitionId: data.competitionId,
          messageId: data.messageId,
          connectionId: data.connectionId,
          formId: data.formId,
          courseId: data.courseId,
          resourceId: data.resourceId,
          metadata: data.metadata
        }
      });
      return notification;
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }

  // Get community notifications
  async getCommunityNotifications(req, res) {
    try {
      const { communityId } = req.params;
      const communityIdInt = parseInt(communityId);

      if (isNaN(communityIdInt)) {
        return res.status(400).json({ message: 'Invalid community ID' });
      }

      const notifications = await prisma.notification.findMany({
        where: {
          communityId: communityIdInt
        },
        include: {
          unifiedUser_Notification_senderIdTounifiedUser: {
            select: {
              id: true,
              email: true,
              user: {
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
              },
              expert: {
                select: {
                  name: true,
                  photoURL: true
                }
              },
              admin: {
                select: {
                  name: true,
                  photoURL: true
                }
              }
            }
          },
          Message: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Transform notifications to map relation names for backward compatibility
      const transformedNotifications = notifications.map(n => ({
        ...n,
        sender: n.unifiedUser_Notification_senderIdTounifiedUser || null,
        messageRef: n.Message || null
      }));

      res.status(200).json({
        notifications: transformedNotifications,
        count: transformedNotifications.length
      });
    } catch (error) {
      console.error('Get community notifications error:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Create test notification
  async createTestNotification(req, res) {
    try {
      const { recipientId, senderId, type, title, message } = req.body;

      const notification = await prisma.notification.create({
        data: {
          recipientId: parseInt(recipientId),
          senderId: senderId ? parseInt(senderId) : null,
          type,
          title,
          message
        }
      });

      res.status(201).json({
        message: 'Test notification created successfully',
        notification
      });
    } catch (error) {
      console.error('Create test notification error:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = { NotificationController }; 