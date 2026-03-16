const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testPasswordReset() {
  try {
    console.log('Testing password reset endpoint...');
    
    // Test 1: Test server connectivity
    console.log('\n1. Testing server connectivity...');
    const testResponse = await axios.get(`${BASE_URL}/test`);
    console.log('✅ Server is running:', testResponse.data);
    
    // Test 2: Test with non-existing email
    console.log('\n2. Testing with non-existing email...');
    const nonExistingResponse = await axios.post(`${BASE_URL}/auth/request-password-reset`, {
      email: 'nonexisting@example.com'
    });
    console.log('✅ Non-existing email response:', nonExistingResponse.data);
    
    // Test 3: Test with invalid email format
    console.log('\n3. Testing with invalid email format...');
    try {
      const invalidResponse = await axios.post(`${BASE_URL}/auth/request-password-reset`, {
        email: 'invalid-email'
      });
      console.log('✅ Invalid email response:', invalidResponse.data);
    } catch (error) {
      console.log('✅ Invalid email error:', error.response?.data || error.message);
    }
    
    // Test 4: Test with empty email
    console.log('\n4. Testing with empty email...');
    try {
      const emptyResponse = await axios.post(`${BASE_URL}/auth/request-password-reset`, {
        email: ''
      });
      console.log('✅ Empty email response:', emptyResponse.data);
    } catch (error) {
      console.log('✅ Empty email error:', error.response?.data || error.message);
    }
    
    // Test 5: Test with missing email
    console.log('\n5. Testing with missing email...');
    try {
      const missingResponse = await axios.post(`${BASE_URL}/auth/request-password-reset`, {});
      console.log('✅ Missing email response:', missingResponse.data);
    } catch (error) {
      console.log('✅ Missing email error:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPasswordReset(); 