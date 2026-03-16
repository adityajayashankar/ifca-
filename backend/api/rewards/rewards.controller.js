const { PrismaClient } = require("@prisma/client");
const { rewardsManagement } = require("../../services/rewards/rewards.service");
const prisma = new PrismaClient();
const { RewardType, RewardAction } = require('@prisma/client');

exports.getUserRewards = async (req, res) => {
const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // First check if the user exists
    const user = await prisma.unifiedUser.findUnique({
      where: {
        id: parseInt(userId, 10),
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Try to find the user's reward record
    let reward = await prisma.userReward.findUnique({
      where: {
        userId: parseInt(userId, 10),
      },
    });

    // If no reward record exists, create one with 0 points
    if (!reward) {
      reward = await prisma.userReward.create({
        data: {
          userId: parseInt(userId, 10),
          totalPoints: 0,
          credit: 0,
          debit: 0,
        },
      });
    }

    return res.status(200).json({
      userId: reward.userId,
      points: reward.totalPoints || 0,
    });
  } catch (error) {
    console.error('Error fetching user points:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}

exports.getAllRewardRules = async (req, res) => {
  try {
    const rules = await prisma.rewardRule.findMany({
      orderBy: { id: 'asc' },
    });

    res.status(200).json(rules);
  } catch (error) {
    console.error('Error fetching reward rules:', error);
    res.status(500).json({ error: 'Failed to fetch reward rules' });
  }
};

exports.updateRewardRules = async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ message: 'No updates provided' });
  }

  try {
    const updatedRecords = [];

    for (const rule of updates) {
      const { id, points, frequency, limit, isActive, expiryDays } = rule;

      if (!id || points == null || !frequency || (frequency !== 'ONCE' && (limit == null || limit <= 0))) {
        continue;
      }

      const updated = await prisma.rewardRule.update({
        where: { id },
        data: {
          points,
          frequency,
          limit: frequency === 'ONCE' ? 0 : limit,
          isActive,
          expiryDays: parseInt(expiryDays)

        },
      });

      updatedRecords.push(updated);
    }

    return res.status(200).json(updatedRecords);
  } catch (error) {
    console.error('Error in bulk update:', error);
    return res.status(500).json({ message: 'Error updating the rules' });
  }
};

exports.updateUserReward = async (req, res) => {
  
  const { userId, points } = req.body;
  console.log('update reward here-----', userId, points)

  if (!userId || points == null) {
    return res.status(400).json({ message: 'userId and points are required' });
  }

  try {
    const updated = await rewardsManagement({
      userId: parseInt(userId),
      type: RewardType.DEBIT,
      points,
      rewardRuleName: RewardAction.REDEEMED,
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating user reward:', error);
    return res.status(500).json({ message: 'Error updating user reward' });
  }
}

exports.getUserRewardHistory = async (req, res) => {

  const { userId } = req.params;

  try {
    const numericUserId = parseInt(userId);
    if (isNaN(numericUserId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const rewardSummary = await prisma.userReward.findUnique({
      where: { userId: numericUserId },
    });

    if (!rewardSummary) {
      return res.status(200).json({
        transactions: [],
        userId: numericUserId,
      });
    }

    const transactions = await prisma.userActivity.findMany({
      where: { userId: numericUserId },
      orderBy: { timestamp: "desc" },
      include: {
        rewardRule: true,
      },
    });

    const formattedTransactions = transactions.map((tx) => ({
      id: tx.id,
      action: tx.rewardAction,
      type: tx.type,
      points: tx.points,
      timestamp: tx.timestamp,
      expiryDate: tx.expiryDate,
      isExpired: tx.isExpired,
      ruleName: tx.rewardRule?.name || null,
    }));

    return res.json({
      userId: numericUserId,
      totalCredit: rewardSummary.credit,
      totalDebit: rewardSummary.debit,
      balance: rewardSummary.totalPoints,
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.error("Error fetching user reward history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}


