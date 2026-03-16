/**
 * Script to create 5 sessions for "Path of the Seeker" community (ID: 141)
 * 
 * Usage: node scripts/createSessionsForCommunity141.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateRoomId } = require('../utils/generateRoomId.js');

const COMMUNITY_ID = 141;

// Session data with realistic names and descriptions
const sessionsData = [
  {
    title: "Meditation and Mindfulness Fundamentals",
    desc: "Discover the art of meditation and learn fundamental mindfulness techniques to cultivate inner peace and awareness. This session will guide you through breathing exercises, body scan practices, and techniques to quiet the mind. Perfect for beginners and those looking to deepen their practice.",
    bannerImgs: [],
    infoImgs: [],
    tagsData: [
      { name: "Meditation" },
      { name: "Mindfulness" },
      { name: "Spiritual Growth" }
    ],
    slots: [
      {
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
        topicName: "Introduction to Meditation Practice",
        isOnline: true,
        isActive: true,
        participantLimit: 50,
        price: 0,
        credits: 10,
        location: "",
        expert_link: ""
      }
    ]
  },
  {
    title: "Self-Discovery Through Journaling",
    desc: "Explore the transformative power of journaling as a tool for self-reflection and personal growth. Learn different journaling techniques including gratitude journaling, stream-of-consciousness writing, and reflective prompts. This session will help you develop a deeper understanding of yourself and your life's journey.",
    bannerImgs: [],
    infoImgs: [],
    tagsData: [
      { name: "Self-Discovery" },
      { name: "Journaling" },
      { name: "Personal Growth" }
    ],
    slots: [
      {
        startTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 1.5 hours later
        topicName: "Journaling Techniques for Self-Awareness",
        isOnline: true,
        isActive: true,
        participantLimit: 40,
        price: 0,
        credits: 8,
        location: "",
        expert_link: ""
      }
    ]
  },
  {
    title: "The Path of Gratitude: Cultivating Thankfulness",
    desc: "Learn how practicing gratitude can transform your perspective and enhance your spiritual journey. This session covers gratitude exercises, the science behind gratitude, and practical ways to incorporate gratitude into your daily life. Discover how appreciation opens doors to greater joy and fulfillment.",
    bannerImgs: [],
    infoImgs: [],
    tagsData: [
      { name: "Gratitude" },
      { name: "Spiritual Practice" },
      { name: "Wellness" }
    ],
    slots: [
      {
        startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
        topicName: "Building a Gratitude Practice",
        isOnline: true,
        isActive: true,
        participantLimit: 60,
        price: 0,
        credits: 12,
        location: "",
        expert_link: ""
      }
    ]
  },
  {
    title: "Connecting with Your Inner Wisdom",
    desc: "Discover how to access your inner guidance and intuition. This session explores techniques for quieting external noise, listening to your inner voice, and trusting your instincts. Learn to distinguish between fear-based thoughts and wisdom-based insights on your path of self-discovery.",
    bannerImgs: [],
    infoImgs: [],
    tagsData: [
      { name: "Intuition" },
      { name: "Inner Wisdom" },
      { name: "Self-Realization" }
    ],
    slots: [
      {
        startTime: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000), // 17 days from now
        endTime: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
        topicName: "Accessing Your Intuitive Guidance",
        isOnline: true,
        isActive: true,
        participantLimit: 45,
        price: 0,
        credits: 15,
        location: "",
        expert_link: ""
      }
    ]
  },
  {
    title: "Building Meaningful Connections in Community",
    desc: "Explore the importance of authentic relationships and community in your spiritual journey. Learn how to create deeper connections, practice active listening, and build a supportive network of like-minded seekers. This session emphasizes the value of shared experiences and mutual growth.",
    bannerImgs: [],
    infoImgs: [],
    tagsData: [
      { name: "Community" },
      { name: "Connection" },
      { name: "Relationships" }
    ],
    slots: [
      {
        startTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        endTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
        topicName: "Fostering Authentic Community Bonds",
        isOnline: true,
        isActive: true,
        participantLimit: 55,
        price: 0,
        credits: 10,
        location: "",
        expert_link: ""
      }
    ]
  }
];

async function createSessions() {
  try {
    console.log('🚀 Creating 5 sessions for "Path of the Seeker" community (ID: 141)...\n');

    // Verify community exists
    const community = await prisma.community.findUnique({
      where: { id: COMMUNITY_ID },
      select: { id: true, title: true }
    });

    if (!community) {
      console.error(`❌ Error: Community with ID ${COMMUNITY_ID} not found!`);
      process.exit(1);
    }

    console.log(`✓ Community found: ${community.title} (ID: ${community.id})\n`);

    // Get a creator (use first available unifiedUser)
    const creator = await prisma.unifiedUser.findFirst({
      select: { id: true, email: true }
    });

    if (!creator) {
      console.error(`❌ Error: No users found in database!`);
      console.log('💡 Tip: You need at least one user to create sessions.');
      process.exit(1);
    }

    console.log(`✓ Using creator: ${creator.email} (ID: ${creator.id})\n`);

    const createdSessions = [];

    // Create each session
    for (let i = 0; i < sessionsData.length; i++) {
      const sessionData = sessionsData[i];
      console.log(`📝 Creating session ${i + 1}/5: "${sessionData.title}"...`);

      try {
        // Generate unique roomId with session-specific name
        const roomId = await generateRoomId(`Session: ${sessionData.title.substring(0, 50)}`);

        // Prepare session slots - convert dates to ISO strings
        const slots = sessionData.slots.map(slot => ({
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          topicName: slot.topicName,
          isOnline: slot.isOnline,
          isActive: slot.isActive,
          isLive: false, // Sessions are not live when created
          participantLimit: slot.participantLimit,
          price: slot.price,
          credits: slot.credits,
          location: slot.location || "",
          expert_link: slot.expert_link || ""
        }));

        // Create session
        const createdSession = await prisma.session.create({
          data: {
            title: sessionData.title,
            desc: sessionData.desc,
            bannerImgs: sessionData.bannerImgs || [],
            infoImgs: sessionData.infoImgs || [],
            communityId: COMMUNITY_ID,
            creatorId: creator.id,
            roomId: roomId,
            isActive: true,
            isApproved: true,
            isCourse: false,
            isExclusive: false,
            isVideoChannel: false,
            SessionSlot: {
              create: slots
            }
          },
          include: {
            SessionSlot: true
          }
        });

        // Create tags
        if (sessionData.tagsData && sessionData.tagsData.length > 0) {
          const tagPromises = sessionData.tagsData.map(async (tagData) => {
            // Check if tag exists
            const existingTag = await prisma.tag.findFirst({
              where: { name: tagData.name }
            });

            if (existingTag) {
              // Connect existing tag
              return prisma.sessionTags.create({
                data: {
                  tag: { connect: { id: existingTag.id } },
                  session: { connect: { id: createdSession.id } }
                }
              });
            } else {
              // Create new tag
              return prisma.sessionTags.create({
                data: {
                  tag: { create: { name: tagData.name } },
                  session: { connect: { id: createdSession.id } }
                }
              });
            }
          });

          await Promise.all(tagPromises);
          console.log(`   ✓ Tags created: ${sessionData.tagsData.map(t => t.name).join(', ')}`);
        }

        createdSessions.push({
          id: createdSession.id,
          title: createdSession.title,
          slots: createdSession.SessionSlot.length
        });

        console.log(`   ✅ Session created successfully! (ID: ${createdSession.id})\n`);

      } catch (error) {
        console.error(`   ❌ Error creating session "${sessionData.title}":`, error.message);
        if (error.code === 'P2002') {
          console.error(`   ⚠️  Room ID conflict - this session may already exist`);
        }
        console.log('');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created ${createdSessions.length} sessions:\n`);
    
    createdSessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.title}`);
      console.log(`   ID: ${session.id} | Slots: ${session.slots}`);
    });

    console.log(`\n🔗 View sessions at: http://localhost:3001/community/${COMMUNITY_ID}`);
    console.log(`   Or via API: GET http://localhost:5000/api/v1/community/${COMMUNITY_ID}/session\n`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error.code === 'P2002') {
      console.error('   Unique constraint violation - check for duplicate roomIds');
    }
    if (error.code === 'P2003') {
      console.error('   Foreign key constraint failed - verify community/user IDs exist');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSessions();

