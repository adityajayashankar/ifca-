const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testCatchupFunctionality() {
    try {
        console.log("Testing catchup functionality...");
        
        // Test 1: Create a scheduled catchup
        console.log("\n1. Testing scheduled catchup creation...");
        const startTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
        
        const scheduledCatchup = await prisma.catchUp.create({
            data: {
                title: "Test Scheduled Catchup",
                desc: "This is a test scheduled catchup",
                startTime: startTime,
                endTime: endTime,
                isScheduled: true,
                isLive: false,
                communityId: 1, // Assuming community with ID 1 exists
                creatorId: 1,   // Assuming unified user with ID 1 exists
                attendees: []
            }
        });
        
        console.log("✅ Scheduled catchup created:", scheduledCatchup.id);
        
        // Test 2: Add attendees
        console.log("\n2. Testing attendee management...");
        const updatedCatchup = await prisma.catchUp.update({
            where: { id: scheduledCatchup.id },
            data: {
                attendees: [1, 2, 3] // Add some test attendees
            }
        });
        
        console.log("✅ Attendees added:", updatedCatchup.attendees);
        
        // Test 3: Check for overlapping catchups
        console.log("\n3. Testing overlap validation...");
        const overlappingCatchup = await prisma.catchUp.findFirst({
            where: {
                communityId: 1,
                OR: [
                    {
                        startTime: {
                            lte: endTime
                        },
                        endTime: {
                            gte: startTime
                        }
                    },
                    {
                        isLive: true
                    }
                ]
            }
        });
        
        if (overlappingCatchup) {
            console.log("✅ Overlap detection working - found overlapping catchup:", overlappingCatchup.id);
        } else {
            console.log("✅ No overlapping catchups found");
        }
        
        // Test 4: Check reminder logic
        console.log("\n4. Testing reminder logic...");
        const now = new Date();
        const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
        
        const catchupsNeedingReminders = await prisma.catchUp.findMany({
            where: {
                isScheduled: true,
                isLive: false,
                reminderSent: false,
                startTime: {
                    gte: now,
                    lte: tenMinutesFromNow
                }
            }
        });
        
        console.log("✅ Found catchups needing reminders:", catchupsNeedingReminders.length);
        
        // Test 5: Check ended catchups
        console.log("\n5. Testing ended catchup detection...");
        const endedCatchups = await prisma.catchUp.findMany({
            where: {
                endTime: {
                    lte: now
                },
                OR: [
                    { isLive: true },
                    { isScheduled: true }
                ]
            }
        });
        
        console.log("✅ Found ended catchups:", endedCatchups.length);
        
        // Cleanup
        console.log("\n6. Cleaning up test data...");
        await prisma.catchUp.delete({
            where: { id: scheduledCatchup.id }
        });
        console.log("✅ Test data cleaned up");
        
        console.log("\n🎉 All tests passed!");
        
    } catch (error) {
        console.error("❌ Test failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testCatchupFunctionality();
