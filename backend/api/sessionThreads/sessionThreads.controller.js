const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createCustomError } = require("../../middleware/errorHandling");

exports.createSessionThread = async function (req, res, next) {
  try {
    const { assetsData, ...threadData } = req.body;
    console.log(threadData);
    const sessionThread = await prisma.thread.create({
      data: {
        ...threadData,
        assets: {
          create: assetsData
        }
      },
      include: {
        assets: true,
        sessionSlot: true,
        creator: {
          include: {
            user: true,
          }
        }
      }
    })
    res.status(201).json(sessionThread);
  } catch (err) {
    console.log(err);
    next(err);
  }
}

// pass sessionSlotId as a param to get all threads related to that sessionSlot
exports.getSessionThread = async function (req, res, next) {
  const { sessionSlotId } = req.params;
  try {
    const sessionThread = await prisma.thread.findMany({
      where: {
        sessionSlotId: parseInt(sessionSlotId),
      },
      include: {
        assets: true,
        sessionSlot: true,
        creator: {
          include: {
            user: true,
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });
    const sessionThreads = await prisma.thread.findMany()
    console.log(sessionThreads)
    res.status(200).json(sessionThread);
  } catch (err) {
    console.log(err);
    next(err);
  }
}