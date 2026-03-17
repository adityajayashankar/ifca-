require('dotenv').config();
const axios = require('axios');

async function testMoodleAPI() {
  try {
    console.log('Testing Moodle API connection...');
    console.log('MOODLE_URL:', process.env.MOODLE_URL);
    console.log('MOODLE_API_TOKEN:', process.env.MOODLE_API_TOKEN ? 'SET' : 'NOT SET');
    
    // Test 1: Check if we can connect to Moodle
    console.log('\n1. Testing basic Moodle connection...');
    const siteInfoResponse = await axios.get(`${process.env.MOODLE_URL}/webservice/rest/server.php`, {
      params: {
        wstoken: process.env.MOODLE_API_TOKEN,
        wsfunction: 'core_webservice_get_site_info',
        moodlewsrestformat: 'json'
      }
    });
    
    console.log('Site info response:', siteInfoResponse.data);
    
    // Test 2: Check if admin user exists
    console.log('\n2. Testing user lookup for admin...');
    const userCheckResponse = await axios.get(`${process.env.MOODLE_URL}/webservice/rest/server.php`, {
      params: {
        wstoken: process.env.MOODLE_API_TOKEN,
        wsfunction: 'core_user_get_users_by_field',
        moodlewsrestformat: 'json',
        field: 'username',
        values: ['admin']
      }
    });
    
    console.log('User check response:', userCheckResponse.data);
  } catch (error) {
    console.error('Error testing Moodle API:', error);
  }
}
