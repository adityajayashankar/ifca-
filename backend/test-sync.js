const axios = require('axios');

// Test script to sync followers/following and test network connections
async function testSync() {
  try {
    const baseURL = 'http://localhost:5000';
    
    console.log('Testing sync and network connections...');
    
    // First, trigger the sync
    console.log('1. Triggering sync of all users...');
    const syncResponse = await axios.post(`${baseURL}/api/connections/sync-followers-following`, {}, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
      }
    });
    console.log('Sync response:', syncResponse.data);
    
    // Test network connections for a specific user (replace with actual user ID)
    console.log('\n2. Testing network connections...');
    const networkResponse = await axios.get(`${baseURL}/api/connections/network-connections/1`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
      }
    });
    console.log('Network response:', {
      followers: networkResponse.data.followers.length,
      following: networkResponse.data.following.length,
      mutual: networkResponse.data.mutual.length,
      counts: networkResponse.data.counts
    });
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testSync(); 