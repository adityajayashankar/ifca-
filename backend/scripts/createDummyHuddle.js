/**
 * Script to create a dummy huddle with AI activities for testing
 * 
 * Usage: node scripts/createDummyHuddle.js
 * 
 * Make sure to update the variables below with your actual IDs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const huddleService = require('../services/huddle/huddle.service');

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

// Get a community ID from your database
const COMMUNITY_ID = 141; // Change this to an existing community ID

// Get a user ID from your database (this will be the creator)
const CREATOR_ID = 1; // Change this to an existing user ID

// Optional: Set a leader ID (can be same as creator or different user)
const LEADER_ID = 1; // Change this to an existing user ID or null

// Scheduled time (must be in the future)
const SCHEDULED_TIME = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

// ============================================
// HUDDLE CONFIGURATION
// ============================================

const huddleData = {
  title: "Weekly Spiritual Growth Circle - Path of the Seeker",
  description: "Join us for our weekly gathering focused on spiritual growth, self-realization, and community connection. This huddle features AI-generated content including inspirational slideshows, guided meditation sessions, reflection exercises, and engaging discussions to deepen your spiritual journey. We'll explore topics related to mindfulness, personal development, and the path of self-discovery together as a community.",
  communityId: COMMUNITY_ID,
  creatorId: CREATOR_ID,
  frequency: "WEEKLY", // Options: DAILY, WEEKLY, FORTNIGHTLY, MONTHLY, ONE_TIME
  scheduledTime: SCHEDULED_TIME.toISOString(),
  timezone: "UTC",
  selectedActivities: [
    "AI_SLIDESHOW",
    "AI_VIDEO_MESSAGE",
    "DISCUSSION_TOPIC",
    "QUIZ",
    "VOTING_SURVEY",
    "REFLECTION",
    "GUIDED_SESSION",
    "STORY_SPOTLIGHT",
    "ANNOUNCEMENT"
  ],
  audienceType: "ALL_MEMBERS", // Options: ALL_MEMBERS, SELECTED_MEMBERS
  selectedMemberIds: [], // Empty for ALL_MEMBERS, or array of user IDs for SELECTED_MEMBERS
  locationType: "DIGITAL", // Options: DIGITAL, OFFLINE, HYBRID
  offlineLocation: null, // Set if locationType is OFFLINE or HYBRID
  leaderId: LEADER_ID,
  leaderSelectionType: "USER" // Options: USER, RANDOM, FIRST_LOGIN, ROUNDROBIN
};

// ============================================
// SCRIPT EXECUTION
// ============================================

async function createDummyHuddle() {
  try {
    console.log('🚀 Creating dummy huddle...\n');
    console.log('Configuration:');
    console.log(`  Title: ${huddleData.title}`);
    console.log(`  Community ID: ${huddleData.communityId}`);
    console.log(`  Creator ID: ${huddleData.creatorId}`);
    console.log(`  Scheduled Time: ${huddleData.scheduledTime}`);
    console.log(`  Activities: ${huddleData.selectedActivities.length} activities\n`);

    // Verify community exists
    const community = await prisma.community.findUnique({
      where: { id: huddleData.communityId },
      select: { id: true, title: true }
    });

    if (!community) {
      console.error(`❌ Error: Community with ID ${huddleData.communityId} not found!`);
      console.log('\n💡 Tip: Run this query to find available communities:');
      console.log('   SELECT id, title FROM "Community" LIMIT 10;');
      process.exit(1);
    }

    console.log(`✓ Community found: ${community.title} (ID: ${community.id})`);

    // Verify creator exists
    const creator = await prisma.unifiedUser.findUnique({
      where: { id: huddleData.creatorId },
      select: { id: true, email: true }
    });

    if (!creator) {
      console.error(`❌ Error: User with ID ${huddleData.creatorId} not found!`);
      console.log('\n💡 Tip: Run this query to find available users:');
      console.log('   SELECT id, email FROM "unifiedUser" LIMIT 10;');
      process.exit(1);
    }

    console.log(`✓ Creator found: ${creator.email} (ID: ${creator.id})`);

    // Create huddle using the service (this will trigger activity generation)
    const huddle = await prisma.huddle.create({
      data: {
        title: huddleData.title,
        description: huddleData.description || "",
        communityId: huddleData.communityId,
        creatorId: huddleData.creatorId,
        frequency: huddleData.frequency,
        scheduledTime: new Date(huddleData.scheduledTime),
        timezone: huddleData.timezone || "UTC",
        selectedActivities: huddleData.selectedActivities,
        audienceType: huddleData.audienceType || "ALL_MEMBERS",
        selectedMemberIds: huddleData.selectedMemberIds || [],
        locationType: huddleData.locationType || "DIGITAL",
        offlineLocation: huddleData.offlineLocation || null,
        roomId: await huddleService.generateHuddleRoomId(huddleData.communityId),
        leaderId: huddleData.leaderId ? huddleData.leaderId : null,
        leaderSelectionType: huddleData.leaderSelectionType || "USER",
        isScheduled: true,
        isLive: false
      },
      include: {
        community: {
          select: {
            id: true,
            title: true
          }
        },
        creator: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    console.log(`\n✅ Huddle created successfully!`);
    console.log(`   Huddle ID: ${huddle.id}`);
    console.log(`   Title: ${huddle.title}`);
    console.log(`   Community: ${huddle.community.title}`);
    console.log(`   Creator: ${huddle.creator.email}`);
    console.log(`   Scheduled: ${huddle.scheduledTime.toISOString()}`);

    // Create activities (this will trigger AI generation in background)
    console.log(`\n📝 Creating activities...`);
    await huddleService.createHuddleActivities(
      huddle.id,
      huddleData.selectedActivities,
      huddleData.creatorId
    );

    console.log(`✅ ${huddleData.selectedActivities.length} activities created!`);
    console.log(`\n⏳ AI generation is happening in the background...`);
    console.log(`   Activities will be generated asynchronously.`);
    console.log(`   Check the huddle details to see generation status.`);
    console.log(`\n🔗 View huddle at: http://localhost:3001/huddle/${huddle.id}`);
    console.log(`   Or via API: GET http://localhost:5000/api/v1/huddle/${huddle.id}\n`);

    // Wait a bit to show initial status
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check activity status
    const activities = await prisma.huddleActivity.findMany({
      where: { huddleId: huddle.id },
      select: {
        id: true,
        activityType: true,
        isGenerated: true,
        activityData: true
      }
    });

    console.log(`\n📊 Activity Status:`);
    activities.forEach((activity, index) => {
      const status = activity.activityData?.status || 'pending';
      const statusIcon = status === 'completed' ? '✅' : status === 'generating' ? '⏳' : status === 'failed' ? '❌' : '⏸️';
      console.log(`   ${index + 1}. ${statusIcon} ${activity.activityType} - ${status}`);
    });

    console.log(`\n💡 Note: Activity generation happens asynchronously.`);
    console.log(`   Check back in a few minutes to see completed activities.`);
    console.log(`   You can also check activity status via API:`);
    console.log(`   GET http://localhost:5000/api/v1/huddle/activity/{activityId}/status\n`);

  } catch (error) {
    console.error('\n❌ Error creating huddle:', error);
    if (error.code === 'P2002') {
      console.error('   This might be a unique constraint violation.');
    }
    if (error.code === 'P2003') {
      console.error('   Foreign key constraint failed. Check if community/user IDs exist.');
    }
    console.error('\nFull error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createDummyHuddle();


