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
        
        // Test 3: Try the auth_userkey_request_login_url function
        console.log('\n3. Testing auth_userkey_request_login_url...');
        try {
            const userKeyResponse = await axios.get(`${process.env.MOODLE_URL}/webservice/rest/server.php`, {
                params: {
                    wstoken: process.env.MOODLE_API_TOKEN,
                    wsfunction: 'auth_userkey_request_login_url',
                    moodlewsrestformat: 'json',
                    'user[username]': 'admin'
                }
            });
            
            console.log('User key response:', userKeyResponse.data);
        } catch (userKeyError) {
            console.log('User key error:', userKeyError.response?.data || userKeyError.message);
            
            // Test 4: Fallback to token-based login
            console.log('\n4. Testing fallback token-based login...');
            const tokenResponse = await axios.post(`${process.env.MOODLE_URL}/login/token.php`, null, {
                params: {
                    username: 'admin',
                    password: process.env.MOODLE_DEFAULT_PASSWORD || 'admin',
                    service: 'moodle_mobile_app'
                }
            });
            
            console.log('Token response:', tokenResponse.data);
        }
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testMoodleAPI();

