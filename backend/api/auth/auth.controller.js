const bcrypt = require("bcryptjs");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createCustomError } = require("../../middleware/errorHandling");
const jwt = require("jsonwebtoken");
const generateAccessToken = require("../../utils/generateAccessToken");
const generateRefreshToken = require("../../utils/generateRefreshToken");
const { checkEmail } = require("./auth.service");
const axios = require("axios");
const moodleService = require('../../services/moodle/moodle.service');
const emailService = require("../../services/email.service.js");
const { RewardType, RewardAction } = require('@prisma/client');

const XLSX = require("xlsx");
const { rewardsManagement } = require("../../services/rewards/rewards.service.js");
const generateDefaultPhotoURL = require('../../utils/generateDefaultPhotoURL');


const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID; 
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Helper: Get user roles from unifiedUser record
function getUserRolesFromUnifiedUser(unifiedUser) {
  const roles = [];
  if (unifiedUser.userId) roles.push('user');
  if (unifiedUser.partnerId) roles.push('partner');
  if (unifiedUser.adminId) roles.push('admin');
  if (unifiedUser.expertId) roles.push('expert');
  return roles;
}

// Helper to get Moodle user by email
async function getMoodleUserByEmail(email) {
  const axios = require('axios');
  const MOODLE_API_URL = process.env.MOODLE_API_URL || 'https://ifcaifcalms.cocreate.ventures/webservice/rest/server.php';
  const MOODLE_API_TOKEN = process.env.MOODLE_API_TOKEN;
  
  try {
    const response = await axios.get(MOODLE_API_URL, {
      params: {
        wstoken: MOODLE_API_TOKEN,
        wsfunction: 'core_user_get_users_by_field',
        moodlewsrestformat: 'json',
        field: 'email',
        values: [email]
      },
      timeout: 10000, // 10 second timeout
    });
    return response.data;
  } catch (error) {
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.warn(`⚠️ Moodle server unreachable: ${error.message}`);
      // Return null to indicate Moodle check should be skipped
      return null;
    }
    throw error;
  }
}

exports.bulkUpload = async (req, res) => {
  try {
    const { userType } = req.body;
    const file = req.file; // Access file from req.file since we're using multer
    
    console.log('file received:', file);

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    if (!userType) {
      return res.status(400).json({ message: "User type is required" });
    }

    // Read Excel file
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const usersData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (usersData.length === 0) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    const createdUsers = [];

    for (const userData of usersData) {
      userData.phone = userData.phone.toString();
      userData.pincode = userData.pincode.toString();
      const { email, password, name, phone, address, pincode, photoURL } = userData;

      // Check if user already exists
      const existingUser = await prisma.unifiedUser.findUnique({ where: { email } });
      if (existingUser) {
        continue; // Skip duplicate email
      }

      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        continue; // Skip duplicate phone
      }

      if (!password) {
        return res.status(400).json({ message: "Password is required for all users" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      let user;
      switch (userType) {
        case "user":
          // Create Moodle user (optional, won't break signup)
          let moodleUser = null;
          try {
            moodleUser = await moodleService.createUser({
              username: phone,
              password: password,
              firstname: name.split(' ')[0],
              lastname: name.split(' ').slice(1).join(' ') || name.split(' ')[0],
              email: email,
            });
            console.log("✅ Moodle user created for bulk upload:", moodleUser);
          } catch (error) {
            console.error("❌ Moodle account creation failed for bulk upload:", error);
            console.warn("⚠️ Continuing with user creation without Moodle integration");
            moodleUser = null;
          }

          user = await prisma.user.create({
            data: { 
              email, 
              password: hashedPassword, 
              name, 
              phone, 
              pincode, 
              photoURL: photoURL || generateDefaultPhotoURL(name),
              ...(moodleUser && {
                moodleUserId: moodleUser.id,
                moodleUsername: moodleUser.username,
                moodlePassword: hashedPassword
              })
            },
          });

          break;
        case "partner":
          user = await prisma.partner.create({
            data: { 
              email, 
              password: hashedPassword, 
              name, 
              phone, 
              address, 
              pincode, 
              photoURL: photoURL || generateDefaultPhotoURL(name)
              // adminId will default to 1 as specified in the schema
            },
          });
          break;
        case "admin":
          user = await prisma.admin.create({
            data: { email, password: hashedPassword, name, phone, address, pincode, photoURL: photoURL || generateDefaultPhotoURL(name) },
          });
          break;
        case "expert":
          user = await prisma.expert.create({
            data: { email, password: hashedPassword, name, phone, address, pincode, photoURL: photoURL || generateDefaultPhotoURL(name) },
          });
          break;
        default:
          return res.status(400).json({ message: "Invalid userType" });
      }

      // Create unified user record
    const unifiedUser = await prisma.unifiedUser.create({
        data: { email, [`${userType}Id`]: user.id },
      });

    // Award signup points (only for users, not admins/partners/experts)
    if (userType === 'user' && unifiedUser.id) {
      try {
        await rewardsManagement({
          userId: unifiedUser.id,
          rewardRuleName: RewardAction.SIGN_UP,
          type: RewardType.CREDIT
        });
        console.log("✅ Signup reward points awarded to user:", unifiedUser.id);
      } catch (rewardError) {
        console.error("❌ Error awarding signup points:", rewardError);
        // Don't fail the signup if reward fails
      }
    }

      //send welcome email
      await emailService.sendEmail({
        to: user.email,
        subject: 'Welcome to IFCA',
        template: 'welcome-email',
        context: {
          email: user.email,
          recipientName: name,
          username: moodleUser?.username || null,
          password: password,
          actionUrl: `${process.env.RESET_DOMAIN || 'https://pvl.ifcaindia.com'}/onBoard`,
        },
      });

      createdUsers.push(user);


    }

    res.status(201).json({ message: `${userType}s uploaded successfully`, count: createdUsers.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};




exports.signup = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      address,
      pincode,
      userType,
      photoURL,
      location,
      state
    } = req.body;

    console.log('🔐 Signup initiated');
    console.log("📨 Desc received in signup");


    // Validate required fields
    if (!email || !password || !name || !phone || !userType) {
      return res.status(400).json({ message: 'Email, password, name, phone, and userType are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // 1. Check if email already exists
    const existingUser = await prisma.unifiedUser.findUnique({ where: { email } });
    if (existingUser) {
      console.error('❌ Email already registered (unified)');
      return res.status(409).json({ message: 'Email already registered.' });
    }

    // 2. Check if phone exists in any user type
    const [userPhone, adminPhone, partnerPhone, expertPhone] = await prisma.$transaction([
      prisma.user.findUnique({ where: { phone } }),
      prisma.admin.findUnique({ where: { phone } }),
      prisma.partner.findUnique({ where: { phone } }),
      prisma.expert.findUnique({ where: { phone } }),
    ]);

    if (userPhone || adminPhone || partnerPhone || expertPhone) {
      console.error(`❌ Phone already registered: ${phone}`);
      return res.status(409).json({ message: 'Phone number already registered.' });
    }

    // Validate phone format (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be 10 digits' });
    }

    // 3. Moodle duplicate checks (only for userType === 'user') - Optional, won't break signup
    if (userType === 'user') {
      try {
        const moodleEmailUser = await getMoodleUserByEmail(email);
        if (moodleEmailUser && moodleEmailUser.length > 0) {
          console.warn(`⚠️ Moodle: Email already registered: ${email}`);
          console.warn(`⚠️ Continuing with signup - Moodle integration is optional`);
          // Don't return error - continue with signup process
        }

        // Only check phone if Moodle is reachable
        if (moodleEmailUser !== null) {
          const moodlePhoneUser = await moodleService.getUserByUsername(phone);
          if (moodlePhoneUser) {
            console.warn(`⚠️ Moodle: Phone already registered: ${phone}`);
            console.warn(`⚠️ Continuing with signup - Moodle integration is optional`);
            // Don't return error - continue with signup process
          }
        } else {
          console.warn(`⚠️ Skipping Moodle phone check due to server unreachability`);
        }
      } catch (err) {
        console.error(`❌ Error checking Moodle for existing user:`, err);
        // Don't fail signup if Moodle is unreachable, just log the warning
        console.warn(`⚠️ Continuing with signup despite Moodle check failure`);
      }
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ Password hashed");

    // 5. Create Moodle user (userType === 'user') - Optional, won't break signup
    let moodleUser = null;
    const defaultMoodlePassword = "Abcd@1234";

    if (userType === 'user') {
      try {
        console.log("📤 Creating Moodle user with:");
        console.log({
          username: phone,
          password: defaultMoodlePassword,
          firstname: name.split(' ')[0],
          lastname: name.split(' ').slice(1).join(' ') || name.split(' ')[0],
          email
        });

        moodleUser = await moodleService.createUser({
          username: phone,
          password: defaultMoodlePassword,
          firstname: name.split(' ')[0],
          lastname: name.split(' ').slice(1).join(' ') || name.split(' ')[0],
          email,
        });

        console.log("✅ Moodle user created:", moodleUser);
        if (!moodleUser || !moodleUser.id) {
          throw new Error("Failed to create Moodle user");
        }
      } catch (error) {
        console.error("❌ Moodle account creation failed:", error);
        console.warn("⚠️ Moodle integration failed, continuing with signup without Moodle integration");
        console.warn("⚠️ User can still use the platform, Moodle features will be limited");
        moodleUser = null;
        // Don't return error - continue with signup process
      }
    }

    // 6. Create user record in DB
    let user;
    switch (userType) {
      case 'user':
        user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            phone,
            address,
            pincode,
            photoURL: photoURL || generateDefaultPhotoURL(name),
            location,
            
            state,
            ...(moodleUser && {
              moodleUserId: moodleUser.id,
              moodleUsername: moodleUser.username,
              moodlePassword: defaultMoodlePassword, // ✅ Not hashed
            }),
          },
        });
        break;
      case 'partner':
        user = await prisma.partner.create({
          data: { email, password: hashedPassword, name, phone, address, pincode,desc: req.body.desc?.trim() ? req.body.desc : "Hey there! I am an partner", photoURL: photoURL || generateDefaultPhotoURL(name) },
        });
        break;
      case 'admin':
        user = await prisma.admin.create({
          data: { email, password: hashedPassword, name, phone, address, pincode, desc: req.body.desc?.trim() ? req.body.desc : "Hey there! I am an admin", photoURL: photoURL || generateDefaultPhotoURL(name) },
        });
        break;
      case 'expert':
        user = await prisma.expert.create({
          data: { email, password: hashedPassword, name, phone, address, pincode,desc: req.body.desc?.trim() ? req.body.desc : "Hey there! I am an expert", photoURL: photoURL || generateDefaultPhotoURL(name) },
        });
        break;
      default:
        console.error(`❌ Invalid userType: ${userType}`);
        return res.status(400).json({ message: 'Invalid userType' });
    }

    console.log(`✅ DB user created with ID: ${user.id}`);

    // 7. Create unified user
    const unifiedUser = await prisma.unifiedUser.create({
      data: {
        email,
        [`${userType}Id`]: user.id,
      },
    });

    // 8. Award signup points (only for users, not admins/partners/experts)
    if (userType === 'user' && unifiedUser.id) {
      try {
        await rewardsManagement({
          userId: unifiedUser.id,
          rewardRuleName: RewardAction.SIGN_UP,
          type: RewardType.CREDIT
        });
        console.log("✅ Signup reward points awarded to user:", unifiedUser.id);
      } catch (rewardError) {
        console.error("❌ Error awarding signup points:", rewardError);
        // Don't fail the signup if reward fails
      }
    }

    // 9. Send welcome email
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Welcome to IFCA',
        template: 'welcome-email',
        context: {
          email: user.email,
          recipientName: name,
          username: moodleUser?.username || null,
          password: moodleUser ? defaultMoodlePassword : password,
          actionUrl: `${process.env.RESET_DOMAIN || 'https://pvl.ifcaindia.com'}/onBoard`,
        },
      });
      console.log("📧 Welcome email sent to:", user.email);
    } catch (err) {
      console.error("❌ Error sending email:", err);
      if (process.env.NODE_ENV !== 'development') {
        return res.status(500).json({ message: 'Signup successful, but email failed to send.' });
      }
    }

    // 9. Final success response
    return res.status(201).json({
      message: 'User created successfully',
      user,
      moodleCredentials: moodleUser
        ? {
            moodleUserId: moodleUser.id,
            username: moodleUser.username,
            password: defaultMoodlePassword,
          }
        : null,
    });

  } catch (error) {
    console.error('❌ Signup error (final catch):', error);
    return res.status(500).json({ message: 'Something went wrong during signup' });
  }
};




exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find unified user
    let unifiedUser = await prisma.unifiedUser.findUnique({ where: { email } });
    if (!unifiedUser) {
      // If not found by email, check if the email is a phone number (mobile-first user)
      const phoneRegex = /^[0-9]{10}$/;
      if (phoneRegex.test(email)) {
        // Try to find user by phone
        const userByPhone = await prisma.user.findUnique({ where: { phone: email } });
        if (userByPhone) {
          // Check if user has an email set
          if (!userByPhone.email) {
            return res.status(400).json({ message: 'This account was created with phone only. Please complete your profile with an email before logging in on the web.' });
          } else {
            // Try to find unifiedUser by userId
            unifiedUser = await prisma.unifiedUser.findUnique({ where: { userId: userByPhone.id } });
            if (!unifiedUser) {
              return res.status(404).json({ message: 'User not found' });
            }
          }
        } else {
          return res.status(404).json({ message: 'User not found' });
        }
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    }
    if (unifiedUser.isActive === false) {
      return res.status(403).json({ message: 'Your account is disabled. Please contact admin to activate your account.' });
    }

    // Try all possible user types
    let user = null;
    let userType = null;
    let userId = null;
    if (unifiedUser.userId) {
      const candidate = await prisma.user.findUnique({ where: { id: unifiedUser.userId } });
      if (candidate && await bcrypt.compare(password, candidate.password)) {
        user = candidate;
        userType = 'user';
        userId = candidate.id;
      }
    }
    if (!user && unifiedUser.adminId) {
      const candidate = await prisma.admin.findUnique({ where: { id: unifiedUser.adminId } });
      if (candidate && await bcrypt.compare(password, candidate.password)) {
        user = candidate;
        userType = 'admin';
        userId = candidate.id;
      }
    }
    if (!user && unifiedUser.partnerId) {
      const candidate = await prisma.partner.findUnique({ where: { id: unifiedUser.partnerId } });
      if (candidate && await bcrypt.compare(password, candidate.password)) {
        user = candidate;
        userType = 'partner';
        userId = candidate.id;
      }
    }
    if (!user && unifiedUser.expertId) {
      const candidate = await prisma.expert.findUnique({ where: { id: unifiedUser.expertId } });
      if (candidate && await bcrypt.compare(password, candidate.password)) {
        user = candidate;
        userType = 'expert';
        userId = candidate.id;
      }
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token as before (include all info as previously)
    const tokenPayload = {
      unifiedUserId: unifiedUser.id,
      userId,
      email: unifiedUser.email,
      userType: userType
    };
    const token = generateAccessToken(tokenPayload);

    res.json({
      jwt: token,
      user: {
        ...user,
        userType,
        unifiedUser
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Something went wrong during signin' });
  }
};

exports.emailBypass = async function (req, res) {
  try {
    const { email, userType } = req.body;
    console.log('email', email)

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find unified user
    const unifiedUser = await prisma.unifiedUser.findUnique({
      where: {
        email: email // Explicitly use email variable
      }
    });

    if (!unifiedUser) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Determine user type and fetch user
    let user;
    let userTypeCheck;
    if (unifiedUser.userId) {
      user = await prisma.user.findUnique({ where: { id: unifiedUser.userId } });
      userTypeCheck = 'user';
    } else if (unifiedUser.partnerId) {
      user = await prisma.partner.findUnique({ where: { id: unifiedUser.partnerId } });
      userTypeCheck = 'partner';
    } else if (unifiedUser.adminId) {
      user = await prisma.admin.findUnique({ where: { id: unifiedUser.adminId } });
      userTypeCheck = 'admin';
    } else if (unifiedUser.expertId) {
      user = await prisma.expert.findUnique({ where: { id: unifiedUser.expertId } });
      userTypeCheck = 'expert';
    }

    if (userType !== userTypeCheck) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Handle Moodle authentication for users
    let moodleToken = null;
    if (userType === 'user' && user.moodleUsername) {
      try {
        // For email bypass, we don't have the password, so we can't get a token
        // But we can still include the Moodle user info in the response
        moodleToken = null;
      } catch (err) {
        console.error('Failed to get Moodle token:', err);
        // Continue without Moodle token
      }
    }

    // Award login points (only for users, not admins/partners/experts)
    if (userType === 'user' && unifiedUser.id) {
      try {
        await rewardsManagement({
          userId: unifiedUser.id,
          rewardRuleName: RewardAction.LOGIN,
          type: RewardType.CREDIT
        });
        console.log("✅ Login reward points awarded to user (email bypass):", unifiedUser.id);
      } catch (rewardError) {
        console.error("❌ Error awarding login points (email bypass):", rewardError);
        // Don't fail the login if reward fails
      }
    }

    // Generate JWT token without password check
    const token = generateAccessToken({ ...user, ...unifiedUser, userType });

    res.json({ 
      jwt: token, 
      user: { 
        ...user, 
        unifiedUser, 
        userType,
        moodleToken // Include Moodle token in response (will be null for email bypass)
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};



// ------------------------------------------

exports.refreshAccessToken = async function (req, res) {
  try {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token is required' });
    }

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, payload) => {
        if (err) {
          console.error('Refresh token verification failed:', err);
          return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

        // Generate new pair of ACCESS & REFRESH token
        const accessToken = generateAccessToken(payload);
        const newRefreshToken = generateRefreshToken(payload);

        return res.status(200).json({ 
          status: 200, 
          accessToken, 
          refreshToken: newRefreshToken,
          message: 'Tokens refreshed successfully'
        });
      }
    );
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Regenerate token for any user type (user, admin, partner, expert)
 * This function validates the current token and generates a new one
 */
exports.regenerateToken = async function (req, res) {
  try {
    const { email, userType } = req.body;

    if (!email || !userType) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and userType are required' 
      });
    }

    // Validate userType
    const validUserTypes = ['user', 'admin', 'partner', 'expert'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid userType. Must be one of: user, admin, partner, expert' 
      });
    }

    // Find unified user
    const unifiedUser = await prisma.unifiedUser.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!unifiedUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (unifiedUser.isActive === false) {
      return res.status(403).json({ 
        success: false,
        message: 'Your account is disabled. Please contact admin to activate your account.' 
      });
    }

    // Find the actual user record based on userType
    let user = null;
    let actualUserType = null;
    let userId = null;

    if (unifiedUser.userId && userType === 'user') {
      user = await prisma.user.findUnique({ where: { id: unifiedUser.userId } });
      actualUserType = 'user';
      userId = user?.id;
    } else if (unifiedUser.adminId && userType === 'admin') {
      user = await prisma.admin.findUnique({ where: { id: unifiedUser.adminId } });
      actualUserType = 'admin';
      userId = user?.id;
    } else if (unifiedUser.partnerId && userType === 'partner') {
      user = await prisma.partner.findUnique({ where: { id: unifiedUser.partnerId } });
      actualUserType = 'partner';
      userId = user?.id;
    } else if (unifiedUser.expertId && userType === 'expert') {
      user = await prisma.expert.findUnique({ where: { id: unifiedUser.expertId } });
      actualUserType = 'expert';
      userId = user?.id;
    }

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found or userType mismatch' 
      });
    }

    // Generate new JWT token
    const tokenPayload = {
      unifiedUserId: unifiedUser.id,
      userId,
      email: unifiedUser.email,
      userType: actualUserType
    };
    
    const newToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Award login points (only for users, not admins/partners/experts)
    if (actualUserType === 'user' && unifiedUser.id) {
      try {
        await rewardsManagement({
          userId: unifiedUser.id,
          rewardRuleName: RewardAction.LOGIN,
          type: RewardType.CREDIT
        });
        console.log("✅ Login reward points awarded to user (token regeneration):", unifiedUser.id);
      } catch (rewardError) {
        console.error("❌ Error awarding login points (token regeneration):", rewardError);
        // Don't fail the token regeneration if reward fails
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Token regenerated successfully',
      jwt: newToken,
      refreshToken,
      user: {
        ...user,
        userType: actualUserType,
        unifiedUser
      }
    });

  } catch (error) {
    console.error('Error regenerating token:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Something went wrong during token regeneration' 
    });
  }
};

// ========================================
// PASSWORD MANAGEMENT FUNCTIONS
// ========================================

/**
 * Request password reset - Step 1
 * Sends a reset link via email
 */
exports.requestPasswordReset = async (req, res) => {
  try {
    console.log("[Password Reset] Request received for:", req.body.email);
    // Validate request body
    const { email } = req.body;
    
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required and must be a valid string'
      });
    }
    
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if user exists
    const unifiedUser = await prisma.unifiedUser.findUnique({
      where: { email: cleanEmail }
    });

    if (!unifiedUser) {
      return res.status(404).json({ 
        success: true,
        message: 'No user found with this email.',
        email: cleanEmail,
        exists: false
      });
    }

    // Find the actual user record
    let user = null;
    let userType = null;

    if (unifiedUser.userId) {
      user = await prisma.user.findUnique({ 
        where: { id: unifiedUser.userId },
        select: { id: true, name: true, email: true }
      });
      userType = 'user';
    } else if (unifiedUser.partnerId) {
      user = await prisma.partner.findUnique({ 
        where: { id: unifiedUser.partnerId },
        select: { id: true, name: true, email: true }
      });
      userType = 'partner';
    } else if (unifiedUser.adminId) {
      user = await prisma.admin.findUnique({ 
        where: { id: unifiedUser.adminId },
        select: { id: true, name: true, email: true }
      });
      userType = 'admin';
    } else if (unifiedUser.expertId) {
      user = await prisma.expert.findUnique({ 
        where: { id: unifiedUser.expertId },
        select: { id: true, name: true, email: true }
      });
      userType = 'expert';
    }

    if (!user) {
      return res.status(200).json({ 
        success: true,
        message: 'If the email exists, a reset link will be sent.',
        email: cleanEmail,
        exists: false
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Update user with reset token
    try {
    switch (userType) {
      case 'user':
          await prisma.user.update({
          where: { id: user.id }, 
            data: { resetToken, resetTokenExpires }
        });
        break;
      case 'partner':
          await prisma.partner.update({
          where: { id: user.id }, 
            data: { resetToken, resetTokenExpires }
        });
        break;
      case 'admin':
          await prisma.admin.update({
          where: { id: user.id }, 
            data: { resetToken, resetTokenExpires }
        });
        break;
      case 'expert':
          await prisma.expert.update({
          where: { id: user.id }, 
            data: { resetToken, resetTokenExpires }
        });
        break;
      default:
          throw new Error('Invalid user type');
      }
      
    } catch (dbError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process reset request'
      });
    }
    
    // After updating user with reset token
    console.log("[Password Reset] Reset token set for user:", user.email, resetToken);
    // Before sending email
    console.log("[Password Reset] Attempting to send password reset email to:", cleanEmail);
    try {
      if (!emailService || typeof emailService.sendEmail !== 'function') {
        console.error('[Password Reset] Email service not configured or sendEmail not a function');
        return res.status(500).json({ success: false, message: 'Email service not configured' });
      }
      // Determine domain from RESET_DOMAIN, or infer from request headers
      let domain = process.env.RESET_DOMAIN;
      if (!domain) {
        domain = req.headers.origin || (req.protocol + '://' + req.get('host'));
      }
      await emailService.sendEmail({
        to: cleanEmail,
        subject: 'Reset your IFCA password',
        template: 'password-reset',
        context: {
          recipientName: user.name || 'User',
          resetUrl: `${domain}/reset-password?token=${resetToken}`
        }
      });
      console.log("[Password Reset] Password reset email sent successfully to:", cleanEmail);
    } catch (emailError) {
      console.error('[Password Reset] Error sending password reset email:', emailError);
      return res.status(500).json({ success: false, message: 'Failed to send reset email', error: emailError.message });
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'If the email exists, a reset link will be sent.',
      email: cleanEmail,
      exists: true
    });
    
  } catch (error) {
    console.error("[Password Reset] Error in requestPasswordReset:", error);
    return res.status(500).json({ 
      success: false,
      message: 'Something went wrong',
      error: error.message
    });
  }
};

/**
 * Reset password - Step 2
 * Resets password using token from email
 */
exports.resetPassword = async (req, res) =>{
  try {
    // Validate request body
    const { token, newPassword } = req.body;
    
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Token is required and must be a valid string'
      });
    }
    
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'New password is required and must be a valid string'
      });
    }
    
    const cleanToken = token.trim();
    const cleanPassword = newPassword.trim();
    
    // Find user by reset token
    const now = new Date();
    let user = null;
    let userType = null;
    
    // Check each user type table
    const userWithToken = await prisma.user.findFirst({ 
      where: { 
        resetToken: cleanToken, 
        resetTokenExpires: { gte: now } 
      },
      select: { id: true, email: true, name: true }
    });
    
    if (userWithToken) {
      user = userWithToken;
      userType = 'user';
    } else {
      const partnerWithToken = await prisma.partner.findFirst({ 
        where: { 
          resetToken: cleanToken, 
          resetTokenExpires: { gte: now } 
        },
        select: { id: true, email: true, name: true }
      });
      
      if (partnerWithToken) {
        user = partnerWithToken;
        userType = 'partner';
      } else {
        const adminWithToken = await prisma.admin.findFirst({ 
          where: { 
            resetToken: cleanToken, 
            resetTokenExpires: { gte: now } 
          },
          select: { id: true, email: true, name: true }
        });
        
        if (adminWithToken) {
          user = adminWithToken;
          userType = 'admin';
        } else {
          const expertWithToken = await prisma.expert.findFirst({ 
            where: { 
              resetToken: cleanToken, 
              resetTokenExpires: { gte: now } 
            },
            select: { id: true, email: true, name: true }
          });
          
          if (expertWithToken) {
            user = expertWithToken;
            userType = 'expert';
          }
        }
      }
    }
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(cleanPassword, 10);
    
    // Update password and clear reset token
    try {
    switch (userType) {
      case 'user':
          await prisma.user.update({
          where: { id: user.id }, 
          data: { 
            password: hashedPassword, 
            resetToken: null, 
            resetTokenExpires: null 
            }
        });
        break;
      case 'partner':
          await prisma.partner.update({
          where: { id: user.id }, 
          data: { 
            password: hashedPassword, 
            resetToken: null, 
            resetTokenExpires: null 
            }
        });
        break;
      case 'admin':
          await prisma.admin.update({
          where: { id: user.id }, 
          data: { 
            password: hashedPassword, 
            resetToken: null, 
            resetTokenExpires: null 
            }
        });
        break;
      case 'expert':
          await prisma.expert.update({
          where: { id: user.id }, 
          data: { 
            password: hashedPassword, 
            resetToken: null, 
            resetTokenExpires: null 
            }
        });
        break;
      default:
          throw new Error('Invalid user type');
      }
      
    } catch (dbError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to reset password'
      });
    }
    
    // Send confirmation email
    try {
      console.log("[Password Change] Attempting to send password changed email to:", user.email);
      if (!emailService || typeof emailService.sendEmail !== 'function') {
        console.error('[Password Change] Email service not configured or sendEmail not a function');
        return res.status(500).json({ success: false, message: 'Email service not configured' });
      }
      await emailService.sendEmail({
        to: user.email,
        subject: 'Your IFCA password was changed',
        template: 'password-changed',
        context: { recipientName: user.name || 'User' }
      });
      console.log("[Password Change] Password changed email sent successfully to:", user.email);
    } catch (emailError) {
      console.error('[Password Change] Error sending password changed email:', emailError);
      return res.status(500).json({ success: false, message: 'Failed to send password changed email', error: emailError.message });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      email: user.email
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }
};

/**
 * Change password (when user is logged in)
 * Changes password when user knows current password
 */
exports.changePasswordUser = async (req, res) => {
  try {
    // Validate request body
    const { email, password, newPassword, userType } = req.body;
    
    if (!email || !password || !newPassword || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, newPassword, and userType are required'
      });
    }
    
    const cleanEmail = email.trim().toLowerCase();
    
    // Find unified user
    const unifiedUser = await prisma.unifiedUser.findUnique({
      where: { email: cleanEmail }
    });

    if (!unifiedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Find the actual user record
    let user = null;
    let actualUserType = null;

    if (unifiedUser.userId) {
      user = await prisma.user.findUnique({
        where: { id: unifiedUser.userId }
      });
      actualUserType = 'user';
    } else if (unifiedUser.partnerId) {
      user = await prisma.partner.findUnique({
        where: { id: unifiedUser.partnerId }
      });
      actualUserType = 'partner';
    } else if (unifiedUser.adminId) {
      user = await prisma.admin.findUnique({
        where: { id: unifiedUser.adminId }
      });
      actualUserType = 'admin';
    } else if (unifiedUser.expertId) {
      user = await prisma.expert.findUnique({
        where: { id: unifiedUser.expertId }
      });
      actualUserType = 'expert';
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (userType !== actualUserType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid current password'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    try {
      switch (actualUserType) {
      case 'user':
        await prisma.user.update({
          where: { id: user.id },
            data: { password: hashedPassword }
        });
        break;
      case 'partner':
        await prisma.partner.update({
          where: { id: user.id },
            data: { password: hashedPassword }
        });
        break;
      case 'admin':
        await prisma.admin.update({
          where: { id: user.id },
            data: { password: hashedPassword }
        });
        break;
      case 'expert':
        await prisma.expert.update({
          where: { id: user.id },
            data: { password: hashedPassword }
        });
        break;
      default:
          throw new Error('Invalid user type');
      }
      
    } catch (dbError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
    
    // Send confirmation email
    try {
      if (emailService && typeof emailService.sendEmail === 'function') {
      await emailService.sendEmail({
          to: cleanEmail,
          subject: 'Password Changed - IFCA',
          template: 'password-changed',
        context: {
            recipientName: user.name || 'User',
            actionUrl: `${process.env.RESET_DOMAIN || 'https://pvl.ifcaindia.com'}/login`
          }
        });
      }
    } catch (emailError) {
      // Continue without failing the request
    }
      
    return res.status(200).json({ 
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }
};

const fast2smsApiUrl = "https://www.fast2sms.com/dev/bulkV2";
const fast2smsApiKey = "xBl4RbUHJAcNoEdeQVharzIDuPXZOSMgf5i8TqCynkWtL6ps30WrqMyphflQPeo0BIScCdmTanRZt16D";



exports.sendOTP = async (req, res) => {
  const { phone } = req.body;

  let otp;
  if (phone === '7506627003') {
    otp = '123456';
  } else {
    otp = generateOTP(phone);
  }

  try {
    // Only allow OTP for existing users
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      // Create a new user with just the phone number and OTP fields
      user = await prisma.user.create({
        data: {
          phone,
          otp,
          otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });
      // Do NOT create a unifiedUser here if no email is available
      // It will be created later when the user updates their email
    } else {
      await prisma.user.update({
        where: { phone },
        data: {
          otp,
          otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });
    }

    // Bypass SMS sending for test number
    if (phone === '7506627003') {
      return res.json({ message: "OTP sent successfully (test number)" });
    }

    const response = await axios.get(
      fast2smsApiUrl,
      {
        params: {
          authorization: fast2smsApiKey,
          route: "dlt",
          sender_id: "IFCAMB",
          message: "188668",
          variables_values: otp,
          numbers: phone,
          flash: "0"
        }
      }
    );

    if (response.data.return) {
      res.json({ message: "OTP sent successfully" });
    } else {
      res.status(500).json({ message: "Failed to send OTP" });
    }
  } catch (error) {
    // Log everything for debugging
    console.error('--- Fast2SMS Error Debug ---');
    console.error('Error object:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Fast2SMS API error:', error.response.data);
      res.status(500).json({ 
        error: error.response.data || error.message, 
        status: error.response.status, 
        headers: error.response.headers 
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response from Fast2SMS API:', error.request);
      // Only send safe info to client
      res.status(500).json({ 
        error: 'No response from SMS provider', 
        code: error.code,
        address: error.errors?.[0]?.address,
        port: error.errors?.[0]?.port,
        message: error.message
      });
    } else {
      // Something happened in setting up the request
      console.error('Error in sendOTP:', error.message);
      res.status(500).json({ error: error.message });
    }
    console.error('--- End Fast2SMS Error Debug ---');
  }
};


exports.verifyOTP = async (req, res) => {
  const { phone, otp } = req.body; // Phone number and OTP are required

  try {
    // Find the user by phone
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        unifiedUserId: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the OTP is valid and not expired
    if (user.otp !== otp || new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // OTP is valid, clear it from the database
    await prisma.user.update({
      where: { phone },
      data: {
        otp: null,
        otpExpiresAt: null,
      },
    });

    // Find the unifiedUser record by userId
    const unifiedUser = await prisma.unifiedUser.findUnique({
      where: { userId: user.id }
    });

    const token = generateAccessToken({ userId: user.id, phone: user.phone, name: user.name, email: user.email, userType: "user", unifiedUserId: unifiedUser?.id });

    // Award login points for OTP verification (only for users)
    if (unifiedUser?.id) {
      try {
        await rewardsManagement({
          userId: unifiedUser.id,
          rewardRuleName: RewardAction.LOGIN,
          type: RewardType.CREDIT
        });
        console.log("✅ Login reward points awarded to user (OTP):", unifiedUser.id);
      } catch (rewardError) {
        console.error("❌ Error awarding login points (OTP):", rewardError);
        // Don't fail the OTP verification if reward fails
      }
    }

    res.json({
      message: "OTP verified successfully",
      data: user,
      jwt: token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Utility function to generate a 6-digit OTP
// function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

function generateOTP(phone) {
  if (phone === '7506627003') {
    return '123456';
  }

  const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
  return randomOtp;
}





       
exports.enrollInCourse = async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Check if user has Moodle account
    if (!user.moodleUserId) {
      console.warn(`⚠️ User ${userId} not linked to Moodle - course enrollment skipped`);
      return res.status(400).json({ 
        error: 'User not linked to Moodle',
        message: 'Course enrollment requires Moodle integration. Please contact support to link your account.'
      });
    }

    try {
      await moodleService.enrollUserInCourse(user.moodleUserId, courseId);
      res.json({ message: 'Successfully enrolled in course' });
    } catch (moodleError) {
      console.error('Moodle course enrollment failed:', moodleError);
      res.status(500).json({ 
        error: 'Failed to enroll in course via Moodle',
        message: 'Moodle service is currently unavailable. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Course enrollment failed:', error);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
};



exports.googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Google ID token is required' });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    
    console.log(`🔐 Google Auth initiated for: ${email}`);

    // Check if user exists in unifiedUser
    let unifiedUser = await prisma.unifiedUser.findUnique({ where: { email } });

    if (!unifiedUser) {
      // User does not exist, ask for phone
      console.log(`📝 New Google user requires phone: ${email}`);
      return res.json({ 
        phoneRequired: true, 
        idToken, 
        email, 
        name, 
        picture 
      });
    }

    // User exists, proceed as direct login (no additional signin check)
    console.log(`🔑 Existing user logging in via Google: ${email}`);
    
    let user, userType = 'user', userId;
    
    if (unifiedUser.userId) {
      user = await prisma.user.findUnique({ where: { id: unifiedUser.userId } });
      userType = 'user';
      userId = user.id;
    } else if (unifiedUser.adminId) {
      user = await prisma.admin.findUnique({ where: { id: unifiedUser.adminId } });
      userType = 'admin';
      userId = user.id;
    } else if (unifiedUser.partnerId) {
      user = await prisma.partner.findUnique({ where: { id: unifiedUser.partnerId } });
      userType = 'partner';
      userId = user.id;
    } else if (unifiedUser.expertId) {
      user = await prisma.expert.findUnique({ where: { id: unifiedUser.expertId } });
      userType = 'expert';
      userId = user.id;
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials or user type mismatch' });
    }

    // Award login points for existing users
    if (userType === 'user' && unifiedUser.id) {
      try {
        await rewardsManagement({
          userId: unifiedUser.id,
          rewardRuleName: RewardAction.LOGIN,
          type: RewardType.CREDIT
        });
        console.log("✅ Login reward points awarded to Google user:", unifiedUser.id);
      } catch (rewardError) {
        console.error("❌ Error awarding login points to Google user:", rewardError);
      }
    }

    // Generate JWT
    const tokenPayload = {
      unifiedUserId: unifiedUser.id,
      userId,
      email: unifiedUser.email,
      userType,
    };
    const token = generateAccessToken(tokenPayload);

    console.log(`✅ Google Auth successful for: ${email} (existing user - direct login)`);

    return res.json({
      jwt: token,
      user: {
        ...user,
        userType,
        unifiedUser,
      },
      isNewUser: false,
      directLogin: true, // Indicate this was a direct login
    });
  } catch (error) {
    console.error('❌ Google Auth error:', error);
    return res.status(500).json({ message: 'Google authentication failed' });
  }
};

// Google OAuth complete signup endpoint
exports.googleComplete = async (req, res) => {
  try {
    const { idToken, phone } = req.body;
    if (!idToken || !phone) return res.status(400).json({ message: 'idToken and phone are required' });
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    // Check if user already exists
    let unifiedUser = await prisma.unifiedUser.findUnique({ where: { email } });
    if (unifiedUser) return res.status(409).json({ message: 'User already exists' });
    // Create user
    const defaultPassword = "Abcd@1234";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    let user = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        photoURL: picture,
        password: hashedPassword,
      },
    });
    unifiedUser = await prisma.unifiedUser.create({
      data: { email, userId: user.id },
    });
    // Award signup points
    try {
      await rewardsManagement({
        userId: unifiedUser.id,
        rewardRuleName: RewardAction.SIGN_UP,
        type: RewardType.CREDIT
      });
    } catch (rewardError) {
      // Don't fail signup if reward fails
    }
    // Send welcome email
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Welcome to IFCA',
        template: 'welcome-email',
        context: {
          email: user.email,
          recipientName: name,
          username: null,
          password: defaultPassword,
          actionUrl: `https://pvl.ifcaindia.com/onBoard`,
        },
      });
    } catch (emailError) {
      // Don't fail signup if email fails
    }
    // Generate JWT
    const tokenPayload = {
      unifiedUserId: unifiedUser.id,
      userId: user.id,
      email: unifiedUser.email,
      userType: 'user',
    };
    const token = generateAccessToken(tokenPayload);
    return res.json({
      jwt: token,
      user: { ...user, userType: 'user', unifiedUser },
      isNewUser: true,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Google signup failed' });
  }
};

// Check if email exists in database
exports.checkEmailExists = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check in unifiedUser table
    const unifiedUser = await prisma.unifiedUser.findUnique({ 
      where: { email: email.toLowerCase() } 
    });

    if (unifiedUser) {
      return res.json({ 
        exists: true, 
        message: 'Email already exists',
        userType: getUserRolesFromUnifiedUser(unifiedUser)[0] || 'user'
      });
    }

    return res.json({ 
      exists: false, 
      message: 'Email is available' 
    });

  } catch (error) {
    console.error('❌ Check email exists error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Check if phone number exists in database
exports.checkPhoneExists = async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Check in user table for phone number
    const user = await prisma.user.findUnique({ 
      where: { phone: phone.toString() } 
    });

    if (user) {
      return res.json({ 
        exists: true, 
        message: 'Phone number already exists' 
      });
    }

    return res.json({ 
      exists: false, 
      message: 'Phone number is available' 
    });

  } catch (error) {
    console.error('❌ Check phone exists error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// --- GLOBAL REQUEST LOGGER ---
const express = require('express');
const app = express();
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// --- GLOBAL ERROR HANDLER FOR UNCAUGHT EXCEPTIONS ---
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

