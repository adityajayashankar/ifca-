const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const aiService = require('../ai/ai.service');
const s3Service = require('../storage/s3.service');

class ActivityGeneratorService {
  /**
   * Build context for AI prompts
   */
  buildContext(huddle, community) {
    return {
      huddleTitle: huddle.title,
      huddleDescription: huddle.description || '',
      communityName: community.title,
      communityDesc: community.desc || '',
      communityTags: community.tags || []
    };
  }

  /**
   * Generate content for an activity
   */
  async generateActivityContent(activity, huddle, community) {
    try {
      // Update status to "generating"
      await this.updateActivityStatus(activity.id, 'generating');

      const context = this.buildContext(huddle, community);
      let result;

      switch (activity.activityType) {
        case 'AI_SLIDESHOW':
          result = await this.generateSlideshow(activity, huddle, community, context);
          break;
        case 'AI_VIDEO_MESSAGE':
          result = await this.generateVideoMessage(activity, huddle, community, context);
          break;
        case 'DISCUSSION_TOPIC':
          result = await this.generateDiscussionTopic(activity, huddle, community, context);
          break;
        case 'QUIZ':
          result = await this.generateQuiz(activity, huddle, community, context);
          break;
        case 'VOTING_SURVEY':
          result = await this.generateVotingSurvey(activity, huddle, community, context);
          break;
        case 'DEBATE':
          result = await this.generateDebate(activity, huddle, community, context);
          break;
        case 'CONTEST':
          result = await this.generateContest(activity, huddle, community, context);
          break;
        case 'REFLECTION':
          result = await this.generateReflection(activity, huddle, community, context);
          break;
        case 'GUIDED_SESSION':
          result = await this.generateGuidedSession(activity, huddle, community, context);
          break;
        case 'STORY_SPOTLIGHT':
          result = await this.generateStorySpotlight(activity, huddle, community, context);
          break;
        case 'ANNOUNCEMENT':
          result = await this.generateAnnouncement(activity, huddle, community, context);
          break;
        default:
          throw new Error(`Unknown activity type: ${activity.activityType}`);
      }

      // Update activity with generated content
      await this.updateActivityWithContent(activity.id, result, 'completed');
      
      return result;
    } catch (error) {
      console.error(`Error generating ${activity.activityType} for activity ${activity.id}:`, error);
      const errorMessage = typeof error === 'string' 
        ? error 
        : error?.message || error?.error?.message || 'Failed to generate activity content';
      
      await this.updateActivityStatus(activity.id, 'failed', { error: errorMessage });
      
      // Don't throw - let the background process continue for other activities
      // Return a failed status object instead
      return {
        status: 'failed',
        error: errorMessage,
        generatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Generate AI Slideshow
   */
  async generateSlideshow(activity, huddle, community, context) {
    const tags = Array.isArray(context.communityTags) 
      ? context.communityTags.join(', ') 
      : (context.communityTags || 'general interests');
    
    const prompt = `You are a news editor presenting top 10 headlines that are relevant to audience of ${context.communityName} (${context.communityDesc}), interested in ${tags}. Prioritize latest news items, awards, deaths and regulations. Create professional banner-style news slides with news items and most relevant images. The image should be wide banner format suitable for website header display.`;

    try {
      // Generate banner-sized images using DALL-E (1792x1024 for DALL-E 3)
      const imageResult = await aiService.generateMultipleImages(prompt, 4, {
        size: '1792x1024' // Banner size
      });
      
      // Check if image generation failed
      if (imageResult.failed || !imageResult.images || imageResult.images.length === 0) {
        throw new Error(imageResult.error || 'Failed to generate slideshow images');
      }
      
      // Upload images to S3
      const imageUrls = [];
      for (let i = 0; i < imageResult.images.length; i++) {
        try {
          const s3Url = await s3Service.uploadFromUrl(
            imageResult.images[i],
            `huddles/${huddle.id}/activities/${activity.id}/slides`,
            `slide-${i + 1}.jpg`
          );
          imageUrls.push(s3Url);
        } catch (uploadError) {
          console.error(`Error uploading slide ${i + 1}:`, uploadError);
          // Continue with other slides
        }
      }

      return {
        status: 'completed',
        images: imageUrls,
        prompt,
        provider: imageResult.provider,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating slideshow:', error);
      // Return a graceful failure instead of throwing
      return {
        status: 'failed',
        images: [],
        prompt,
        error: typeof error === 'string' ? error : error?.message || 'Failed to generate slideshow images',
        generatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Generate AI Video Message
   */
  async generateVideoMessage(activity, huddle, community, context) {
    const prompt = `You are worlds top5 motivational video creator. Create a 2 mins video script For the community ${context.communityName} Motivated by ${context.huddleTitle}. Using top 5 news items bringing out a purpose. Context: ${context.huddleDescription}`;

    try {
      // Generate video script using OpenAI/Gemini
      const scriptResult = await aiService.generateText(prompt, {
        max_tokens: 500,
        temperature: 0.8
      });

      // Generate banner-sized images for video slides using OpenAI DALL-E
      const videoImagePrompt = `Create a motivational banner image for the community ${context.communityName} about ${context.huddleTitle}. The image should be inspiring, professional, and suitable for a video presentation. Style: modern, engaging, with motivational elements.`;
      
      try {
        // Generate a banner image for the video
        const bannerImageResult = await aiService.generateImage(videoImagePrompt, {
          size: '1792x1024', // Banner size
          n: 1
        });

        // Check if image generation failed
        if (bannerImageResult.failed || !bannerImageResult.images || bannerImageResult.images.length === 0) {
          throw new Error(bannerImageResult.error || 'Failed to generate video banner image');
        }

        // Upload banner image to S3
        let bannerImageUrl = null;
        if (bannerImageResult.images && bannerImageResult.images.length > 0) {
        try {
            bannerImageUrl = await s3Service.uploadFromUrl(
              bannerImageResult.images[0],
            `huddles/${huddle.id}/activities/${activity.id}/video`,
              'banner.jpg'
          );
        } catch (uploadError) {
            console.error('Error uploading video banner image:', uploadError);
        }
      }

      return {
        status: 'completed',
          videoUrl: null, // No actual video file - only script and image
          script: scriptResult.content,
          bannerImage: bannerImageUrl,
          duration: 120,
          prompt,
          provider: scriptResult.provider,
          videoProvider: 'script-only', // Indicates script-based, not actual video
          generatedAt: new Date().toISOString(),
          note: 'This is a script-based presentation with a banner image. The script can be used for narration.'
        };
      } catch (imageError) {
        console.error('Error generating video banner image:', imageError);
        // Return script only if image generation fails
        return {
          status: 'completed',
          videoUrl: null,
        script: scriptResult.content,
        duration: 120,
        prompt,
        provider: scriptResult.provider,
          videoProvider: 'text-only',
          generatedAt: new Date().toISOString(),
          note: 'Video script generated. Image generation failed.'
      };
      }
    } catch (error) {
      console.error('Error generating video message:', error);
      throw error;
    }
  }

  /**
   * Generate Discussion Topic
   */
  async generateDiscussionTopic(activity, huddle, community, context) {
    const prompt = `If you are an analyst on reddit/ quora and understand what topics makes the best engagements. List 10 most interesting discussions, Quiz, Poll that team members of community ${context.communityName} can have based on recent trends related to ${context.huddleTitle}. Context: ${context.huddleDescription}. Community focus: ${context.communityDesc}. Format your response as JSON: { "topic": "Main discussion topic", "instructions": "How to engage in this discussion", "discussionPoints": ["Point 1", "Point 2", "Point 3"] }`;

    try {
      const result = await aiService.generateText(prompt, {
        max_tokens: 1000,
        temperature: 0.8
      });

      // Parse JSON response
      let discussionData;
      try {
        discussionData = JSON.parse(result.content);
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from markdown code blocks
        const jsonMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         result.content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          discussionData = JSON.parse(jsonMatch[1]);
        } else {
          // Fallback: create structure from text
          discussionData = {
            topic: result.content.split('\n')[0] || `Discussion about ${context.huddleTitle}`,
            instructions: result.content.substring(0, 500),
            discussionPoints: result.content.split('\n').filter(line => line.trim().length > 0).slice(0, 5)
          };
        }
      }

      // Optionally create a post in the community
      let postId = null;
      try {
        const post = await prisma.post.create({
          data: {
            title: discussionData.topic,
            content: discussionData.instructions || '',
            communityId: huddle.communityId,
            creatorId: huddle.creatorId
          }
        });
        postId = post.id;
      } catch (postError) {
        console.error('Error creating discussion post:', postError);
        // Continue without post
      }

      return {
        status: 'completed',
        topic: discussionData.topic,
        instructions: discussionData.instructions || '',
        discussionPoints: discussionData.discussionPoints || [],
        postId: postId,
        linkUrl: postId ? `/comHome/${huddle.communityId}?postId=${postId}` : `/huddle/${huddle.id}/activity/${activity.id}/discussion`,
        prompt,
        provider: result.provider,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating discussion topic:', error);
      throw error;
    }
  }

  /**
   * Generate Quiz
   */
  async generateQuiz(activity, huddle, community, context) {
    const prompt = `Create 5 quiz questions about "${context.huddleTitle}" for community "${context.communityName}". Context: ${context.huddleDescription}. Community focus: ${context.communityDesc}. Each question should have 4 multiple-choice options and one correct answer (0-3 index). Format as JSON: { "questions": [{ "question": "Question text", "options": ["Option 1", "Option 2", "Option 3", "Option 4"], "correctAnswer": 0, "explanation": "Why this answer is correct" }] }`;

    try {
      const result = await aiService.generateText(prompt, {
        max_tokens: 2000,
        temperature: 0.7
      });

      // Parse JSON response
      let quizData;
      try {
        quizData = JSON.parse(result.content);
      } catch (parseError) {
        const jsonMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         result.content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          quizData = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Failed to parse quiz JSON');
        }
      }

      return {
        status: 'completed',
        questions: quizData.questions.map((q, index) => ({
          id: index + 1,
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
          explanation: q.explanation || ''
        })),
        timeLimit: 300,
        showAnswers: true,
        totalQuestions: quizData.questions.length,
        prompt,
        provider: result.provider,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw error;
    }
  }

  /**
   * Generate Voting Survey
   */
  async generateVotingSurvey(activity, huddle, community, context) {
    const prompt = `Create a voting/survey question for huddle "${context.huddleTitle}" in community "${context.communityName}". Huddle Context: ${context.huddleDescription}. Community Focus: ${context.communityDesc}. Generate: One engaging voting/survey question relevant to the huddle topic, 3-4 response options that are relevant and meaningful. Format as JSON: { "question": "Survey question text", "options": ["Option 1", "Option 2", "Option 3", "Option 4"], "allowMultiple": false, "description": "Brief description of what this survey is about" }`;

    try {
      const result = await aiService.generateText(prompt, {
        max_tokens: 500,
        temperature: 0.8
      });

      // Parse JSON response
      let surveyData;
      try {
        surveyData = JSON.parse(result.content);
      } catch (parseError) {
        const jsonMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         result.content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          surveyData = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Failed to parse survey JSON');
        }
      }

      // Optionally create poll post
      let pollPost = null;
      try {
        pollPost = await this.createPollPost(surveyData, huddle, community);
      } catch (pollError) {
        console.error('Error creating poll post:', pollError);
        // Continue without poll post
      }

      return {
        status: 'completed',
        question: surveyData.question,
        options: surveyData.options || [],
        allowMultiple: surveyData.allowMultiple || false,
        description: surveyData.description || '',
        totalVotes: 0,
        results: (surveyData.options || []).map((opt, index) => ({
          option: opt,
          votes: 0,
          percentage: 0
        })),
        expiresAt: pollPost?.pollExpiresAt ? pollPost.pollExpiresAt.toISOString() : null,
        pollId: pollPost?.id || null,
        linkUrl: pollPost 
          ? `/comHome/${huddle.communityId}?postId=${pollPost.id}`
          : `/huddle/${huddle.id}/activity/${activity.id}/vote`,
        prompt,
        provider: result.provider,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating voting survey:', error);
      throw error;
    }
  }

  /**
   * Generate Debate
   */
  async generateDebate(activity, huddle, community, context) {
    const prompt = `Create a debate topic for "${context.huddleTitle}" in community "${context.communityName}". Context: ${context.huddleDescription}. Generate arguments for and against. Format as JSON: { "topic": "Debate topic", "sides": { "for": { "title": "For side title", "arguments": ["Arg 1", "Arg 2"] }, "against": { "title": "Against side title", "arguments": ["Arg 1", "Arg 2"] } }, "instructions": "How to participate", "duration": 300 }`;

    try {
      const result = await aiService.generateText(prompt, {
        max_tokens: 1000,
        temperature: 0.8
      });

      let debateData;
      try {
        // Try parsing directly
        debateData = JSON.parse(result.content);
      } catch (parseError) {
        // Try extracting from markdown code blocks
        const jsonMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         result.content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            debateData = JSON.parse(jsonMatch[1]);
          } catch (e) {
            console.warn('Failed to parse JSON from code block, using fallback');
            debateData = null;
          }
        } else {
          // Try to extract JSON object from text
          const jsonObjectMatch = result.content.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) {
            try {
              debateData = JSON.parse(jsonObjectMatch[0]);
            } catch (e) {
              console.warn('Failed to parse JSON object from text, using fallback');
              debateData = null;
            }
          } else {
            debateData = null;
          }
        }
      }

      // Use fallback if parsing failed
      if (!debateData || typeof debateData !== 'object') {
        console.warn('Using fallback debate data due to parsing failure');
        debateData = {
          topic: `Debate: ${context.huddleTitle}`,
          sides: {
            for: { 
              title: 'For', 
              arguments: ['Supporting argument 1', 'Supporting argument 2'] 
            },
            against: { 
              title: 'Against', 
              arguments: ['Opposing argument 1', 'Opposing argument 2'] 
            }
          },
          duration: 300,
          instructions: 'Choose a side and present your arguments'
        };
      }

      return {
        status: 'completed',
        topic: debateData.topic || `Debate: ${context.huddleTitle}`,
        sides: debateData.sides || {
          for: { title: 'For', arguments: [] },
          against: { title: 'Against', arguments: [] }
        },
        duration: debateData.duration || 300,
        instructions: debateData.instructions || 'Choose a side and present your arguments',
        prompt,
        provider: result.provider,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating debate:', error);
      throw error;
    }
  }

  /**
   * Generate Contest
   */
  async generateContest(activity, huddle, community, context) {
    const prompt = `Design a contest for "${context.huddleTitle}" in community "${context.communityName}". Context: ${context.huddleDescription}. Generate rules, prizes, and criteria. Format as JSON: { "title": "Contest title", "description": "Contest description", "rules": ["Rule 1", "Rule 2"], "prizes": ["Prize 1", "Prize 2"], "criteria": ["Criterion 1", "Criterion 2"], "deadline": "ISO date string" }`;

    try {
      const result = await aiService.generateText(prompt, {
        max_tokens: 1500,
        temperature: 0.8
      });

      let contestData;
      try {
        // Try parsing directly
        contestData = JSON.parse(result.content);
      } catch (parseError) {
        // Try extracting from markdown code blocks
        const jsonMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         result.content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            contestData = JSON.parse(jsonMatch[1]);
          } catch (e) {
            console.warn('Failed to parse JSON from code block, using fallback');
            contestData = null;
          }
        } else {
          // Try to extract JSON object from text
          const jsonObjectMatch = result.content.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) {
            try {
              contestData = JSON.parse(jsonObjectMatch[0]);
            } catch (e) {
              console.warn('Failed to parse JSON object from text, using fallback');
              contestData = null;
            }
          } else {
            contestData = null;
          }
        }
      }

      // Use fallback if parsing failed
      if (!contestData || typeof contestData !== 'object') {
        console.warn('Using fallback contest data due to parsing failure');
        contestData = {
          title: `Contest: ${context.huddleTitle}`,
          description: `Participate in this contest related to ${context.huddleTitle}`,
          rules: ['Follow all contest guidelines', 'Submit before deadline'],
          prizes: ['Winner prize', 'Runner-up prize'],
          criteria: ['Creativity', 'Relevance', 'Quality']
        };
      }

      // Set deadline to 7 days from now if not provided or invalid
      let deadline;
      if (contestData.deadline) {
        deadline = new Date(contestData.deadline);
        // Validate the date
        if (isNaN(deadline.getTime())) {
          console.warn('Invalid deadline date provided, using default (7 days from now)');
          deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
      } else {
        deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }

      // Ensure deadline is valid before converting to ISO string
      if (isNaN(deadline.getTime())) {
        console.warn('Deadline is still invalid, using default');
        deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }

      return {
        status: 'completed',
        title: contestData.title || `Contest: ${context.huddleTitle}`,
        description: contestData.description || '',
        rules: contestData.rules || [],
        prizes: contestData.prizes || [],
        criteria: contestData.criteria || [],
        deadline: deadline.toISOString(),
        prompt,
        provider: result.provider,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating contest:', error);
      throw error;
    }
  }

  /**
   * Generate Reflection
   */
  async generateReflection(activity, huddle, community, context) {
    const prompt = `Create reflection prompts for "${context.huddleTitle}" in community "${context.communityName}". Context: ${context.huddleDescription}. Generate 4-5 reflection prompts that help members reflect on the huddle topic. Format as JSON: { "prompts": ["Prompt 1", "Prompt 2"], "instructions": "How to reflect", "duration": 60 }`;

    try {
      const result = await aiService.generateText(prompt, {
        max_tokens: 800,
        temperature: 0.7
      });

      let reflectionData;
      try {
        reflectionData = JSON.parse(result.content);
      } catch (parseError) {
        const jsonMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         result.content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          reflectionData = JSON.parse(jsonMatch[1]);
        } else {
          // Fallback: extract prompts from text
          const lines = result.content.split('\n').filter(line => line.trim().length > 0);
          reflectionData = {
            prompts: lines.slice(0, 5),
            instructions: 'Take time to reflect on each prompt',
            duration: 60
          };
        }
      }

      return {
        status: 'completed',
        prompts: reflectionData.prompts || [],
        duration: reflectionData.duration || 60,
        instructions: reflectionData.instructions || 'Take 10 minutes to reflect on each prompt',
        allowSharing: true,
        prompt,
        provider: result.provider,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating reflection:', error);
      throw error;
    }
  }

  /**
   * Generate Guided Session
   */
  async generateGuidedSession(activity, huddle, community, context) {
    const prompt = `Create a guided session script for "${context.huddleTitle}" in community "${context.communityName}". Context: ${context.huddleDescription}. Generate step-by-step instructions for a guided session (breathing, meditation, or similar). Format as JSON: { "type": "breathing", "title": "Session title", "duration": 300, "instructions": [{ "step": 1, "title": "Step title", "content": "Step content", "duration": 30 }] }`;

    try {
      const result = await aiService.generateText(prompt, {
        max_tokens: 1500,
        temperature: 0.7
      });

      let sessionData;
      try {
        sessionData = JSON.parse(result.content);
      } catch (parseError) {
        const jsonMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         result.content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          sessionData = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Failed to parse session JSON');
        }
      }

      return {
        status: 'completed',
        type: sessionData.type || 'breathing',
        title: sessionData.title,
        duration: sessionData.duration || 300,
        instructions: sessionData.instructions || [],
        audioUrl: null,
        prompt,
        provider: result.provider,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating guided session:', error);
      throw error;
    }
  }

  /**
   * Generate Story Spotlight
   */
  async generateStorySpotlight(activity, huddle, community, context) {
    const prompt = `Create a story spotlight prompt for "${context.huddleTitle}" in community "${context.communityName}". Context: ${context.huddleDescription}. Generate a story prompt and questions to guide storytelling. Format as JSON: { "prompt": "Story prompt", "questions": ["Question 1", "Question 2"], "maxDuration": 120, "instructions": "How to share your story" }`;

    try {
      const result = await aiService.generateText(prompt, {
        max_tokens: 600,
        temperature: 0.8
      });

      let storyData;
      try {
        storyData = JSON.parse(result.content);
      } catch (parseError) {
        const jsonMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         result.content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          storyData = JSON.parse(jsonMatch[1]);
        } else {
          storyData = {
            prompt: result.content.split('\n')[0] || `Share a story about ${context.huddleTitle}`,
            questions: [],
            maxDuration: 120,
            instructions: 'Record or write your story'
          };
        }
      }

      return {
        status: 'completed',
        prompt: storyData.prompt,
        questions: storyData.questions || [],
        maxDuration: storyData.maxDuration || 120,
        instructions: storyData.instructions || 'Record or write your story (max 2 minutes)',
        allowComments: true,
        prompt,
        provider: result.provider,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating story spotlight:', error);
      throw error;
    }
  }

  /**
   * Generate Announcement
   */
  async generateAnnouncement(activity, huddle, community, context) {
    const prompt = `Write an announcement for "${context.huddleTitle}" in community "${context.communityName}". Context: ${context.huddleDescription}. Create an engaging announcement title and content. Format as JSON: { "title": "Announcement title", "content": "Announcement content", "priority": "normal" }`;

    try {
      const result = await aiService.generateText(prompt, {
        max_tokens: 500,
        temperature: 0.7
      });

      let announcementData;
      try {
        announcementData = JSON.parse(result.content);
      } catch (parseError) {
        const jsonMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         result.content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          announcementData = JSON.parse(jsonMatch[1]);
        } else {
          const lines = result.content.split('\n').filter(line => line.trim().length > 0);
          announcementData = {
            title: lines[0] || `${context.huddleTitle}: Important Announcement`,
            content: lines.slice(1).join('\n') || result.content,
            priority: 'normal'
          };
        }
      }

      // Create announcement post with reactions and comments support
      // Set isArchived to true so it doesn't show in community thread
      let postId = null;
      try {
        const post = await prisma.post.create({
          data: {
            title: announcementData.title,
            content: announcementData.content,
            communityId: huddle.communityId,
            creatorId: huddle.creatorId,
            isArchived: true // Hide from community thread/feed - only show in huddle
          },
          include: {
            likes: true,
            childrenPosts: {
              where: {
                isArchived: false
              },
              include: {
                creator: {
                  include: {
                    user: { select: { name: true, photoURL: true } }
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          }
        });
        postId = post.id;
      } catch (postError) {
        console.error('Error creating announcement post:', postError);
      }

      return {
        status: 'completed',
        title: announcementData.title,
        content: announcementData.content,
        allowReactions: true,
        allowComments: true,
        priority: announcementData.priority || 'normal',
        linkUrl: postId ? `/huddle/${huddle.id}?activityId=${activity.id}` : null,
        postId: postId,
        prompt,
        provider: result.provider,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating announcement:', error);
      throw error;
    }
  }

  /**
   * Update activity status
   */
  async updateActivityStatus(activityId, status, error = null) {
    try {
      const currentActivity = await prisma.huddleActivity.findUnique({
        where: { id: activityId },
        select: { activityData: true }
      });

      const currentData = currentActivity?.activityData || {};
      const updateData = {
        activityData: {
          ...currentData,
          status,
          ...(error && { 
            error: typeof error === 'string' ? error : error?.message || error?.error?.message || JSON.stringify(error),
            errorTimestamp: new Date().toISOString() 
          })
        }
      };

      await prisma.huddleActivity.update({
        where: { id: activityId },
        data: updateData
      });
    } catch (updateError) {
      console.error(`Error updating activity status for ${activityId}:`, updateError);
    }
  }

  /**
   * Update activity with generated content
   */
  async updateActivityWithContent(activityId, content, status) {
    try {
      const currentActivity = await prisma.huddleActivity.findUnique({
        where: { id: activityId },
        select: { activityData: true }
      });

      const currentData = currentActivity?.activityData || {};
      
      await prisma.huddleActivity.update({
        where: { id: activityId },
        data: {
          activityData: {
            ...currentData,
            ...content,
            status
          },
          isGenerated: true,
          linkUrl: content.linkUrl || null,
          pollId: content.pollId || null,
          threadId: content.threadId || null,
          postId: content.postId || null // Link post to huddle activity
        }
      });
    } catch (updateError) {
      console.error(`Error updating activity content for ${activityId}:`, updateError);
      throw updateError;
    }
  }

  /**
   * Create poll post in community
   */
  async createPollPost(surveyData, huddle, community) {
    try {
      const pollPost = await prisma.post.create({
        data: {
          title: surveyData.question,
          content: surveyData.description || '',
          communityId: huddle.communityId,
          creatorId: huddle.creatorId,
          isPoll: true,
          pollExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          PollOptions: {
            create: (surveyData.options || []).map((optionText) => ({
              option: optionText
            }))
          }
        },
        include: {
          PollOptions: true
        }
      });

      return pollPost;
    } catch (error) {
      console.error('Error creating poll post:', error);
      return null;
    }
  }
}

module.exports = new ActivityGeneratorService();
