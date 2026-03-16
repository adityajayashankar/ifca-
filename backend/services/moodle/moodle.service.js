const axios = require('axios');

const MOODLE_API_URL = process.env.MOODLE_API_URL || 'https://ifcaifcalms.cocreate.ventures/webservice/rest/server.php';
const MOODLE_API_TOKEN = process.env.MOODLE_API_TOKEN;

class MoodleService {
    constructor() {
        this.baseUrl = MOODLE_API_URL;
        this.token = MOODLE_API_TOKEN;
    }

    // Safely split name into first and last name
    splitName(name) {
        if (!name) {
            return { firstname: 'Unknown', lastname: 'User' };
        }
        
        const nameParts = name.trim().split(' ');
        if (nameParts.length === 1) {
            return { firstname: nameParts[0], lastname: 'User' };
        }
        
        return {
            firstname: nameParts[0],
            lastname: nameParts.slice(1).join(' ')
        };
    }

    // Create a new user in Moodle
    async createUser({ username, password, firstname, lastname, email, name }) {
        try {
            // Validate password
            if (!password || password.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }

            // Handle name splitting if full name is provided
            let firstName = firstname;
            let lastName = lastname;
            if (name && (!firstname || !lastname)) {
                const splitNames = this.splitName(name);
                firstName = splitNames.firstname;
                lastName = splitNames.lastname;
            }

            // Ensure we have valid first and last names
            if (!firstName) firstName = 'Unknown';
            if (!lastName) lastName = 'User';

            // Debug log input
            console.log('[Moodle createUser] Input:', { username, password: '****', firstName, lastName, email });

            // Check if username already exists
            try {
                const existingUser = await this.getUserByUsername(username);
                if (existingUser) {
                    return {
                        id: existingUser.id,
                        username: existingUser.username,
                        password: password
                    };
                }
            } catch (error) {
                // If user not found, continue with creation
                console.log('User not found, proceeding with creation');
            }

            const response = await axios.get(this.baseUrl, {
                params: {
                    wstoken: this.token,
                    wsfunction: 'core_user_create_users',
                    moodlewsrestformat: 'json',
                    users: [{
                        username,
                        password,
                        firstname: firstName,
                        lastname: lastName,
                        email,
                        auth: 'manual',
                        createpassword: 0 // Don't create password, use the one provided
                    }]
                },
                timeout: 15000, // 15 second timeout for user creation
            });

            // Debug log full response
            console.log('[Moodle createUser] API response:', response.data);

            // Check if response is an array (success case)
            if (Array.isArray(response.data)) {
                const user = response.data[0];
                if (user && user.id) {
                    return {
                        id: user.id,
                        username: user.username,
                        password: password
                    };
                }
            }

            // If we get here, something went wrong
            console.error('Moodle API response:', response.data);
            throw new Error('Failed to create Moodle user');
        } catch (error) {
            // Handle network connectivity issues
            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                console.warn(`⚠️ Moodle server unreachable when creating user: ${error.message}`);
                throw error; // Re-throw to be handled by the calling function
            }
            
            if (error.response?.data) {
                const moodleError = error.response.data;
                if (moodleError.errorcode === 'invalidparameter') {
                    if (moodleError.message.includes('Username already exists')) {
                        // Try to get the existing user
                        try {
                            const existingUser = await this.getUserByUsername(username);
                            if (existingUser) {
                                return {
                                    id: existingUser.id,
                                    username: existingUser.username,
                                    password: password
                                };
                            }
                        } catch (err) {
                            console.error('Error getting existing user:', err);
                        }
                    }
                }
                console.error('Moodle API error:', moodleError);
                throw new Error(moodleError.message || 'Failed to create Moodle user');
            }
            console.error('Error creating Moodle user:', error.message);
            throw error;
        }
    }

    // Update an existing user in Moodle
    async updateUser({ id, username, password, firstname, lastname, email, name }) {
        try {
            // Handle name splitting if full name is provided
            let firstName = firstname;
            let lastName = lastname;
            if (name && (!firstname || !lastname)) {
                const splitNames = this.splitName(name);
                firstName = splitNames.firstname;
                lastName = splitNames.lastname;
            }

            // Ensure we have valid first and last names
            if (!firstName) firstName = 'Unknown';
            if (!lastName) lastName = 'User';

            const response = await axios.get(this.baseUrl, {
                params: {
                    wstoken: this.token,
                    wsfunction: 'core_user_update_users',
                    moodlewsrestformat: 'json',
                    users: [{
                        id,
                        username,
                        password,
                        firstname: firstName,
                        lastname: lastName,
                        email,
                    }]
                },
                timeout: 15000, // 15 second timeout for user update
            });

            // Check if response is an array (success case)
            if (Array.isArray(response.data)) {
                const user = response.data[0];
                if (user && user.id) {
                    return {
                        id: user.id,
                        username: user.username,
                        password: password
                    };
                }
            }

            // If we get here, something went wrong
            console.error('Moodle API response (update):', response.data);
            throw new Error('Failed to update Moodle user');
        } catch (error) {
            // Handle network connectivity issues
            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                console.warn(`⚠️ Moodle server unreachable when updating user: ${error.message}`);
                throw error; // Re-throw to be handled by the calling function
            }
            if (error.response?.data) {
                const moodleError = error.response.data;
                console.error('Moodle API error (update):', moodleError);
                throw new Error(moodleError.message || 'Failed to update Moodle user');
            }
            console.error('Error updating Moodle user:', error.message);
            throw error;
        }
    }

    // Get user by username
    async getUserByUsername(username) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    wstoken: this.token,
                    wsfunction: 'core_user_get_users_by_field',
                    moodlewsrestformat: 'json',
                    field: 'username',
                    values: [username]
                },
                timeout: 10000, // 10 second timeout
            });

            if (Array.isArray(response.data) && response.data.length > 0) {
                return response.data[0];
            }
            return null;
        } catch (error) {
            if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                console.warn(`⚠️ Moodle server unreachable when checking username: ${error.message}`);
                return null;
            }
            console.error('Error getting user by username:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get Moodle token for a user
    async getToken(username, password) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    wstoken: this.token,
                    wsfunction: 'core_auth_request_user_key',
                    moodlewsrestformat: 'json',
                    user: {
                        username,
                        password
                    }
                }
            });

            if (response.data && response.data.token) {
                return response.data.token;
            }

            throw new Error('Failed to get Moodle token');
        } catch (error) {
            console.error('Error getting Moodle token:', error.response?.data || error.message);
            throw error;
        }
    }

    // Enroll user in a course
    async enrollUserInCourse(userId, courseId) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    wstoken: this.token,
                    wsfunction: 'enrol_manual_enrol_users',
                    moodlewsrestformat: 'json',
                    enrolments: [{
                        roleid: 5, // Student role
                        userid: userId,
                        courseid: courseId
                    }]
                }
            });

            if (Array.isArray(response.data)) {
                return response.data[0];
            }

            throw new Error('Failed to enroll user in course');
        } catch (error) {
            console.error('Error enrolling user in course:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get user's enrolled courses
    async getUserCourses(userId) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    wstoken: this.token,
                    wsfunction: 'core_enrol_get_users_courses',
                    moodlewsrestformat: 'json',
                    userid: userId
                }
            });

            if (Array.isArray(response.data)) {
                return response.data;
            }

            throw new Error('Failed to get user courses');
        } catch (error) {
            console.error('Error getting user courses:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get course details
    async getCourseDetails(courseId) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    wstoken: this.token,
                    wsfunction: 'core_course_get_courses',
                    moodlewsrestformat: 'json',
                    options: {
                        ids: [courseId]
                    }
                }
            });

            if (Array.isArray(response.data) && response.data.length > 0) {
                return response.data[0];
            }

            throw new Error('Failed to get course details');
        } catch (error) {
            console.error('Error getting course details:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new MoodleService(); 