const { PrismaClient, RewardAction, Frequency } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateAuthRewards() {
  try {
    // Activate SIGN_UP reward rule
    await prisma.rewardRule.upsert({
      where: { action: RewardAction.SIGN_UP },
      update: {
        points: 100,
        frequency: Frequency.ONCE,
        limit: 1,
        isActive: true,
        name: 'Sign Up'
      },
      create: {
        action: RewardAction.SIGN_UP,
        name: 'Sign Up',
        points: 100,
        frequency: Frequency.ONCE,
        limit: 1,
        isActive: true
      }
    });

    // Activate LOGIN reward rule
    await prisma.rewardRule.upsert({
      where: { action: RewardAction.LOGIN },
      update: {
        points: 10,
        frequency: Frequency.DAILY,
        limit: 1,
        isActive: true,
        name: 'Login'
      },
      create: {
        action: RewardAction.LOGIN,
        name: 'Login',
        points: 10,
        frequency: Frequency.DAILY,
        limit: 1,
        isActive: true
      }
    });

    console.log('✅ Auth reward rules activated successfully:');
    console.log('   - SIGN_UP: 100 points (once)');
    console.log('   - LOGIN: 10 points (daily)');
    
  } catch (error) {
    console.error('❌ Error activating auth rewards:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

activateAuthRewards(); 