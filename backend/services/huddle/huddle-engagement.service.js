const { PrismaClient, RewardType, RewardAction } = require("@prisma/client");
const prisma = new PrismaClient();
const { rewardsManagement } = require("../rewards/rewards.service");

// ==================== STREAK MANAGEMENT ====================

/**
 * Update streaks for all attendees after a huddle ends
 * @param {object} huddle - The huddle object with attendances
 */
async function updateStreaksForHuddle(huddle) {
    try {
        const attendances = await prisma.huddleAttendance.findMany({
            where: { huddleId: huddle.id },
            select: { userId: true }
        });

        for (const attendance of attendances) {
            await updateUserStreak(attendance.userId, huddle.communityId);
        }

        console.log(`Updated streaks for ${attendances.length} attendees of huddle ${huddle.id}`);
    } catch (error) {
        console.error('Error updating streaks for huddle:', error);
    }
}

/**
 * Update a user's streak for a community
 * @param {number} userId - The user ID
 * @param {number} communityId - The community ID
 */
async function updateUserStreak(userId, communityId) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get or create streak record
        let streak = await prisma.huddleStreak.findUnique({
            where: {
                userId_communityId: {
                    userId,
                    communityId
                }
            }
        });

        if (!streak) {
            // Create new streak
            streak = await prisma.huddleStreak.create({
                data: {
                    userId,
                    communityId,
                    currentStreak: 1,
                    longestStreak: 1,
                    lastHuddleDate: today
                }
            });
            return streak;
        }

        // Check if this is a consecutive day
        const lastDate = streak.lastHuddleDate ? new Date(streak.lastHuddleDate) : null;
        
        if (!lastDate) {
            // First huddle
            streak = await prisma.huddleStreak.update({
                where: { id: streak.id },
                data: {
                    currentStreak: 1,
                    longestStreak: Math.max(1, streak.longestStreak),
                    lastHuddleDate: today
                }
            });
        } else {
            lastDate.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

            if (daysDiff === 0) {
                // Same day, no streak change needed
                return streak;
            } else if (daysDiff === 1) {
                // Consecutive day, increase streak
                const newStreak = streak.currentStreak + 1;
                streak = await prisma.huddleStreak.update({
                    where: { id: streak.id },
                    data: {
                        currentStreak: newStreak,
                        longestStreak: Math.max(newStreak, streak.longestStreak),
                        lastHuddleDate: today
                    }
                });
            } else {
                // Streak broken, reset to 1
                streak = await prisma.huddleStreak.update({
                    where: { id: streak.id },
                    data: {
                        currentStreak: 1,
                        lastHuddleDate: today
                    }
                });
            }
        }

        return streak;
    } catch (error) {
        console.error(`Error updating streak for user ${userId}:`, error);
        return null;
    }
}

/**
 * Get user's streak for a community
 * @param {number} userId - The user ID
 * @param {number} communityId - The community ID
 * @returns {object} - The streak object
 */
async function getUserStreak(userId, communityId) {
    return await prisma.huddleStreak.findUnique({
        where: {
            userId_communityId: {
                userId,
                communityId
            }
        }
    });
}

/**
 * Check if user's streak is at risk (no huddle attended yesterday)
 * @param {number} userId - The user ID
 * @param {number} communityId - The community ID
 * @returns {boolean} - Whether streak is at risk
 */
async function isStreakAtRisk(userId, communityId) {
    const streak = await getUserStreak(userId, communityId);
    if (!streak || streak.currentStreak === 0) return false;

    const lastDate = streak.lastHuddleDate ? new Date(streak.lastHuddleDate) : null;
    if (!lastDate) return false;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);

    // If last huddle was before yesterday, streak is at risk
    return lastDate < yesterday;
}

// ==================== LEADERBOARD MANAGEMENT ====================

/**
 * Get community huddle leaderboard
 * @param {number} communityId - The community ID
 * @param {number} limit - Number of users to return
 * @returns {array} - Leaderboard entries
 */
async function getCommunityLeaderboard(communityId, limit = 10) {
    try {
        // Get all streaks for the community, sorted by current streak
        const streaks = await prisma.huddleStreak.findMany({
            where: { communityId },
            orderBy: [
                { currentStreak: 'desc' },
                { longestStreak: 'desc' }
            ],
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        user: {
                            select: {
                                name: true,
                                photoURL: true
                            }
                        },
                        expert: {
                            select: {
                                name: true,
                                photoURL: true
                            }
                        },
                        partner: {
                            select: {
                                name: true,
                                photoURL: true
                            }
                        }
                    }
                }
            }
        });

        // Get total points earned from huddles for each user
        const leaderboard = await Promise.all(streaks.map(async (streak, index) => {
            const totalPoints = await prisma.huddleAttendance.aggregate({
                where: {
                    userId: streak.userId,
                    huddle: { communityId }
                },
                _sum: {
                    pointsEarned: true
                }
            });

            const huddlesAttended = await prisma.huddleAttendance.count({
                where: {
                    userId: streak.userId,
                    huddle: { communityId }
                }
            });

            return {
                rank: index + 1,
                userId: streak.user.id,
                email: streak.user.email,
                name: streak.user.user?.name || streak.user.expert?.name || streak.user.partner?.name || "Unknown",
                photoURL: streak.user.user?.photoURL || streak.user.expert?.photoURL || streak.user.partner?.photoURL || "",
                currentStreak: streak.currentStreak,
                longestStreak: streak.longestStreak,
                totalPoints: totalPoints._sum.pointsEarned || 0,
                huddlesAttended,
                lastHuddleDate: streak.lastHuddleDate
            };
        }));

        return leaderboard;
    } catch (error) {
        console.error('Error getting community leaderboard:', error);
        return [];
    }
}

/**
 * Get user's rank in community leaderboard
 * @param {number} userId - The user ID
 * @param {number} communityId - The community ID
 * @returns {object} - User's rank info
 */
async function getUserRank(userId, communityId) {
    const leaderboard = await getCommunityLeaderboard(communityId, 100);
    const userEntry = leaderboard.find(entry => entry.userId === userId);
    
    return userEntry || { rank: null, message: 'User not on leaderboard yet' };
}

// ==================== POINTS MANAGEMENT ====================

/**
 * Assign points to all attendees after a huddle ends
 * @param {object} huddle - The huddle object
 */
async function assignPointsToAttendees(huddle) {
    try {
        const attendances = await prisma.huddleAttendance.findMany({
            where: { huddleId: huddle.id },
            include: {
                user: true
            }
        });

        for (const attendance of attendances) {
            const points = calculateAttendancePoints(attendance, huddle);
            
            // Update attendance with points
            await prisma.huddleAttendance.update({
                where: { id: attendance.id },
                data: { pointsEarned: points }
            });

            // Award rewards using the rewards service
            try {
                await rewardsManagement({
                    userId: attendance.userId,
                    rewardRuleName: RewardAction.ATTEND_HUDDLE,
                    type: RewardType.CREDIT
                });
            } catch (rewardError) {
                console.log(`Reward error for user ${attendance.userId}:`, rewardError);
            }
        }

        console.log(`Assigned points to ${attendances.length} attendees of huddle ${huddle.id}`);
    } catch (error) {
        console.error('Error assigning points to attendees:', error);
    }
}

/**
 * Calculate points for a huddle attendance
 * @param {object} attendance - The attendance record
 * @param {object} huddle - The huddle object
 * @returns {number} - Points earned
 */
function calculateAttendancePoints(attendance, huddle) {
    let points = 10; // Base points for attending

    // Bonus for staying entire duration
    if (attendance.joinedAt && attendance.leftAt && huddle.startTime && huddle.endTime) {
        const huddleDuration = new Date(huddle.endTime) - new Date(huddle.startTime);
        const attendanceDuration = new Date(attendance.leftAt) - new Date(attendance.joinedAt);
        
        if (attendanceDuration >= huddleDuration * 0.8) {
            points += 5; // Bonus for staying 80%+ of huddle
        }
    }

    // Bonus for being the leader
    if (huddle.leaderId === attendance.userId) {
        points += 10;
    }

    return points;
}

/**
 * Award points for completing a huddle activity
 * @param {number} userId - The user ID
 * @param {object} activity - The activity object
 * @returns {number} - Points awarded
 */
async function awardActivityCompletionPoints(userId, activity) {
    try {
        const pointsMap = {
            'AI_SLIDESHOW': 5,
            'AI_VIDEO_MESSAGE': 5,
            'DISCUSSION_TOPIC': 3,
            'QUIZ': 5,
            'DEBATE': 5,
            'CONTEST': 5,
            'VOTING_SURVEY': 2,
            'REFLECTION': 3,
            'GUIDED_SESSION': 3,
            'STORY_SPOTLIGHT': 4,
            'ANNOUNCEMENT': 2
        };

        const points = pointsMap[activity.activityType] || 2;

        // Award using rewards service
        try {
            await rewardsManagement({
                userId,
                rewardRuleName: RewardAction.COMPLETE_HUDDLE_ACTIVITY,
                type: RewardType.CREDIT
            });
        } catch (rewardError) {
            console.log(`Activity reward error for user ${userId}:`, rewardError);
        }

        return points;
    } catch (error) {
        console.error('Error awarding activity points:', error);
        return 0;
    }
}

// ==================== SUMMARY GENERATION ====================

/**
 * Generate a summary for a completed huddle
 * @param {object} huddle - The huddle object with attendances and activities
 * @returns {object} - The generated summary
 */
async function generateHuddleSummary(huddle) {
    try {
        const attendees = huddle.attendances || [];
        const activities = huddle.activities || [];

        // Calculate statistics
        const duration = huddle.startTime && huddle.endTime
            ? Math.round((new Date(huddle.endTime) - new Date(huddle.startTime)) / 60000)
            : 0;

        const totalPoints = attendees.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);

        // Generate highlights
        const highlights = [];
        
        if (attendees.length > 0) {
            highlights.push(`${attendees.length} participants joined the huddle`);
        }
        
        if (duration > 0) {
            highlights.push(`The huddle lasted ${duration} minutes`);
        }
        
        if (activities.length > 0) {
            const activityTypes = [...new Set(activities.map(a => a.activityType))];
            highlights.push(`Activities included: ${activityTypes.join(', ')}`);
        }

        // Generate summary text
        const summaryText = generateSummaryText(huddle, attendees, activities, duration);

        // Create summary record
        const summary = await prisma.huddleSummary.create({
            data: {
                huddleId: huddle.id,
                summaryText,
                highlights,
                aiGenerated: false // Set to true when AI is used
            }
        });

        return summary;
    } catch (error) {
        console.error('Error generating huddle summary:', error);
        throw error;
    }
}

/**
 * Generate summary text for a huddle
 * @param {object} huddle - The huddle object
 * @param {array} attendees - Array of attendees
 * @param {array} activities - Array of activities
 * @param {number} duration - Duration in minutes
 * @returns {string} - Summary text
 */
function generateSummaryText(huddle, attendees, activities, duration) {
    let text = `## ${huddle.title} Summary\n\n`;
    
    text += `### Overview\n`;
    text += `This huddle took place on ${new Date(huddle.startTime).toLocaleDateString()} `;
    text += `and lasted ${duration} minutes with ${attendees.length} participants.\n\n`;

    if (activities.length > 0) {
        text += `### Activities\n`;
        const activityTypes = [...new Set(activities.map(a => a.activityType))];
        activityTypes.forEach(type => {
            text += `- ${formatActivityType(type)}\n`;
        });
        text += '\n';
    }

    text += `### Engagement\n`;
    text += `- Total Participants: ${attendees.length}\n`;
    
    const totalPoints = attendees.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
    text += `- Total Points Awarded: ${totalPoints}\n`;

    return text;
}

/**
 * Format activity type for display
 * @param {string} type - The activity type enum value
 * @returns {string} - Formatted activity name
 */
function formatActivityType(type) {
    const formatMap = {
        'AI_SLIDESHOW': 'AI Slideshow Presentation',
        'AI_VIDEO_MESSAGE': 'AI Video Message',
        'DISCUSSION_TOPIC': 'Discussion Topic',
        'QUIZ': 'Quiz',
        'DEBATE': 'Debate',
        'CONTEST': 'Contest',
        'VOTING_SURVEY': 'Voting/Survey',
        'REFLECTION': '1-Minute Reflection',
        'GUIDED_SESSION': 'Guided Session',
        'STORY_SPOTLIGHT': 'Story Spotlight',
        'ANNOUNCEMENT': 'Announcement'
    };

    return formatMap[type] || type;
}

/**
 * Generate AI-powered summary using ChatGPT (placeholder)
 * @param {object} huddle - The huddle object
 * @returns {string} - AI-generated summary
 */
async function generateAISummary(huddle) {
    // TODO: Implement ChatGPT API call for AI-generated summary
    console.log('AI summary generation pending - ChatGPT API integration required');
    
    // For now, use the basic summary generation
    const summary = await generateHuddleSummary(huddle);
    return summary;
}

module.exports = {
    // Streak management
    updateStreaksForHuddle,
    updateUserStreak,
    getUserStreak,
    isStreakAtRisk,
    // Leaderboard management
    getCommunityLeaderboard,
    getUserRank,
    // Points management
    assignPointsToAttendees,
    calculateAttendancePoints,
    awardActivityCompletionPoints,
    // Summary generation
    generateHuddleSummary,
    generateSummaryText,
    formatActivityType,
    generateAISummary
};
