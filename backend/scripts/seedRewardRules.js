const { PrismaClient, RewardAction, Frequency } = require('@prisma/client');
const prisma = new PrismaClient();

const actionNames = {
  SIGN_UP: 'Sign Up',
  LOGIN: 'Login',
  PROFILE_COMPLETION: 'Complete Profile',
  JOIN_COMMUNITY: 'Join a Community',
  REGISTER_SESSION: 'Register for Session',
  ATTEND_SESSION: 'Attend a Session',
  CREATE_ANNOUNCEMENT: 'Create Announcement',
  CREATE_GREETING: 'Create Greeting',
  CREATE_ASK: 'Create Ask Post',
  CREATE_POLL: 'Create Poll',
  ANSWER_POLL: 'Answer Poll',
  REPLY_TO_POST: 'Reply to Thread/Post',
  ATTEND_COMPETITION: 'Attend Competition',
  CREATE_SERVICE: 'Create a Service',
  JOIN_COURSE: 'Join a Course',
  OPT_FOR_SERVICE: 'Opt for a Service',
  COMPLETE_COURSE: 'Complete a Course',
  REACT_TO_THREADS: 'React to Threads',
  START_CATCHUP: 'Start a Catch-Up',
  JOIN_CATCHUP: 'Join a Catch-Up',
  CREATE_FORM: 'Create a Form',
  REPLY_TO_FORM: 'Reply to a Form',
  REDEEM: 'Redeem',
  // Huddle actions
  CREATE_HUDDLE: 'Create a Huddle',
  JOIN_HUDDLE: 'Join a Huddle',
  ATTEND_HUDDLE: 'Attend a Huddle',
  COMPLETE_HUDDLE_ACTIVITY: 'Complete Huddle Activity'
};

async function seedRewardRules() {
  const actions = Object.values(RewardAction);

  for (const action of actions) {
    const exists = await prisma.rewardRule.findUnique({ where: { action } });

    if (!exists) {
      await prisma.rewardRule.create({
        data: {
          action,
          name: actionNames[action] || action,
          points: 0,
          frequency: Frequency.ONCE,
          limit: 1,
          isActive: false
        }
      });
    }
  }

  console.log('Reward rules seeded successfully.');
  process.exit();
}

seedRewardRules().catch((err) => {
  console.error('Failed to seed reward rules:', err);
  process.exit(1);
});
