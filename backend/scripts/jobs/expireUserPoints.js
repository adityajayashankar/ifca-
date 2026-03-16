const { PrismaClient, RewardType } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to check if error is a database connection error
function isDatabaseConnectionError(error) {
    return error?.name === 'PrismaClientInitializationError' || 
           error?.message?.includes("Can't reach database server") ||
           error?.message?.includes("database server is running");
}

async function expireUserPoints() {

  const now = new Date();

  try {
    const expiredActivities = await prisma.userActivity.findMany({
      where: {
        expiryDate: { lte: now },
        type: RewardType.CREDIT,
        isExpired: false
      },
      select: {
        userId: true,
        points: true,
        id: true
      }
    });

    const userPointsMap = new Map();
    for (const activity of expiredActivities) {
      const { userId, points } = activity;
      if (!userPointsMap.has(userId)) userPointsMap.set(userId, 0);
      userPointsMap.set(userId, userPointsMap.get(userId) + points);
    }

    const transaction = await prisma.$transaction(async (tx) => {
      for (const [userId, expiredPoints] of userPointsMap.entries()) {
        const reward = await tx.userReward.findUnique({
          where: { userId },
          select: { totalPoints: true },
        });
    
        if (!reward) continue;
    
        if (reward.totalPoints >= expiredPoints) {
          await tx.userReward.update({
            where: { userId },
            data: {
              totalPoints: { decrement: expiredPoints },
              debit: { increment: -expiredPoints },
            }
          });
        }
    
        await tx.userActivity.updateMany({
          where: {
            userId,
            expiryDate: { lte: now },
            type: RewardType.CREDIT,
            isExpired: false
          },
          data: { isExpired: true }
        });
      }
    });
    

    console.log('Expired points deducted for users:', [...userPointsMap.keys()]);
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      console.log('Database unavailable, skipping user points expiration');
      return;
    }
    console.error('Error expiring user points:', error);
  }
}

module.exports = expireUserPoints;
