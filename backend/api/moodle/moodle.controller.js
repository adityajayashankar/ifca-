const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { RewardType, RewardAction } = require('@prisma/client');
const { rewardsManagement } = require('../../services/rewards/rewards.service');
const Razorpay = require('razorpay');
const moodleService = require('../../services/moodle/moodle.service');
const notificationService = require('../../services/notification.service');

const router = express.Router();

// Replace with your Moodle API endpoint and token
const MOODLE_API_URL = process.env.MOODLE_API_URL;
const MOODLE_API_TOKEN = process.env.MOODLE_API_TOKEN;

// Add token validation function
const validateMoodleToken = () => {
    if (!MOODLE_API_TOKEN) {
        throw new Error('MOODLE_API_TOKEN environment variable is not set. Please configure it in your .env file.');
    }
    
    if (MOODLE_API_TOKEN.trim() === '') {
        throw new Error('MOODLE_API_TOKEN environment variable is empty. Please set a valid token.');
    }
    
    // Basic token format validation (Moodle tokens are typically alphanumeric)
    if (!/^[a-zA-Z0-9]+$/.test(MOODLE_API_TOKEN)) {
        console.warn('MOODLE_API_TOKEN format appears invalid. Expected alphanumeric characters only.');
    }
    
    return MOODLE_API_TOKEN;
};

// Add function to test Moodle API connection
const testMoodleConnection = async () => {
    try {
        const token = validateMoodleToken();
        
        const response = await axios.get(MOODLE_API_URL, {
            params: {
                wstoken: token,
                wsfunction: 'core_webservice_get_site_info',
                moodlewsrestformat: 'json'
            },
            timeout: 10000 // 10 second timeout
        });
        
        if (response.data.errorcode) {
            throw new Error(`Moodle API Error: ${response.data.errorcode} - ${response.data.message || response.data.error}`);
        }
        
        return {
            success: true,
            siteInfo: response.data,
            message: 'Moodle API connection successful'
        };
    } catch (error) {
        console.error('Moodle API connection test failed:', error.message);
        
        if (error.response?.data?.errorcode === 'invalidtoken') {
            throw new Error('Invalid Moodle API token. Please check your MOODLE_API_TOKEN environment variable.');
        }
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            throw new Error('Cannot connect to Moodle server. Please check MOODLE_API_URL and ensure the server is accessible.');
        }
        
        throw error;
    }
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_API_SECRET
});

// Helper function to create Moodle token
const createMoodleToken = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!user?.moodleUserId) {
            throw new Error('User not found or not linked to Moodle');
        }

        // Get token for the user
        const tokenResponse = await axios.post(`${process.env.MOODLE_URL}/login/token.php`, null, {
            params: {
                username: user.phone,
                password: process.env.MOODLE_DEFAULT_PASSWORD,
                service: 'moodle_mobile_app'
            }
        });

        if (tokenResponse.data.error) {
            throw new Error(tokenResponse.data.error);
        }

        // Create direct access URL with the token and course redirect
        const loginUrl = `${process.env.MOODLE_URL}/login/token.php?token=${tokenResponse.data.token}`;
        return loginUrl;

    } catch (error) {
        console.error('Error creating Moodle token:', error);
        throw error;
    }
};

// Helper function to get appropriate Moodle token
const getMoodleToken = async (req) => {
    const userToken = req.body.token || req.query.token;
    if (userToken) {
        return userToken;
    }
    
    // Use the validation function to ensure we have a valid token
    return validateMoodleToken();
};

// Function to get all courses
const getAllMoodleCourses = async (req, res) => {
    try {
        const response = await axios.get(MOODLE_API_URL, {
            params: {
                wstoken: MOODLE_API_TOKEN,
                wsfunction: 'core_course_get_courses',
                moodlewsrestformat: 'json'
            }
        });
        // Add image field for each course
        const courses = Array.isArray(response.data)
            ? response.data.map(course => ({
                ...course,
                image: course.courseimage || null
            }))
            : response.data;
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Function to get all courses from the database
const getAllCourses = async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            include: {
                communities: true
            }
        });
        // For each course, if image is missing, fetch from Moodle
        const result = await Promise.all(courses.map(async course => {
            let image = course.image || null;
            if (!image && course.moodleCourseId) {
                try {
                    const moodleRes = await axios.get(MOODLE_API_URL, {
                        params: {
                            wstoken: MOODLE_API_TOKEN,
                            wsfunction: 'core_course_get_courses_by_field',
                            moodlewsrestformat: 'json',
                            field: 'id',
                            value: course.moodleCourseId
                        }
                    });
                    if (moodleRes.data.courses && moodleRes.data.courses[0]?.courseimage) {
                        image = moodleRes.data.courses[0].courseimage;
                    }
                } catch (err) {
                    // ignore, fallback to null
                }
            }
            return {
                ...course,
                image
            };
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Function to enroll a user in a course with payment
const enrollUserInCourse = async (req, res) => {
    const { userId, courseId, transactionId } = req.body;

    try {
        // Validate input parameters
        if (!userId || !courseId) {
            return res.status(400).json({ error: 'Missing required parameters: userId and courseId are required' });
        }

        // Get course details
        const course = await prisma.course.findUnique({
            where: { id: parseInt(courseId) }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Get user details first to get the unified user ID
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: { unifiedUserId: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (!user.unifiedUserId || !user.unifiedUserId.id) {
            return res.status(404).json({ error: 'Unified user ID not found for this user.' });
        }

        const unifiedUserId = user.unifiedUserId.id;

        // Check if user is already enrolled
        const existingSubscription = await prisma.courseSubscription.findUnique({
            where: {
                unifiedUserId_courseId: {
                    unifiedUserId: unifiedUserId,
                    courseId: parseInt(courseId)
                }
            }
        });

        if (existingSubscription) {
            return res.status(400).json({ error: 'User is already enrolled in this course' });
        }

        // Create subscription
        const subscription = await prisma.courseSubscription.create({
            data: {
                courseId: parseInt(courseId),
                unifiedUserId: unifiedUserId,
                transactionId: transactionId ? parseInt(transactionId) : null,
                startsAt: new Date(),
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
            }
        });

        // Enroll user in Moodle course
        if (user?.moodleUserId) {
            const course = await prisma.course.findUnique({
                where: { id: parseInt(courseId) }
            });

            if (course?.moodleCourseId) {
                await axios.post(MOODLE_API_URL, null, {
                    params: {
                        wstoken: MOODLE_API_TOKEN,
                        wsfunction: 'enrol_manual_enrol_users',
                        moodlewsrestformat: 'json',
                        'enrolments[0][roleid]': 5, // Student role
                        'enrolments[0][courseid]': course.moodleCourseId,
                        'enrolments[0][userid]': user.moodleUserId
                    }
                });
            }
        }

        res.json({
            message: 'Course enrollment completed successfully',
            subscription
        });
    } catch (error) {
        console.error('Error enrolling user in course:', error);
        res.status(500).json({ error: 'Failed to enroll user in course' });
    }
};

// Function to create a new course
const createCourse = async (req, res) => {
    try {
        const {
            name,
            description,
            status,
            price,
            discount,
            creatorId,
            communityId
        } = req.body;

        // 1. Create course in Moodle
        const moodleCreateRes = await axios.post(MOODLE_API_URL, null, {
            params: {
                wstoken: MOODLE_API_TOKEN,
                wsfunction: 'core_course_create_courses',
                moodlewsrestformat: 'json',
                'courses[0][fullname]': name,
                'courses[0][shortname]': name.substring(0, 20),
                'courses[0][summary]': description,
                'courses[0][categoryid]': 1 // You may want to make this dynamic
            }
        });
        if (!Array.isArray(moodleCreateRes.data) || !moodleCreateRes.data[0]?.id) {
            return res.status(500).json({ error: 'Failed to create course in Moodle', details: moodleCreateRes.data });
        }
        const moodleCourseId = moodleCreateRes.data[0].id;

        // 2. Assign teacher (userId 2) as teacher in Moodle
        await axios.post(MOODLE_API_URL, null, {
            params: {
                wstoken: MOODLE_API_TOKEN,
                wsfunction: 'enrol_manual_enrol_users',
                moodlewsrestformat: 'json',
                'enrolments[0][roleid]': 3, // Teacher role
                'enrolments[0][courseid]': moodleCourseId,
                'enrolments[0][userid]': 2 // Default teacher userId
            }
        });

        // 3. Fetch course details from Moodle to get courseimage
        let moodleImage = image;
        try {
            const moodleDetailsRes = await axios.get(MOODLE_API_URL, {
                params: {
                    wstoken: MOODLE_API_TOKEN,
                    wsfunction: 'core_course_get_courses_by_field',
                    moodlewsrestformat: 'json',
                    field: 'id',
                    value: moodleCourseId
                }
            });
            if (moodleDetailsRes.data.courses && moodleDetailsRes.data.courses[0]?.courseimage) {
                moodleImage = moodleDetailsRes.data.courses[0].courseimage;
            }
        } catch (err) {
            // fallback to provided image
        }

        // 4. Create course in local DB
        const course = await prisma.course.create({
            data: {
                moodleCourseId,
                name,
                description,
                status,
                price: price || 0,
                discount: discount || 0,
                creatorId,
                image: moodleImage,
                communities: communityId ? {
                    connect: [{ id: parseInt(communityId) }]
                } : { connect: [] }
            },
            include: { communities: true }
        });
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Function to get a course by ID
const getCourseById = async (req, res) => {
    const { id } = req.params;

    try {
        // First try to get course from local database
        let course = await prisma.course.findUnique({
            where: { id: parseInt(id) },
            include: {
                communities: true
            }
        });

        // If course not found in local database, try to fetch from Moodle
        if (!course) {
            const moodleResponse = await axios.get(MOODLE_API_URL, {
                params: {
                    wstoken: MOODLE_API_TOKEN,
                    wsfunction: 'core_course_get_courses_by_field',
                    moodlewsrestformat: 'json',
                    field: 'id',
                    value: id
                }
            });

            if (moodleResponse.data.courses && moodleResponse.data.courses.length > 0) {
                const moodleCourse = moodleResponse.data.courses[0];
                // Create a course object from Moodle data
                course = {
                    id: parseInt(id),
                    moodleCourseId: moodleCourse.id,
                    name: moodleCourse.fullname,
                    description: moodleCourse.summary,
                    status: 'active',
                    communities: [],
                    image: moodleCourse.courseimage || null,
                    moodleDetails: {
                        fullname: moodleCourse.fullname,
                        shortname: moodleCourse.shortname,
                        summary: moodleCourse.summary,
                        courseimage: moodleCourse.courseimage,
                        startdate: moodleCourse.startdate,
                        enddate: moodleCourse.enddate,
                        categoryid: moodleCourse.categoryid,
                        progress: moodleCourse.progress || 0
                    }
                };
            } else {
                return res.status(404).json({ error: 'Course not found in either local database or Moodle' });
            }
        } else {
            // If course found in local database, fetch additional details from Moodle
            const moodleResponse = await axios.get(MOODLE_API_URL, {
                params: {
                    wstoken: MOODLE_API_TOKEN,
                    wsfunction: 'core_course_get_courses_by_field',
                    moodlewsrestformat: 'json',
                    field: 'id',
                    value: course.moodleCourseId
                }
            });

            if (moodleResponse.data.courses && moodleResponse.data.courses.length > 0) {
                const moodleCourse = moodleResponse.data.courses[0];
                course.moodleDetails = {
                    fullname: moodleCourse.fullname,
                    shortname: moodleCourse.shortname,
                    summary: moodleCourse.summary,
                    courseimage: moodleCourse.courseimage,
                    startdate: moodleCourse.startdate,
                    enddate: moodleCourse.enddate,
                    categoryid: moodleCourse.categoryid,
                    progress: moodleCourse.progress || 0
                };
            }
        }

        // Always include the local image field
        course.image = course.image || (course.moodleDetails && course.moodleDetails.courseimage) || null;

        res.json(course);
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ error: error.message });
    }
};

// Function to update a course by ID
const updateCourseById = async (req, res) => {
    const { id } = req.params;
    const { name, description, status, communityId } = req.body;
    try {
        // 1. Get course from DB
        const course = await prisma.course.findUnique({ where: { id: parseInt(id) } });
        if (!course) return res.status(404).json({ error: 'Course not found' });
        // 2. Update in Moodle
        await axios.post(MOODLE_API_URL, null, {
            params: {
                wstoken: MOODLE_API_TOKEN,
                wsfunction: 'core_course_update_courses',
                moodlewsrestformat: 'json',
                'courses[0][id]': course.moodleCourseId,
                'courses[0][fullname]': name,
                'courses[0][shortname]': name.substring(0, 20),
                'courses[0][summary]': description
            }
        });
        // 3. Update in local DB
        const updatedCourse = await prisma.course.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                status,
                communities: communityId ? {
                    connect: [{ id: parseInt(communityId) }]
                } : { connect: [] }
            },
            include: { communities: true }
        });
        res.json(updatedCourse);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Function to delete a course by ID
const deleteCourseById = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.course.delete({
            where: { id: parseInt(id) }
        });

        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Function to get courses by community ID
const getCoursesByCommunityId = async (req, res) => {
    const { communityId } = req.params;

    try {
        const courses = await prisma.course.findMany({
            where: {
                communities: {
                    some: {
                        id: parseInt(communityId)
                    }
                }
            },
            include: {
                communities: true
            }
        });

        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get course details with progress
const getCourseDetails = async (req, res) => {
    const { courseId } = req.params;
    const { userId } = req.query;

    try {
        const token = await getMoodleToken(req);
        const course = await prisma.course.findUnique({
            where: { id: parseInt(courseId) }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
    
        const [courseResponse, progressResponse] = await Promise.all([
            axios.get(process.env.MOODLE_API_URL, {
            params: {
                    wstoken: token,
                wsfunction: 'core_course_get_courses_by_field',
                moodlewsrestformat: 'json',
                field: 'id',
                    value: course.moodleCourseId
                }
            }),
            userId ? axios.get(process.env.MOODLE_API_URL, {
                params: {
                    wstoken: token,
                    wsfunction: 'core_completion_get_course_completion_status',
                    moodlewsrestformat: 'json',
                    courseid: course.moodleCourseId,
                    userid: userId
                }
            }) : Promise.resolve({ data: null })
        ]);

        console.log(courseResponse.data, progressResponse.data);

        // Check for Moodle API errors
        if (courseResponse.data.errorcode) {
            console.error('Moodle API Error:', courseResponse.data);
            if (courseResponse.data.errorcode === 'accessexception') {
                return res.status(400).json({ 
                    error: 'Moodle API access denied. Please check your API token and permissions.',
                    errorcode: courseResponse.data.errorcode,
                    details: 'The Moodle API token may be expired, invalid, or lack required permissions.'
                });
            }
            return res.status(400).json({ 
                error: 'Moodle API error', 
                errorcode: courseResponse.data.errorcode,
                message: courseResponse.data.message || courseResponse.data.error
            });
        }

        if (!courseResponse.data.courses || courseResponse.data.courses.length === 0) {
            return res.status(404).json({ error: 'Course not found in Moodle' });
        }

        const courseData = {
            ...courseResponse.data.courses[0],
            completion: progressResponse.data
        };

        res.json(courseData);
    } catch (error) {
        console.error('Error fetching course details:', error);
        
        // Handle axios errors specifically
        if (error.response) {
            console.error('Moodle API Response Error:', error.response.data);
            if (error.response.data.errorcode === 'accessexception') {
                return res.status(400).json({ 
                    error: 'Moodle API access denied. Please check your API token and permissions.',
                    errorcode: error.response.data.errorcode,
                    details: 'The Moodle API token may be expired, invalid, or lack required permissions.'
                });
            }
            return res.status(error.response.status).json({ 
                error: 'Moodle API error',
                details: error.response.data
            });
        }
        
        res.status(500).json({ error: error.message });
    }
};

// Get course contents
const getCourseContents = async (req, res) => {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) }
    });

    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }

    try {
        const token = await getMoodleToken(req);
        const response = await axios.get(process.env.MOODLE_API_URL, {
            params: {
                wstoken: token,
                wsfunction: 'core_course_get_contents',
                moodlewsrestformat: 'json',
                courseid: course.moodleCourseId
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching course contents:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get user's enrolled courses
const getUserEnrolledCourses = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!user?.moodleUserId) {
            return res.status(404).json({ error: 'User not found or not linked to Moodle' });
        }

        // Try to get enrolled courses from Moodle
        try {
            const token = await getMoodleToken(req);
            const response = await axios.get(MOODLE_API_URL, {
                params: {
                    wstoken: token,
                    wsfunction: 'core_enrol_get_users_courses',
                    moodlewsrestformat: 'json',
                    userid: user.moodleUserId
                }
            });

            // Check if response.data is an array
            if (!Array.isArray(response.data)) {
                console.error('Moodle API returned non-array data:', response.data);
                
                // Check if it's an error response
                if (response.data && response.data.exception) {
                    console.error('Moodle API Error:', response.data.message || response.data.exception);
                    // Fallback to database-only approach
                    throw new Error('Moodle API access denied, falling back to database');
                }
                
                return res.status(500).json({ 
                    error: 'Invalid response from Moodle API',
                    details: 'Expected array but received: ' + typeof response.data,
                    response: response.data
                });
            }

            // Get course mappings from our database
            const dbCourses = await prisma.course.findMany({
                where: {
                    moodleCourseId: {
                        in: response.data.map(course => course.id)
                    }
                },
                include: {
                    communities: true
                }
            });

            const enrolledCourses = response.data.map(moodleCourse => {
                const dbCourse = dbCourses.find(dc => dc.moodleCourseId === moodleCourse.id);
                return {
                    id: dbCourse?.id || moodleCourse.id,
                    moodleCourseId: moodleCourse.id,
                    name: dbCourse?.name || moodleCourse.fullname,
                    shortname: dbCourse?.shortname || moodleCourse.shortname,
                    courseimage: dbCourse?.image || moodleCourse.courseimage,
                    price: dbCourse?.price || 0,
                    discount: dbCourse?.discount || 0,
                    creatorId: dbCourse?.creatorId || 0,
                    image: dbCourse?.image || '',
                    description: moodleCourse.summary,
                    progress: moodleCourse.progress || 0,
                    startdate: moodleCourse.startdate,
                    enddate: moodleCourse.enddate,
                    categoryid: moodleCourse.categoryid,
                    communities: dbCourse?.communities || []
                };
            });

            res.json(enrolledCourses);
        } catch (moodleError) {
            console.error('Moodle API failed, falling back to database:', moodleError.message);
            
            // Fallback: Get enrolled courses from database only
            const enrolledCourses = await prisma.course.findMany({
                where: {
                    moodleCourseId: {
                        not: null
                    }
                },
                include: {
                    communities: true
                }
            });

            // Return basic course info without Moodle-specific data
            const fallbackCourses = enrolledCourses.map(course => ({
                id: course.id,
                moodleCourseId: course.moodleCourseId,
                name: course.name || 'Course',
                shortname: course.shortname || '',
                courseimage: course.image || null,
                price: course.price || 0,
                discount: course.discount || 0,
                creatorId: course.creatorId || 0,
                image: course.image || '',
                description: course.description || '',
                progress: 0, // No progress data available
                startdate: null,
                enddate: null,
                categoryid: null,
                communities: course.communities || []
            }));

            res.json(fallbackCourses);
        }
    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get courses user is not enrolled in
const getUserNotEnrolledCourses = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!user?.moodleUserId) {
            return res.status(404).json({ error: 'User not found or not linked to Moodle' });
        }

        // Try to get courses from Moodle
        try {
            const token = await getMoodleToken(req);
            const [allCoursesResponse, enrolledCoursesResponse] = await Promise.all([
                axios.get(MOODLE_API_URL, {
                params: {
                        wstoken: token,
                    wsfunction: 'core_course_get_courses',
                    moodlewsrestformat: 'json'
                }
                }),
                axios.get(MOODLE_API_URL, {
                params: {
                        wstoken: token,
                    wsfunction: 'core_enrol_get_users_courses',
                    moodlewsrestformat: 'json',
                    userid: user.moodleUserId
                }
                })
            ]);

            // Check if responses are arrays
            if (!Array.isArray(allCoursesResponse.data)) {
                console.error('Moodle API returned non-array data for all courses:', allCoursesResponse.data);
                
                // Check if it's an error response
                if (allCoursesResponse.data && allCoursesResponse.data.exception) {
                    console.error('Moodle API Error for all courses:', allCoursesResponse.data.message || allCoursesResponse.data.exception);
                    throw new Error('Moodle API access denied for all courses, falling back to database');
                }
                
                return res.status(500).json({ 
                    error: 'Invalid response from Moodle API for all courses',
                    details: 'Expected array but received: ' + typeof allCoursesResponse.data,
                    response: allCoursesResponse.data
                });
            }

            if (!Array.isArray(enrolledCoursesResponse.data)) {
                console.error('Moodle API returned non-array data for enrolled courses:', enrolledCoursesResponse.data);
                
                // Check if it's an error response
                if (enrolledCoursesResponse.data && enrolledCoursesResponse.data.exception) {
                    console.error('Moodle API Error for enrolled courses:', enrolledCoursesResponse.data.message || enrolledCoursesResponse.data.exception);
                    throw new Error('Moodle API access denied for enrolled courses, falling back to database');
                }
                
                return res.status(500).json({ 
                    error: 'Invalid response from Moodle API for enrolled courses',
                    details: 'Expected array but received: ' + typeof enrolledCoursesResponse.data,
                    response: enrolledCoursesResponse.data
                });
            }

            const enrolledCourseIds = enrolledCoursesResponse.data.map(course => course.id);
            const notEnrolledMoodleCourses = allCoursesResponse.data.filter(
                course => !enrolledCourseIds.includes(course.id)
            );

            // Get course mappings from our database
            const dbCourses = await prisma.course.findMany({
                where: {
                    moodleCourseId: {
                        in: notEnrolledMoodleCourses.map(course => course.id)
                    }
                },
                include: {
                    communities: true
                }
            });

            const notEnrolledCourses = await Promise.all(notEnrolledMoodleCourses.map(async moodleCourse => {
                const dbCourse = dbCourses.find(dc => dc.moodleCourseId === moodleCourse.id);
                let image = dbCourse?.image || moodleCourse.courseimage || null;
                // If no image, fetch from Moodle
                if (!image) {
                    try {
                        const moodleRes = await axios.get(MOODLE_API_URL, {
                            params: {
                                wstoken: MOODLE_API_TOKEN,
                                wsfunction: 'core_course_get_courses_by_field',
                                moodlewsrestformat: 'json',
                                field: 'id',
                                value: moodleCourse.id
                            }
                        });
                        if (moodleRes.data.courses && moodleRes.data.courses[0]?.courseimage) {
                            image = moodleRes.data.courses[0].courseimage;
                        }
                    } catch (err) {
                        // ignore, fallback to null
                    }
                }
                return {
                    id: dbCourse?.id || moodleCourse.id,
                    moodleCourseId: moodleCourse.id,
                    name: dbCourse?.name || moodleCourse.fullname,
                    shortname: dbCourse?.shortname || moodleCourse.shortname,
                    description: dbCourse?.description || moodleCourse.summary,
                    courseimage: dbCourse?.image || moodleCourse.courseimage,
                    image: dbCourse?.image || moodleCourse.courseimage || null,
                    price: dbCourse?.price || 0,
                    discount: dbCourse?.discount || 0,
                    creatorId: dbCourse?.creatorId || 0,
                    progress: moodleCourse.progress || 0,
                    startdate: moodleCourse.startdate,
                    enddate: moodleCourse.enddate,
                    categoryid: moodleCourse.categoryid,
                    communities: dbCourse?.communities || []
                };
            }));

            res.json(notEnrolledCourses);
        } catch (moodleError) {
            console.error('Moodle API failed, falling back to database:', moodleError.message);
            
            // Fallback: Get all courses from database
            const allCourses = await prisma.course.findMany({
                where: {
                    moodleCourseId: {
                        not: null
                    }
                },
                include: {
                    communities: true
                }
            });

            // Return basic course info without Moodle-specific data
            const fallbackCourses = allCourses.map(course => ({
                id: course.id,
                moodleCourseId: course.moodleCourseId,
                name: course.name || 'Course',
                shortname: course.shortname || '',
                description: course.description || '',
                courseimage: course.image || null,
                image: course.image || null,
                price: course.price || 0,
                discount: course.discount || 0,
                creatorId: course.creatorId || 0,
                progress: 0, // No progress data available
                startdate: null,
                enddate: null,
                categoryid: null,
                communities: course.communities || []
            }));

            res.json(fallbackCourses);
        }
    } catch (error) {
        console.error('Error fetching not enrolled courses:', error);
        res.status(500).json({ error: error.message });
    }
};

// Function to check if user is enrolled in a course
const getUserEnrollmentStatus = async (req, res) => {
    const { userId, courseId } = req.params;

    const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) }
    });

    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!user?.moodleUserId) {
            return res.status(404).json({ error: 'User not found or not linked to Moodle' });
        }

        const response = await axios.get(MOODLE_API_URL, {
            params: {
                wstoken: MOODLE_API_TOKEN,
                wsfunction: 'core_enrol_get_enrolled_users',
                moodlewsrestformat: 'json',
                courseid: Number(course.moodleCourseId)
            }
        });

        const isEnrolled = response.data.some(enrolledUser =>
            enrolledUser.id === user.moodleUserId
        );

        res.json({ isEnrolled });
    } catch (error) {
        console.error('Error checking enrollment status:', error);
        res.status(500).json({ error: error.message });
    }
};

// Function to get all enrolled users in a course
const getCourseEnrolledUsers = async (req, res) => {
    const { courseId } = req.params;
    const { count } = req.query;

    try {
        // First try to get course from local database
    const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) }
    });

        // If course not found in local database, try to fetch from Moodle
        let moodleCourseId = courseId;
    if (!course) {
            const moodleResponse = await axios.get(MOODLE_API_URL, {
                params: {
                    wstoken: MOODLE_API_TOKEN,
                    wsfunction: 'core_course_get_courses_by_field',
                    moodlewsrestformat: 'json',
                    field: 'id',
                    value: courseId
                }
            });

            if (!moodleResponse.data.courses || moodleResponse.data.courses.length === 0) {
                return res.status(404).json({ error: 'Course not found in either local database or Moodle' });
            }
            moodleCourseId = moodleResponse.data.courses[0].id;
        } else {
            moodleCourseId = course.moodleCourseId;
        }

        // Get enrolled users from Moodle
        const response = await axios.get(MOODLE_API_URL, {
            params: {
                wstoken: MOODLE_API_TOKEN,
                wsfunction: 'core_enrol_get_enrolled_users',
                moodlewsrestformat: 'json',
                courseid: moodleCourseId
            }
        });

        // Get user mappings from our database
        const dbUsers = await prisma.user.findMany({
            where: {
                moodleUserId: {
                    in: response.data.map(user => user.id)
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                photoURL: true,
                moodleUserId: true
            }
        });

        // Combine Moodle and database information
        const enrolledUsers = response.data.map(moodleUser => {
            const dbUser = dbUsers.find(u => u.moodleUserId === moodleUser.id);
            return {
                id: dbUser?.id,
                moodleUserId: moodleUser.id,
                name: moodleUser.fullname,
                email: moodleUser.email,
                photoURL: dbUser?.photoURL || null,
                lastAccess: moodleUser.lastaccess,
                roles: moodleUser.roles
            };
        });

        res.json(count ? { count: enrolledUsers.length } : enrolledUsers);
    } catch (error) {
        console.error('Error fetching enrolled users:', error);
        res.status(500).json({ error: error.message });
    }
};

// Unenroll user from course
const unenrollUserFromCourse = async (req, res) => {
    const { userId, courseId } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!user?.moodleUserId) {
            return res.status(404).json({ error: 'User not found or not linked to Moodle' });
        }

        const token = await getMoodleToken(req);
        await axios.post(process.env.MOODLE_API_URL, null, {
            params: {
                wstoken: token,
                wsfunction: 'enrol_manual_unenrol_users',
                moodlewsrestformat: 'json',
                'enrolments[0][userid]': user.moodleUserId,
                'enrolments[0][courseid]': courseId
            }
        });

        res.json({ message: 'User unenrolled successfully' });
    } catch (error) {
        console.error('Error unenrolling user:', error);
        res.status(500).json({ error: error.message });
    }
};

// Function to get user's Moodle session URL
const getMoodleSessionUrl = async (req, res) => {
    const { userId } = req.params;

    try {
        const loginUrl = await createMoodleToken(userId);
        res.json({ loginUrl });
    } catch (error) {
        console.error('Error getting Moodle session URL:', error);
        res.status(500).json({ error: error.message });
    }
};

// Function to request a user key login URL from Moodle
const authUserKeyRequestLoginUrl = async (req, res) => {
    try {
      const { username, password } = req.body.user || {};

      console.log('Request body:', req.body);
      console.log('Username:', username);
      console.log('Password provided:', !!password);
  
      if (!username) {
        return res.status(400).json({
          error: "Missing username",
          errorcode: "missingparam"
        });
      }

      // Try to get user key login URL from Moodle API
      try {
      const userKeyResponse = await axios.post(`${process.env.MOODLE_URL}/webservice/rest/server.php`, null, {
        params: {
          wstoken: process.env.MOODLE_API_TOKEN,
          wsfunction: 'auth_userkey_request_login_url',
          moodlewsrestformat: 'json',
          'user[username]': username,
        }
      });
  
      // Check for Moodle API errors in user key response
      if (userKeyResponse.data.errorcode) {
        console.error('Moodle User Key API Error:', userKeyResponse.data);
        if (userKeyResponse.data.errorcode === 'accessexception') {
            // Fallback to direct login URL when access is denied
            console.log('Access exception detected, using fallback login URL');
            const fallbackLoginUrl = `${process.env.MOODLE_URL}/login/index.php`;
            return res.json({
              loginurl: fallbackLoginUrl,
              baseUrl: process.env.MOODLE_URL,
              message: 'Using fallback login method due to API access restrictions'
          });
        }
        return res.status(400).json({
          error: userKeyResponse.data.message || 'Failed to generate login URL',
          errorcode: userKeyResponse.data.errorcode
        });
      }
  
        // Success case - return the login URL from Moodle
      res.json({
          loginurl: userKeyResponse.data.loginurl,
          baseUrl: process.env.MOODLE_URL
        });
      } catch (apiError) {
        console.error('Moodle API Error:', apiError.response?.data || apiError.message);
        
        // If it's an access exception, use fallback
        if (apiError.response?.data?.errorcode === 'accessexception') {
          console.log('Access exception detected, using fallback login URL');
          const fallbackLoginUrl = `${process.env.MOODLE_URL}/login/index.php`;
          return res.json({
            loginurl: fallbackLoginUrl,
            baseUrl: process.env.MOODLE_URL,
            message: 'Using fallback login method due to API access restrictions'
          });
        }
        
        // For other errors, throw to be handled by outer catch
        throw apiError;
      }
    } catch (error) {
      console.error('Error requesting user key login URL:', error);
      
      // Handle axios errors specifically
      if (error.response) {
        console.error('Moodle API Response Error:', error.response.data);
        if (error.response.data.errorcode === 'accessexception') {
          // Final fallback for access exception
          const fallbackLoginUrl = `${process.env.MOODLE_URL}/login/index.php`;
          return res.json({
            loginurl: fallbackLoginUrl,
            baseUrl: process.env.MOODLE_URL,
            message: 'Using fallback login method due to API access restrictions'
          });
        }
        return res.status(error.response.status).json({
          error: 'Moodle API error',
          details: error.response.data
        });
      }
      
      res.status(500).json({
        error: error.message,
        errorcode: "servererror"
      });
    }
  };
  
// Create Razorpay order for course payment
const createCoursePaymentOrder = async (req, res) => {
  try {
    const { userId, courseId, amount } = req.body;
    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.price <= 0) return res.status(400).json({ error: 'Course is free' });

    // Use discounted amount if provided, else use course.price
    const finalAmount = (typeof amount !== 'undefined' && !isNaN(amount)) ? amount : course.price;

    const order = await razorpay.orders.create({
      amount: finalAmount * 100, // INR paise
      currency: 'INR',
      receipt: `course_${courseId}_${userId}`,
      notes: { courseId, userId }
    });

    // Create transaction record (pending)
    const transaction = await prisma.transaction.create({
      data: {
        amount: finalAmount,
        status: 'pending',
        paymentProvider: 'razorpay',
        paymentProviderOrderId: order.id,
        userId: parseInt(userId),
        transactionId: order.id,
        paymentId: ''
      }
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, transactionId: transaction.id });
  } catch (error) {
    console.error('Error creating course payment order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

// Verify Razorpay payment and enroll user in course
const verifyCoursePayment = async (req, res) => {
  try {
    const { userId, courseId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_API_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Find the transaction
    const transaction = await prisma.transaction.findFirst({
      where: { paymentProviderOrderId: razorpay_order_id }
    });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Get course and user details
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) }
    });
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { unifiedUserId: true }
    });

    if (!course || !user) {
      return res.status(404).json({ error: 'Course or user not found' });
    }
    if (!user.unifiedUserId || !user.unifiedUserId.id) {
      return res.status(404).json({ error: 'Unified user ID not found for this user.' });
    }

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'completed', paymentId: razorpay_payment_id }
    });

    // Create payment confirmation notification
    await notificationService.createNotification({
      recipientId: user.unifiedUserId.id,
      type: 'PAYMENT_CONFIRMATION',
      title: 'Payment Successful',
      message: `Your payment for ${course.name} has been confirmed.`,
      metadata: {
        courseId: course.id,
        courseName: course.name,
        courseImage: course.image || course.moodleDetails?.courseimage,
        courseDescription: course.description || course.moodleDetails?.summary || 'Course details not available',
        originalPrice: course.price,
        discount: course.discount || 0,
        amount: transaction.amount,
        transactionId: transaction.id,
        paymentId: transaction.paymentId,
        paymentDate: new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      },
      shouldEmail: true,
      emailTemplate: 'payment-confirmation',
      actionUrl: `${process.env.FRONTEND_URL}/courses/${course.id}`,
      courseId: course.id
    });

    // Call enrollUserInCourse logic
    req.body.transactionId = transaction.id;
    await enrollUserInCourse(req, res);
  } catch (error) {
    console.error('Error verifying course payment:', error);
    res.status(500).json({ error: 'Failed to verify payment and enroll' });
  }
};

// Function to sync Moodle courses with our database
const syncMoodleCourses = async (req, res) => {
    try {
        // Get all courses from Moodle
        const moodleResponse = await axios.get(MOODLE_API_URL, {
            params: {
                wstoken: MOODLE_API_TOKEN,
                wsfunction: 'core_course_get_courses',
                moodlewsrestformat: 'json'
            }
        });

        if (!moodleResponse.data || !Array.isArray(moodleResponse.data)) {
            return res.status(400).json({ error: 'Invalid response from Moodle API' });
        }

        const moodleCourses = moodleResponse.data;
        const results = {
            added: 0,
            updated: 0,
            skipped: 0,
            errors: []
        };

        // Process each Moodle course
        for (const moodleCourse of moodleCourses) {
            try {
                // Check if course already exists in our database
                const existingCourse = await prisma.course.findUnique({
                    where: { moodleCourseId: moodleCourse.id }
                });

                if (existingCourse) {
                    // Update image if changed
                    await prisma.course.update({
                        where: { moodleCourseId: moodleCourse.id },
                        data: {
                            image: moodleCourse.courseimage || null
                        }
                    });
                    results.skipped++;
                    continue;
                }

                // Create new course in our database
                const newCourse = await prisma.course.create({
                    data: {
                        moodleCourseId: moodleCourse.id,
                        name: moodleCourse.fullname,
                        description: moodleCourse.summary,
                        status: 'active',
                        price: 0, // Default price
                        discount: 0, // Default discount
                        creatorId: 1, // Default creator ID (you might want to change this)
                        image: moodleCourse.courseimage || null
                    }
                });

                results.added++;
            } catch (error) {
                results.errors.push({
                    courseId: moodleCourse.id,
                    error: error.message
                });
            }
        }

        res.json({
            message: 'Course sync completed',
            results
        });

    } catch (error) {
        console.error('Error syncing Moodle courses:', error);
        res.status(500).json({ 
            error: 'Failed to sync Moodle courses',
            details: error.message
        });
    }
};

// Function to map selected Moodle courses with amount and community
const mapMoodleCourses = async (req, res) => {
    try {
        const { courses } = req.body;

        if (!Array.isArray(courses)) {
            return res.status(400).json({ error: 'Invalid request format. Expected array of courses.' });
        }

        const results = {
            mapped: 0,
            errors: []
        };

        // Process each course mapping
        for (const courseData of courses) {
            try {
                const { moodleCourseId, price, discount, communityId, creatorId } = courseData;

                // Validate required fields
                if (!moodleCourseId || !creatorId) {
                    throw new Error('Missing required fields: moodleCourseId and creatorId are required');
                }

                // Get course details from Moodle
                const moodleResponse = await axios.get(MOODLE_API_URL, {
                    params: {
                        wstoken: MOODLE_API_TOKEN,
                        wsfunction: 'core_course_get_courses',
                        moodlewsrestformat: 'json',
                        options: {
                            ids: [moodleCourseId]
                        }
                    }
                });

                if (!moodleResponse.data || !moodleResponse.data[0]) {
                    throw new Error(`Course not found in Moodle: ${moodleCourseId}`);
                }

                const moodleCourse = moodleResponse.data[0];

                // Check if course already exists in our database
                const existingCourse = await prisma.course.findUnique({
                    where: { moodleCourseId: moodleCourseId }
                });

                if (existingCourse) {
                    // Update existing course, including image
                    await prisma.course.update({
                        where: { moodleCourseId: moodleCourseId },
                        data: {
                            price: price || 0,
                            discount: discount || 0,
                            creatorId: creatorId,
                            image: moodleCourse.courseimage || null,
                            communities: communityId ? {
                                connect: [{ id: parseInt(communityId) }]
                            } : { connect: [] }
                        }
                    });
                } else {
                    // Create new course with mapping, including image
                    await prisma.course.create({
                        data: {
                            moodleCourseId: moodleCourseId,
                            name: moodleCourse.fullname,
                            description: moodleCourse.summary,
                            status: 'active',
                            price: price || 0,
                            discount: discount || 0,
                            creatorId: creatorId,
                            image: moodleCourse.courseimage || null,
                            communities: communityId ? {
                                connect: [{ id: parseInt(communityId) }]
                            } : undefined
                        }
                    });
                }

                results.mapped++;
            } catch (error) {
                results.errors.push({
                    courseId: courseData.moodleCourseId,
                    error: error.message
                });
            }
        }

        res.json({
            message: 'Course mapping completed',
            results
        });

    } catch (error) {
        console.error('Error mapping Moodle courses:', error);
        res.status(500).json({ 
            error: 'Failed to map Moodle courses',
            details: error.message
        });
    }
};

// Function to create Moodle account for all users
const createMoodleAccountsForAllUsers = async (req, res) => {
    try {
        // Get all users without Moodle accounts
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { moodleUserId: null },
                    { moodleUsername: null }
                ]
            }
        });

        const results = {
            created: 0,
            failed: 0,
            errors: []
        };

        for (const user of users) {
            try {
                // Create Moodle user
                const moodleUser = await moodleService.createUser({
                    username: user.phone,
                    password: user.password, // Use existing password
                    firstname: user.name.split(' ')[0],
                    lastname: user.name.split(' ').slice(1).join(' ') || user.name.split(' ')[0],
                    email: user.email
                });

                if (!moodleUser || !moodleUser.id) {
                    throw new Error('Invalid Moodle user data returned');
                }

                // Update user with Moodle details
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        moodleUserId: moodleUser.id,
                        moodleUsername: moodleUser.username,
                        moodlePassword: user.password // Store the password for future use
                    }
                });

                results.created++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    userId: user.id,
                    error: error.message
                });
            }
        }

        res.json({
            message: 'Moodle account creation completed',
            results
        });

    } catch (error) {
        console.error('Error creating Moodle accounts:', error);
        res.status(500).json({ 
            error: 'Failed to create Moodle accounts',
            details: error.message
        });
    }
};

// Function to remove course registration
const removeCourseRegistration = async (req, res) => {
    const { userId, courseId } = req.params;

    try {
        // Get user details first to get the unified user ID
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: { unifiedUserId: true }
        });

        if (!user || !user.unifiedUserId) {
            return res.status(404).json({ error: 'User not found or no unified user ID' });
        }

        const unifiedUserId = user.unifiedUserId.id;

        // Check if user has paid for the course
        const subscription = await prisma.courseSubscription.findFirst({
            where: {
                unifiedUserId: unifiedUserId,
                courseId: parseInt(courseId),
                transaction: {
                    status: 'completed'
                }
            },
            include: {
                transaction: true
            }
        });

        if (subscription) {
            return res.status(400).json({ 
                error: 'Cannot remove registration for paid course. Please contact support for refund.'
            });
        }

        // Remove course registration from database
        await prisma.courseSubscription.deleteMany({
            where: {
                unifiedUserId: unifiedUserId,
                courseId: parseInt(courseId)
            }
        });

        // Remove from Moodle if user has Moodle account
        if (user?.moodleUserId) {
            const course = await prisma.course.findUnique({
                where: { id: parseInt(courseId) }
            });

            if (course?.moodleCourseId) {
                await axios.post(MOODLE_API_URL, null, {
                    params: {
                        wstoken: MOODLE_API_TOKEN,
                        wsfunction: 'enrol_manual_unenrol_users',
                        moodlewsrestformat: 'json',
                        'enrolments[0][userid]': user.moodleUserId,
                        'enrolments[0][courseid]': course.moodleCourseId
                    }
                });
            }
        }

        res.json({ message: 'Course registration removed successfully' });
    } catch (error) {
        console.error('Error removing course registration:', error);
        res.status(500).json({ error: error.message });
    }
};

// Function to enroll user in paid course
const enrollInPaidCourse = async (req, res) => {
    const { userId, courseId } = req.body;

    try {
        // Get user details first to get the unified user ID
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: { unifiedUserId: true }
        });

        if (!user || !user.unifiedUserId) {
            return res.status(404).json({ error: 'User not found or no unified user ID' });
        }

        const unifiedUserId = user.unifiedUserId.id;

        // Check if course exists and has a price
        const course = await prisma.course.findUnique({
            where: { id: parseInt(courseId) }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (course.price <= 0) {
            return res.status(400).json({ error: 'Course is free. Use regular enrollment.' });
        }

        // Check if user has already paid for the course
        const existingSubscription = await prisma.courseSubscription.findFirst({
            where: {
                unifiedUserId: unifiedUserId,
                courseId: parseInt(courseId),
                transaction: {
                    status: 'completed'
                }
            }
        });

        if (existingSubscription) {
            return res.status(400).json({ error: 'User has already paid for this course' });
        }

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: course.price * 100, // Convert to paise
            currency: 'INR',
            receipt: `course_${courseId}_${userId}`,
            notes: { courseId, userId }
        });

        // Create pending transaction
        const transaction = await prisma.transaction.create({
            data: {
                amount: course.price,
                status: 'pending',
                paymentProvider: 'razorpay',
                paymentProviderOrderId: order.id,
                userId: parseInt(userId),
                transactionId: order.id,
                paymentId: ''
            }
        });

        res.json({
            message: 'Payment order created successfully',
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            transactionId: transaction.id
        });
    } catch (error) {
        console.error('Error creating paid course enrollment:', error);
        res.status(500).json({ error: error.message });
    }
};

// Function to verify paid course enrollment
const verifyPaidCourseEnrollment = async (req, res) => {
    const { 
        userId, 
        courseId, 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature 
    } = req.body;

    try {
        // Get user details first to get the unified user ID
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: { unifiedUserId: true }
        });

        if (!user || !user.unifiedUserId) {
            return res.status(404).json({ error: 'User not found or no unified user ID' });
        }

        const unifiedUserId = user.unifiedUserId.id;

        // Verify Razorpay signature
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_API_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        // Find and update transaction
        const transaction = await prisma.transaction.findFirst({
            where: { paymentProviderOrderId: razorpay_order_id }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
                status: 'completed', 
                paymentId: razorpay_payment_id 
            }
        });

        // Create course subscription
        const subscription = await prisma.courseSubscription.create({
            data: {
                courseId: parseInt(courseId),
                unifiedUserId: unifiedUserId,
                transactionId: transaction.id,
                startsAt: new Date(),
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
            }
        });

        // Enroll user in Moodle course
        if (user?.moodleUserId) {
            const course = await prisma.course.findUnique({
                where: { id: parseInt(courseId) }
            });

            if (course?.moodleCourseId) {
                await axios.post(MOODLE_API_URL, null, {
                    params: {
                        wstoken: MOODLE_API_TOKEN,
                        wsfunction: 'enrol_manual_enrol_users',
                        moodlewsrestformat: 'json',
                        'enrolments[0][roleid]': 5, // Student role
                        'enrolments[0][courseid]': course.moodleCourseId,
                        'enrolments[0][userid]': user.moodleUserId
                    }
                });
            }
        }

        res.json({
            message: 'Course enrollment verified and completed successfully',
            subscription
        });
    } catch (error) {
        console.error('Error verifying paid course enrollment:', error);
        res.status(500).json({ error: error.message });
    }
};

// Function to check course registration status
const getCourseRegistrationStatus = async (req, res) => {
    const { userId, courseId } = req.params;

    try {
        // Get user details first to get the unified user ID
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: { unifiedUserId: true }
        });

        if (!user || !user.unifiedUserId) {
            return res.status(404).json({ error: 'User not found or no unified user ID' });
        }

        const unifiedUserId = user.unifiedUserId.id;

        // Get course details
        const course = await prisma.course.findUnique({
            where: { id: parseInt(courseId) }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Check subscription status
        const subscription = await prisma.courseSubscription.findFirst({
            where: {
                unifiedUserId: unifiedUserId,
                courseId: parseInt(courseId)
            },
            include: {
                transaction: true
            }
        });

        // Check Moodle enrollment status
        let moodleEnrolled = false;
        if (user?.moodleUserId && course.moodleCourseId) {
            const moodleResponse = await axios.get(MOODLE_API_URL, {
                params: {
                    wstoken: MOODLE_API_TOKEN,
                    wsfunction: 'core_enrol_get_enrolled_users',
                    moodlewsrestformat: 'json',
                    courseid: course.moodleCourseId
                }
            });

            moodleEnrolled = moodleResponse.data.some(
                enrolledUser => enrolledUser.id === user.moodleUserId
            );
        }

        // Prepare response
        const response = {
            courseId: course.id,
            courseName: course.name,
            isPaidCourse: course.price > 0,
            coursePrice: course.price,
            registrationStatus: {
                isRegistered: !!subscription,
                isMoodleEnrolled: moodleEnrolled,
                subscriptionDetails: subscription ? {
                    startDate: subscription.startsAt,
                    endDate: subscription.expiresAt,
                    isActive: new Date() <= subscription.expiresAt,
                    paymentStatus: subscription.transaction?.status || 'none'
                } : null
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error checking course registration status:', error);
        res.status(500).json({ error: error.message });
    }
};

// Function to remove all registrations from a course
const removeAllCourseRegistrations = async (req, res) => {
    const { courseId } = req.params;

    try {
        // Get course details
        const course = await prisma.course.findUnique({
            where: { id: parseInt(courseId) }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Get all subscriptions for this course
        const subscriptions = await prisma.courseSubscription.findMany({
            where: {
                courseId: parseInt(courseId)
            },
            include: {
                transaction: true
            }
        });

        // Separate paid and unpaid subscriptions
        const paidSubscriptions = subscriptions.filter(sub => 
            sub.transaction?.status === 'completed'
        );
        const unpaidSubscriptions = subscriptions.filter(sub => 
            !sub.transaction || sub.transaction.status !== 'completed'
        );

        // Get all users with Moodle accounts
        const users = await prisma.user.findMany({
            where: {
                id: {
                    in: subscriptions.map(sub => sub.unifiedUserId)
                },
                moodleUserId: {
                    not: null
                }
            }
        });

        // Remove from Moodle
        if (course.moodleCourseId) {
            for (const user of users) {
                try {
                    await axios.post(MOODLE_API_URL, null, {
                        params: {
                            wstoken: MOODLE_API_TOKEN,
                            wsfunction: 'enrol_manual_unenrol_users',
                            moodlewsrestformat: 'json',
                            'enrolments[0][userid]': user.moodleUserId,
                            'enrolments[0][courseid]': course.moodleCourseId
                        }
                    });
                } catch (error) {
                    console.error(`Failed to remove user ${user.id} from Moodle:`, error);
                }
            }
        }

        // Remove from database
        await prisma.courseSubscription.deleteMany({
            where: {
                courseId: parseInt(courseId)
            }
        });

        // Prepare response
        const response = {
            message: 'All course registrations removed successfully',
            summary: {
                totalRegistrations: subscriptions.length,
                paidRegistrations: paidSubscriptions.length,
                unpaidRegistrations: unpaidSubscriptions.length,
                moodleUsersRemoved: users.length,
                courseId: course.id,
                courseName: course.name
            },
            warning: paidSubscriptions.length > 0 
                ? 'Some paid subscriptions were removed. Consider refunding these users.'
                : null
        };

        res.json(response);
    } catch (error) {
        console.error('Error removing all course registrations:', error);
        res.status(500).json({ error: error.message });
    }
};

// Function to test Moodle API connection
const testMoodleAPI = async (req, res) => {
    try {
        const result = await testMoodleConnection();
        res.json(result);
    } catch (error) {
        console.error('Moodle API test failed:', error.message);
        res.status(500).json({
            error: 'Moodle API connection failed',
            message: error.message,
            troubleshooting: {
                checkToken: 'Verify MOODLE_API_TOKEN is set in your .env file',
                checkURL: 'Verify MOODLE_API_URL is correct and accessible',
                checkPermissions: 'Ensure the token has required Moodle web service permissions',
                checkNetwork: 'Ensure the Moodle server is accessible from this environment'
            }
        });
    }
};

module.exports = {
    getAllCourses,
    enrollUserInCourse,
    createCourse,
    getCourseById,
    updateCourseById,
    deleteCourseById,
    getCoursesByCommunityId,
    getCourseDetails,
    getCourseContents,
    getAllMoodleCourses,
    getUserEnrolledCourses,
    getUserNotEnrolledCourses,
    getUserEnrollmentStatus,
    getCourseEnrolledUsers,
    getMoodleSessionUrl,
    unenrollUserFromCourse,
    authUserKeyRequestLoginUrl,
    createCoursePaymentOrder,
    verifyCoursePayment,
    syncMoodleCourses,
    mapMoodleCourses,
    createMoodleAccountsForAllUsers,
    removeCourseRegistration,
    enrollInPaidCourse,
    verifyPaidCourseEnrollment,
    getCourseRegistrationStatus,
    removeAllCourseRegistrations,
    testMoodleAPI
};