const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateHuddleRewards() {
  const huddleActions = [
    'CREATE_HUDDLE',
    'JOIN_HUDDLE', 
    'ATTEND_HUDDLE',
    'COMPLETE_HUDDLE_ACTIVITY'
  ];

  for (const action of huddleActions) {
    try {
      await prisma.rewardRule.update({
        where: { action },
        data: { 
          isActive: true,
          points: 10,
          frequency: 'PER_ACTION',
          limit: 100
        }
      });
      console.log(`Activated reward rule: ${action}`);
    } catch (error) {
      console.log(`Could not update ${action}:`, error.message);
    }
  }

  console.log('Huddle reward rules activated successfully.');
  await prisma.$disconnect();
  process.exit();
}

activateHuddleRewards().catch((err) => {
  console.error('Failed to activate huddle rewards:', err);
  process.exit(1);
});
