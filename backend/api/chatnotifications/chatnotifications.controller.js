const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

//user notification
exports.createNotification = async (req, res) => {
  try {
    const { fromId, toId, messageBody } = req.body;

    console.log("Received notification data:", req.body); // Log received data for debugging

    const newNotification = await prisma.chatNotifications.create({
      data: {
        fromId,
        toId,
        messageBody,
      },
    });

    res.status(201).json(newNotification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
};
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await prisma.chatNotifications.findMany();

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notifications = await prisma.chatNotifications.findMany({
      where: { toId: parseInt(id) },
      include: {
        fromUser: {
          select: {
            name: true,
            photoURL: true,
          },
        },
      },
    });

    if (!notifications.length) {
      return res.status(404).json({ error: "Notifications not found" });
    }

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany(); // Assuming 'user' is your Prisma model for users

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
