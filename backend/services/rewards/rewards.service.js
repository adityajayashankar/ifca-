const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { RewardType } = require('@prisma/client');

async function rewardsManagement({ userId, rewardRuleName, type, points }) {
  try {
    let rewardRule
    if(type !== RewardType.DEBIT) {
    rewardRule = await prisma.rewardRule.findUnique({
      where: { action: rewardRuleName }
    });

    if (!rewardRule || !rewardRule.isActive) {
      console.log(`Reward rule not found or inactive: ${rewardRuleName}`);
      return;
    }
  }

    const now = new Date();

    const pointValue = type === RewardType.CREDIT
      ? rewardRule.points
      : typeof points === 'number' && points > 0
        ? points
        : (() => {
            console.log('Points must be provided for DEBIT');
            return null;
          })();

    if (pointValue === null) return;

    let filterDate = new Date(now);
    switch (type === RewardType.CREDIT && rewardRule.frequency) {
      case 'DAILY':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'WEEKLY': {
        const day = filterDate.getDay();
        filterDate.setDate(filterDate.getDate() - day);
        filterDate.setHours(0, 0, 0, 0);
        break;
      }
      case 'MONTHLY':
        filterDate = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1);
        break;
      case 'ONCE':
        filterDate = new Date(0);
        break;
      case 'PER_ACTION':
        filterDate.setHours(0, 0, 0, 0);
        break;
    }

    let activitiesCount
    if(type === RewardType.CREDIT) {
    activitiesCount = await prisma.userActivity.count({
      where: {
        userId,
        rewardAction: rewardRuleName,
        timestamp: { gte: filterDate }
      }
    });
  }

  if(type === RewardType.CREDIT) {

    if ((rewardRule.frequency !== 'PER_ACTION' && rewardRule.frequency !== 'ONCE') && activitiesCount >= rewardRule.limit) {
      console.log('Limit reached for user');
      return;
    }

    if (rewardRule.frequency === 'ONCE' && activitiesCount > 0) {
      console.log('User already received this one-time reward');
      return;
    }

    if (rewardRule.frequency === 'PER_ACTION' && activitiesCount >= rewardRule.limit) {
      console.log('Per-action limit reached for today');
      return;
    }
  }

    const point = type === RewardType.CREDIT ? pointValue : -pointValue;

    let expiryDate = null;
    if (type === RewardType.CREDIT && rewardRule?.expiryDays) {
      expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + rewardRule.expiryDays);
      expiryDate.setHours(23, 59, 59);
    }


    await prisma.userActivity.create({
      data: {
        userId,
        rewardAction: rewardRuleName,
        type,
        points: point,
        expiryDate
      }
    });

    const exisitngUser = await prisma.userReward.findUnique({
      where: { userId }
    });

    if (exisitngUser) {
      await prisma.userReward.update({
        where: { userId },
        data: {
          totalPoints: { increment: point },
          credit: type === RewardType.CREDIT ? { increment: point } : undefined,
          debit: type === RewardType.DEBIT ? { increment: point } : undefined,
        }
      });
    } else {
      await prisma.userReward.create({
        data: {
          userId,
          totalPoints: pointValue,
          credit: type === RewardType.CREDIT ? rewardRule.points : 0,
          debit: type === RewardType.DEBIT ? rewardRule.points : 0,
        }
      });
    }

    console.log(`Reward ${type.toLowerCase()}ed successfully`);
  } catch (err) {
    console.log('Reward management failed silently:', err.message);
  }
}

module.exports = { rewardsManagement };
