const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script to update existing users who have old DiceBear URLs to use UI Avatars
 */
async function updateAvatarUrls() {
  try {
    console.log('Starting avatar URL update...');

    // Find all users with DiceBear URLs
    const usersWithDiceBear = await prisma.user.findMany({
      where: {
        photoURL: {
          contains: 'api.dicebear.com'
        }
      }
    });

    console.log(`Found ${usersWithDiceBear.length} users with DiceBear URLs`);

    for (const user of usersWithDiceBear) {
      if (user.name && user.name.trim() !== '') {
        // Generate new UI Avatars URL
        const cleanName = user.name.trim().replace(/\s+/g, '+');
        const newPhotoURL = `https://ui-avatars.com/api/?name=${cleanName}&background=ffe5b4&color=000000&size=256&bold=true&format=png`;
        
        // Update the user
        await prisma.user.update({
          where: { id: user.id },
          data: { photoURL: newPhotoURL }
        });

        console.log(`Updated user ${user.name} (ID: ${user.id})`);
      }
    }

    // Also check partners
    const partnersWithDiceBear = await prisma.partner.findMany({
      where: {
        photoURL: {
          contains: 'api.dicebear.com'
        }
      }
    });

    console.log(`Found ${partnersWithDiceBear.length} partners with DiceBear URLs`);

    for (const partner of partnersWithDiceBear) {
      if (partner.name && partner.name.trim() !== '') {
        // Generate new UI Avatars URL
        const cleanName = partner.name.trim().replace(/\s+/g, '+');
        const newPhotoURL = `https://ui-avatars.com/api/?name=${cleanName}&background=ffe5b4&color=000000&size=256&bold=true&format=png`;
        
        // Update the partner
        await prisma.partner.update({
          where: { id: partner.id },
          data: { photoURL: newPhotoURL }
        });

        console.log(`Updated partner ${partner.name} (ID: ${partner.id})`);
      }
    }

    // Also check experts
    const expertsWithDiceBear = await prisma.expert.findMany({
      where: {
        photoURL: {
          contains: 'api.dicebear.com'
        }
      }
    });

    console.log(`Found ${expertsWithDiceBear.length} experts with DiceBear URLs`);

    for (const expert of expertsWithDiceBear) {
      if (expert.name && expert.name.trim() !== '') {
        // Generate new UI Avatars URL
        const cleanName = expert.name.trim().replace(/\s+/g, '+');
        const newPhotoURL = `https://ui-avatars.com/api/?name=${cleanName}&background=ffe5b4&color=000000&size=256&bold=true&format=png`;
        
        // Update the expert
        await prisma.expert.update({
          where: { id: expert.id },
          data: { photoURL: newPhotoURL }
        });

        console.log(`Updated expert ${expert.name} (ID: ${expert.id})`);
      }
    }

    console.log('Avatar URL update completed successfully!');
  } catch (error) {
    console.error('Error updating avatar URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if called directly
if (require.main === module) {
  updateAvatarUrls();
}

module.exports = updateAvatarUrls; 