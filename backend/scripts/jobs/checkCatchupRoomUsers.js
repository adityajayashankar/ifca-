const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const uuid4 = require('uuid4');
const prisma = new PrismaClient();

// Helper function to check if error is a database connection error
function isDatabaseConnectionError(error) {
    return error?.name === 'PrismaClientInitializationError' || 
           error?.message?.includes("Can't reach database server") ||
           error?.message?.includes("database server is running");
}

async function get100msToken() {
  const app_access_key = process.env.MS_APP_ACCESS_KEY;
  const app_secret_key = process.env.MS_APP_SECRET_KEY;
  const payload = {
    access_key: app_access_key,
    type: 'management',
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
    jti: uuid4()
  };
  return jwt.sign(payload, app_secret_key);
}

async function checkCatchupRoomUsers() {
  try {
    console.log('Starting catchup room user check...');
    
    // Get all live catchups with roomId
    const liveCatchups = await prisma.catchUp.findMany({
      where: {
        isLive: true,
        roomId: { not: null }
      },
      include: {
        community: {
          select: { id: true, title: true }
        }
      }
    });

    console.log(`Found ${liveCatchups.length} live catchups to check`);

    const token = await get100msToken();
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    for (const catchup of liveCatchups) {
      try {
        // Check if catchup is older than 1 minute (wait before first check)
        const catchupAge = Date.now() - new Date(catchup.createdAt).getTime();
        const oneMinute = 60 * 1000; // 1 minute in milliseconds
        
        if (catchupAge < oneMinute) {
          console.log(`Catchup ${catchup.id} (${catchup.roomId}): Too new (${Math.round(catchupAge/1000)}s), skipping check`);
          continue;
        }

        const url = `https://api.100ms.live/v2/active-rooms/${catchup.roomId}/peers`;
        const response = await axios.get(url, config);
        const peers = response.data.peers || {};
        const hasActive = Object.keys(peers).length > 0;
        
        if (hasActive) {
          // Ensure isLive true
          await prisma.catchUp.update({ where: { id: catchup.id }, data: { isLive: true } });
          if (catchup.communityId) {
            await prisma.community.update({ where: { id: catchup.communityId }, data: { isCatchupLive: true } });
          }
          console.log(`Catchup ${catchup.id} (${catchup.roomId}): ACTIVE (${Object.keys(peers).length} users)`);
        } else {
          // Check if catchup has been empty for 15 minutes
          const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
          const lastActivityTime = catchup.updatedAt || catchup.createdAt;
          const timeSinceLastActivity = Date.now() - new Date(lastActivityTime).getTime();
          
          if (timeSinceLastActivity >= fifteenMinutes) {
            // Mark as inactive after 15 minutes of no activity
            await prisma.catchUp.update({ where: { id: catchup.id }, data: { isLive: false } });
            if (catchup.communityId) {
              await prisma.community.update({ where: { id: catchup.communityId }, data: { isCatchupLive: false } });
            }
            console.log(`Catchup ${catchup.id} (${catchup.roomId}): INACTIVE (empty for 15+ minutes)`);
          } else {
            console.log(`Catchup ${catchup.id} (${catchup.roomId}): EMPTY but not yet inactive (${Math.round(timeSinceLastActivity/1000)}s since last activity)`);
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 404 && error.response.data?.message === 'session not active') {
          // Room not active on 100ms - check if it's been 15 minutes
          const fifteenMinutes = 15 * 60 * 1000;
          const lastActivityTime = catchup.updatedAt || catchup.createdAt;
          const timeSinceLastActivity = Date.now() - new Date(lastActivityTime).getTime();
          
          if (timeSinceLastActivity >= fifteenMinutes) {
            await prisma.catchUp.update({ where: { id: catchup.id }, data: { isLive: false } });
            if (catchup.communityId) {
              await prisma.community.update({ where: { id: catchup.communityId }, data: { isCatchupLive: false } });
            }
            console.log(`Catchup ${catchup.id} (${catchup.roomId}): INACTIVE (room not active on 100ms, empty for 15+ minutes)`);
          } else {
            console.log(`Catchup ${catchup.id} (${catchup.roomId}): Room not active but not yet inactive (${Math.round(timeSinceLastActivity/1000)}s since last activity)`);
          }
        } else {
          console.error(`Error checking room ${catchup.roomId}:`, error.message);
        }
      }
    }
    
    console.log('Catchup room user check completed');
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      console.log('Database unavailable, skipping catchup room users check');
      return;
    }
    console.error('Error in checkCatchupRoomUsers:', error);
  }
}

module.exports = checkCatchupRoomUsers; 