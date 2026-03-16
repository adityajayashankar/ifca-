const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware to handle user deletion cleanup
prisma.$use(async (params, next) => {
  // Check if this is a delete operation on unifiedUser
  if (params.model === 'unifiedUser' && params.action === 'delete') {
    const userId = params.args.where.id;
    
    // Find all users that have this user in their arrays
    const affectedUsers = await prisma.unifiedUser.findMany({
      where: {
        OR: [
          {
            followers: {
              has: userId
            }
          },
          {
            following: {
              has: userId
            }
          },
          {
            selectedViewers: {
              has: userId
            }
          }
        ]
      }
    });

    // Update each affected user by removing the deleted user's ID
    await Promise.all(affectedUsers.map(user => 
      prisma.unifiedUser.update({
        where: { id: user.id },
        data: {
          followers: {
            set: user.followers.filter(id => id !== userId)
          },
          following: {
            set: user.following.filter(id => id !== userId)
          },
          selectedViewers: {
            set: user.selectedViewers.filter(id => id !== userId)
          }
        }
      })
    ));
  }
  
  return next(params);
});

// Export the prisma instance with middleware
module.exports = prisma; 