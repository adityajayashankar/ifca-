const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const huddleService = require("../services/huddle/huddle.service");

/**
 * Script to delete all huddles and create one huddle per community
 * Usage: node backend/scripts/reset-huddles.js
 */
async function resetHuddles() {
  try {
    console.log("Starting huddle reset process...");

    // Step 1: Get all huddles
    console.log("\n1. Fetching all huddles...");
    const allHuddles = await prisma.huddle.findMany({
      include: {
        community: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
    console.log(`Found ${allHuddles.length} huddles`);

    // Step 2: End all live huddles first
    console.log("\n2. Ending live huddles...");
    const liveHuddles = allHuddles.filter(h => h.isLive);
    console.log(`Found ${liveHuddles.length} live huddles`);
    
    for (const huddle of liveHuddles) {
      try {
        // Update all attendances with leftAt time
        await prisma.huddleAttendance.updateMany({
          where: {
            huddleId: huddle.id,
            leftAt: null
          },
          data: {
            leftAt: new Date()
          }
        });

        // Update huddle status
        await prisma.huddle.update({
          where: { id: huddle.id },
          data: {
            isLive: false,
            endTime: new Date()
          }
        });
        console.log(`  ✓ Ended live huddle: ${huddle.title} (ID: ${huddle.id})`);
      } catch (error) {
        console.error(`  ✗ Error ending huddle ${huddle.id}:`, error.message);
      }
    }

    // Step 3: Delete all huddles
    console.log("\n3. Deleting all huddles...");
    const deleteResult = await prisma.huddle.deleteMany({});
    console.log(`  ✓ Deleted ${deleteResult.count} huddles`);

    // Step 4: Get only parent communities (exclude sub-communities)
    console.log("\n4. Fetching parent communities (excluding sub-communities)...");
    
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
    
    console.log(`Found ${childCommunityIds.size} sub-communities to exclude`);
    
    // Get all communities, excluding those that are children
    const allCommunities = await prisma.community.findMany({
      select: {
        id: true,
        title: true,
        desc: true
      }
    });
    
    // Filter out sub-communities (only keep parent communities)
    const communities = allCommunities.filter(
      community => !childCommunityIds.has(community.id)
    );
    
    console.log(`Found ${allCommunities.length} total communities`);
    console.log(`Found ${communities.length} parent communities (excluding ${childCommunityIds.size} sub-communities)`);

    if (communities.length === 0) {
      console.log("\n⚠ No parent communities found. Exiting.");
      return;
    }

    // Step 5: Get a default creator (first admin or first user)
    console.log("\n5. Finding default creator...");
    let defaultCreatorId = null;
    
    // Try to find an admin first
    const admin = await prisma.admin.findFirst({
      select: { id: true, email: true }
    });
    
    if (admin) {
      // Get unified user for admin
      const unifiedUser = await prisma.unifiedUser.findFirst({
        where: { adminId: admin.id },
        select: { id: true }
      });
      if (unifiedUser) {
        defaultCreatorId = unifiedUser.id;
        console.log(`  ✓ Using admin as creator (UnifiedUser ID: ${defaultCreatorId})`);
      }
    }
    
    // If no admin, try to find a user
    if (!defaultCreatorId) {
      const user = await prisma.user.findFirst({
        select: { id: true, email: true }
      });
      if (user) {
        const unifiedUser = await prisma.unifiedUser.findFirst({
          where: { userId: user.id },
          select: { id: true }
        });
        if (unifiedUser) {
          defaultCreatorId = unifiedUser.id;
          console.log(`  ✓ Using user as creator (UnifiedUser ID: ${defaultCreatorId})`);
        }
      }
    }
    
    if (!defaultCreatorId) {
      console.error("  ✗ No creator found. Cannot create huddles without a creator.");
      return;
    }

    // Step 6: Create one huddle per community
    console.log("\n6. Creating one huddle per community...");
    const defaultScheduledTime = new Date();
    defaultScheduledTime.setDate(defaultScheduledTime.getDate() + 1); // Tomorrow
    defaultScheduledTime.setHours(10, 0, 0, 0); // 10 AM

    const createdHuddles = [];
    const failedHuddles = [];

    for (const community of communities) {
      try {
        // Generate 100ms room ID
        let roomId = null;
        try {
          roomId = await huddleService.generateHuddleRoomId(community.id, `${community.title} Huddle`);
        } catch (error) {
          console.warn(`  ⚠ Failed to create 100ms room for community ${community.id}, will create on-demand`);
        }

        // Create huddle with default values
        const huddle = await prisma.huddle.create({
          data: {
            title: `${community.title} Huddle`,
            description: community.desc || `Weekly huddle for ${community.title}`,
            communityId: community.id,
            creatorId: defaultCreatorId,
            frequency: 'WEEKLY',
            scheduledTime: defaultScheduledTime,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            selectedActivities: ['AI_SLIDESHOW', 'DISCUSSION_TOPIC', 'ANNOUNCEMENT'],
            audienceType: 'ALL_MEMBERS',
            selectedMemberIds: [],
            locationType: 'DIGITAL',
            offlineLocation: null,
            leaderId: null,
            leaderSelectionType: 'RANDOM',
            isScheduled: true,
            isLive: false,
            roomId
          }
        });

        createdHuddles.push({ community: community.title, huddleId: huddle.id });
        console.log(`  ✓ Created huddle for "${community.title}" (ID: ${huddle.id})`);
      } catch (error) {
        failedHuddles.push({ community: community.title, error: error.message });
        console.error(`  ✗ Failed to create huddle for "${community.title}":`, error.message);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("RESET SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total huddles deleted: ${deleteResult.count}`);
    console.log(`Total communities: ${communities.length}`);
    console.log(`Huddles created successfully: ${createdHuddles.length}`);
    console.log(`Huddles failed: ${failedHuddles.length}`);

    if (createdHuddles.length > 0) {
      console.log("\n✓ Successfully created huddles:");
      createdHuddles.forEach(({ community, huddleId }) => {
        console.log(`  - ${community} (Huddle ID: ${huddleId})`);
      });
    }

    if (failedHuddles.length > 0) {
      console.log("\n✗ Failed to create huddles:");
      failedHuddles.forEach(({ community, error }) => {
        console.log(`  - ${community}: ${error}`);
      });
    }

    console.log("\n✓ Huddle reset process completed!");

  } catch (error) {
    console.error("\n✗ Error during huddle reset:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  resetHuddles()
    .then(() => {
      console.log("\nScript completed successfully.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nScript failed:", error);
      process.exit(1);
    });
}

module.exports = { resetHuddles };

