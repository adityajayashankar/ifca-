const axios = require('axios');
const bcrypt = require('bcryptjs');

class MoodleService {
  constructor() {
    this.apiUrl = process.env.MOODLE_API_URL;
    this.token = process.env.MOODLE_API_TOKEN;
    this.moodleUrl = process.env.MOODLE_URL;
  }
  async createUser(userData) {
    try {
      console.log('createUser called with:', { ...userData, password: '****' });
      return await this.createMoodleUser(userData);
    } catch (error) {
      console.error('Error in createUser:', error.message);
      throw error;
    }
  }

  async createMoodleUser(userData) {
    try {
      const moodlePassword = userData.password;

      // Generate a unique username from email
      const username = userData.phone;

      // Split name into first and last name
      const nameParts = userData.name.split(' ');
      const firstname = nameParts[0];
      const lastname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      // Use URLSearchParams to properly format the request
      const params = new URLSearchParams({
        wstoken: this.token,
        wsfunction: 'core_user_create_users',
        moodlewsrestformat: 'json'
      });
      console.log("Creating Moodle user with username:", username);
      
      // Format the users array as required by Moodle API
      const users = [{
        username: username,
        password: moodlePassword,
        firstname: firstname || "User",
        lastname: lastname || "Name",
        email: userData.email,
        auth: 'manual',
        idnumber: '',
        lang: 'en',
        calendartype: 'gregorian',
        theme: '',
        timezone: 'UTC',
        mailformat: 1
      }];

      // Add users array to params
      params.append('users[0][username]', username);
      params.append('users[0][password]', moodlePassword);
      params.append('users[0][firstname]', firstname || "User");
      params.append('users[0][lastname]', lastname || "Name");
      params.append('users[0][email]', userData.email);
      params.append('users[0][auth]', 'manual');
      params.append('users[0][lang]', 'en');
      params.append('users[0][calendartype]', 'gregorian');
      params.append('users[0][theme]', '');
      params.append('users[0][timezone]', 'UTC');
      params.append('users[0][mailformat]', '1');

      console.log("Sending request to Moodle API:", `${this.apiUrl}?${params.toString().replace(/password=([^&]+)/, 'password=****')}`);
      
      const response = await axios.post(`${this.apiUrl}?${params.toString()}`);

      // Check for Moodle API errors
      if (response.data.exception) {
        console.error('Moodle API error:', response.data);
        throw new Error(response.data.message || 'Moodle API error');
      }

      // Validate response
      if (!response.data || !Array.isArray(response.data) || !response.data[0] || !response.data[0].id) {
        console.error('Invalid Moodle API response:', response.data);
        throw new Error('Invalid response format from Moodle API');
      }

      console.log("Moodle user created successfully with ID:", response.data[0].id);
      
      // if (response.data[0].id) {
      //   await this.assignMoodleUserRole(response.data[0].id, 5, 1);
      // }
      
      const hashedPassword = await bcrypt.hash(moodlePassword, 10);
      
      return {
        moodleUserId: response.data[0].id,
        moodleUsername: username,
        moodlePassword: hashedPassword,
      };
    } catch (error) {
      console.error('Error creating Moodle user:', error.message);
      throw error;
    }
  }

  async enrollUserInCourse(moodleUserId, moodleCourseId) {
    try {
      // Use URLSearchParams for proper parameter formatting
      const params = new URLSearchParams({
        wstoken: this.token,
        wsfunction: 'enrol_manual_enrol_users',
        moodlewsrestformat: 'json'
      });

      // Add enrollment parameters
      params.append('enrolments[0][roleid]', '5'); // student role
      params.append('enrolments[0][userid]', moodleUserId);
      params.append('enrolments[0][courseid]', moodleCourseId);

      const response = await axios.post(`${this.apiUrl}?${params.toString()}`);

      if (response.data.exception) {
        throw new Error(response.data.message || 'Moodle enrollment error');
      }

      return true;
    } catch (error) {
      console.error('Moodle Enrollment Error:', error.response?.data || error.message);
      throw new Error(`Course enrollment failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async assignMoodleUserRole(userId, roleId = 5) {
    try {
      // Fetch site info to ensure context ID is correct
      console.log("userId:", userId, "roleId:", roleId)
      // Proceed with role assignment
      const params = new URLSearchParams({
        wstoken: this.token,
        wsfunction: 'core_role_assign_roles',
        moodlewsrestformat: 'json'
      });

      params.append('assignments[0][roleid]', roleId);
      params.append('assignments[0][userid]', userId);

      const response = await axios.post(`${this.apiUrl}?${params.toString()}`);

      if (response.data.exception) {
        throw new Error(response.data.message || 'Moodle role assignment error');
      }

      return true;
    } catch (error) {
      console.error('Moodle Role Assignment Error:', error.response?.data || error.message);
      throw new Error(`Moodle role assignment failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getToken(username, password) {
    try {
      const response = await axios.post(`${this.moodleUrl}/login/token.php`, null, {
        params: {
          username,
          password,
          service: 'moodle_mobile_app',
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    } catch (error) {
      console.error('Moodle Token Error:', error.response?.data || error.message);
      throw new Error(`Failed to get Moodle token: ${error.response?.data?.message || error.message}`);
    }
  }

  generateMoodlePassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}

module.exports = new MoodleService(); 