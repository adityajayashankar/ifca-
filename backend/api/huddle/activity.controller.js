const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const activityGenerator = require("../../services/huddle/activity-generator.service");

/**
 * Submit vote for a voting survey activity
 * POST /api/v1/huddle/activity/:activityId/vote
 */
exports.submitVote = async function (req, res) {
  try {
    const { activityId } = req.params;
    const { selectedOptions, userId } = req.body;

    if (!selectedOptions || !Array.isArray(selectedOptions) || selectedOptions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "selectedOptions array is required"
      });
    }

    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      include: { huddle: true }
    });

    if (!activity || activity.activityType !== 'VOTING_SURVEY') {
      return res.status(404).json({
        success: false,
        message: "Voting survey activity not found"
      });
    }

    const activityData = activity.activityData || {};
    const results = activityData.results || [];
    const options = activityData.options || [];

    // Validate selected options
    const validOptions = selectedOptions.filter(opt => 
      typeof opt === 'number' && opt >= 0 && opt < options.length
    );

    if (validOptions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid option selection"
      });
    }

    // Update vote counts
    validOptions.forEach(optionIndex => {
      if (results[optionIndex]) {
        results[optionIndex].votes = (results[optionIndex].votes || 0) + 1;
      }
    });

    const totalVotes = results.reduce((sum, r) => sum + (r.votes || 0), 0);

    // Calculate percentages
    results.forEach(result => {
      result.percentage = totalVotes > 0 
        ? ((result.votes || 0) / totalVotes) * 100 
        : 0;
    });

    // Update activity data
    await prisma.huddleActivity.update({
      where: { id: parseInt(activityId) },
      data: {
        activityData: {
          ...activityData,
          totalVotes: totalVotes,
          results: results
        }
      }
    });

    // If poll post exists, update it too
    if (activity.pollId) {
      try {
        // Update poll options votes
        await Promise.all(
          validOptions.map(async (optionIndex) => {
            const pollOptions = await prisma.pollOptions.findMany({
              where: { postId: activity.pollId },
              orderBy: { order: 'asc' }
            });

            if (pollOptions[optionIndex]) {
              // Note: This assumes PollOptions has a votes field
              // If not, you may need to track votes separately
              await prisma.pollOptions.update({
                where: { id: pollOptions[optionIndex].id },
                data: {
                  // votes: (pollOptions[optionIndex].votes || 0) + 1
                }
              });
            }
          })
        );
      } catch (pollError) {
        console.error('Error updating poll post:', pollError);
        // Continue even if poll update fails
      }
    }

    return res.status(200).json({
      success: true,
      message: "Vote submitted successfully",
      results: results,
      totalVotes: totalVotes
    });

  } catch (error) {
    console.error("Error submitting vote:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit vote",
      error: error.message
    });
  }
};

/**
 * Submit quiz answers
 * POST /api/v1/huddle/activity/:activityId/quiz/submit
 */
exports.submitQuizAnswers = async function (req, res) {
  try {
    const { activityId } = req.params;
    const { answers, userId } = req.body; // answers: [{ questionId: 1, selectedAnswer: 0 }]

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "answers array is required"
      });
    }

    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) }
    });

    if (!activity || activity.activityType !== 'QUIZ') {
      return res.status(404).json({
        success: false,
        message: "Quiz activity not found"
      });
    }

    const activityData = activity.activityData || {};
    const questions = activityData.questions || [];

    // Calculate score
    let correctAnswers = 0;
    const results = answers.map(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) return null;

      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      if (isCorrect) correctAnswers++;

      return {
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect,
        explanation: question.explanation || ''
      };
    }).filter(r => r !== null);

    const score = questions.length > 0 
      ? (correctAnswers / questions.length) * 100 
      : 0;

    return res.status(200).json({
      success: true,
      message: "Quiz submitted successfully",
      score: score,
      correctAnswers: correctAnswers,
      totalQuestions: questions.length,
      results: results
    });

  } catch (error) {
    console.error("Error submitting quiz:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit quiz",
      error: error.message
    });
  }
};

/**
 * Regenerate activity content
 * POST /api/v1/huddle/activity/:activityId/regenerate
 */
exports.regenerateActivity = async function (req, res) {
  try {
    const { activityId } = req.params;

    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      include: {
        huddle: {
          include: {
            community: true
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    if (!activity.huddle || !activity.huddle.community) {
      return res.status(404).json({
        success: false,
        message: "Huddle or community not found"
      });
    }

    // Trigger regeneration in background
    activityGenerator.generateActivityContent(
      activity,
      activity.huddle,
      activity.huddle.community
    ).catch(error => {
      console.error(`Background regeneration failed for activity ${activityId}:`, error);
    });

    return res.status(200).json({
      success: true,
      message: "Activity regeneration started",
      activityId: activityId
    });

  } catch (error) {
    console.error("Error regenerating activity:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to regenerate activity",
      error: error.message
    });
  }
};

/**
 * Get activity generation status
 * GET /api/v1/huddle/activity/:activityId/status
 */
exports.getActivityStatus = async function (req, res) {
  try {
    const { activityId } = req.params;

    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      select: {
        id: true,
        activityType: true,
        activityData: true,
        isGenerated: true,
        linkUrl: true
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    const status = activity.activityData?.status || 'pending';

    return res.status(200).json({
      success: true,
      activityId: activity.id,
      activityType: activity.activityType,
      status: status,
      isGenerated: activity.isGenerated,
      linkUrl: activity.linkUrl,
      hasError: status === 'failed',
      error: activity.activityData?.error || null
    });

  } catch (error) {
    console.error("Error getting activity status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get activity status",
      error: error.message
    });
  }
};

/**
 * Mark activity as completed for a user
 * POST /api/v1/huddle/activity/:activityId/complete
 */
exports.markActivityComplete = async function (req, res) {
  try {
    const { activityId } = req.params;
    const { userId, huddleId } = req.body;

    if (!userId || !huddleId) {
      return res.status(400).json({
        success: false,
        message: "userId and huddleId are required"
      });
    }

    // Check if activity exists
    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      include: { huddle: true }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    // Check if already completed
    const existingCompletion = await prisma.huddleActivityCompletion.findUnique({
      where: {
        huddleId_activityId_userId: {
          huddleId: parseInt(huddleId),
          activityId: parseInt(activityId),
          userId: parseInt(userId)
        }
      }
    });

    if (existingCompletion) {
      return res.status(200).json({
        success: true,
        message: "Activity already marked as completed",
        completion: existingCompletion
      });
    }

    // Create completion record
    const completion = await prisma.huddleActivityCompletion.create({
      data: {
        huddleId: parseInt(huddleId),
        activityId: parseInt(activityId),
        userId: parseInt(userId),
        completedAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: "Activity marked as completed",
      completion: completion
    });

  } catch (error) {
    console.error("Error marking activity as complete:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark activity as complete",
      error: error.message
    });
  }
};

/**
 * Get user's activity completion status
 * GET /api/v1/huddle/:huddleId/user/:userId/completions
 */
exports.getUserActivityCompletions = async function (req, res) {
  try {
    const { huddleId, userId } = req.params;

    const completions = await prisma.huddleActivityCompletion.findMany({
      where: {
        huddleId: parseInt(huddleId),
        userId: parseInt(userId)
      },
      include: {
        activity: {
          select: {
            id: true,
            activityType: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      completions: completions.map(c => ({
        activityId: c.activityId,
        activityType: c.activity.activityType,
        completedAt: c.completedAt
      }))
    });

  } catch (error) {
    console.error("Error getting user activity completions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get activity completions",
      error: error.message
    });
  }
};

/**
 * Get activity details with generated content
 * GET /api/v1/huddle/activity/:activityId
 */
exports.getActivityDetails = async function (req, res) {
  try {
    const { activityId } = req.params;

    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      include: {
        huddle: {
          select: {
            id: true,
            title: true,
            communityId: true
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    return res.status(200).json({
      success: true,
      activity: {
        id: activity.id,
        activityType: activity.activityType,
        activityData: activity.activityData,
        isGenerated: activity.isGenerated,
        isActive: activity.isActive,
        linkUrl: activity.linkUrl,
        pollId: activity.pollId,
        postId: activity.postId,
        threadId: activity.threadId,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
        huddle: activity.huddle
      }
    });

  } catch (error) {
    console.error("Error getting activity details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get activity details",
      error: error.message
    });
  }
};

/**
 * Toggle activity completion status (for hosts/admins)
 * POST /api/v1/huddle/activity/:activityId/toggle-complete
 */
exports.toggleActivityComplete = async function (req, res) {
  try {
    const { activityId } = req.params;
    const { userId, huddleId } = req.body;

    if (!userId || !huddleId) {
      return res.status(400).json({
        success: false,
        message: "userId and huddleId are required"
      });
    }

    // Check if activity exists
    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      include: { huddle: true }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    // Check if completion exists
    const existingCompletion = await prisma.huddleActivityCompletion.findUnique({
      where: {
        huddleId_activityId_userId: {
          huddleId: parseInt(huddleId),
          activityId: parseInt(activityId),
          userId: parseInt(userId)
        }
      }
    });

    let completion;
    if (existingCompletion) {
      // Delete completion (mark as incomplete)
      await prisma.huddleActivityCompletion.delete({
        where: { id: existingCompletion.id }
      });
      completion = null;
    } else {
      // Create completion (mark as complete)
      completion = await prisma.huddleActivityCompletion.create({
        data: {
          huddleId: parseInt(huddleId),
          activityId: parseInt(activityId),
          userId: parseInt(userId),
          completedAt: new Date()
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: existingCompletion ? "Activity marked as incomplete" : "Activity marked as completed",
      isCompleted: !existingCompletion,
      completion: completion
    });

  } catch (error) {
    console.error("Error toggling activity completion:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle activity completion",
      error: error.message
    });
  }
};

/**
 * Update video playback state for AI_VIDEO_MESSAGE activity (moderator only)
 * POST /api/v1/huddle/activity/:activityId/video-state
 */
exports.updateVideoPlaybackState = async function (req, res) {
  try {
    const { activityId } = req.params;
    const { isPlaying, currentTime, userId } = req.body;

    // Validate required fields
    if (typeof isPlaying !== 'boolean' || typeof currentTime !== 'number') {
      return res.status(400).json({
        success: false,
        message: "isPlaying (boolean) and currentTime (number) are required"
      });
    }

    // Get activity and check authorization
    const userUnifiedId = userId ? parseInt(userId) : (req.user?.id || req.user?.unifiedUserId);
    
    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      include: {
        huddle: {
          include: {
            community: true
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    if (activity.activityType !== 'AI_VIDEO_MESSAGE' && activity.activityType !== 'ANTHEM') {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for AI_VIDEO_MESSAGE or ANTHEM activities"
      });
    }

    // Check if user is authorized (moderator/admin/leader/community admin)
    const isCreator = activity.huddle.creatorId === userUnifiedId;
    const isLeader = activity.huddle.leaderId === userUnifiedId;
    
    // Check community role via Subscription
    let isCommunityAdmin = false;
    if (userUnifiedId && activity.huddle.communityId) {
      const subscription = await prisma.subscription.findUnique({
        where: {
          unifiedUserId_communityId: {
            unifiedUserId: userUnifiedId,
            communityId: activity.huddle.communityId
          }
        },
        select: {
          role: true
        }
      });
      isCommunityAdmin = subscription?.role === 'ADMIN' || subscription?.role === 'MODERATOR';
    }
    
    const isAdmin = req.user?.userType === 'admin' || req.user?.role === 'admin';

    if (!isCreator && !isLeader && !isCommunityAdmin && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only moderators, admins, leaders, or community admins can control video playback"
      });
    }

    // Update activity data with video playback state
    const activityData = activity.activityData || {};
    const updatedActivityData = {
      ...activityData,
      videoPlaybackState: {
        isPlaying: isPlaying,
        currentTime: currentTime,
        lastUpdated: new Date().toISOString(),
        updatedBy: userUnifiedId
      }
    };

    await prisma.huddleActivity.update({
      where: { id: parseInt(activityId) },
      data: {
        activityData: updatedActivityData
      }
    });

    return res.status(200).json({
      success: true,
      message: "Video playback state updated",
      videoState: {
        isPlaying: isPlaying,
        currentTime: currentTime,
        lastUpdated: updatedActivityData.videoPlaybackState.lastUpdated
      }
    });

  } catch (error) {
    console.error("Error updating video playback state:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update video playback state",
      error: error.message
    });
  }
};

/**
 * Get video playback state for AI_VIDEO_MESSAGE activity
 * GET /api/v1/huddle/activity/:activityId/video-state
 */
exports.getVideoPlaybackState = async function (req, res) {
  try {
    const { activityId } = req.params;

    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      select: {
        id: true,
        activityType: true,
        activityData: true
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    if (activity.activityType !== 'AI_VIDEO_MESSAGE' && activity.activityType !== 'ANTHEM') {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for AI_VIDEO_MESSAGE or ANTHEM activities"
      });
    }

    const activityData = activity.activityData || {};
    const videoState = activityData.videoPlaybackState || {
      isPlaying: false,
      currentTime: 0,
      lastUpdated: null,
      updatedBy: null
    };

    return res.status(200).json({
      success: true,
      videoState: {
        isPlaying: videoState.isPlaying || false,
        currentTime: videoState.currentTime || 0,
        lastUpdated: videoState.lastUpdated || null,
        updatedBy: videoState.updatedBy || null
      }
    });

  } catch (error) {
    console.error("Error getting video playback state:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get video playback state",
      error: error.message
    });
  }
};

/**
 * Add a message to DISCUSSION_TOPIC activity
 * POST /api/v1/huddle/activity/:activityId/discussion/message
 */
exports.addDiscussionMessage = async function (req, res) {
  try {
    const { activityId } = req.params;
    const { text, link, userId, userName } = req.body;

    // Validate required fields
    if (!text && !link) {
      return res.status(400).json({
        success: false,
        message: "Either text or link is required"
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    // Get activity
    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      select: {
        id: true,
        activityType: true,
        activityData: true
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    if (activity.activityType !== 'DISCUSSION_TOPIC') {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for DISCUSSION_TOPIC activities"
      });
    }

    // Get or initialize messages array
    const activityData = activity.activityData || {};
    const messages = activityData.messages || [];

    // Create new message
    const newMessage = {
      id: Date.now().toString(), // Simple ID generation
      text: text || null,
      link: link || null,
      userId: parseInt(userId),
      userName: userName || 'Anonymous',
      timestamp: new Date().toISOString()
    };

    // Add message to array
    messages.push(newMessage);

    // Update activity data
    await prisma.huddleActivity.update({
      where: { id: parseInt(activityId) },
      data: {
        activityData: {
          ...activityData,
          messages: messages
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: "Message added successfully",
      newMessage: newMessage
    });

  } catch (error) {
    console.error("Error adding discussion message:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add discussion message",
      error: error.message
    });
  }
};

/**
 * Get discussion messages for DISCUSSION_TOPIC activity
 * GET /api/v1/huddle/activity/:activityId/discussion/messages
 */
exports.getDiscussionMessages = async function (req, res) {
  try {
    const { activityId } = req.params;

    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      select: {
        id: true,
        activityType: true,
        activityData: true
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    if (activity.activityType !== 'DISCUSSION_TOPIC') {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for DISCUSSION_TOPIC activities"
      });
    }

    const activityData = activity.activityData || {};
    const messages = activityData.messages || [];

    return res.status(200).json({
      success: true,
      messages: messages
    });

  } catch (error) {
    console.error("Error getting discussion messages:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get discussion messages",
      error: error.message
    });
  }
};

/**
 * Get debate data for DEBATE activity
 * GET /api/v1/huddle/activity/:activityId/debate
 */
exports.getDebate = async function (req, res) {
  try {
    const { activityId } = req.params;

    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      select: {
        id: true,
        activityType: true,
        activityData: true
      }
    });

    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    if (activity.activityType !== 'DEBATE') {
      return res.status(400).json({ success: false, message: "This endpoint is only for DEBATE activities" });
    }

    const activityData = activity.activityData || {};
    const sides = activityData.sides || { for: { arguments: [] }, against: { arguments: [] } };

    return res.status(200).json({ success: true, debate: { sides } });

  } catch (error) {
    console.error("Error getting debate data:", error);
    return res.status(500).json({ success: false, message: "Failed to get debate data", error: error.message });
  }
};


/**
 * Add an argument to a DEBATE activity
 * POST /api/v1/huddle/activity/:activityId/debate/argument
 */
exports.addDebateArgument = async function (req, res) {
  try {
    const { activityId } = req.params;
    const { side, text, userId, userName } = req.body;

    if (!side || !['for', 'against'].includes(side)) {
      return res.status(400).json({ success: false, message: "side must be 'for' or 'against'" });
    }
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: "text is required" });
    }

    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      select: { id: true, activityType: true, activityData: true }
    });

    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    if (activity.activityType !== 'DEBATE') {
      return res.status(400).json({ success: false, message: "This endpoint is only for DEBATE activities" });
    }

    const activityData = activity.activityData || {};
    const sides = activityData.sides || { for: { arguments: [] }, against: { arguments: [] } };

    const newArg = {
      id: Date.now().toString(),
      text: text.trim(),
      userId: userId ? parseInt(userId) : null,
      userName: userName || 'Anonymous',
      timestamp: new Date().toISOString()
    };

    // Push to appropriate side
    sides[side] = sides[side] || { arguments: [] };
    sides[side].arguments = sides[side].arguments || [];
    sides[side].arguments.push(newArg);

    // Persist
    await prisma.huddleActivity.update({
      where: { id: parseInt(activityId) },
      data: {
        activityData: {
          ...activityData,
          sides: sides
        }
      }
    });

    return res.status(200).json({ success: true, message: "Argument added", argument: newArg });

  } catch (error) {
    console.error("Error adding debate argument:", error);
    return res.status(500).json({ success: false, message: "Failed to add argument", error: error.message });
  }
};

/**
 * Get contest data for CONTEST activity
 * GET /api/v1/huddle/activity/:activityId/contest
 */
exports.getContest = async function (req, res) {
  try {
    const { activityId } = req.params;

    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      select: {
        id: true,
        activityType: true,
        activityData: true
      }
    });

    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    if (activity.activityType !== 'CONTEST') {
      return res.status(400).json({ success: false, message: "This endpoint is only for CONTEST activities" });
    }

    const activityData = activity.activityData || {};
    const submissions = activityData.submissions || [];

    return res.status(200).json({
      success: true,
      contest: {
        title: activityData.title,
        description: activityData.description,
        rules: activityData.rules || [],
        prizes: activityData.prizes || [],
        criteria: activityData.criteria || [],
        deadline: activityData.deadline,
        submissions: submissions
      }
    });

  } catch (error) {
    console.error("Error getting contest data:", error);
    return res.status(500).json({ success: false, message: "Failed to get contest data", error: error.message });
  }
};

/**
 * Submit a contest entry
 * POST /api/v1/huddle/activity/:activityId/contest/entry
 */
exports.submitContestEntry = async function (req, res) {
  try {
    const { activityId } = req.params;
    const { text, userId, userName } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: "text is required" });
    }

    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      select: { id: true, activityType: true, activityData: true }
    });

    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    if (activity.activityType !== 'CONTEST') {
      return res.status(400).json({ success: false, message: "This endpoint is only for CONTEST activities" });
    }

    const activityData = activity.activityData || {};
    const submissions = activityData.submissions || [];

    const newSubmission = {
      id: Date.now().toString(),
      text: text.trim(),
      userId: userId ? parseInt(userId) : null,
      userName: userName || 'Anonymous',
      timestamp: new Date().toISOString()
    };

    submissions.push(newSubmission);

    // Persist
    await prisma.huddleActivity.update({
      where: { id: parseInt(activityId) },
      data: {
        activityData: {
          ...activityData,
          submissions: submissions
        }
      }
    });

    return res.status(200).json({ success: true, message: "Entry submitted", entry: newSubmission });

  } catch (error) {
    console.error("Error submitting contest entry:", error);
    return res.status(500).json({ success: false, message: "Failed to submit entry", error: error.message });
  }
};

/**
 * Update guided session state for GUIDED_SESSION activity (moderator only)
 * POST /api/v1/huddle/activity/:activityId/guided-session-state
 */
exports.updateGuidedSessionState = async function (req, res) {
  try {
    const { activityId } = req.params;
    const { currentStep, isPlaying, timeElapsed, userId } = req.body;

    // Validate required fields
    if (typeof currentStep !== 'number' || typeof isPlaying !== 'boolean' || typeof timeElapsed !== 'number') {
      return res.status(400).json({
        success: false,
        message: "currentStep (number), isPlaying (boolean), and timeElapsed (number) are required"
      });
    }

    // Get activity and check authorization
    const userUnifiedId = userId ? parseInt(userId) : (req.user?.id || req.user?.unifiedUserId);
    
    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      include: {
        huddle: {
          include: {
            community: true
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    if (activity.activityType !== 'GUIDED_SESSION') {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for GUIDED_SESSION activities"
      });
    }

    // Check if user is authorized (moderator/admin/leader/community admin)
    const isCreator = activity.huddle.creatorId === userUnifiedId;
    const isLeader = activity.huddle.leaderId === userUnifiedId;
    
    // Check community role via Subscription
    let isCommunityAdmin = false;
    if (userUnifiedId && activity.huddle.communityId) {
      const subscription = await prisma.subscription.findUnique({
        where: {
          unifiedUserId_communityId: {
            unifiedUserId: userUnifiedId,
            communityId: activity.huddle.communityId
          }
        },
        select: {
          role: true
        }
      });
      isCommunityAdmin = subscription?.role === 'ADMIN' || subscription?.role === 'MODERATOR';
    }
    
    const isAdmin = req.user?.userType === 'admin' || req.user?.role === 'admin';

    if (!isCreator && !isLeader && !isCommunityAdmin && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only moderators, admins, leaders, or community admins can control guided session"
      });
    }

    // Update activity data with guided session state
    const activityData = activity.activityData || {};
    const updatedActivityData = {
      ...activityData,
      guidedSessionState: {
        currentStep: currentStep,
        isPlaying: isPlaying,
        timeElapsed: timeElapsed,
        lastUpdated: new Date().toISOString(),
        updatedBy: userUnifiedId
      }
    };

    await prisma.huddleActivity.update({
      where: { id: parseInt(activityId) },
      data: {
        activityData: updatedActivityData
      }
    });

    return res.status(200).json({
      success: true,
      message: "Guided session state updated",
      sessionState: {
        currentStep: currentStep,
        isPlaying: isPlaying,
        timeElapsed: timeElapsed,
        lastUpdated: updatedActivityData.guidedSessionState.lastUpdated
      }
    });

  } catch (error) {
    console.error("Error updating guided session state:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update guided session state",
      error: error.message
    });
  }
};

/**
 * Get guided session state for GUIDED_SESSION activity
 * GET /api/v1/huddle/activity/:activityId/guided-session-state
 */
exports.getGuidedSessionState = async function (req, res) {
  try {
    const { activityId } = req.params;

    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      select: {
        id: true,
        activityType: true,
        activityData: true
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    if (activity.activityType !== 'GUIDED_SESSION') {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for GUIDED_SESSION activities"
      });
    }

    const activityData = activity.activityData || {};
    const sessionState = activityData.guidedSessionState || {
      currentStep: 0,
      isPlaying: false,
      timeElapsed: 0,
      lastUpdated: null,
      updatedBy: null
    };

    return res.status(200).json({
      success: true,
      sessionState: {
        currentStep: sessionState.currentStep || 0,
        isPlaying: sessionState.isPlaying || false,
        timeElapsed: sessionState.timeElapsed || 0,
        lastUpdated: sessionState.lastUpdated || null,
        updatedBy: sessionState.updatedBy || null
      }
    });

  } catch (error) {
    console.error("Error getting guided session state:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get guided session state",
      error: error.message
    });
  }
};

/**
 * Update slideshow state for AI_SLIDESHOW activity (moderator only)
 * POST /api/v1/huddle/activity/:activityId/slideshow-state
 */
exports.updateSlideshowState = async function (req, res) {
  try {
    const { activityId } = req.params;
    const { currentSlideIndex, isAutoPlay, userId } = req.body;

    // Validate required fields
    if (typeof currentSlideIndex !== 'number' || typeof isAutoPlay !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "currentSlideIndex (number) and isAutoPlay (boolean) are required"
      });
    }

    // Get activity and check authorization
    const userUnifiedId = userId ? parseInt(userId) : (req.user?.id || req.user?.unifiedUserId);
    
    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      include: {
        huddle: {
          include: {
            community: true
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    if (activity.activityType !== 'AI_SLIDESHOW') {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for AI_SLIDESHOW activities"
      });
    }

    // Check if user is authorized (moderator/admin/leader/community admin)
    const isCreator = activity.huddle.creatorId === userUnifiedId;
    const isLeader = activity.huddle.leaderId === userUnifiedId;
    
    // Check community role via Subscription
    let isCommunityAdmin = false;
    if (userUnifiedId && activity.huddle.communityId) {
      const subscription = await prisma.subscription.findUnique({
        where: {
          unifiedUserId_communityId: {
            unifiedUserId: userUnifiedId,
            communityId: activity.huddle.communityId
          }
        },
        select: {
          role: true
        }
      });
      isCommunityAdmin = subscription?.role === 'ADMIN' || subscription?.role === 'MODERATOR';
    }
    
    const isAdmin = req.user?.userType === 'admin' || req.user?.role === 'admin';

    if (!isCreator && !isLeader && !isCommunityAdmin && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only moderators, admins, leaders, or community admins can control slideshow"
      });
    }

    // Get slides to validate index
    const activityData = activity.activityData || {};
    const slides = activityData.images || activityData.slides || [];
    const validSlideIndex = Math.max(0, Math.min(currentSlideIndex, slides.length - 1));

    // Update activity data with slideshow state
    const updatedActivityData = {
      ...activityData,
      slideshowState: {
        currentSlideIndex: validSlideIndex,
        isAutoPlay: isAutoPlay,
        lastUpdated: new Date().toISOString(),
        updatedBy: userUnifiedId
      }
    };

    await prisma.huddleActivity.update({
      where: { id: parseInt(activityId) },
      data: {
        activityData: updatedActivityData
      }
    });

    return res.status(200).json({
      success: true,
      message: "Slideshow state updated",
      slideshowState: {
        currentSlideIndex: validSlideIndex,
        isAutoPlay: isAutoPlay,
        lastUpdated: updatedActivityData.slideshowState.lastUpdated
      }
    });

  } catch (error) {
    console.error("Error updating slideshow state:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update slideshow state",
      error: error.message
    });
  }
};

/**
 * Get slideshow state for AI_SLIDESHOW activity
 * GET /api/v1/huddle/activity/:activityId/slideshow-state
 */
exports.getSlideshowState = async function (req, res) {
  try {
    const { activityId } = req.params;

    const activity = await prisma.huddleActivity.findUnique({
      where: { id: parseInt(activityId) },
      select: {
        id: true,
        activityType: true,
        activityData: true
      }
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    if (activity.activityType !== 'AI_SLIDESHOW') {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for AI_SLIDESHOW activities"
      });
    }

    const activityData = activity.activityData || {};
    const slideshowState = activityData.slideshowState || {
      currentSlideIndex: 0,
      isAutoPlay: false,
      lastUpdated: null,
      updatedBy: null
    };

    return res.status(200).json({
      success: true,
      slideshowState: {
        currentSlideIndex: slideshowState.currentSlideIndex || 0,
        isAutoPlay: slideshowState.isAutoPlay || false,
        lastUpdated: slideshowState.lastUpdated || null,
        updatedBy: slideshowState.updatedBy || null
      }
    });

  } catch (error) {
    console.error("Error getting slideshow state:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get slideshow state",
      error: error.message
    });
  }
};
