const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createCustomError } = require("../../middleware/errorHandling");
const {
  findPostByIdHelper,
  findPostByIdHelperLite,
  findUnifiedUserByIdHelperLite,
} = require("../services/getById");
const {
  getPollVotesHelper,
  getPollVotesHelperWithoutFind,
} = require("./thread");
const { RewardType, RewardAction } = require('@prisma/client');
const { rewardsManagement } = require("../../services/rewards/rewards.service");
const notificationService = require("../../services/notification.service");

// NOTE: Except community posts, everything else is stale

// create post
// req.body={content,parentPostId,assetsData:[{type,url,index}],tagsData:[{id,name}],sessionId?,eventId?,communityId?,subcommunityId?,
// optionsData:[{option}]}
exports.createPost = async function (req, res, next) {
  const { tagsData, assetsData, optionsData, ...postData } = req.body;

  try {
    let createdPost;
    if (!postData.isPoll) {
      createdPost = await prisma.post.create({
        data: {
          ...postData,

          assets: {
            create: assetsData,
          },
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          creator: {
            include: {
              user: true,
              partner: true,
              expert: true,
              admin: true,
            },
          },
          assets: true,
          likes: true,
          _count: {
            select: { childrenPosts: true },
          },
        },
      });
    } else {
      createdPost = await prisma.post.create({
        data: {
          ...postData,
          assets: {
            create: assetsData,
          },
          PollOptions: {
            create: optionsData,
          },
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          creator: {
            include: {
              user: true,
              partner: true,
              expert: true,
              admin: true,
            },
          },
          assets: true,
          likes: true,
          _count: {
            select: { childrenPosts: true },
          },
        },
      });
    }

    // Send notification to parent post creator if this is a comment
    if (postData.parentPostId) {
      try {
        const parentPost = await prisma.post.findUnique({
          where: { id: postData.parentPostId },
          include: {
            creator: true
          }
        });

        if (parentPost && parentPost.creatorId !== postData.creatorId) {
          const commenterName = createdPost.creator.user?.name || 
                               createdPost.creator.partner?.name || 
                               createdPost.creator.expert?.name || 
                               createdPost.creator.admin?.name || 'Someone';

          // Determine action URL based on post type
          let actionUrl = '';
          if (parentPost.isPoll) {
            actionUrl = `/comHome/${postData.communityId}?postId=${postData.parentPostId}`;
          } else if (parentPost.isGreeting) {
            actionUrl = `/comHome/${postData.communityId}?postId=${postData.parentPostId}`;
          } else if (parentPost.isAsk) {
            actionUrl = `/comHome/${postData.communityId}?postId=${postData.parentPostId}`;
          } else {
            actionUrl = `/comHome/${postData.communityId}?postId=${postData.parentPostId}`;
          }

          // Store only page URL in notification table (without domain)
          const pageUrl = actionUrl; // This is already without domain

          // Add domain only for email notifications
          if (true) { // shouldEmail is true for comment notifications
            // Extract domain from NEXT_PUBLIC_API_BASE_URL
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
            const domain = apiBaseUrl.replace('/api/v1', '').replace('/api', '');
            const emailActionUrl = `${domain}${actionUrl}`;
            
            await notificationService.createNotification({
              recipientId: parentPost.creatorId,
              senderId: postData.creatorId,
              type: 'POST_COMMENT',
              title: 'New Comment on Your Post',
              message: `${commenterName} commented on your post`,
              postId: postData.parentPostId,
              metadata: {
                commenterName,
                commentContent: postData.content?.substring(0, 100) + (postData.content?.length > 100 ? '...' : ''),
                postTitle: parentPost.title || 'Your post',
                actionUrl: pageUrl // Store page URL without domain in notification table
              },
              shouldEmail: true,
              emailTemplate: 'post-comment',
              emailActionUrl: emailActionUrl // Pass full URL with domain for email
            });
          } else {
            await notificationService.createNotification({
              recipientId: parentPost.creatorId,
              senderId: postData.creatorId,
              type: 'POST_COMMENT',
              title: 'New Comment on Your Post',
              message: `${commenterName} commented on your post`,
              postId: postData.parentPostId,
              metadata: {
                commenterName,
                commentContent: postData.content?.substring(0, 100) + (postData.content?.length > 100 ? '...' : ''),
                postTitle: parentPost.title || 'Your post',
                actionUrl: pageUrl // Store page URL without domain in notification table
              },
              shouldEmail: false
            });
          }

          await notificationService.createNotification({
            recipientId: parentPost.creatorId,
            senderId: postData.creatorId,
            type: 'POST_COMMENT',
            title: 'New Comment on Your Post',
            message: `${commenterName} commented on your post`,
            postId: postData.parentPostId,
            metadata: {
              commenterName,
              commentContent: postData.content?.substring(0, 100) + (postData.content?.length > 100 ? '...' : ''),
              postTitle: parentPost.title || 'Your post',
              actionUrl
            },
            shouldEmail: true,
            emailTemplate: 'post-comment'
          });
        }
      } catch (error) {
        console.error('Error sending comment notification:', error);
      }
    }

    if(postData?.isPoll) {
      await rewardsManagement({
        userId: parseInt(postData?.creatorId),
        rewardRuleName: RewardAction.CREATE_POLL,
        type: RewardType.CREDIT
      });
    } else if(postData?.isGreeting) {
      await rewardsManagement({
        userId: parseInt(postData?.creatorId),
        rewardRuleName: RewardAction.CREATE_GREETING,
        type: RewardType.CREDIT
      });
    } else if(postData?.isAsk) {
      await rewardsManagement({
        userId: parseInt(postData?.creatorId),
        rewardRuleName: RewardAction.CREATE_ASK,
        type: RewardType.CREDIT
      });
    } else if (postData?.parentPostId) {
      await rewardsManagement({
        userId: parseInt(postData?.creatorId),
        rewardRuleName: RewardAction.REPLY_TO_POST,
        type: RewardType.CREDIT
      });
    } else {
      await rewardsManagement({
        userId: parseInt(postData?.creatorId),
        rewardRuleName: RewardAction.CREATE_ANNOUNCEMENT,
        type: RewardType.CREDIT
      });
    }

    const promises = [];
    tagsData?.forEach((item) => {
      if (item.id) {
        promises.push(
          prisma.postTag.create({
            data: {
              tag: {
                connect: {
                  id: item.id,
                },
              },
              post: {
                connect: {
                  id: createdPost.id,
                },
              },
            },
          })
        );
      } else {
        promises.push(
          prisma.postTag.create({
            data: {
              post: {
                connect: {
                  id: createdPost.id,
                },
              },
              tag: {
                create: {
                  name: item.name,
                },
              },
            },
          })
        );
      }
    });

    const createdResponse = await prisma.$transaction([...promises]);
    
    return res.status(200).json({ tags: [], createdPost });
  } catch (error) {
    next(error);
  }
};

// get all posts
exports.getAllPosts = async function (req, res, next) {
  const user = req.user;
  try {
    const posts = await prisma.post.findMany({
      where: {
        AND: [
          {
            isArchived: false,
          },
        ],
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        creator: {
          include: {
            user: true,
            partner: true,
            expert: true,
            admin: true,
          },
        },
        assets: true,
        likes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const like_map = {};
    posts?.forEach((post) => {
      let status = false;
      post.likes.every((item) => {
        if (item.userId === req.user.unifiedUserId.id) {
          status = true;
          return false;
        }
        return true;
      });

      if (status) {
        like_map[post.id] = 1;
      } else {
        like_map[post.id] = 0;
      }
    });

    return res.status(200).json({ posts, like_map });
  } catch (error) {
    next(error);
  }
};

// get post by id
exports.getPostById = async function (req, res, next) {
  let { postId } = req.params;
  try {
    const post = await findPostByIdHelper(postId);
    let liked = false;
    const like_map = {};
    if (req.user) {
      post.likes.every((item) => {
        if (item.userId === req.user.unifiedUserId.id) {
          liked = true;
          return false;
        }
        return true;
      });
      post.childrenPosts.forEach((post) => {
        let status = false;
        post.likes.every((item) => {
          if (item.userId === req.user.unifiedUserId.id) {
            status = true;
            return false;
          }
          return true;
        });

        if (status) {
          like_map[post.id] = 1;
        } else {
          like_map[post.id] = 0;
        }
      });
    }

    return res.status(200).json({ post, liked, like_map });
  } catch (error) {
    next(error);
  }
};

// update post
exports.updatePost = async function (req, res, next) {
  let { postId } = req.params;
  postId = parseInt(postId);
  try {
    // update the content only
    await findPostByIdHelperLite(postId);
    const { content ,title,isArchived} = req.body;
    const updatedPost = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        content: content,
        title:title,
        isArchived
      },
    });

    return res.status(200).json({ post: updatedPost });
  } catch (error) {
    next(error);
  }
};

// update tags
// req.body={newTags:[{id,name}]}
exports.updatePostTags = async function (req, res, next) {
  let { postId } = req.params;
  postId = parseInt(postId);
  const { newTags } = req.body;
  try {
    if (!newTags) {
      throw createCustomError({
        status: 400,
        message: "Invalid data! Missing newTags",
      });
    }
    /*
          1. Create tags which exist
          2. Remove tags which dont exist    
      */
    const existingTags = await prisma.postTag.findMany({
      where: {
        postId: postId,
      },
      include: {
        tag: true,
      },
    });
    let promises = [];
    let delete_promises = [];
    let map_tags = {};
    existingTags.forEach((item) => {
      map_tags[item.tag.name] = 1;
    });

    newTags.forEach((item) => {
      if (!map_tags[item.name]) {
        // create or connect
        if (item.id) {
          promises.push(
            prisma.postTag.create({
              data: {
                post: {
                  connect: {
                    id: postId,
                  },
                },
                tag: {
                  connect: {
                    id: item.id,
                  },
                },
              },
            })
          );
        } else {
          promises.push(
            prisma.postTag.create({
              data: {
                post: {
                  connect: {
                    id: postId,
                  },
                },
                tag: {
                  create: {
                    name: item.name,
                  },
                },
              },
            })
          );
        }
      } else {
        map_tags[item.name] = -1;
      }
    });

    existingTags.forEach((item) => {
      if (map_tags[item.tag.name] !== -1) {
        // delete existing tags
        delete_promises.push(
          prisma.postTag.delete({
            where: {
              id: item.id,
            },
          })
        );
      }
    });

    const returnedResult = await prisma.$transaction([
      ...promises,
      ...delete_promises,
    ]);
    return res.status(200).json({ tags: returnedResult });
  } catch (error) {
    next(error);
  }
};

// delete post
exports.deletePostById = async function (req, res, next) {
  let { postId } = req.params;
  try {
    // Get post details before deletion for notification
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
      include: {
        creator: true
      }
    });

    if (!post) {
      throw createCustomError({ status: 404, message: "Post not found" });
    }

    // Check if user is admin or post creator
    const currentUser = req.user;
    const isAdmin = currentUser?.userType === 'admin' || currentUser?.unifiedUser?.adminId;
    const isPostCreator = currentUser?.unifiedUser?.id === post.creatorId;

    if (!isAdmin && !isPostCreator) {
      throw createCustomError({ status: 403, message: "Unauthorized to delete this post" });
    }

    // Delete the post
    const deletedPost = await prisma.post.delete({
      where: {
        id: parseInt(postId),
      },
    });

    // Send notification to post/comment creator if being deleted by someone else
    if (post.creatorId !== currentUser?.unifiedUser?.id) {
      try {
        const modifierName = notificationService.getModifierName(currentUser);
        const isComment = !!post.parentPostId; // Check if this is a comment
        
        await notificationService.createPostActionNotification({
          recipientId: post.creatorId,
          senderId: currentUser?.unifiedUser?.id,
          action: 'delete',
          postId: parseInt(postId),
          communityId: post.communityId,
          modifierName,
          postTitle: post.title,
          isComment
        });
      } catch (notificationError) {
        console.error('Failed to create delete notification:', notificationError);
        // Don't fail the main operation if notification fails
      }
    }

    return res.status(200).json({ post: deletedPost });
  } catch (error) {
    next(error);
  }
};

// get posts by community
exports.getPostsByCommunity = async function (req, res, next) {
  let { communityId } = req.params;
  const { type, includeArchived } = req.query;
  const unifiedUserId = req.user ? req.user.unifiedUserId?.id : null;
  const isAdmin = req.user?.userType === 'admin' || req.user?.unifiedUser?.adminId;
  

  
  try {
    // Base where conditions
    const whereConditions = {
      AND: [
        {
          parentPostId: null,
        },
        {
          eventId: null,
        },
        {
          communityId: parseInt(communityId),
        },
        {
          subcommunityId: null,
        },
        {
          sessionId: null,
        },
        // Exclude posts linked to huddle activities (announcements)
        {
          huddleActivities: {
            none: {}
          }
        },
        // Exclude posts linked to huddle polls
        {
          huddlePollActivities: {
            none: {}
          }
        }
      ],
    };

    // Only filter out archived posts if not admin or not explicitly requesting archived posts
    if (!isAdmin || includeArchived !== 'true') {
      whereConditions.AND.push({
        isArchived: false,
      });
    }

    // Add type-specific conditions based on query parameter
    if (type) {
      switch (type.toLowerCase()) {
        case 'announcements':
          whereConditions.AND.push({ 
            isGreeting: false, 
            isAsk: false, 
            isPoll: false 
          });
          break;
        case 'greetings':
          whereConditions.AND.push({ isGreeting: true });
          break;
        case 'asks':
          whereConditions.AND.push({ isAsk: true });
          break;
        case 'polls':
          whereConditions.AND.push({ isPoll: true });
          break;
        default:
          // If type is not recognized, return all posts
          break;
      }
    }

    let posts = await prisma.post.findMany({
      where: whereConditions,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        creator: {
          include: {
            user: { select: { id: true, name: true, photoURL: true } },
            partner: { select: { id: true, name: true, photoURL: true } },
            expert: { select: { id: true, name: true, photoURL: true } },
            admin: { select: { id: true, name: true, photoURL: true } },
          },
        },
        assets: true,
        likes: true,
        _count: { select: { childrenPosts: true } },
        community: { select: { id: true, title: true, bannerImg: true } },
        PollOptions: {
          include: {
            UserPollOptionSelect: true
          }
        },
        UserPollOptionSelect: true,
        childrenPosts: {
          include: {
            creator: {
              include: {
                user: { select: { id: true, name: true, photoURL: true } },
                partner: { select: { id: true, name: true, photoURL: true } },
                expert: { select: { id: true, name: true, photoURL: true } },
                admin: { select: { id: true, name: true, photoURL: true } },
              },
            },
            assets: true,
            likes: true,
            _count: { select: { childrenPosts: true } },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Build like_map and vote_map
    const like_map = {};
    const vote_map = {};
    const poll_results = {};
    posts.forEach((post) => {
      let status = false;
      post.likes.every((item) => {
        if (item.userId === unifiedUserId) {
          status = true;
          return false;
        }
        return true;
      });
      like_map[post.id] = status ? 1 : 0;
      if (post.isPoll) {
        // Poll results summary
        poll_results[post.id] = {
          total_votes: 0,
          options: {}
        };
        post.PollOptions.forEach(option => {
          const voteCount = option.UserPollOptionSelect ? option.UserPollOptionSelect.length : 0;
          poll_results[post.id].options[option.id] = {
            option_text: option.option,
            vote_count: voteCount
          };
          poll_results[post.id].total_votes += voteCount;
        });
        // User vote
        let pollObj = null;
        post.UserPollOptionSelect?.every((item) => {
          if (item.unifiedUserId === unifiedUserId) {
            pollObj = item.pollOptionsId;
            return false;
          }
          return true;
        });
        vote_map[post.id] = pollObj ? pollObj : -1;
      }
    });
    // Add poll votes summary
    posts = posts.map((item) => ({
      ...item,
      votes: getPollVotesHelperWithoutFind(item),
      UserPollOptionSelect: item.UserPollOptionSelect || [],
    }));
    return res.status(200).json({ posts, like_map, vote_map, poll_results });
  } catch (error) {
    next(error);
  }
};
// get posts by session
exports.getPostsBySession = async function (req, res, next) {
  let { sessionId } = req.params;
  try {
    let posts = await prisma.post.findMany({
      where: {
        AND: [
          {
            parentPostId: null,
          },
          {
            eventId: null,
          },
          {
            communityId: null,
          },
          {
            subcommunityId: null,
          },
          {
            sessionId: parseInt(sessionId),
          },
          {
            isArchived: false,
          },
        ],
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        creator: {
          include: {
            user: true,
            partner: true,
            expert: true,
            admin: true,
          },
        },
        assets: true,
        likes: true,
        _count: {
          select: { childrenPosts: true },
        },
        PollOptions: true,
        UserPollOptionSelect: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const like_map = {};
    const vote_map = {};
    if (req.user) {
      posts.forEach((post) => {
        let status = false;
        post.likes.every((item) => {
          if (item.userId === req.user.unifiedUserId.id) {
            status = true;
            return false;
          }
          return true;
        });

        if (status) {
          like_map[post.id] = 1;
        } else {
          like_map[post.id] = 0;
        }
        if (post.isPoll) {
          let pollObj = null;
          post.UserPollOptionSelect.every((item) => {
            if (item.unifiedUserId === req.user.unifiedUserId.id) {
              status = true;
              pollObj = item.pollOptionsId;

              return false;
            }
            return true;
          });

          if (pollObj) {
            vote_map[post.id] = pollObj;
          } else {
            vote_map[post.id] = -1;
          }
        }
      });
    }
    posts = posts.map((item) => ({
      ...item,
      votes: getPollVotesHelperWithoutFind(item),
    }));
    return res.status(200).json({ posts, like_map, vote_map });
  } catch (error) {
    next(error);
  }
};
// get posts by event
exports.getPostsByEvent = async function (req, res, next) {
  let { eventId } = req.params;
  try {
    const posts = await prisma.post.findMany({
      where: {
        AND: [
          {
            parentPostId: null,
          },
          {
            eventId: parseInt(eventId),
          },
          {
            communityId: null,
          },
          {
            subcommunityId: null,
          },
          {
            sessionId: null,
          },
          {
            isArchived: false,
          },
        ],
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        creator: {
          include: {
            user: true,
            partner: true,
            expert: true,
            admin: true,
          },
        },
        assets: true,
        likes: true,
      },
    });
    const like_map = {};
    posts?.forEach((post) => {
      let status = false;
      post.likes.every((item) => {
        if (item.userId === req.user.unifiedUserId.id) {
          status = true;
          return false;
        }
        return true;
      });

      if (status) {
        like_map[post.id] = 1;
      } else {
        like_map[post.id] = 0;
      }
    });

    return res.status(200).json({ posts, like_map });
  } catch (error) {
    next(error);
  }
};

// get posts by user
exports.getPostsByUser = async function (req, res, next) {
  let { userId } = req.params;
  const unifiedUserId = parseInt(userId);
  try {
    const posts = await prisma.post.findMany({
      where: {
        AND: [
          {
            parentPostId: null,
          },
          {
            eventId: null,
          },
          {
            communityId: null,
          },
          {
            subcommunityId: null,
          },
          {
            sessionId: null,
          },
          {
            isArchived: false,
          },
          {
            creatorId: unifiedUserId,
          },
        ],
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        creator: {
          include: {
            user: true,
            partner: true,
            expert: true,
            admin: true,
          },
        },
        assets: true,
        likes: true,
      },
    });
    const like_map = {};
    posts?.forEach((post) => {
      let status = false;
      post.likes.every((item) => {
        if (item.userId === req.user.unifiedUserId.id) {
          status = true;
          return false;
        }
        return true;
      });

      if (status) {
        like_map[post.id] = 1;
      } else {
        like_map[post.id] = 0;
      }
    });

    return res.status(200).json({ posts, like_map });
  } catch (error) {
    next(error);
  }
};

// used to either like/dislike a post
exports.likePost = async function (req, res, next) {
  let { postId, userId } = req.params;
  postId = parseInt(postId);
  const unifiedUserId = parseInt(userId);
  try {
    const post = await findPostByIdHelper(postId);
    const pre_like = await prisma.postLikes.findUnique({
      where: {
        userId_postId: {
          userId: unifiedUserId,
          postId: postId,
        },
      },
      include: {
        post: {
          select: {
            _count: {
              select: { likes: true },
            },
          },
        },
      },
    });
    if (!pre_like) {
      const like = await prisma.postLikes.create({
        data: {
          post: {
            connect: {
              id: postId,
            },
          },
          user: {
            connect: {
              id: unifiedUserId,
            },
          },
        },
        include: {
          post: {
            select: {
              _count: {
                select: {
                  likes: true,
                },
              },
            },
          },
        },
      });

      // Send notification to post creator if it's not their own post
      if (post.creatorId !== unifiedUserId) {
        try {
          // Get liker information from unifiedUser table
          const likerInfo = await prisma.unifiedUser.findUnique({
            where: { id: unifiedUserId },
            include: {
              user: { select: { name: true, photoURL: true, email: true } },
              partner: { select: { name: true, photoURL: true, email: true } },
              expert: { select: { name: true, photoURL: true, email: true } },
              admin: { select: { name: true, photoURL: true, email: true } }
            }
          });

          // Extract liker details
          const likerData = likerInfo?.user || likerInfo?.partner || likerInfo?.expert || likerInfo?.admin;
          const likerName = likerData?.name || 'Someone';
          const likerPhotoURL = likerData?.photoURL || '/default-avatar.png';
          const likerEmail = likerData?.email || '';

          // Determine action URL based on post type (without domain for non-email notifications)
          let actionUrl = '';
          if (post.isPoll) {
            actionUrl = `/comHome/${post.communityId}?postId=${postId}`;
          } else if (post.isGreeting) {
            actionUrl = `/comHome/${post.communityId}?postId=${postId}`;
          } else if (post.isAsk) {
            actionUrl = `/comHome/${post.communityId}?postId=${postId}`;
          } else {
            actionUrl = `/comHome/${post.communityId}?postId=${postId}`;
          }

          // Store only page URL in notification table (without domain)
          const pageUrl = actionUrl; // This is already without domain

          await notificationService.createNotification({
            recipientId: post.creatorId,
            senderId: unifiedUserId,
            type: 'NEW_POST',
            title: 'New Like on Your Post',
            message: `${likerName} liked your post`,
            postId: postId,
            metadata: {
              likerName,
              likerPhotoURL,
              likerEmail,
              postTitle: post.title || 'Your post',
              actionUrl: pageUrl // Store page URL without domain in notification table
            },
            shouldEmail: false
          });
        } catch (error) {
          console.error('Error sending like notification:', error);
        }
      }

      await rewardsManagement({
        userId: parseInt(unifiedUserId),
        rewardRuleName: RewardAction.REACT_TO_THREADS,
        type: RewardType.CREDIT
      });

      return res.status(200).json({ like });
    } else {
      await prisma.postLikes.delete({
        where: {
          id: pre_like.id,
        },
      });

      // Remove the like notification when user dislikes
      try {
        await prisma.notification.deleteMany({
          where: {
            recipientId: post.creatorId,
            senderId: unifiedUserId,
            type: 'NEW_POST',
            postId: postId
          }
        });
      } catch (error) {
        console.error('Error removing like notification:', error);
      }

      return res.status(200).json({ like: 0 });
    }
  } catch (error) {
    next(error);
  }
};

// add user poll reaction
exports.createUserPollReaction = async (req, res, next) => {
  let { userId, optionId, postId } = req.params;
  const unifiedUserId = parseInt(userId);
  optionId = parseInt(optionId);
  postId = parseInt(postId);
  try {
    await findUnifiedUserByIdHelperLite(unifiedUserId);
    const post = await findPostByIdHelperLite(postId);
    if (post.isPoll && new Date() > new Date(post.expiresAt)) {
      throw createCustomError({ status: 400, message: "Poll has expired" });
    }
    const userPollOptionSelect = await prisma.userPollOptionSelect.create({
      data: {
        unifiedUserId: unifiedUserId,
        pollOptionsId: optionId,
        postId: postId,
      },
    });
    const pollResults = await getPollVotesHelper(postId);

    await rewardsManagement({
      userId: parseInt(unifiedUserId),
      rewardRuleName: RewardAction.ANSWER_POLL,
      type: RewardType.CREDIT
    });

    return res.status(200).json({ pollResults });
  } catch (error) {
    next(error);
  }
};


exports.getUserCommunityPosts = async (req, res, next) => {
  let { userId } = req.params;
  const unifiedUserId = parseInt(userId);
  try {
    const user = await prisma.unifiedUser.findUnique({
      where: { id: unifiedUserId },
    });
    if (!user) {
      throw createCustomError({ status: 400, message: "User not found" });
    }
    const subscription = await prisma.subscription.findMany({
      where: { unifiedUserId: user.id },
      include: { community: true },
    });
    if (!subscription) {
      throw createCustomError({ status: 400, message: "User is not subscribed to any community" });
    }
    let posts = await prisma.post.findMany({
      where: {
        communityId: { in: subscription.map((item) => item.communityId) },
        isArchived: false,
        parentPostId: null, // Only top-level posts, not replies/comments (thread info)
      },
      include: {
        tags: true,
        creator: {
          include: {
            user: { select: { id: true, name: true, photoURL: true } },
            partner: { select: { id: true, name: true, photoURL: true } },
            expert: { select: { id: true, name: true, photoURL: true } },
            admin: { select: { id: true, name: true, photoURL: true } },
          },
        },
        assets: true,
        likes: true,
        _count: { select: { childrenPosts: true } },
        community: { select: { id: true, title: true, bannerImg: true } },
        PollOptions: {
          include: {
            UserPollOptionSelect: true
          }
        },
        UserPollOptionSelect: true,
        childrenPosts: {
          include: {
            creator: {
              include: {
                user: { select: { id: true, name: true, photoURL: true } },
                partner: { select: { id: true, name: true, photoURL: true } },
                expert: { select: { id: true, name: true, photoURL: true } },
                admin: { select: { id: true, name: true, photoURL: true } },
              },
            },
            assets: true,
            likes: true,
            _count: { select: { childrenPosts: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    // Build like_map and vote_map
    const like_map = {};
    const vote_map = {};
    posts.forEach((post) => {
      let status = false;
      post.likes.every((item) => {
        if (item.userId === unifiedUserId) {
          status = true;
          return false;
        }
        return true;
      });
      like_map[post.id] = status ? 1 : 0;
      if (post.isPoll) {
        let pollObj = null;
        post.UserPollOptionSelect?.every((item) => {
          if (item.unifiedUserId === unifiedUserId) {
            pollObj = item.pollOptionsId;
            return false;
          }
          return true;
        });
        vote_map[post.id] = pollObj ? pollObj : -1;
      }
    });
    // Add poll votes summary
    posts = posts.map((item) => ({
      ...item,
      votes: getPollVotesHelperWithoutFind(item),
    }));
    return res.status(200).json({ posts, like_map, vote_map });
  } catch (error) {
    next(error);
  }
};

// Get users who liked a post
exports.getPostLikes = async function (req, res, next) {
  let { postId } = req.params;
  postId = parseInt(postId);
  
  try {
    // Verify post exists
    await findPostByIdHelperLite(postId);
    
    const likes = await prisma.postLikes.findMany({
      where: {
        postId: postId,
      },
      include: {
        user: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                photoURL: true,
                email: true
              }
            },
            partner: {
              select: {
                id: true,
                name: true,
                photoURL: true,
                email: true
              }
            },
            expert: {
              select: {
                id: true,
                name: true,
                photoURL: true,
                email: true
              }
            },
            admin: {
              select: {
                id: true,
                name: true,
                photoURL: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedLikes = likes.map(like => {
      const userData = like.user.user || like.user.partner || like.user.expert || like.user.admin;
      return {
        id: like.id,
        userId: like.userId,
        userName: userData?.name || 'Unknown User',
        userPhoto: userData?.photoURL || '/default-avatar.png',
        userEmail: userData?.email,
        likedAt: like.createdAt
      };
    });

    return res.status(200).json({ 
      likes: formattedLikes,
      totalLikes: formattedLikes.length
    });
  } catch (error) {
    next(error);
  }
};

// Archive/Unarchive a post (Admin only)
exports.archivePost = async function (req, res, next) {
  const { threadId } = req.params;
  const { isArchived = true } = req.body;
  
  try {
    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: parseInt(threadId) },
      include: {
        creator: true
      }
    });

    if (!post) {
      throw createCustomError({ status: 404, message: "Post not found" });
    }

    // Check if user is admin or post creator
    const currentUser = req.user;
    const isAdmin = currentUser?.userType === 'admin' || currentUser?.unifiedUser?.adminId;
    const isPostCreator = currentUser?.unifiedUser?.id === post.creatorId;

    if (!isAdmin && !isPostCreator) {
      throw createCustomError({ status: 403, message: "Unauthorized to archive this post" });
    }

    // Update the post archive status
    const updatedPost = await prisma.post.update({
      where: { id: parseInt(threadId) },
      data: { isArchived: isArchived },
      include: {
        creator: {
          include: {
            user: true,
            partner: true,
            expert: true,
            admin: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        assets: true,
        likes: true,
        _count: {
          select: { childrenPosts: true }
        }
      }
    });

    // Send notification to post/comment creator if being archived (not unarchived)
    if (isArchived && post.creatorId !== currentUser?.unifiedUser?.id) {
      try {
        const modifierName = notificationService.getModifierName(currentUser);
        const isComment = !!post.parentPostId; // Check if this is a comment
        
        await notificationService.createPostActionNotification({
          recipientId: post.creatorId,
          senderId: currentUser?.unifiedUser?.id,
          action: 'archive',
          postId: parseInt(threadId),
          communityId: post.communityId,
          modifierName,
          postTitle: post.title,
          isComment
        });
      } catch (notificationError) {
        console.error('Failed to create archive notification:', notificationError);
        // Don't fail the main operation if notification fails
      }
    }

    return res.status(200).json({
      message: `Post ${isArchived ? 'archived' : 'unarchived'} successfully`,
      post: updatedPost
    });
  } catch (error) {
    next(error);
  }
};

// Get comments for a post
exports.getPostComments = async function (req, res, next) {
  const { postId } = req.params;
  
  try {
    const comments = await prisma.post.findMany({
      where: {
        parentPostId: parseInt(postId),
        isArchived: false
      },
      include: {
        creator: {
          include: {
            user: { select: { id: true, name: true, photoURL: true } },
            partner: { select: { id: true, name: true, photoURL: true } },
            expert: { select: { id: true, name: true, photoURL: true } },
            admin: { select: { id: true, name: true, photoURL: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return res.status(200).json({ 
      comments: comments,
      totalComments: comments.length
    });
  } catch (error) {
    next(error);
  }
};

// Get poll voters for a specific post
exports.getPollVoters = async function (req, res, next) {
  let { postId } = req.params;
  postId = parseInt(postId);
  
  try {
    // Verify post exists and is a poll
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        PollOptions: true
      }
    });

    if (!post) {
      throw createCustomError({ status: 404, message: "Post not found" });
    }

    if (!post.isPoll) {
      throw createCustomError({ status: 400, message: "This post is not a poll" });
    }

    // Get all poll votes with user information
    const pollVotes = await prisma.userPollOptionSelect.findMany({
      where: {
        postId: postId,
      },
      include: {
        user: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                photoURL: true,
                email: true
              }
            },
            partner: {
              select: {
                id: true,
                name: true,
                photoURL: true,
                email: true
              }
            },
            expert: {
              select: {
                id: true,
                name: true,
                photoURL: true,
                email: true
              }
            },
            admin: {
              select: {
                id: true,
                name: true,
                photoURL: true,
                email: true
              }
            }
          }
        },
        option: {
          select: {
            id: true,
            option: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group votes by option
    const votesByOption = {};
    pollVotes.forEach(vote => {
      const userData = vote.user.user || vote.user.partner || vote.user.expert || vote.user.admin;
      const voterInfo = {
        id: vote.id,
        userId: vote.unifiedUserId,
        userName: userData?.name || 'Unknown User',
        userPhoto: userData?.photoURL || '/default-avatar.png',
        userEmail: userData?.email,
        votedAt: vote.createdAt
      };

      if (!votesByOption[vote.pollOptionsId]) {
        votesByOption[vote.pollOptionsId] = {
          optionId: vote.pollOptionsId,
          optionText: vote.option.option,
          voters: []
        };
      }
      votesByOption[vote.pollOptionsId].voters.push(voterInfo);
    });

    // Format the response
    const formattedVotes = Object.values(votesByOption);
    const totalVotes = pollVotes.length;

    return res.status(200).json({ 
      pollVotes: formattedVotes,
      totalVotes: totalVotes,
      pollQuestion: post.title || post.content
    });
  } catch (error) {
    next(error);
  }
};


