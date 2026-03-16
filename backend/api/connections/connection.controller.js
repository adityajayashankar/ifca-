const { NotificationController } = require('../notifications/notification.controller');
const prisma = require('../../prisma/middleware');

// Send connection request (mutual connection system)
exports.sendConnectionRequest = async (req, res) => {
  try {
    const { receiverId, senderId: bodySenderId, message } = req.body;
    const senderId = req.user.unifiedUserId;

    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId is required' });
    }

    const senderIdInt = parseInt(senderId);
    const receiverIdInt = parseInt(receiverId);

    if (isNaN(senderIdInt) || isNaN(receiverIdInt)) {
      return res.status(400).json({ message: 'Invalid receiverId' });
    }

    if (senderIdInt === receiverIdInt) {
      return res.status(400).json({ message: 'Cannot send connection request to yourself' });
    }

    console.log('🔍 Checking for existing connections between:', senderIdInt, 'and', receiverIdInt);

    // Check for existing connections in both directions
    const [existingOutgoingConnection, existingIncomingConnection] = await Promise.all([
      prisma.connection.findFirst({
      where: {
        senderId: senderIdInt,
        receiverId: receiverIdInt
      }
      }),
      prisma.connection.findFirst({
        where: {
          senderId: receiverIdInt,
          receiverId: senderIdInt
        }
      })
    ]);


    // If there's already a connection in this direction, check the status
    if (existingOutgoingConnection) {
      if (existingOutgoingConnection.status === 'pending') {
        return res.status(400).json({ 
          message: 'Connection request already sent',
          connectionId: existingOutgoingConnection.id
        });
      } else if (existingOutgoingConnection.status === 'accepted') {
        // Check if there's also an accepted connection in the other direction
        if (existingIncomingConnection && existingIncomingConnection.status === 'accepted') {
          return res.status(200).json({
            message: 'Already have mutual connection',
            connection: existingOutgoingConnection,
            isMutual: true,
            existingConnectionId: existingIncomingConnection.id
          });
        } else {
          return res.status(400).json({ 
            message: 'Already connected in this direction',
            connectionId: existingOutgoingConnection.id
          });
        }
      }
    }

    // If there's already a connection in the opposite direction, check if we can create mutual connection
    if (existingIncomingConnection) {
      if (existingIncomingConnection.status === 'pending') {
        // Both users have sent requests to each other - create mutual connection
        const mutualConnection = await prisma.connection.create({
      data: {
        senderId: senderIdInt,
        receiverId: receiverIdInt,
            status: 'accepted', // Automatically accepted since both sent requests
            message: message || null
          }
        });

        // Update the existing incoming connection to accepted as well
        await prisma.connection.update({
          where: { id: existingIncomingConnection.id },
          data: { status: 'accepted' }
        });

        // Create notifications for both users
        try {
          const sender = await prisma.unifiedUser.findUnique({
            where: { id: senderIdInt },
            include: {
              user: true,
              partner: true,
              expert: true,
              admin: true
      }
    });

          const receiver = await prisma.unifiedUser.findUnique({
            where: { id: receiverIdInt },
            include: {
              user: true,
              partner: true,
              expert: true,
              admin: true
            }
          });

          const senderName = sender?.user?.name || sender?.partner?.name || sender?.expert?.name || sender?.admin?.name || 'Someone';
          const receiverName = receiver?.user?.name || receiver?.partner?.name || receiver?.expert?.name || receiver?.admin?.name || 'Someone';

          // Notify both users about the mutual connection
          await Promise.all([
            NotificationController.createNotification({
              recipientId: receiverIdInt,
              senderId: senderIdInt,
              type: 'CONNECTION_ACCEPTED',
              title: 'Mutual Connection Established',
              message: `You and ${senderName} are now connected!`,
              connectionId: mutualConnection.id,
              actionUrl: `/user/${senderIdInt}`
            }),
            NotificationController.createNotification({
              recipientId: senderIdInt,
              senderId: receiverIdInt,
              type: 'CONNECTION_ACCEPTED',
              title: 'Mutual Connection Established',
              message: `You and ${receiverName} are now connected!`,
              connectionId: mutualConnection.id,
              actionUrl: `/user/${receiverIdInt}`
            })
          ]);
        } catch (notificationError) {
          console.error('Error creating notifications:', notificationError);
        }

        return res.status(201).json({
          message: 'Mutual connection established successfully',
          connection: mutualConnection,
          isMutual: true,
          existingConnectionId: existingIncomingConnection.id
        });
      } else if (existingIncomingConnection.status === 'accepted') {
        // The other user has already accepted a connection, but we can still send a request
        // This creates a mutual connection where both directions are accepted
        console.log('🔄 Creating mutual connection - one direction already accepted');
        
        const newConnection = await prisma.connection.create({
          data: {
            senderId: senderIdInt,
            receiverId: receiverIdInt,
            status: 'accepted', // Automatically accepted since other direction is accepted
            message: message || null
          }
        });

        // Create notification for the receiver
        try {
          const sender = await prisma.unifiedUser.findUnique({
            where: { id: senderIdInt },
            include: {
              user: true,
              partner: true,
              expert: true,
              admin: true
            }
          });

          const senderName = sender?.user?.name || sender?.partner?.name || sender?.expert?.name || sender?.admin?.name || 'Someone';

          await NotificationController.createNotification({
            recipientId: receiverIdInt,
            senderId: senderIdInt,
            type: 'CONNECTION_ACCEPTED',
            title: 'Mutual Connection Established',
            message: `${senderName} has also connected with you!`,
            connectionId: newConnection.id,
            actionUrl: `/user/${senderIdInt}`
          });
        } catch (notificationError) {
          console.error('Error creating notification:', notificationError);
        }

        return res.status(201).json({
          message: 'Mutual connection established successfully',
          connection: newConnection,
          isMutual: true,
          existingConnectionId: existingIncomingConnection.id
        });
      }
    }

    console.log('📤 Creating new connection request from', senderIdInt, 'to', receiverIdInt);
    // Create the initial connection request (status: 'pending')
    const connectionRequest = await prisma.connection.create({
      data: {
        senderId: senderIdInt,
        receiverId: receiverIdInt,
        status: 'pending',
        message: message || null
      }
    });

    // Create notification for the receiver
    try {
      const sender = await prisma.unifiedUser.findUnique({
        where: { id: senderIdInt },
        include: {
          user: true,
          partner: true,
          expert: true,
          admin: true
        }
      });

      const senderName = sender?.user?.name || sender?.partner?.name || sender?.expert?.name || sender?.admin?.name || 'Someone';

      await NotificationController.createNotification({
        recipientId: receiverIdInt,
        senderId: senderIdInt,
        type: 'CONNECTION_REQUEST',
        title: 'New Connection Request',
        message: `${senderName} sent you a connection request`,
        connectionId: connectionRequest.id,
        actionUrl: `/user/${senderIdInt}`
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the connection request if notification fails
    }

    res.status(201).json({
      message: 'Connection request sent successfully',
      connectionRequest,
      isMutual: false
    });
  } catch (error) {
    console.error('Connection request error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('senderId') && error.meta?.target?.includes('receiverId')) {
      return res.status(400).json({
        message: 'Connection request already sent',
        error: 'DUPLICATE_CONNECTION_REQUEST'
      });
    }
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Accept a connection request (bidirectional support)
exports.acceptConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user.unifiedUserId;
    const userIdInt = parseInt(userId);
    const connectionIdInt = parseInt(connectionId);

    if (isNaN(connectionIdInt)) {
      return res.status(400).json({ message: 'Invalid connection ID' });
    }

    // First, let's check if the connection exists at all
    const connectionExists = await prisma.connection.findUnique({
      where: { id: connectionIdInt }
    });

    if (!connectionExists) {
      return res.status(404).json({ 
        message: 'Connection request not found',
        connectionId: connectionIdInt,
        userId: userIdInt
      });
    }

    console.log('Debug - Connection found:', {
      id: connectionExists.id,
      senderId: connectionExists.senderId,
      receiverId: connectionExists.receiverId,
      status: connectionExists.status,
      currentUserId: userIdInt
    });

    // Find the connection request (can be either incoming or outgoing)
    const connection = await prisma.connection.findFirst({
      where: {
        id: connectionIdInt,
        OR: [
          { receiverId: userIdInt, status: 'pending' }, // Incoming request
          { senderId: userIdInt, status: 'pending' }     // Outgoing request
        ]
      }
    });

    if (!connection) {
      return res.status(404).json({ 
        message: 'Connection request not found or you are not authorized to accept it',
        connectionId: connectionIdInt,
        userId: userIdInt,
        connectionStatus: connectionExists.status,
        isReceiver: connectionExists.receiverId === userIdInt,
        isSender: connectionExists.senderId === userIdInt
      });
    }

    // Update the connection status to 'accepted'
    const updatedConnection = await prisma.connection.update({
      where: { id: connectionIdInt },
      data: { status: 'accepted' }
    });

    // Create notification for the other user
    try {
      const currentUser = await prisma.unifiedUser.findUnique({
        where: { id: userIdInt },
        include: {
          user: true,
          partner: true,
          expert: true,
          admin: true
        }
      });

      const currentUserName = currentUser?.user?.name || currentUser?.partner?.name || currentUser?.expert?.name || currentUser?.admin?.name || 'Someone';

      // Determine who to send the notification to
      const notificationRecipientId = connection.senderId === userIdInt ? connection.receiverId : connection.senderId;

      await NotificationController.createNotification({
        recipientId: notificationRecipientId,
        senderId: userIdInt,
        type: 'CONNECTION_ACCEPTED',
        title: 'Connection Accepted',
        message: `${currentUserName} accepted your connection request`,
        connectionId: connectionIdInt,
        actionUrl: `/user/${userIdInt}`
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the connection acceptance if notification fails
    }

    res.status(200).json({
      message: 'Connection request accepted successfully',
      connection: updatedConnection
    });
  } catch (error) {
    console.error('Accept connection error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Reject a connection request (bidirectional support)
exports.rejectConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user.unifiedUserId;
    const userIdInt = parseInt(userId);
    const connectionIdInt = parseInt(connectionId);

    if (isNaN(connectionIdInt)) {
      return res.status(400).json({ message: 'Invalid connection ID' });
    }

    // Find the connection request (can be either incoming or outgoing)
    const connection = await prisma.connection.findFirst({
      where: {
        id: connectionIdInt,
        OR: [
          { receiverId: userIdInt, status: 'pending' }, // Incoming request
          { senderId: userIdInt, status: 'pending' }     // Outgoing request
        ]
      }
    });

    if (!connection) {
      return res.status(404).json({ 
        message: 'Connection request not found or you are not authorized to reject it',
        connectionId: connectionIdInt,
        userId: userIdInt
      });
    }

    // Delete the connection request
    await prisma.connection.delete({
      where: { id: connectionIdInt }
    });

    res.status(200).json({
      message: 'Connection request rejected successfully',
      connectionId: connectionIdInt
    });
  } catch (error) {
    console.error('Reject connection error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get pending connection requests (comprehensive fix)
exports.getPendingRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);


    if (isNaN(userIdInt)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Verify user exists
    const user = await prisma.unifiedUser.findUnique({
      where: { id: userIdInt },
      select: { id: true, email: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all connections for this user to understand the full picture
    const allUserConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: userIdInt },
          { receiverId: userIdInt }
        ]
      },
      include: {
        unifiedUser_Connection_senderIdTounifiedUser: {
          select: {
            id: true,
            email: true,
            user: {
              select: {
                name: true,
                photoURL: true,
                currentPosition: true
              }
            },
            partner: {
              select: {
                name: true,
                photoURL: true,
                desc: true
              }
            },
            expert: {
              select: {
                name: true,
                photoURL: true,
                desc: true
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
        unifiedUser_Connection_receiverIdTounifiedUser: {
          select: {
            id: true,
            email: true,
            user: {
              select: {
                name: true,
                photoURL: true,
                currentPosition: true
              }
            },
            partner: {
              select: {
                name: true,
                photoURL: true,
                desc: true
              }
            },
            expert: {
              select: {
                name: true,
                photoURL: true,
                desc: true
              }
            },
            admin: {
              select: {
                name: true,
                photoURL: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Separate connections by type and status
    const pendingIncoming = [];
    const pendingOutgoing = [];
    const acceptedConnections = [];
    const otherConnections = [];

    allUserConnections.forEach(conn => {
      const isOutgoing = conn.senderId === userIdInt;
      const sender = conn.unifiedUser_Connection_senderIdTounifiedUser;
      const receiver = conn.unifiedUser_Connection_receiverIdTounifiedUser;
      const otherUser = isOutgoing ? receiver : sender;
      const otherUserName = otherUser?.user?.name || otherUser?.partner?.name || otherUser?.expert?.name || otherUser?.admin?.name || 'Unknown User';
      const otherUserPhoto = otherUser?.user?.photoURL || otherUser?.partner?.photoURL || otherUser?.expert?.photoURL || otherUser?.admin?.photoURL || '/default-avatar.png';
      const otherUserTitle = otherUser?.user?.currentPosition || otherUser?.partner?.desc || otherUser?.expert?.desc || 'Member';

      const connectionData = {
        id: conn.id,
        status: conn.status,
        message: conn.message,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt,
        sender: sender,
        receiver: receiver,
        otherUser: {
          id: otherUser?.id,
          email: otherUser?.email,
          name: otherUserName,
          photoURL: otherUserPhoto,
          title: otherUserTitle,
          userType: otherUser?.user ? 'user' : otherUser?.partner ? 'partner' : otherUser?.expert ? 'expert' : 'admin'
        },
        isOutgoing: isOutgoing,
        canAccept: !isOutgoing && conn.status === 'pending',
        canReject: conn.status === 'pending',
        canCancel: isOutgoing && conn.status === 'pending'
      };

      if (conn.status === 'pending') {
        if (isOutgoing) {
          pendingOutgoing.push(connectionData);
        } else {
          pendingIncoming.push(connectionData);
        }
      } else if (conn.status === 'accepted') {
        acceptedConnections.push(connectionData);
      } else {
        otherConnections.push(connectionData);
      }
    });


    // Format response for frontend
    const response = {
      success: true,
      userId: userIdInt,
      userEmail: user.email,
      pendingRequests: {
        incoming: pendingIncoming.map(req => ({
          id: req.id,
          status: req.status,
          message: req.message,
          createdAt: req.createdAt,
          updatedAt: req.updatedAt,
          sender: req.otherUser,
          type: 'incoming',
          canAccept: req.canAccept,
          canReject: req.canReject,
          canCancel: req.canCancel
        })),
        outgoing: pendingOutgoing.map(req => ({
          id: req.id,
          status: req.status,
          message: req.message,
          createdAt: req.createdAt,
          updatedAt: req.updatedAt,
          receiver: req.otherUser,
          type: 'outgoing',
          canAccept: req.canAccept,
          canReject: req.canReject,
          canCancel: req.canCancel
        }))
      },
      counts: {
        total: pendingIncoming.length + pendingOutgoing.length,
        incoming: pendingIncoming.length,
        outgoing: pendingOutgoing.length,
        accepted: acceptedConnections.length
      },
      summary: {
        hasIncomingRequests: pendingIncoming.length > 0,
        hasOutgoingRequests: pendingOutgoing.length > 0,
        hasAnyPendingRequests: (pendingIncoming.length + pendingOutgoing.length) > 0
      }
    };


    res.status(200).json(response);
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get user connections with privacy check (bidirectional support)
exports.getUserConnections = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user?.unifiedUserId;
    const userIdInt = parseInt(userId);

    if (isNaN(userIdInt)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Get user privacy settings first
    const user = await prisma.unifiedUser.findUnique({
      where: { id: userIdInt }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if viewer has permission to see connections
    let canViewConnections = false;
    if (viewerId === userIdInt) {
      canViewConnections = true; // User can always see their own connections
    } else {
      switch (user.privacyType) {
        case 'all':
          canViewConnections = true;
          break;
        case 'none':
          canViewConnections = false;
          break;
        case 'selected':
          canViewConnections = (user.selectedViewers || []).includes(viewerId);
          break;
        case 'followers':
          canViewConnections = (user.followers || []).includes(viewerId);
          break;
        case 'following':
          canViewConnections = (user.following || []).includes(viewerId);
          break;
      }
    }

    if (!canViewConnections) {
      return res.status(403).json({ message: 'You do not have permission to view this user\'s connections' });
    }

    // Get all accepted connections (bidirectional)
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: userIdInt },
          { receiverId: userIdInt }
        ],
        status: 'accepted'
      },
      include: {
        unifiedUser_Connection_senderIdTounifiedUser: {
          select: {
            id: true,
            email: true,
            privacyType: true,
            user: {
              select: {
                name: true,
                photoURL: true,
                currentPosition: true
              }
            },
            partner: {
              select: {
                name: true,
                photoURL: true,
                desc: true
              }
            },
            expert: {
              select: {
                name: true,
                photoURL: true,
                desc: true
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
        unifiedUser_Connection_receiverIdTounifiedUser: {
          select: {
            id: true,
            email: true,
            privacyType: true,
            user: {
              select: {
                name: true,
                photoURL: true,
                currentPosition: true
              }
            },
            partner: {
              select: {
                name: true,
                photoURL: true,
                desc: true
              }
            },
            expert: {
              select: {
                name: true,
                photoURL: true,
                desc: true
              }
            },
            admin: {
              select: {
                name: true,
                photoURL: true
              }
            }
          }
        }
      }
    });

    // Format connections
    const formattedConnections = connections.map(conn => {
      const isOutgoing = conn.senderId === userIdInt;
      const sender = conn.unifiedUser_Connection_senderIdTounifiedUser;
      const receiver = conn.unifiedUser_Connection_receiverIdTounifiedUser;
      const connectedUser = isOutgoing ? receiver : sender;

      return {
        connectionId: conn.id,
        status: conn.status,
        type: isOutgoing ? 'outgoing' : 'incoming',
        message: conn.message,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt,
        sender: sender,
        receiver: receiver,
        connectedUser
      };
    });

    // Separate by type for easier frontend handling
    const outgoing = formattedConnections.filter(conn => conn.type === 'outgoing');
    const incoming = formattedConnections.filter(conn => conn.type === 'incoming');

    res.status(200).json({
      connections: formattedConnections,
      outgoing,
      incoming,
      total: formattedConnections.length,
      privacySettings: {
        type: user.privacyType,
        canView: canViewConnections
      }
    });
  } catch (error) {
    console.error('Get user connections error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

exports.getSelectedViewers = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    // Get user details including selected viewers
    const user = await prisma.unifiedUser.findUnique({
      where: { id: userIdInt }
    });

    if (!user) {
      return res.status(404).json({ user: [] });
    }

    console.log(user);
    // Fetch connections that are accepted and involve the user
    const connections = await prisma.connection.findMany({
      where: {
        OR: [{ senderId: userIdInt }, { receiverId: userIdInt }],
        status: 'accepted'
      },
      include: {
        unifiedUser_Connection_senderIdTounifiedUser: {
          select: {
            id: true,
            email: true,
            user: {
              select: {
                id: true,
                name: true,
                photoURL: true
              }
            },
            partner: {
              select: {
                id: true,
                name: true,
                photoURL: true
              }
            },
            expert: {
              select: {
                id: true,
                name: true,
                photoURL: true
              }
            },
            admin: {
              select: {
                id: true,
                name: true,
                photoURL: true
              }
            }
          }
        },
        unifiedUser_Connection_receiverIdTounifiedUser: {
          select: {
            id: true,
            email: true,
            user: {
              select: {
                id: true,
                name: true,
                photoURL: true
              }
            },
            partner: {
              select: {
                id: true,
                name: true,
                photoURL: true
              }
            },
            expert: {
              select: {
                id: true,
                name: true,
                photoURL: true
              }
            },
            admin: {
              select: {
                id: true,
                name: true,
                photoURL: true
              }
            }
          }
        }
      }
    });

    // Format connections with selected status
    const formattedConnections = connections.map(conn => {
      const isOutgoing = conn.senderId === userIdInt;
      const sender = conn.unifiedUser_Connection_senderIdTounifiedUser;
      const receiver = conn.unifiedUser_Connection_receiverIdTounifiedUser;
      const connectedUserId = isOutgoing ? conn.receiverId : conn.senderId;
      const connectedUser = isOutgoing ? receiver : sender;
      const isSelected = user.selectedViewers.includes(connectedUserId);
      console.log("connectedUser",connectedUser,isSelected,user.selectedViewers,connectedUserId);

      return {
        ...connectedUser,
        sender: sender,
        receiver: receiver,
        selected: isSelected
      };
    });

    res.status(200).json(formattedConnections);

  } catch (error) {
    console.error('Get selected connections error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};




// Get connection status between two users (mutual connection support)
exports.getConnectionStatus = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const userId1Int = parseInt(userId1);
    const userId2Int = parseInt(userId2);

    if (isNaN(userId1Int) || isNaN(userId2Int)) {
      return res.status(400).json({ message: 'Invalid user IDs' });
    }

    // Check connection from user1 to user2
    const outgoingConnection = await prisma.connection.findFirst({
      where: {
        senderId: userId1Int,
        receiverId: userId2Int
      }
    });

    // Check connection from user2 to user1
    const incomingConnection = await prisma.connection.findFirst({
      where: {
        senderId: userId2Int,
        receiverId: userId1Int
      }
    });

    // Determine overall connection status
    let overallStatus = 'not_connected';
    let canSendRequest = true;
    let canAcceptRequest = false;

    if (outgoingConnection && incomingConnection) {
      if (outgoingConnection.status === 'accepted' && incomingConnection.status === 'accepted') {
        overallStatus = 'mutual_connected';
        canSendRequest = false;
      } else if (outgoingConnection.status === 'pending' && incomingConnection.status === 'pending') {
        overallStatus = 'mutual_pending';
        canSendRequest = false;
      } else if (outgoingConnection.status === 'accepted' || incomingConnection.status === 'accepted') {
        // One direction is accepted, allow sending in the other direction
        overallStatus = 'partially_connected';
        canSendRequest = true; // Can still send request in the other direction
      }
    } else if (outgoingConnection) {
      if (outgoingConnection.status === 'accepted') {
        overallStatus = 'connected_outgoing';
        canSendRequest = true; // Can still send request in the other direction
      } else if (outgoingConnection.status === 'pending') {
        overallStatus = 'pending_outgoing';
        canSendRequest = false;
      }
    } else if (incomingConnection) {
      if (incomingConnection.status === 'accepted') {
        overallStatus = 'connected_incoming';
        canSendRequest = true; // Can still send request in the other direction
      } else if (incomingConnection.status === 'pending') {
        overallStatus = 'pending_incoming';
        canAcceptRequest = true;
      }
    }

    res.status(200).json({
      outgoing: {
        connectionId: outgoingConnection?.id,
        status: outgoingConnection?.status || 'not_connected'
      },
      incoming: {
        connectionId: incomingConnection?.id,
        status: incomingConnection?.status || 'not_connected'
      },
      overall: {
        status: overallStatus,
        canSendRequest,
        canAcceptRequest
      },
      isMutualConnection: overallStatus === 'mutual_connected',
      isMutualPending: overallStatus === 'mutual_pending',
      isPartiallyConnected: overallStatus === 'partially_connected'
    });
  } catch (error) {
    console.error('Get connection status error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

exports.getProfileDetails = async (req, res) => {
  try {
    const {isPartner} = req.query;
    console.log("isAdmnin",isPartner);
    const { userId } = req.params;
    const userIdInt = parseInt(userId);
    const currentUserId = parseInt(req.query.currentUserId);

    if (isNaN(userIdInt)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Get user profile with all related data
    const user = await prisma.unifiedUser.findUnique({
      where: { id: userIdInt },
      include: {
        user: true,
        partner: true,
        expert: true,
        admin: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If viewing own profile, return complete data
    if (currentUserId === userIdInt) {
      return res.status(200).json({
        ...user,
        isOwnProfile: true,
      });
    }

    // Check if viewer has permission based on privacy settings
    let canViewFullProfile = false;
    switch (user.privacyType) {
      case 'all':
        canViewFullProfile = true;
        break;
      case 'none':
        canViewFullProfile = false;
        break;
      case 'selected':
        canViewFullProfile = (user.selectedViewers || []).includes(currentUserId);
        break;
      case 'followers':
        canViewFullProfile = (user.followers || []).includes(currentUserId);
        break;
      case 'following':
        canViewFullProfile = (user.following || []).includes(currentUserId);
        break;
    }

    // Get connection status
    const [outgoingConnection, incomingConnection] = await Promise.all([
      prisma.connection.findFirst({
        where: {
          senderId: currentUserId,
          receiverId: userIdInt,
        }
      }),
      prisma.connection.findFirst({
        where: {
          senderId: userIdInt,
          receiverId: currentUserId,
        }
      })
    ]);

    const isMutualConnection = outgoingConnection && incomingConnection;

    // Function to sanitize user data based on type and visibility permissions
    const sanitizeUserData = (userData, type) => {
      if (!userData) return null;

      // Basic public data that's always visible
      const publicData = {
        name: userData.name,
        photoURL: userData.photoURL
      };

      // Add role-specific public information
      if (type === 'user') {
        publicData.currentPosition = userData.currentPosition;
        return {
          ...userData,
          // Remove sensitive data
          password: undefined,
          moodlePassword: undefined,
          otp: undefined,
          otpExpiresAt: undefined,
          moodleUserId: undefined,
          moodleUsername: undefined,
          // Keep public professional information
          awards: userData.awards,
          culinaryPhilosophy: userData.culinaryPhilosophy,
          currentPosition: userData.currentPosition,
          expertise: userData.expertise,
          ifcaInvolvement: userData.ifcaInvolvement,
          industryContributions: userData.industryContributions,
          interests: userData.interests,
          mentorship: userData.mentorship,
          mentorshipAvailability: userData.mentorshipAvailability,
          nationality: userData.nationality,
          recipes: userData.recipes,
          roleDescription: userData.roleDescription,
          specializations: userData.specializations,
          sustainability: userData.sustainability,
          technologySkills: userData.technologySkills,
          vision: userData.vision,
          // Conditionally include contact information
          email: (canViewFullProfile || isPartner) ? userData.email : undefined,
          phone: (canViewFullProfile || isPartner) ? userData.phone : undefined,
          website: canViewFullProfile ? userData.website : undefined,
          location: (canViewFullProfile || isPartner) ? userData.location : undefined,
          state: (canViewFullProfile || isPartner) ? userData.state : undefined,
          socialMediaLinks: canViewFullProfile ? userData.socialMediaLinks : undefined,
          preferredContact: canViewFullProfile ? userData.preferredContact : undefined
        }
      } else if (type === 'partner') {
        publicData.desc = userData.desc;
        if (canViewFullProfile || isMutualConnection) {
          return {
            ...userData,
            password: undefined,
            email: canViewFullProfile ? userData.email : undefined,
            phone: canViewFullProfile ? userData.phone : undefined
          };
        }
      } else if (type === 'expert') {
        publicData.desc = userData.desc;
        if (canViewFullProfile || isMutualConnection) {
          return {
            ...userData,
            password: undefined,
            email: canViewFullProfile ? userData.email : undefined,
            phone: canViewFullProfile ? userData.phone : undefined
          };
        }
      } else if (type === 'admin') {
        if (canViewFullProfile || isMutualConnection) {
          return {
            ...userData,
            password: undefined,
            email: canViewFullProfile ? userData.email : undefined,
            phone: canViewFullProfile ? userData.phone : undefined
          };
        }
      }

      return publicData;
    };

    // Prepare base profile data
    const baseProfile = {
      id: user.id,
      email: user.email, // Keep email for connection requests
      privacyType: user.privacyType,
      isOwnProfile: false,
      connectionStatus: (() => {
        const isCurrentUser = user.id === currentUserId;
        const primaryConnection = isCurrentUser ? incomingConnection : outgoingConnection;
        const secondaryConnection = isCurrentUser ? outgoingConnection : incomingConnection;

        console.log(primaryConnection?.status, secondaryConnection?.status);

        let status = 'connect';
        if (primaryConnection?.status === 'accepted') {
          status = 'connected';
        } else if (primaryConnection?.status === undefined && secondaryConnection?.status === 'accepted') {
          status = 'connect_back';
        } else if (primaryConnection?.status === 'accepted' && secondaryConnection?.status === undefined) {
          status = 'connect';
        } else if (primaryConnection?.status === 'pending') {
          status = 'request_sent';
        } else if (secondaryConnection?.status === 'pending') {
          status = 'request_received';
        }

        return {
          status,
          connectionId: primaryConnection?.id || secondaryConnection?.id
        };
      })()
    };

    // Prepare the response with appropriate level of detail
    const response = {
      ...baseProfile,
      user: sanitizeUserData(user.user, 'user'),
      partner: sanitizeUserData(user.partner, 'partner'),
      expert: sanitizeUserData(user.expert, 'expert'),
      admin: sanitizeUserData(user.admin, 'admin'),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Get profile details error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

exports.updateConnectionPrivacy = async (req, res) => {
  try {
    const { connectionId, privacyType, selectedViewers } = req.body;
    const userId = req.user.unifiedUserId; // Assuming user is authenticated

    // Validate privacy type
    const validPrivacyTypes = ['all', 'none', 'selected', 'followers', 'following'];
    if (!validPrivacyTypes.includes(privacyType)) {
      return res.status(400).json({ message: 'Invalid privacy type' });
    }

    // Check if connection exists and belongs to the user
    const connection = await prisma.connection.findFirst({
      where: {
        id: connectionId,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Update privacy settings
    const updatedConnection = await prisma.connection.update({
      where: { id: connectionId },
      data: {
        privacyType,
        ...(privacyType === 'selected' && { selectedViewers: selectedViewers || [] })
      }
    });

    res.json({
      message: 'Privacy settings updated successfully',
      connection: updatedConnection
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ message: 'Failed to update privacy settings' });
  }
};

exports.updateFollowStatus = async (req, res) => {
  try {
    const { connectionId, action, targetUserId } = req.body;
    const userId = req.user.unifiedUserId; // Assuming user is authenticated

    // Validate action
    if (!['follow', 'unfollow'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const connection = await prisma.connection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    let updatedConnection;
    if (action === 'follow') {
      // Add to following for current user and followers for target user
      updatedConnection = await prisma.connection.update({
        where: { id: connectionId },
        data: {
          following: {
            push: targetUserId
          }
        }
      });

      // Update target user's connection to add follower
      await prisma.connection.updateMany({
        where: {
          OR: [
            { senderId: targetUserId },
            { receiverId: targetUserId }
          ]
        },
        data: {
          followers: {
            push: userId
          }
        }
      });
    } else {
      // Remove from following/followers
      updatedConnection = await prisma.connection.update({
        where: { id: connectionId },
        data: {
          following: {
            set: connection.following.filter(id => id !== targetUserId)
          }
        }
      });

      // Update target user's connection to remove follower
      await prisma.connection.updateMany({
        where: {
          OR: [
            { senderId: targetUserId },
            { receiverId: targetUserId }
          ]
        },
        data: {
          followers: {
            set: connection.followers.filter(id => id !== userId)
          }
        }
      });
    }

    res.json({
      message: `Successfully ${action}ed user`,
      connection: updatedConnection
    });
  } catch (error) {
    console.error(`Error ${req.body.action}ing user:`, error);
    res.status(500).json({ message: `Failed to ${req.body.action} user` });
  }
};

exports.getConnectionVisibility = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.body.userId; // Assuming user is authenticated

    const connection = await prisma.connection.findUnique({
      where: { id: parseInt(connectionId) }
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Check visibility based on privacy settings
    let canView = false;
    switch (connection.privacyType) {
      case 'all':
        canView = true;
        break;
      case 'none':
        canView = connection.senderId === userId || connection.receiverId === userId;
        break;
      case 'selected':
        canView = connection.selectedViewers.includes(userId);
        break;
      case 'followers':
        canView = connection.followers.includes(userId);
        break;
      case 'following':
        canView = connection.following.includes(userId);
        break;
    }

    if (!canView) {
      return res.status(403).json({ message: 'You do not have permission to view this connection' });
    }

    res.json({
      connection,
      visibility: {
        privacyType: connection.privacyType,
        canView,
        isFollower: connection.followers.includes(userId),
        isFollowing: connection.following.includes(userId)
      }
    });
  } catch (error) {
    console.error('Error getting connection visibility:', error);
    res.status(500).json({ message: 'Failed to get connection visibility' });
  }
};

exports.getPrivacySettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    if (isNaN(userIdInt)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const privacySettings = await prisma.unifiedUser.findUnique({
      where: { id: userIdInt },
    }); 

    if (!privacySettings) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(privacySettings);
  } catch (error) {
    console.error('Error getting privacy settings:', error);
    res.status(500).json({ message: 'Failed to get privacy settings' });
  }
};




// Add new function to update user privacy settings
exports.updateUserPrivacy = async (req, res) => {
  try {
    const { userId } = req.params;
    const { privacyType, selectedViewers } = req.body;
    const userIdInt = parseInt(userId);

    if (isNaN(userIdInt)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Validate privacy type
    const validPrivacyTypes = ['all', 'none', 'selected', 'followers', 'following'];
    if (!validPrivacyTypes.includes(privacyType)) {
      return res.status(400).json({ message: 'Invalid privacy type' });
    }

    // Update user privacy settings
    const updatedUser = await prisma.unifiedUser.update({
      where: { id: userIdInt },
      data: {
        privacyType,
        selectedViewers: privacyType === 'selected' ? selectedViewers || [] : []
      }
    });

    res.json({
      message: 'Privacy settings updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({ message: 'Failed to update privacy settings' });
  }
};

// Clean up user references when a user is deleted
exports.cleanupUserReferences = async (userId) => {
  try {
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      throw new Error('Invalid user ID - ' + userId);
    }

    // Get all users that have the deleted user in their arrays
    const affectedUsers = await prisma.unifiedUser.findMany({
      where: {
        OR: [
          {
            followers: {
              has: userIdInt
            }
          },
          {
            following: {
              has: userIdInt
            }
          },
          {
            selectedViewers: {
              has: userIdInt
            }
          }
        ]
      }
    });

    // Update each affected user by removing the deleted user's ID
    const updatePromises = affectedUsers.map(user =>
      prisma.unifiedUser.update({
        where: { id: user.id },
        data: {
          followers: {
            set: user.followers.filter(id => id !== userIdInt)
          },
          following: {
            set: user.following.filter(id => id !== userIdInt)
          },
          selectedViewers: {
            set: user.selectedViewers.filter(id => id !== userIdInt)
          }
        }
      })
    );

    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error cleaning up user references:', error);
    throw error;
  }
};

// Function to sync followers/following arrays from existing connections
const syncFollowersFollowingFromConnections = async (userId) => {
  try {
    // Get all accepted connections for this user
    const acceptedConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'accepted' },
          { receiverId: userId, status: 'accepted' }
        ]
      }
    });

    // Build followers and following arrays
    const followers = [];
    const following = [];

    acceptedConnections.forEach(conn => {
      if (conn.senderId === userId) {
        // User is the sender, so they are following the receiver
        following.push(conn.receiverId);
      } else {
        // User is the receiver, so the sender is following them
        followers.push(conn.senderId);
      }
    });

    // Update the user's followers/following arrays
    await prisma.unifiedUser.update({
      where: { id: userId },
      data: {
        followers: followers,
        following: following
      }
    });

    console.log(`Synced followers/following for user ${userId}:`, { followers, following });
    return { followers, following };
  } catch (error) {
    console.error('Error syncing followers/following:', error);
    return { followers: [], following: [] };
  }
};

// New function to get network connections data
exports.getNetworkConnections = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    if (isNaN(userIdInt)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Get all connections for the current user
    const userConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: userIdInt },
          { receiverId: userIdInt }
        ]
      },
      include: {
        unifiedUser_Connection_senderIdTounifiedUser: {
          select: {
            id: true,
            email: true,
            user: {
              select: {
                name: true,
                photoURL: true,
                currentPosition: true,
                careerHistory: true
              }
            },
            partner: {
              select: {
                name: true,
                photoURL: true,
                desc: true
              }
            },
            expert: {
              select: {
                name: true,
                photoURL: true,
                desc: true
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
        unifiedUser_Connection_receiverIdTounifiedUser: {
          select: {
            id: true,
            email: true,
            user: {
              select: {
                name: true,
                photoURL: true,
                currentPosition: true,
                careerHistory: true
              }
            },
        partner: {
          select: {
            name: true,
            photoURL: true,
            desc: true
          }
        },
        expert: {
          select: {
            name: true,
            photoURL: true,
            desc: true
          }
        },
        admin: {
          select: {
            name: true,
            photoURL: true
              }
            }
          }
        }
      }
    });

    // Get all users for comparison (excluding current user and inactive users)
    const allUsers = await prisma.unifiedUser.findMany({
      where: {
        id: { not: userIdInt }, // Exclude current user
        isActive: true // Only include active users
      },
      select: {
        id: true,
        user: {
          select: {
            name: true,
            photoURL: true,
            currentPosition: true,
            careerHistory: true
          }
        },
        partner: {
          select: {
            name: true,
            photoURL: true,
            desc: true
          }
        },
        expert: {
          select: {
            name: true,
            photoURL: true,
            desc: true
          }
        },
        admin: {
          select: {
            name: true,
            photoURL: true
          }
        }
      }
    });

    // Create a map to track connection status for each user
    const connectionMap = new Map();

    // Process user's connections to build connection status map
    userConnections.forEach(conn => {
      const otherUserId = conn.senderId === userIdInt ? conn.receiverId : conn.senderId;
      const isOutgoing = conn.senderId === userIdInt;
      const otherUser = isOutgoing ? conn.unifiedUser_Connection_receiverIdTounifiedUser : conn.unifiedUser_Connection_senderIdTounifiedUser;

      if (!connectionMap.has(otherUserId)) {
        connectionMap.set(otherUserId, {
          user: otherUser,
          outgoingConnection: null,
          incomingConnection: null,
          connectionStatus: 'none'
        });
      }

      const connectionInfo = connectionMap.get(otherUserId);
      
        if (isOutgoing) {
        connectionInfo.outgoingConnection = conn;
        } else {
        connectionInfo.incomingConnection = conn;
      }
    });

    // After processing all connections, determine the final connection status
    connectionMap.forEach((connectionInfo, userId) => {
      const hasOutgoingAccepted = connectionInfo.outgoingConnection?.status === 'accepted';
      const hasIncomingAccepted = connectionInfo.incomingConnection?.status === 'accepted';
      const hasOutgoingPending = connectionInfo.outgoingConnection?.status === 'pending';
      const hasIncomingPending = connectionInfo.incomingConnection?.status === 'pending';

      // Determine connection status based on both directions
      if (hasOutgoingAccepted && hasIncomingAccepted) {
        connectionInfo.connectionStatus = 'mutual';
      } else if (hasOutgoingAccepted) {
        connectionInfo.connectionStatus = 'following';
      } else if (hasIncomingAccepted) {
        connectionInfo.connectionStatus = 'follower';
      } else if (hasOutgoingPending) {
        connectionInfo.connectionStatus = 'request_sent';
      } else if (hasIncomingPending) {
        connectionInfo.connectionStatus = 'request_received';
      } else {
        connectionInfo.connectionStatus = 'none';
      }
    });

    // Format user data
    const formatUserData = (userData) => {
      const name = userData.user?.name || userData.partner?.name || userData.expert?.name || userData.admin?.name || 'Unknown User';
      const photoURL = userData.user?.photoURL || userData.partner?.photoURL || userData.expert?.photoURL || userData.admin?.photoURL || '/t6.svg';
      const title = userData.user?.careerHistory?.[0]?.jobTitle || 
                   userData.user?.currentPosition || 
                   userData.partner?.desc || 
                   userData.expert?.desc || 'Member';
      
      const connectionInfo = connectionMap.get(userData.id);
      let connectionStatus = 'none';
      let isFollower = false;
      let isFollowing = false;

      if (connectionInfo) {
        connectionStatus = connectionInfo.connectionStatus;
        isFollower = connectionInfo.incomingConnection?.status === 'accepted';
        isFollowing = connectionInfo.outgoingConnection?.status === 'accepted';
      }

      // Find mutual connections (users that both the current user and this user are connected to)
      const mutualConnections = allUsers.filter(otherUser => {
        if (otherUser.id === userIdInt || otherUser.id === userData.id) return false;
        
        // Check if current user is connected to this other user
        const otherUserConnectionInfo = connectionMap.get(otherUser.id);
        if (!otherUserConnectionInfo) return false;
        
        const currentUserConnectedToOther = otherUserConnectionInfo.outgoingConnection?.status === 'accepted' || 
                                          otherUserConnectionInfo.incomingConnection?.status === 'accepted';
        
        if (!currentUserConnectedToOther) return false;
        
        // Now check if the target user (userData) is also connected to this other user
        // We need to check if userData has a connection to otherUser
        const targetUserConnectionInfo = connectionMap.get(userData.id);
        if (!targetUserConnectionInfo) return false;
        
        // Check if target user has any accepted connection (this is a simplified check)
        // In a real implementation, we'd need to check the specific connection to otherUser
        const targetUserHasConnections = targetUserConnectionInfo.outgoingConnection?.status === 'accepted' || 
                                       targetUserConnectionInfo.incomingConnection?.status === 'accepted';
        
        return targetUserHasConnections;
      }).map(mutualUser => ({
        id: mutualUser.id,
        name: mutualUser.user?.name || mutualUser.partner?.name || mutualUser.expert?.name || mutualUser.admin?.name || 'Unknown User',
        photoURL: mutualUser.user?.photoURL || mutualUser.partner?.photoURL || mutualUser.expert?.photoURL || mutualUser.admin?.photoURL || '/t6.svg'
      }));
      
      return {
        id: userData.id,
        name,
        photoURL,
        title,
        userType: userData.user ? 'user' : userData.partner ? 'partner' : userData.expert ? 'expert' : 'admin',
        connectionStatus,
        isFollower,
        isFollowing,
        mutualConnections,
        mutualConnectionsCount: mutualConnections.length,
        connectionInfo: connectionInfo ? {
          outgoingConnectionId: connectionInfo.outgoingConnection?.id,
          incomingConnectionId: connectionInfo.incomingConnection?.id,
          outgoingStatus: connectionInfo.outgoingConnection?.status,
          incomingStatus: connectionInfo.incomingConnection?.status
        } : null
      };
    };

    // Process all users (current user already excluded in query)
    const formattedUsers = allUsers.map(userData => formatUserData(userData));
    
    // Categorize users by connection type
    const followers = formattedUsers.filter(user => user.connectionStatus === 'follower');
    const following = formattedUsers.filter(user => user.connectionStatus === 'following');
    const mutual = formattedUsers.filter(user => user.connectionStatus === 'mutual');
    const others = formattedUsers.filter(user => user.connectionStatus === 'none');
    const pendingSent = formattedUsers.filter(user => user.connectionStatus === 'request_sent');
    const pendingReceived = formattedUsers.filter(user => user.connectionStatus === 'request_received');

    // Debug logging
    console.log('Network Connections Debug:', {
      userId: userIdInt,
      totalConnections: userConnections.length,
      totalUsers: formattedUsers.length,
      followersCount: followers.length,
      followingCount: following.length,
      mutualCount: mutual.length,
      othersCount: others.length,
      pendingSentCount: pendingSent.length,
      pendingReceivedCount: pendingReceived.length,
      connectionMapSize: connectionMap.size
    });

    // Log connection map details for debugging
    console.log('Connection Map Details:');
    connectionMap.forEach((info, userId) => {
      console.log(`User ${userId}:`, {
        outgoingStatus: info.outgoingConnection?.status,
        incomingStatus: info.incomingConnection?.status,
        finalStatus: info.connectionStatus
      });
    });

    // Log a few examples of connection statuses
    const sampleUsers = formattedUsers.slice(0, 3);
    sampleUsers.forEach(user => {
      console.log(`User ${user.id} (${user.name}): ${user.connectionStatus}`);
    });

    res.status(200).json({
      followers,
      following,
      mutual,
      others,
      pendingSent,
      pendingReceived,
      // Include all users in a single array for easier unified handling on the frontend
      allUsers: formattedUsers,
      counts: {
        followers: followers.length,
        following: following.length,
        mutual: mutual.length,
        pendingSent: pendingSent.length,
        pendingReceived: pendingReceived.length,
        others: others.length
      }
    });
  } catch (error) {
    console.error('Get network connections error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Utility function to sync all users' followers/following arrays
exports.syncAllUsersFollowersFollowing = async (req, res) => {
  try {
    console.log('Starting sync of all users followers/following arrays...');
    
    // Get all active users
    const allUsers = await prisma.unifiedUser.findMany({
      where: {
        isActive: true // Only sync active users
      },
      select: { id: true }
    });
    
    let syncedCount = 0;
    
    for (const user of allUsers) {
      try {
        const syncedData = await syncFollowersFollowingFromConnections(user.id);
        if (syncedData.followers.length > 0 || syncedData.following.length > 0) {
          syncedCount++;
        }
      } catch (error) {
        console.error(`Error syncing user ${user.id}:`, error);
      }
    }
    
    console.log(`Sync completed. Updated ${syncedCount} users.`);
    
    res.status(200).json({
      message: 'Sync completed successfully',
      syncedCount,
      totalUsers: allUsers.length
    });
  } catch (error) {
    console.error('Error in syncAllUsersFollowersFollowing:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Debug endpoint to check followers/following arrays for a user
exports.debugUserArrays = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    if (isNaN(userIdInt)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Get user data
    const user = await prisma.unifiedUser.findUnique({
      where: { id: userIdInt },
      select: {
        id: true,
        followers: true,
        following: true,
        user: {
          select: {
            name: true,
            email: true
          }
        },
        partner: {
          select: {
            name: true,
            email: true
          }
        },
        expert: {
          select: {
            name: true,
            email: true
          }
        },
        admin: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get accepted connections for this user
    const acceptedConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: userIdInt, status: 'accepted' },
          { receiverId: userIdInt, status: 'accepted' }
        ]
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        status: true
      }
    });

    // Calculate expected followers/following from connections
    const expectedFollowers = [];
    const expectedFollowing = [];

    acceptedConnections.forEach(conn => {
      if (conn.senderId === userIdInt) {
        expectedFollowing.push(conn.receiverId);
      } else {
        expectedFollowers.push(conn.senderId);
      }
    });

    const name = user.user?.name || user.partner?.name || user.expert?.name || user.admin?.name || 'Unknown User';

    res.status(200).json({
      user: {
        id: user.id,
        name,
        email: user.user?.email || user.partner?.email || user.expert?.email || user.admin?.email
      },
      currentArrays: {
        followers: user.followers,
        following: user.following
      },
      expectedFromConnections: {
        followers: expectedFollowers,
        following: expectedFollowing
      },
      acceptedConnections: acceptedConnections.length,
      arraysMatch: {
        followers: JSON.stringify(user.followers.sort()) === JSON.stringify(expectedFollowers.sort()),
        following: JSON.stringify(user.following.sort()) === JSON.stringify(expectedFollowing.sort())
      }
    });
  } catch (error) {
    console.error('Debug user arrays error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Test endpoint to verify connection status logic
exports.testConnectionStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    if (isNaN(userIdInt)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Get user data
    let user = await prisma.unifiedUser.findUnique({
      where: { id: userIdInt },
      select: {
        id: true,
        followers: true,
        following: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all connections for the current user
    const userConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: userIdInt },
          { receiverId: userIdInt }
        ]
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        status: true
      }
    });

    // Get a few other active users to test with
    const otherUsers = await prisma.unifiedUser.findMany({
      where: {
        id: { not: userIdInt }, // Exclude current user
        isActive: true // Only include active users
      },
      take: 5,
      select: {
        id: true,
        followers: true,
        following: true,
        user: {
          select: {
            name: true
          }
        },
        partner: {
          select: {
            name: true
          }
        },
        expert: {
          select: {
            name: true
          }
        },
        admin: {
          select: {
            name: true
          }
        }
      }
    });

    // Test connection status for each user
    const testResults = otherUsers.map(otherUser => {
      const name = otherUser.user?.name || otherUser.partner?.name || otherUser.expert?.name || otherUser.admin?.name || 'Unknown User';
      
      const isFollower = user.followers.includes(otherUser.id);
      const isFollowing = user.following.includes(otherUser.id);
      
      // Find connection status
      const connection = userConnections.find(conn => 
        (conn.senderId === userIdInt && conn.receiverId === otherUser.id) ||
        (conn.senderId === otherUser.id && conn.receiverId === userIdInt)
      );
      
      let connectionStatus;
      if (connection?.status === 'pending') {
        const isOutgoing = connection.senderId === userIdInt;
        connectionStatus = isOutgoing ? 'request_sent' : 'request_received';
      } else if (isFollower && isFollowing) {
        connectionStatus = 'mutual';
      } else if (isFollowing) {
        connectionStatus = 'following';
      } else if (isFollower) {
        connectionStatus = 'follower';
      } else {
        connectionStatus = 'none';
      }

      return {
        userId: otherUser.id,
        name,
        isFollower,
        isFollowing,
        connectionStatus,
        connectionId: connection?.id,
        connectionStatusFromDB: connection?.status
      };
    });

    res.status(200).json({
      currentUser: {
        id: user.id,
        followers: user.followers,
        following: user.following
      },
      testResults,
      totalConnections: userConnections.length
    });
  } catch (error) {
    console.error('Test connection status error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Debug endpoint to test connection categorization
exports.debugConnectionCategorization = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    if (isNaN(userIdInt)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Get all connections for the user
    const userConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: userIdInt },
          { receiverId: userIdInt }
        ]
      },
      include: {
        unifiedUser_Connection_senderIdTounifiedUser: {
          select: {
            id: true,
            email: true,
            user: { select: { name: true } },
            partner: { select: { name: true } },
            expert: { select: { name: true } },
            admin: { select: { name: true } }
          }
        },
        unifiedUser_Connection_receiverIdTounifiedUser: {
          select: {
            id: true,
            email: true,
            user: { select: { name: true } },
            partner: { select: { name: true } },
            expert: { select: { name: true } },
            admin: { select: { name: true } }
          }
        }
      }
    });

    // Process connections
    const connectionMap = new Map();
    
    userConnections.forEach(conn => {
      const otherUserId = conn.senderId === userIdInt ? conn.receiverId : conn.senderId;
      const isOutgoing = conn.senderId === userIdInt;
      const otherUser = isOutgoing ? conn.unifiedUser_Connection_receiverIdTounifiedUser : conn.unifiedUser_Connection_senderIdTounifiedUser;
      const otherUserName = otherUser.user?.name || otherUser.partner?.name || otherUser.expert?.name || otherUser.admin?.name || 'Unknown';

      if (!connectionMap.has(otherUserId)) {
        connectionMap.set(otherUserId, {
          user: otherUser,
          userName: otherUserName,
          outgoingConnection: null,
          incomingConnection: null,
          connectionStatus: 'none'
        });
      }

      const connectionInfo = connectionMap.get(otherUserId);
      
      if (isOutgoing) {
        connectionInfo.outgoingConnection = conn;
      } else {
        connectionInfo.incomingConnection = conn;
      }
    });

    // Determine final status
    connectionMap.forEach((connectionInfo, userId) => {
      const hasOutgoingAccepted = connectionInfo.outgoingConnection?.status === 'accepted';
      const hasIncomingAccepted = connectionInfo.incomingConnection?.status === 'accepted';
      const hasOutgoingPending = connectionInfo.outgoingConnection?.status === 'pending';
      const hasIncomingPending = connectionInfo.incomingConnection?.status === 'pending';

      if (hasOutgoingAccepted && hasIncomingAccepted) {
        connectionInfo.connectionStatus = 'mutual';
      } else if (hasOutgoingAccepted) {
        connectionInfo.connectionStatus = 'following';
      } else if (hasIncomingAccepted) {
        connectionInfo.connectionStatus = 'follower';
      } else if (hasOutgoingPending) {
        connectionInfo.connectionStatus = 'request_sent';
      } else if (hasIncomingPending) {
        connectionInfo.connectionStatus = 'request_received';
      } else {
        connectionInfo.connectionStatus = 'none';
      }
    });

    // Categorize
    const followers = [];
    const following = [];
    const mutual = [];
    const pendingSent = [];
    const pendingReceived = [];

    connectionMap.forEach((info, userId) => {
      const userInfo = {
        id: userId,
        name: info.userName,
        status: info.connectionStatus,
        outgoingStatus: info.outgoingConnection?.status,
        incomingStatus: info.incomingConnection?.status
      };

      switch (info.connectionStatus) {
        case 'follower':
          followers.push(userInfo);
          break;
        case 'following':
          following.push(userInfo);
          break;
        case 'mutual':
          mutual.push(userInfo);
          break;
        case 'request_sent':
          pendingSent.push(userInfo);
          break;
        case 'request_received':
          pendingReceived.push(userInfo);
          break;
      }
    });

    res.status(200).json({
      userId: userIdInt,
      totalConnections: userConnections.length,
      connectionMap: Array.from(connectionMap.entries()).map(([userId, info]) => ({
        userId,
        userName: info.userName,
        outgoingStatus: info.outgoingConnection?.status,
        incomingStatus: info.incomingConnection?.status,
        finalStatus: info.connectionStatus
      })),
      categories: {
        followers,
        following,
        mutual,
        pendingSent,
        pendingReceived
      },
      counts: {
        followers: followers.length,
        following: following.length,
        mutual: mutual.length,
        pendingSent: pendingSent.length,
        pendingReceived: pendingReceived.length
      }
    });
  } catch (error) {
    console.error('Debug connection categorization error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Debug endpoint for pending requests
exports.debugPendingRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    console.log('🔍 Debug: Getting pending requests for user:', userIdInt);

    if (isNaN(userIdInt)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Get all connections for this user
    const allConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: userIdInt },
          { receiverId: userIdInt }
        ]
      },
      include: {
        unifiedUser_Connection_senderIdTounifiedUser: {
          select: {
            id: true,
            email: true,
            user: { select: { name: true } },
            partner: { select: { name: true } },
            expert: { select: { name: true } },
            admin: { select: { name: true } }
          }
        },
        unifiedUser_Connection_receiverIdTounifiedUser: {
          select: {
            id: true,
            email: true,
            user: { select: { name: true } },
            partner: { select: { name: true } },
            expert: { select: { name: true } },
            admin: { select: { name: true } }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('🔍 Debug: All connections for user:', allConnections.length);

    // Categorize connections
    const pendingIncoming = [];
    const pendingOutgoing = [];
    const acceptedIncoming = [];
    const acceptedOutgoing = [];

    allConnections.forEach(conn => {
      const isOutgoing = conn.senderId === userIdInt;
      const otherUser = isOutgoing ? conn.unifiedUser_Connection_receiverIdTounifiedUser : conn.unifiedUser_Connection_senderIdTounifiedUser;
      const otherUserName = otherUser.user?.name || otherUser.partner?.name || otherUser.expert?.name || otherUser.admin?.name || 'Unknown';

      const connectionInfo = {
        id: conn.id,
        status: conn.status,
        message: conn.message,
        createdAt: conn.createdAt,
        otherUserId: otherUser.id,
        otherUserName: otherUserName,
        isOutgoing: isOutgoing
      };

      if (conn.status === 'pending') {
        if (isOutgoing) {
          pendingOutgoing.push(connectionInfo);
        } else {
          pendingIncoming.push(connectionInfo);
        }
      } else if (conn.status === 'accepted') {
        if (isOutgoing) {
          acceptedOutgoing.push(connectionInfo);
        } else {
          acceptedIncoming.push(connectionInfo);
        }
      }
    });

    console.log('🔍 Debug: Connection breakdown:', {
      pendingIncoming: pendingIncoming.length,
      pendingOutgoing: pendingOutgoing.length,
      acceptedIncoming: acceptedIncoming.length,
      acceptedOutgoing: acceptedOutgoing.length
    });

    res.status(200).json({
      userId: userIdInt,
      totalConnections: allConnections.length,
      connections: {
        pendingIncoming,
        pendingOutgoing,
        acceptedIncoming,
        acceptedOutgoing
      },
      counts: {
        pendingIncoming: pendingIncoming.length,
        pendingOutgoing: pendingOutgoing.length,
        acceptedIncoming: acceptedIncoming.length,
        acceptedOutgoing: acceptedOutgoing.length
      },
      allConnections: allConnections.map(conn => ({
        id: conn.id,
        senderId: conn.senderId,
        receiverId: conn.receiverId,
        status: conn.status,
        message: conn.message,
        createdAt: conn.createdAt,
        senderName: conn.sender.user?.name || conn.sender.partner?.name || conn.sender.expert?.name || conn.sender.admin?.name,
        receiverName: conn.receiver.user?.name || conn.receiver.partner?.name || conn.receiver.expert?.name || conn.receiver.admin?.name
      }))
    });
  } catch (error) {
    console.error('Debug pending requests error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Simple test endpoint for pending requests
exports.testPendingRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    console.log('🧪 Test: Getting pending requests for user:', userIdInt);

    if (isNaN(userIdInt)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Simple query to check if user exists
    const user = await prisma.unifiedUser.findUnique({
      where: { id: userIdInt },
      select: { id: true, email: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found', userId: userIdInt });
    }

    // Simple query to get all pending connections
    const pendingConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: userIdInt, status: 'pending' },
          { receiverId: userIdInt, status: 'pending' }
        ]
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        status: true,
        message: true,
        createdAt: true
      }
    });

    console.log('🧪 Test: Found pending connections:', pendingConnections.length);

    res.status(200).json({
      message: 'Test successful',
      user: user,
      pendingConnections: pendingConnections,
      count: pendingConnections.length
    });
  } catch (error) {
    console.error('Test pending requests error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Test function to create incoming requests for testing
exports.createTestIncomingRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    console.log('🧪 Creating test incoming requests for user:', userIdInt);

    if (isNaN(userIdInt)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Verify user exists
    const user = await prisma.unifiedUser.findUnique({
      where: { id: userIdInt },
      select: { id: true, email: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get some other active users to send requests from
    const otherUsers = await prisma.unifiedUser.findMany({
      where: {
        id: { not: userIdInt }, // Exclude current user
        isActive: true // Only include active users
      },
      take: 5,
      select: { id: true, email: true }
    });

    if (otherUsers.length === 0) {
      return res.status(400).json({ message: 'No other users found to create test requests' });
    }

    const createdRequests = [];

    // Create incoming requests from other users to the target user
    for (const otherUser of otherUsers) {
      // Check if connection already exists
      const existingConnection = await prisma.connection.findFirst({
        where: {
          senderId: otherUser.id,
          receiverId: userIdInt
        }
      });

      if (!existingConnection) {
        const testRequest = await prisma.connection.create({
          data: {
            senderId: otherUser.id,
            receiverId: userIdInt,
            status: 'pending',
            message: `Test connection request from user ${otherUser.id}`
          }
        });

        createdRequests.push({
          id: testRequest.id,
          senderId: otherUser.id,
          receiverId: userIdInt,
          message: testRequest.message,
          createdAt: testRequest.createdAt
        });

        console.log('✅ Created test request:', testRequest.id);
      } else {
        console.log('⚠️ Connection already exists between', otherUser.id, 'and', userIdInt);
      }
    }

    res.status(200).json({
      success: true,
      message: `Created ${createdRequests.length} test incoming requests`,
      createdRequests,
      totalRequests: createdRequests.length
    });
  } catch (error) {
    console.error('Create test incoming requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
