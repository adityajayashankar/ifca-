const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("./auth.controller");

// User registration and login
router.post("/signup", auth.signup);
router.post("/signin", auth.signin);

// Password management routes
router.post("/request-password-reset", auth.requestPasswordReset);
router.post("/reset-password", auth.resetPassword);
router.post("/change-password", auth.changePasswordUser);

// Token management routes
router.post("/refresh-token", auth.refreshAccessToken);
router.post("/regenerate-token", auth.regenerateToken);

// OTP routes
router.post("/send-otp", auth.sendOTP);
router.post("/verify-otp", auth.verifyOTP);

// Email bypass route (for development/testing)
router.post("/email-bypass", auth.emailBypass);

// Bulk upload route
router.post("/bulk-upload", auth.bulkUpload);

// Course enrollment route
router.post("/enroll-course", auth.enrollInCourse);

router.post('/google', auth.googleAuth);

router.post('/google/complete', auth.googleComplete);

// Check existence routes
router.get('/check-email', auth.checkEmailExists);
router.get('/check-phone', auth.checkPhoneExists);

module.exports = router;
