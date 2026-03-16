const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { rewardsManagement } = require("../../services/rewards/rewards.service");
const { RewardType, RewardAction } = require('@prisma/client');

const updateRewardPoints = async (userId, pointsToAdd) => {
  try {
    // Use the new reward system instead of the old prisma.reward
    await rewardsManagement({
        userId: parseInt(userId),
      rewardRuleName: RewardAction.REDEEMED, // Using REDEEMED as a generic action
      type: RewardType.CREDIT,
        points: pointsToAdd
    });
    
    // Get the updated user reward record
    const userReward = await prisma.userReward.findUnique({
      where: { userId: parseInt(userId) }
    });
    
    return userReward;
  } catch (error) {
    console.error('Error in updating reward points:', error);
    throw new Error('Unable to update reward points.');
  }
};

module.exports = {
  updateRewardPoints
};
