const axios = require('axios');

async function testMoodleFix() {
  try {
    console.log('Testing Moodle API fix...');
    
    const response = await axios.post('http://localhost:5000/api/v1/course/auth/userkey/request_login_url', {
      user: { 
        username: '9876789876',
        email: 'ujwal@gmail.com'
      }
    });
    
    console.log('✅ Moodle API response:', response.data);
    
    if (response.data.loginurl && response.data.baseUrl) {
      console.log('✅ Both loginurl and baseUrl are present');
      console.log('✅ Login URL:', response.data.loginurl);
      console.log('✅ Base URL:', response.data.baseUrl);
    } else {
      console.log('❌ Missing required fields in response');
    }
    
  } catch (error) {
    console.error('❌ Error testing Moodle fix:', error.response?.data || error.message);
  }
}

testMoodleFix();
