const express = require('express');
const router = express.Router();
const {
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
    getCourseEnrolledUsers,
    getUserEnrollmentStatus,
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
} = require('./moodle.controller');

// Course routes
router.get('/test-moodle-api', testMoodleAPI);
router.get('/courses', getAllCourses);
router.get('/courses/moodle', getAllMoodleCourses);
router.post('/courses/enroll', enrollUserInCourse);
router.post('/courses/unenroll', unenrollUserFromCourse);
router.post('/courses', createCourse);
router.get('/courses/:id', getCourseById);
router.put('/courses/:id', updateCourseById);
router.delete('/courses/:id', deleteCourseById);
router.get('/community/:communityId/courses', getCoursesByCommunityId);
router.get('/courses/:courseId/details', getCourseDetails);
router.get('/courses/:courseId/contents', getCourseContents);
router.get('/users/:userId/token', getMoodleSessionUrl);
router.get('/users/:userId/enrolled-courses', getUserEnrolledCourses);
router.post('/auth/userkey/request_login_url', authUserKeyRequestLoginUrl);
router.get('/users/:userId', getMoodleSessionUrl);
router.get('/users/:userId/not-enrolled-courses', getUserNotEnrolledCourses);
router.get('/courses/:courseId/users', getCourseEnrolledUsers);
router.get('/courses/:courseId/users/:userId/status', getUserEnrollmentStatus);

// New routes for course subscriptions
router.get('/courses/:courseId/subscriptions', async (req, res) => {
    try {
        const subscriptions = await prisma.courseSubscription.findMany({
            where: { courseId: parseInt(req.params.courseId) },
            include: {
                unifiedUser: true,
                transaction: true
            }
        });
        res.json(subscriptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/users/:userId/course-subscriptions', async (req, res) => {
    try {
        const subscriptions = await prisma.courseSubscription.findMany({
            where: { unifiedUserId: parseInt(req.params.userId) },
            include: {
                course: true,
                transaction: true
            }
        });
        res.json(subscriptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/courses/payment/order', createCoursePaymentOrder);
router.post('/courses/payment/verify', verifyCoursePayment);

// Add this route with the other routes
router.get('/sync-courses', syncMoodleCourses);

// Add this route with the other routes
router.post('/courses/map', mapMoodleCourses);

// Add this route with the other routes
router.post('/users/create-moodle-accounts', createMoodleAccountsForAllUsers);
router.put('/courses/:courseId/update', updateCourseById);

// Add new routes for course registration and paid enrollment
router.delete('/courses/:courseId/users/:userId/registration', removeCourseRegistration);
router.post('/courses/:courseId/enroll-paid', enrollInPaidCourse);
router.post('/courses/:courseId/verify-paid-enrollment', verifyPaidCourseEnrollment);

// Add route for checking course registration status
router.get('/courses/:courseId/users/:userId/registration-status', getCourseRegistrationStatus);

// Add route for removing all course registrations
router.delete('/courses/:courseId/registrations', removeAllCourseRegistrations);

module.exports = router;