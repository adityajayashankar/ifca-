const axios = require('axios');
require('dotenv').config();

const MOODLE_API_URL = process.env.MOODLE_API_URL;
const MOODLE_API_TOKEN = process.env.MOODLE_API_TOKEN;

console.log('🔍 Moodle API Token Diagnostics');
console.log('================================');

// Check environment variables
console.log('\n1. Environment Variables:');
console.log(`   MOODLE_API_URL: ${MOODLE_API_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`   MOODLE_API_TOKEN: ${MOODLE_API_TOKEN ? '✅ Set' : '❌ Not set'}`);

if (!MOODLE_API_URL) {
    console.log('\n❌ MOODLE_API_URL is not set in your .env file');
    console.log('   Please add: MOODLE_API_URL=https://your-moodle-site.com/webservice/rest/server.php');
    process.exit(1);
}

if (!MOODLE_API_TOKEN) {
    console.log('\n❌ MOODLE_API_TOKEN is not set in your .env file');
    console.log('   Please add: MOODLE_API_TOKEN=your_moodle_token_here');
    console.log('\n   To get a token:');
    console.log('   1. Log into your Moodle admin panel');
    console.log('   2. Go to Site administration > Plugins > Web services > External services');
    console.log('   3. Create or edit a service and enable the required functions');
    console.log('   4. Go to Site administration > Plugins > Web services > Manage tokens');
    console.log('   5. Create a new token for your service');
    process.exit(1);
}

// Test token format
console.log('\n2. Token Format Validation:');
if (/^[a-zA-Z0-9]+$/.test(MOODLE_API_TOKEN)) {
    console.log('   ✅ Token format appears valid (alphanumeric)');
} else {
    console.log('   ⚠️  Token format may be invalid (contains special characters)');
}

// Test API connection
console.log('\n3. Testing Moodle API Connection...');

async function testMoodleAPI() {
    try {
        // Try multiple functions to test token permissions
        const testFunctions = [
            'core_webservice_get_site_info',
            'core_course_get_courses',
            'core_user_get_users_by_field'
        ];

        let success = false;
        let lastError = null;

        for (const wsfunction of testFunctions) {
            try {
                console.log(`   Testing function: ${wsfunction}...`);
                const response = await axios.get(MOODLE_API_URL, {
                    params: {
                        wstoken: MOODLE_API_TOKEN,
                        wsfunction: wsfunction,
                        moodlewsrestformat: 'json'
                    },
                    timeout: 10000
                });

                if (response.data.errorcode) {
                    console.log(`      ❌ ${response.data.errorcode}: ${response.data.message || response.data.error}`);
                    lastError = response.data;
                } else {
                    console.log(`      ✅ Function ${wsfunction} works!`);
                    success = true;
                    break;
                }
            } catch (error) {
                console.log(`      ❌ Error: ${error.message}`);
                lastError = error.response?.data || error;
            }
        }

        if (success) {
            console.log('   ✅ Moodle API connection successful!');
            console.log('      At least one function is working with your token.');
        } else {
            console.log('   ❌ Moodle API Error:');
            if (lastError && lastError.errorcode) {
                console.log(`      Error Code: ${lastError.errorcode}`);
                console.log(`      Message: ${lastError.message || lastError.error}`);
                
                if (lastError.errorcode === 'invalidtoken') {
                    console.log('\n   🔧 Troubleshooting for invalid token:');
                    console.log('      1. Check if the token is correct');
                    console.log('      2. Verify the token hasn\'t expired');
                    console.log('      3. Ensure the token has required permissions');
                    console.log('      4. Check if the web service is enabled');
                } else if (lastError.errorcode === 'accessexception') {
                    console.log('\n   🔧 Troubleshooting for access exception:');
                    console.log('      1. Add the required functions to your external service');
                    console.log('      2. Check if the service is enabled');
                    console.log('      3. Verify the token is associated with the correct service');
                    console.log('      4. Required functions: core_course_get_courses, core_user_get_users_by_field, etc.');
                }
            } else {
                console.log(`      Error: ${lastError?.message || 'Unknown error'}`);
            }
        }
    } catch (error) {
        console.log('   ❌ Connection failed:');
        
        if (error.code === 'ENOTFOUND') {
            console.log('      Cannot resolve Moodle server hostname');
            console.log('      Check if MOODLE_API_URL is correct');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('      Connection refused by Moodle server');
            console.log('      Check if Moodle server is running and accessible');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('      Connection timed out');
            console.log('      Check network connectivity and server response time');
        } else if (error.response) {
            console.log(`      HTTP ${error.response.status}: ${error.response.statusText}`);
            if (error.response.data) {
                console.log(`      Response: ${JSON.stringify(error.response.data, null, 2)}`);
            }
        } else {
            console.log(`      Error: ${error.message}`);
        }
    }
}

testMoodleAPI().then(() => {
    console.log('\n📋 Summary:');
    console.log('   If you see ✅ marks above, your Moodle API should work correctly.');
    console.log('   If you see ❌ marks, follow the troubleshooting steps provided.');
    console.log('\n   For additional help:');
    console.log('   - Check your Moodle server logs');
    console.log('   - Verify web services are enabled in Moodle');
    console.log('   - Ensure the token has the required function permissions');
}); 