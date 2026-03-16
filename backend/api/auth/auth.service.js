const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createCustomError } = require("../../middleware/errorHandling");
const jwt = require("jsonwebtoken");
const generateAccessToken = require("../../utils/generateAccessToken");
const generateRefreshToken = require("../../utils/generateRefreshToken");

exports.checkEmail = (email) => {
  return new Promise((resolve, reject) => {
    prisma.unifiedUser
      .findUnique({
        where: { email: email },
      })
      .then((user) => {
        if (!user) {
          resolve({ message: "Email available" });
        }
        reject(
          createCustomError({ status: 404, message: "User found with email" })
        );
      })
      .catch((err) => {
        reject(err);
      });
  });
};

/**
 * Validate and regenerate token for any user type
 * @param {string} email - User email
 * @param {string} userType - User type (user, admin, partner, expert)
 * @returns {Promise<Object>} - New token and user data
 */
exports.validateAndRegenerateToken = async (email, userType) => {
  try {
    // Find unified user
    const unifiedUser = await prisma.unifiedUser.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!unifiedUser) {
      throw createCustomError({ status: 404, message: "User not found" });
    }

    if (unifiedUser.isActive === false) {
      throw createCustomError({ status: 403, message: "Account is disabled" });
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
      throw createCustomError({ status: 404, message: "User not found or userType mismatch" });
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

    return {
      success: true,
      jwt: newToken,
      refreshToken,
      user: {
        ...user,
        userType: actualUserType,
        unifiedUser
      }
    };

  } catch (error) {
    throw error;
  }
};
