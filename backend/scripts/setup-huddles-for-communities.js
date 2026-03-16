const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const huddleService = require("../services/huddle/huddle.service");
const huddleNotificationService = require("../services/huddle/huddle-notification.service");

/**
 * Script to delete all huddles and create new huddles for parent communities
 * with daily, weekly, and monthly frequencies
 * Special: Community 141 gets daily huddle with all activities
 * Usage: node backend/scripts/setup-huddles-for-communities.js
 */

// All available activity types
const ALL_ACTIVITIES = [
  'AI_SLIDESHOW',
  'AI_VIDEO_MESSAGE',
  'DISCUSSION_TOPIC',
  'QUIZ',
  'DEBATE',
  'CONTEST',
  'VOTING_SURVEY',
  'REFLECTION',
  'GUIDED_SESSION',
  'STORY_SPOTLIGHT',
  'ANNOUNCEMENT'
];

// Default activities for regular communities (subset)
const DEFAULT_ACTIVITIES = [
  'AI_SLIDESHOW',
  'DISCUSSION_TOPIC',
  'QUIZ',
  'VOTING_SURVEY',
  'REFLECTION'
];

async function setupHuddles() {
  try {
    console.log("=".repeat(60));
    console.log("Starting huddle setup for parent communities...");
    console.log("=".repeat(60));

    // Step 1: Delete all existing huddles
    console.log("\n1. Deleting all existing huddles...");
    
    // First, end all live huddles
    const liveHuddles = await prisma.huddle.findMany({
      where: { isLive: true }
    });
    
    if (liveHuddles.length > 0) {
      console.log(`   Found ${liveHuddles.length} live huddles, ending them first...`);
      for (const huddle of liveHuddles) {
        try {
          await prisma.huddleAttendance.updateMany({
            where: {
              huddleId: huddle.id,
              leftAt: null
            },
            data: {
              leftAt: new Date()
            }
          });
          
          await prisma.huddle.update({
            where: { id: huddle.id },
            data: {
              isLive: false,
              endTime: new Date()
            }
          });
        } catch (error) {
          console.error(`   Error ending huddle ${huddle.id}:`, error.message);
        }
      }
    }
    
    // Delete all huddles
    const deleteResult = await prisma.huddle.deleteMany({});
    console.log(`   ✓ Deleted ${deleteResult.count} huddles`);

    // Step 2: Get parent communities (exclude sub-communities)
    console.log("\n2. Fetching parent communities...");
    
    // Get all community mappings to identify child communities
    const communityMappings = await prisma.communityMapping.findMany({
      select: {
        childCommunityId: true
      }
    });
    
    // Extract all child community IDs
    const childCommunityIds = new Set(
      communityMappings.map(mapping => mapping.childCommunityId)
    );
    
    console.log(`   Found ${childCommunityIds.size} sub-communities to exclude`);
    
    // Get all communities
    const allCommunities = await prisma.community.findMany({
      select: {
        id: true,
        title: true,
        desc: true,
        creatorId: true
      },
      where: {
        isArchived: false
      }
    });
    
    // Filter out sub-communities (only keep parent communities)
    const parentCommunities = allCommunities.filter(
      community => !childCommunityIds.has(community.id)
    );
    
    console.log(`   Found ${allCommunities.length} total communities`);
    console.log(`   Found ${parentCommunities.length} parent communities`);
    
    if (parentCommunities.length === 0) {
      console.log("\n⚠ No parent communities found. Exiting.");
      return;
    }

    // Step 3: Create huddles for each parent community
    console.log("\n3. Creating huddles for parent communities...");
    
    const now = new Date();
    const createdHuddles = [];
    
    for (const community of parentCommunities) {
      try {
        // Determine activities and frequencies based on community
        let activities = DEFAULT_ACTIVITIES;
        let frequencies = ['DAILY', 'WEEKLY', 'FORTNIGHTLY'];
        
        // Special handling for community 141
        if (community.id === 141) {
          activities = ALL_ACTIVITIES; // All activities for community 141
          frequencies = ['DAILY']; // Only daily for community 141
          console.log(`\n   Special: Community 141 - Creating DAILY huddle with ALL activities`);
        }
        
        // Create huddles for each frequency
        for (const frequency of frequencies) {
          // Calculate scheduled time based on frequency
          let scheduledTime = new Date(now);
          
          switch (frequency) {
            case 'DAILY':
              // Schedule for tomorrow at 9 AM
              scheduledTime.setDate(scheduledTime.getDate() + 1);
              scheduledTime.setHours(9, 0, 0, 0);
              break;
            case 'WEEKLY':
              // Schedule for next week same day at 9 AM
              scheduledTime.setDate(scheduledTime.getDate() + 7);
              scheduledTime.setHours(9, 0, 0, 0);
              break;
            case 'FORTNIGHTLY':
              // Schedule for 2 weeks from now at 9 AM
              scheduledTime.setDate(scheduledTime.getDate() + 14);
              scheduledTime.setHours(9, 0, 0, 0);
              break;
          }
          
          // Generate room ID
          let roomId = null;
          try {
            roomId = await huddleService.generateHuddleRoomId(community.id, `${community.title} - ${frequency}`);
          } catch (error) {
            console.warn(`   Warning: Failed to generate room ID for community ${community.id}, will create on-demand`);
          }
          
          // Create huddle
          const huddle = await prisma.huddle.create({
            data: {
              title: `${community.title} - ${frequency}`,
              description: `Recurring ${frequency.toLowerCase()} huddle for ${community.title}`,
              communityId: community.id,
              creatorId: community.creatorId,
              frequency: frequency,
              scheduledTime: scheduledTime,
              timezone: "UTC",
              selectedActivities: activities,
              audienceType: "ALL_MEMBERS",
              selectedMemberIds: [],
              locationType: "DIGITAL",
              offlineLocation: null,
              roomId: roomId,
              leaderId: null,
              leaderSelectionType: "RANDOM",
              isScheduled: true,
              isLive: false
            },
            include: {
              community: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          });
          
          // Create activities for the huddle
          await huddleService.createHuddleActivities(huddle.id, activities, community.creatorId);
          
          createdHuddles.push({
            id: huddle.id,
            title: huddle.title,
            communityId: community.id,
            communityTitle: community.title,
            frequency: frequency,
            scheduledTime: scheduledTime,
            activityCount: activities.length
          });
          
          console.log(`   ✓ Created ${frequency} huddle for community ${community.id} (${community.title})`);
          console.log(`     Huddle ID: ${huddle.id}, Scheduled: ${scheduledTime.toISOString()}, Activities: ${activities.length}`);
        }
        
      } catch (error) {
        console.error(`   ✗ Error creating huddles for community ${community.id} (${community.title}):`, error.message);
        console.error(`     Stack:`, error.stack);
      }
    }
    
    // Step 4: Summary
    console.log("\n" + "=".repeat(60));
    console.log("HUDDLE SETUP COMPLETE");
    console.log("=".repeat(60));
    console.log(`\nTotal huddles created: ${createdHuddles.length}`);
    console.log(`Total communities processed: ${parentCommunities.length}`);
    
    // Group by frequency
    const byFrequency = createdHuddles.reduce((acc, h) => {
      acc[h.frequency] = (acc[h.frequency] || 0) + 1;
      return acc;
    }, {});
    
    console.log("\nHuddles by frequency:");
    Object.entries(byFrequency).forEach(([freq, count]) => {
      console.log(`  ${freq}: ${count}`);
    });
    
    // Special note for community 141
    const community141Huddles = createdHuddles.filter(h => h.communityId === 141);
    if (community141Huddles.length > 0) {
      console.log("\nCommunity 141 (Special):");
      community141Huddles.forEach(h => {
        console.log(`  - ${h.frequency} huddle (ID: ${h.id}) with ${h.activityCount} activities`);
      });
    }
    
    console.log("\n" + "=".repeat(60));
    
  } catch (error) {
    console.error("\n❌ Fatal error in setupHuddles:", error);
    console.error("Stack:", error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  setupHuddles()
    .then(() => {
      console.log("\n✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = { setupHuddles };

