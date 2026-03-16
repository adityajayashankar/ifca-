const emailService = require('./email.service')
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NotificationService {
  async createNotification({
    recipientId,
    senderId,
    type,
    title,
    message,
    metadata = {},
    shouldEmail = false,
    emailTemplate = null,
    actionUrl = null,
    // Optional relation IDs
    communityId = null,
    sessionId = null,
    postId = null,
    blogId = null,
    eventId = null,
    competitionId = null,
    messageId = null,
    connectionId = null,
    formId = null,
    courseId = null,
    resourceId = null,
    huddleId = null,
  }) {
    try {
      // Ensure all IDs are integers
      const parsedRecipientId = parseInt(recipientId);
      const parsedHuddleId = huddleId ? parseInt(huddleId) : null;

      // Check for duplicate huddle notifications (prevent duplicates within 5 minutes)
      if (parsedHuddleId && this.isHuddleNotificationType(type)) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const existingNotification = await prisma.notification.findFirst({
          where: {
            recipientId: parsedRecipientId,
            type,
            huddleId: parsedHuddleId,
            createdAt: {
              gte: fiveMinutesAgo
            }
          }
        });

        if (existingNotification) {
          console.log(`Duplicate notification prevented: ${type} for huddle ${parsedHuddleId} to user ${parsedRecipientId} (existing notification created at ${existingNotification.createdAt})`);
          return existingNotification;
        }
      }

      const data = {
        recipientId: parsedRecipientId,
        type,
        title,
        message,
        metadata,
        ...(senderId && { senderId: parseInt(senderId) }),
        ...(communityId && { communityId: parseInt(communityId) }),
        ...(sessionId && { sessionId: parseInt(sessionId) }),
        ...(postId && { postId: parseInt(postId) }),
        ...(blogId && { blogId }),
        ...(eventId && { eventId: parseInt(eventId) }),
        ...(competitionId && { competitionId: parseInt(competitionId) }),
        ...(messageId && { messageId: parseInt(messageId) }),
        ...(connectionId && { connectionId: parseInt(connectionId) }),
        ...(formId && { formId: parseInt(formId) }),
        ...(courseId && { courseId: parseInt(courseId) }),
        ...(resourceId && { resourceId: parseInt(resourceId) }),
        ...(parsedHuddleId && { huddleId: parsedHuddleId }),
      };

      // Create the notification
      const notification = await prisma.notification.create({
        data,
        include: {
          unifiedUser_Notification_recipientIdTounifiedUser: {
            include: {
              user: true
            }
          },
        },
      });

      // Get recipient data from the relation
      const recipient = notification.unifiedUser_Notification_recipientIdTounifiedUser;

      console.log("notification=======",notification)

      // Send email if requested
      if (shouldEmail && recipient?.email) {
        await this.sendNotificationEmail({
          to: recipient.email,
          subject: title,
          text: message,
          template: emailTemplate,
          context: {
            recipientName: recipient.user?.name || recipient.email,
            ...notification,
            ...(notification.metadata || {}), // FLATTEN metadata
            actionUrl
          },
          actionUrl
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Check if a notification type is a huddle-related notification
   * @param {string} type - Notification type
   * @returns {boolean}
   */
  isHuddleNotificationType(type) {
    const huddleTypes = [
      'HUDDLE_CREATED',
      'HUDDLE_REMINDER_1_DAY',
      'HUDDLE_REMINDER_2_HOURS',
      'HUDDLE_REMINDER_10_MIN',
      'HUDDLE_STARTED',
      'HUDDLE_ENDED',
      'HUDDLE_AI_HOOK',
      'HUDDLE_USER_JOINED',
      'HUDDLE_USER_LEFT'
    ];
    return huddleTypes.includes(type);
  }

  async createSessionRegistrationNotification({
    recipientId,
    senderId,
    sessionId,
    sessionName,
    sessionImage,
    slots,
    roomId
  }) {
    const baseUrl = process.env.FRONTEND_URL || 'https://pvl.ifcaindia.com';
    const joinLink = roomId ? `${baseUrl}/room/${roomId}` : null;
    // Set actionUrl to classDetails page for proper navigation
    const actionUrl = `${baseUrl}/classDetails/${sessionId}`;
    const sessionPageLink = `${baseUrl}/home`;


    const metadata = {
      sessionId: parseInt(sessionId),
      sessionName,
      sessionImage,
      slots: slots,
      actionUrl,
      ...(joinLink && { joinLink }),
      sessionPageLink
    };

    return this.createNotification({
      recipientId: parseInt(recipientId),
      senderId: senderId ? parseInt(senderId) : undefined,
      type: 'SESSION_REGISTRATION',
      title: 'Session Registration Confirmed',
      message: `You have successfully registered for ${sessionName}`,
      metadata,
      shouldEmail: true,
      emailTemplate: 'session-registration',
      actionUrl: actionUrl,
      sessionId: parseInt(sessionId)
    });
  }

  /**
   * Create a notification for post/comment archive/delete
   * @param {Object} params
   * @param {number} params.recipientId - ID of the post/comment creator
   * @param {number} params.senderId - ID of the admin who performed the action
   * @param {string} params.action - 'archive' or 'delete'
   * @param {number} params.postId - ID of the post/comment
   * @param {number} params.communityId - ID of the community
   * @param {string} params.modifierName - Name of the admin who performed the action
   * @param {string} params.postTitle - Title of the post (optional)
   * @param {boolean} params.isComment - Whether this is a comment (default: false)
   */
  static async createPostActionNotification({
    recipientId,
    senderId,
    action,
    postId,
    communityId,
    modifierName,
    postTitle,
    isComment = false
  }) {
    try {
      let notificationType;
      let actionText;
      let title;
      let message;
      
      if (isComment) {
        notificationType = action === 'archive' ? 'COMMENT_ARCHIVED' : 'COMMENT_DELETED';
        actionText = action === 'archive' ? 'archived' : 'deleted';
        title = `Comment ${actionText}`;
        message = `Your comment has been ${actionText} by ${modifierName}.`;
      } else {
        notificationType = action === 'archive' ? 'POST_ARCHIVED' : 'POST_DELETED';
        actionText = action === 'archive' ? 'archived' : 'deleted';
        title = `Post ${actionText}`;
        message = postTitle 
          ? `Your post "${postTitle}" has been ${actionText} by ${modifierName}.`
          : `Your post has been ${actionText} by ${modifierName}.`;
      }

      const notification = await prisma.notification.create({
        data: {
          recipientId,
          senderId,
          type: notificationType,
          title,
          message,
          postId,
          communityId,
          status: 'UNREAD',
          isRead: false,
          metadata: {
            action,
            modifierName,
            postTitle,
            isComment
          }
        }
      });

      console.log(`📧 Notification created for ${isComment ? 'comment' : 'post'} ${action}:`, {
        recipientId,
        senderId,
        postId,
        notificationId: notification.id
      });

      return notification;
    } catch (error) {
      console.error('❌ Error creating post action notification:', error);
      throw error;
    }
  }

  /**
   * Get modifier name from user object
   * @param {Object} user - User object from req.user
   * @returns {string} - Modifier name
   */
  static getModifierName(user) {
    if (!user) return 'Admin';
    
    // Check different user types and return the name
    if (user.userType === 'admin' && user.unifiedUser?.admin?.name) {
      return user.unifiedUser.admin.name;
    }
    if (user.userType === 'partner' && user.unifiedUser?.partner?.name) {
      return user.unifiedUser.partner.name;
    }
    if (user.userType === 'expert' && user.unifiedUser?.expert?.name) {
      return user.unifiedUser.expert.name;
    }
    if (user.userType === 'user' && user.unifiedUser?.user?.name) {
      return user.unifiedUser.user.name;
    }
    
    return 'Admin'; // Fallback
  }
  
  async sendNotificationEmail(emailData) {
    try {
      if (!emailData || !emailData.to) {
        console.error('Invalid email data:', emailData);
        return;
      }

      const mailData = {
        to: emailData.to,
        subject: emailData.subject || 'Notification',
        text: emailData.text || '',
        template: emailData.template || 'base',
        context: {
          ...emailData.context,
          actionUrl: emailData.actionUrl
        }
      };

      await emailService.sendNotificationEmail(mailData);
    } catch (error) {
      console.error('Error sending notification email:', error);
      // Don't throw error to prevent notification creation failure
    }
  }

  async getUserNotifications(userId, {
    status = null,
    type = null,
    page = 1,
    limit = 10,
    includeRelations = false,
  }) {
    const skip = (page - 1) * limit
    const where = { recipientId: userId }

    if (status) {
      if (status === 'UNREAD') {
        where.isRead = false
      } else if (status === 'READ') {
        where.isRead = true
      } else {
        where.status = status
      }
    }
    if (type) {
      where.type = type
    }

    const include = includeRelations ? {
      community: true,
      session: true,
      post: true,
      sender: true,
      blog: true,
      event: true,
      competition: true,
      messageRef: true,
      connection: true,
      form: true,
      course: true,
    } : {}

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ])

    // Transform notifications to map relation names for backward compatibility
    const transformedNotifications = notifications.map(n => ({
      ...n,
      sender: n.unifiedUser_Notification_senderIdTounifiedUser || null,
      messageRef: n.Message || null
    }));

    return {
      notifications: transformedNotifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async markAsRead(notificationId, userId) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientId: userId,
      },
      data: {
        status: 'READ',
        isRead: true,
      },
    })
  }

  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: {
        recipientId: userId,
        status: 'UNREAD',
      },
      data: {
        status: 'READ',
        isRead: true,
      },
    })
  }

  async deleteNotification(notificationId, userId) {
    return prisma.notification.deleteMany({
      where: {
        id: notificationId,
        recipientId: userId,
      },
    })
  }

  async archiveNotification(notificationId, userId) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientId: userId,
      },
      data: {
        status: 'ARCHIVED',
      },
    })
  }

  async getCommunityNotifications(communityId, {
    status = null,
    type = null,
    page = 1,
    limit = 10,
    includeRelations = false,
  }) {
    // Ensure page and limit are positive integers
    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const skip = (page - 1) * limit;
    const where = { communityId: parseInt(communityId) };
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    const include = includeRelations ? {
      community: true,
      session: true,
      post: true,
      sender: true,
      blog: true,
      event: true,
      competition: true,
      messageRef: true,
      connection: true,
      form: true,
      course: true,
    } : {};
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);
    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new NotificationService() 