const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();

const Razorpay = require("razorpay");
const { sendEmailHelper } = require("../mail/email");
const { sendEmail } = require("../../utils/sendMail");
const moment = require("moment");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

exports.createOrder = async function (req, res, next) {
  try {
    const { amount, currency, userId } = req.body;

    const options = {
      amount: amount * 100,
      currency,
      receipt: `order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const savedOrder = await prisma.order.create({
      data: {
        paymentId: order.id,
        createdAt: new Date(),
        unifiedUser: {
          connect: { id: userId }, 
        },
      },
    });

    return res.status(200).json({ order, savedOrder });
  } catch (error) {
    return res.status(500).json({ error: "Error creating payment order" });
  }
};


exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, signature, userId, orderId, cartItems, userEmail } = req.body;
    const body = `${orderId}|${paymentId}`;

    if (!process.env.RAZORPAY_API_SECRET) {
      console.error("RAZORPAY_API_SECRET is not defined in the environment variables");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    await prisma.$transaction(async (tx) => {
      const orderRes = await tx.order.create({
        data: { 
          paymentId, 
          createdAt: new Date(), 
          unifiedUser: {
          connect: { id: userId },
          },
        },
      });

      const orderDBId = orderRes.id;

      const sessionOrderPromises = cartItems
  .filter((item) => item?.sessionId)
  .map(async (item) => {
    let sessionSlotId = item.sessionSlot?.id;

    if (!sessionSlotId) {
      const sessionSlot = await tx.sessionSlot.findFirst({
        where: { sessionId: item.sessionId },
        select: { id: true },
      });

      if (!sessionSlot) {
        throw new Error(`No session slot found for sessionId: ${item.sessionId}`);
      }

      sessionSlotId = sessionSlot.id;
    }

    return tx.sessionOrderMapping.create({
      data: {
        session: { connect: { id: item.sessionId } },
        sessionSlot: { connect: { id: sessionSlotId } },
        order: { connect: { id: orderDBId } },
        unifiedUser: { connect: { id: userId } },
      },
    });
  });

      const attendancePromises = cartItems.map((item) =>
        tx.attendance.updateMany({
          where: {
            sessionId: item.sessionId,
            userId,
          },
          data: {
            paymentCompleted: true,
          },
        })
      );

      await Promise.all([
        ...(await Promise.all(sessionOrderPromises)),
        ...attendancePromises,
      ]);
      
      const purchasedSessions = cartItems
        .filter((item) => item?.sessionId) 
        .map((item) => ({
          name: item.name,
          // slot: moment(item.sessionSlot.startTime).format("DD/MM/YYYY hh:mm"),
        }));

      sendEmail(
        `You have purchased: ${purchasedSessions
          .map((item) => `${item.name}`)
          .join(", ")}`,
        userEmail,
        "Your order has been confirmed"
      );
    });

    res.status(200).json({ message: "Order successfully created" });
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    res.status(500).json({ error: "Error creating order" });
  }
};


exports.verifyOrderOwnership = async (req, res, next) => {
  const { userId } = req.params;

  const { roomId, isExpert } = req.body;

  const associatedSession = await prisma.session.findUnique({
    where: {
      roomId: roomId,
    },
    select: {
      id: true,
      creatorId: true,
    },
  });

  if (isExpert) {
    try {
      const expert = await prisma.expert.findUnique({
        where: {
          id: parseInt(userId),
        },
      });
      if (expert) {
        res.status(200).json({
          isOwner: true,
          sessionId: associatedSession.id,
          role: "host",
        });
      } else {
        res.status(200).json({
          isOwner: false,
          sessionId: associatedSession.id,
          role: "none",
        });
      }
    } catch (err) {
      next(err);
      console.log(err);
    }
  } else {
    try {
      const userBoughtSessions = await prisma.attendance.findMany({
        where: {
          userId: parseInt(userId),
          paymentCompleted: true,
        },
        select: {
          sessionId: true,
        },
      });

      const arr = userBoughtSessions.map((item) => {
        return item.sessionId;
      });

      res.status(200).json({
        isOwner: arr.includes(associatedSession.id),
        sessionId: associatedSession.id,
        role: !arr.includes(associatedSession.id)
          ? "not_owner"
          : userId === associatedSession.creatorId
          ? "host"
          : "guest",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
};

