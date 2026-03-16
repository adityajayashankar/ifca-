import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { clearUserDataCache } from "@/utils/apiSetup";
import { cacheManager } from "@/utils/cacheManager";
import { toast } from "react-hot-toast";

const initialState = {
  user: 0,
  nextpage: null,
  attendance: [],
  sessions: [],
  selectedSession: null,
  communities: [],
  communitySessions: [],
  weeklyPass: false,
  cart: [],
  meetingLink: "",
  loading: false,
  from: "",
  meetdetails: {},
  // New state properties
  profileProgress: 0,
  recentActivities: [],
  initialCommunities: [],
  subscribedCommunities: [],
  nonSubscribedCommunities: [],
  requestedCommunities: [],
  userEvents: [],
  completedEvents: [],
  notifications: [],
  allUsers: [],
  error: null,
  success: null,
  // Session management state
  subscribedSessions: [],
  nonSubscribedSessions: [],
  ongoingSessions: [],
  sessionStats: null,
  sessionJoinStatus: null,
  sessionSubscriptionStatus: null,
  // Session pagination state
  sessionPagination: {
    subscribed: { page: 1, limit: 10, total: 0, pages: 0 },
    nonSubscribed: { page: 1, limit: 10, total: 0, pages: 0 }
  },
  // Feed/Thread data
  feedPosts: [],
  feedLikeMap: {},
  feedLoading: false,
  feedError: null,
  // User data initialization tracking
  isUserDataInitialized: false,
  // Community tags state
  communityTags: [],
  communityTagsLoading: false,
  communityTagsError: null,
  communityTagsLoaded: false
};

// User Management
export const getUserById = createAsyncThunk(
  "user/getUserById",
  async (userId, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}`);
      return res.data.user;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateUserById = createAsyncThunk(
  "user/updateUserById",
  async ({ userId, userData }, thunkAPI) => {
    try {
      const res = await api.patch(`/user/${userId}`, userData);
      // Clear cache to ensure fresh data
      clearUserDataCache();
      return res.data.user;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteUserById = createAsyncThunk(
  "user/deleteUserById",
  async (userId, thunkAPI) => {
    try {
      const res = await api.delete(`/user/${userId}`);
      return { userId, message: res.data.message };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getAllUsers = createAsyncThunk(
  "user/getAllUsers",
  async (_, thunkAPI) => {
    try {
      const res = await api.get("/user/");
      return res.data.users;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Profile Management
export const getUserProfileProgress = createAsyncThunk(
  "user/getUserProfileProgress",
  async (userId, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/profile-progress`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getUserRecentActivities = createAsyncThunk(
  "user/getUserRecentActivities",
  async ({ userId, page = 1, limit = 10 }, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/recent-activities?page=${page}&limit=${limit}`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Sessions Management
export const setUserSessions = createAsyncThunk(
  "user/setUserSessions",
  async (uid, thunkAPI) => {
    try {
      const res = await api.get(`/user/${uid}/sessions`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const addUserSession = createAsyncThunk(
  "user/addUserSession",
  async ({ userId, sessionData }, thunkAPI) => {
    try {
      const res = await api.post(`/user/${userId}/sessions`, sessionData);
      // Clear cache to ensure fresh data
      clearUserDataCache();
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const markUserAttendance = createAsyncThunk(
  "user/markUserAttendance",
  async ({ userId, attendanceData }, thunkAPI) => {
    try {
      const res = await api.patch(`/user/${userId}/sessions`, attendanceData);
      // Clear cache to ensure fresh data
      clearUserDataCache();
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const buySession = createAsyncThunk(
  "user/buySession",
  async ({ userId, transactionData }, thunkAPI) => {
    try {
      const res = await api.patch(`/user/${userId}/sessions/buy`, transactionData);
      // Clear cache to ensure fresh data
      clearUserDataCache();
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteUserSession = createAsyncThunk(
  "user/deleteUserSession",
  async (attendanceId, thunkAPI) => {
    try {
      const res = await api.delete(`/user/${attendanceId}/sessions`);
      return { attendanceId, data: res.data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Cart Management
export const setUserCart = createAsyncThunk(
  "user/setUserCart",
  async (uid, thunkAPI) => {
    try {
      const res = await api.get(`/user/${uid}/cart`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteCartSessions = createAsyncThunk(
  "user/deleteCartSessions",
  async ({ userId, attendanceIds }, thunkAPI) => {
    try {
      const res = await api.patch(`/user/${userId}/cart`, { attendanceIds });
      // Clear cache to ensure fresh data
      clearUserDataCache();
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Communities Management
export const setUserCommunities = createAsyncThunk(
  "user/setUserCommunities",
  async (uid, thunkAPI) => {
    try {
      const res = await api.get(`/user/${uid}/community`);
      
      // Handle both old and new response formats
      let communities = res.data.communities || res.data || [];
      let hasWeeklyPass = communities?.find((item) => item.id === 1);
      let stampedCommunities = communities?.map((item) => ({
        ...item,
        bought: true,
      }));
      return [stampedCommunities, !!hasWeeklyPass, res.data.memberships || []];
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getUserInitialCommunities = createAsyncThunk(
  "user/getUserInitialCommunities",
  async (userId, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/intial-community`);
      return res.data.initialCommunity;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getUserSubscribedCommunities = createAsyncThunk(
  "user/getUserSubscribedCommunities",
  async (userId, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/community/subscribed`);
      return res.data.communities;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getUserNonSubscribedCommunities = createAsyncThunk(
  "user/getUserNonSubscribedCommunities",
  async (userId, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/community/non-subscribed`);
      return res.data.communities;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getUserRequestedCommunities = createAsyncThunk(
  "user/getUserRequestedCommunities",
  async (userId, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/communities/requested`);
      return res.data.communities;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const checkUserSubscribedToCommunity = createAsyncThunk(
  "user/checkUserSubscribedToCommunity",
  async ({ userId, communityId }, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/community/${communityId}/subscribed`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const checkUserRequestedCommunity = createAsyncThunk(
  "user/checkUserRequestedCommunity",
  async ({ userId, communityId }, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/community/${communityId}/requested`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getSessionsFromCommunity = createAsyncThunk(
  "user/getSessionsFromCommunity",
  async (userId, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/community/sessions`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Community Tags Management
export const getCommunityTags = createAsyncThunk(
  "user/getCommunityTags",
  async (_, thunkAPI) => {
    try {
      const res = await api.get('/community/community-tags');
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getPopularCommunityTags = createAsyncThunk(
  "user/getPopularCommunityTags",
  async ({ limit = 10 }, thunkAPI) => {
    try {
      const res = await api.get(`/community/community-tags/popular?limit=${limit}`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Events Management
export const getUserEvents = createAsyncThunk(
  "user/getUserEvents",
  async (userId, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/events`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Session Management
export const getUserSubscribedSessions = createAsyncThunk(
  "user/getUserSubscribedSessions",
  async ({ userId, page = 1, limit = 10 }, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/sessions/subscribed?page=${page}&limit=${limit}`);
      return {
        sessions: res.data.sessions || [],
        page: res.data.page || 1,
        limit: res.data.limit || 10,
        total: res.data.total || 0,
        pages: res.data.pages || 0
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getUserNonSubscribedSessions = createAsyncThunk(
  "user/getUserNonSubscribedSessions",
  async ({ userId, page = 1, limit = 10 }, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/sessions/non-subscribed?page=${page}&limit=${limit}`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const checkUserSubscribedToSession = createAsyncThunk(
  "user/checkUserSubscribedToSession",
  async ({ userId, sessionId }, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/session/${sessionId}/subscribed`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getUserSessionJoinStatus = createAsyncThunk(
  "user/getUserSessionJoinStatus",
  async ({ userId, sessionId }, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/session/${sessionId}/join-status`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getUserSessionStats = createAsyncThunk(
  "user/getUserSessionStats",
  async (userId, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/sessions/stats`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Ongoing Sessions Management
export const getUserOngoingSessions = createAsyncThunk(
  "user/getUserOngoingSessions",
  async (userId, thunkAPI) => {
    try {
      const res = await api.get(`/user/${userId}/sessions/ongoing`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Notifications Management
export const createNotification = createAsyncThunk(
  "user/createNotification",
  async (notificationData, thunkAPI) => {
    try {
      const res = await api.post("/user/notifications", notificationData);
      // Clear cache to ensure fresh data
      clearUserDataCache();
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getAllNotifications = createAsyncThunk(
  "user/getAllNotifications",
  async (_, thunkAPI) => {
    try {
      const res = await api.get("/user/notifications");
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Utility functions
export const fetchAllCartItems = (state) => state.user.cart;

// Comprehensive user data initialization
export const initializeUserData = createAsyncThunk(
  "user/initializeUserData",
  async (userId, thunkAPI) => {
    try {
      // Fetch all user-related data in parallel
      const [
        profileProgressRes,
        initialCommunitiesRes,
        subscribedCommunitiesRes,
        nonSubscribedCommunitiesRes,
        subscribedSessionsRes,
        nonSubscribedSessionsRes,
        sessionStatsRes,
        recentActivitiesRes
      ] = await Promise.all([
        api.get(`/user/${userId}/profile-progress`),
        api.get(`/user/${userId}/intial-community`),
        api.get(`/user/${userId}/community/subscribed`),
        api.get(`/user/${userId}/community/non-subscribed`),
        api.get(`/user/${userId}/sessions/subscribed?page=1&limit=10`),
        api.get(`/user/${userId}/sessions/non-subscribed?page=1&limit=10`),
        api.get(`/user/${userId}/sessions/stats`),
        api.get(`/user/${userId}/recent-activities?page=1&limit=20`)
      ]);

      return {
        profileProgress: profileProgressRes.data.profileProgress,
        initialCommunities: initialCommunitiesRes.data.initialCommunity,
        subscribedCommunities: subscribedCommunitiesRes.data.communities,
        nonSubscribedCommunities: nonSubscribedCommunitiesRes.data.communities,
        subscribedSessions: subscribedSessionsRes.data.sessions || [],
        nonSubscribedSessions: nonSubscribedSessionsRes.data.sessions || [],
        sessionStats: sessionStatsRes.data.stats,
        recentActivities: recentActivitiesRes.data.activities,
        sessionPagination: {
          subscribed: {
            page: subscribedSessionsRes.data.page || 1,
            limit: subscribedSessionsRes.data.limit || 10,
            total: subscribedSessionsRes.data.total || 0,
            pages: subscribedSessionsRes.data.pages || 0
          },
          nonSubscribed: {
            page: nonSubscribedSessionsRes.data.page || 1,
            limit: nonSubscribedSessionsRes.data.limit || 10,
            total: nonSubscribedSessionsRes.data.total || 0,
            pages: nonSubscribedSessionsRes.data.pages || 0
          }
        }
      };
    } catch (err) {
      console.error('Error initializing user data:', err);
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Feed/Thread data management with advanced caching
export const fetchUserFeed = createAsyncThunk(
  "user/fetchUserFeed",
  async (unifiedUserId, thunkAPI) => {
    try {
      const cacheKey = `feed_${unifiedUserId}`;
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
      
      // Check advanced cache first
      const cachedData = await cacheManager.get(cacheKey);
      if (cachedData) {
        console.log('📦 Using cached feed data from advanced cache');
        return cachedData;
      }
      
      // Fetch fresh data
      console.log('🔄 Fetching fresh feed data');
      const res = await api.get(`/thread/user/${unifiedUserId}/community`);
      const feedData = {
        posts: res.data.posts || [],
        likeMap: res.data.like_map || {}
      };
      
      // Store in advanced cache with TTL
      await cacheManager.set(cacheKey, feedData, CACHE_TTL);
      
      return feedData;
    } catch (err) {
      console.error('Error fetching user feed:', err);
      
      // Fallback to cached data even if expired
      const cacheKey = `feed_${unifiedUserId}`;
      try {
        const cachedData = await cacheManager.get(cacheKey);
        if (cachedData) {
          console.log('⚠️ API failed, using expired cache as fallback');
          return cachedData;
        }
      } catch (cacheErr) {
        console.warn('Cache fallback failed:', cacheErr);
      }
      
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const refreshUserFeed = createAsyncThunk(
  "user/refreshUserFeed",
  async (unifiedUserId, thunkAPI) => {
    try {
      // Clear cache to force fresh fetch
      const cacheKey = `feed_${unifiedUserId}`;
      cacheManager.delete(cacheKey);
      
      const res = await api.get(`/thread/user/${unifiedUserId}/community`);
      const feedData = {
        posts: res.data.posts || [],
        likeMap: res.data.like_map || {}
      };
      
      // Cache the fresh result
      await cacheManager.set(cacheKey, feedData, 5 * 60 * 1000);
      
      return feedData;
    } catch (err) {
      console.error('Error refreshing user feed:', err);
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setFromPage: (state, action) => {
      state.from = action.payload;
    },
    setMeetDetails: (state, action) => {
      state.meetdetails = action.payload;
    },
    setNextPage: (state, action) => {
      state.nextpage = action.payload;
    },
    logoutUser: (state) => {
      state.user = null;
      // Reset all user-related state
      state.isUserDataInitialized = false;
      state.subscribedSessions = [];
      state.nonSubscribedSessions = [];
      state.sessionStats = null;
      state.sessionJoinStatus = null;
      state.sessionSubscriptionStatus = null;
      state.sessionPagination = {
        subscribed: { page: 1, limit: 10, total: 0, pages: 0 },
        nonSubscribed: { page: 1, limit: 10, total: 0, pages: 0 }
      };
      state.feedPosts = [];
      state.feedLikeMap = {};
      state.communities = [];
      state.initialCommunities = [];
      state.subscribedCommunities = [];
      state.nonSubscribedCommunities = [];
      state.requestedCommunities = [];
      state.userEvents = [];
      state.completedEvents = [];
      state.notifications = [];
      state.recentActivities = [];
      state.profileProgress = 0;
      localStorage.removeItem("persist:rootStore");
      // Clear unified tokens from localStorage
      localStorage.removeItem('ifca-jwt');
      localStorage.removeItem('ifca-userType');
      localStorage.removeItem('ifca-unifiedUser');
      localStorage.removeItem('ifca-user');
    },
    resetNextPage: (state) => {
      state.nextpage = null;
    },
    setSelectedUserSession: (state, action) => {
      state.selectedSession = action.payload;
    },
    resetSelectedUserSession: (state) => {
      state.selectedSession = null;
    },
    setMeetingLink: (state, action) => {
      state.meetingLink = action.payload;
    },
    resetMeetingLink: (state) => {
      state.meetingLink = "";
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    addToCart: (state, action) => {
      const { comId, sessionId, comTitle, price, image } = action.payload;
    
      const newItem = {
        comTitle,
        price,
        image,
      };
      if (comId) {
        newItem.comId = comId;
        newItem.type = 'community';
      } else if (sessionId) {
        newItem.sessionId = sessionId;
        newItem.type = 'session';
      } else {
        return;
      }
      state.cart.push(newItem);
    },
    clearCart: (state) => {
      state.cart = [];
    },
    deleteItem: (state, action) => {
      const itemId = action.payload;
      state.cart = state.cart.filter((item) => item.comId !== itemId);
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    setUserDataInitialized: (state, action) => {
      state.isUserDataInitialized = action.payload;
    },
    // Session management reducers
    clearSessionStatus: (state) => {
      state.sessionJoinStatus = null;
      state.sessionSubscriptionStatus = null;
    },
    resetSessionPagination: (state) => {
      state.sessionPagination = {
        subscribed: { page: 1, limit: 10, total: 0, pages: 0 },
        nonSubscribed: { page: 1, limit: 10, total: 0, pages: 0 }
      };
    },
    updateSessionPagination: (state, action) => {
      const { type, page, limit, total, pages } = action.payload;
      // Ensure sessionPagination exists
      if (!state.sessionPagination) {
        state.sessionPagination = {
          subscribed: { page: 1, limit: 10, total: 0, pages: 0 },
          nonSubscribed: { page: 1, limit: 10, total: 0, pages: 0 }
        };
      }
      if (type === 'subscribed') {
        state.sessionPagination.subscribed = { page, limit, total, pages };
      } else if (type === 'nonSubscribed') {
        state.sessionPagination.nonSubscribed = { page, limit, total, pages };
      }
    },
    // Optimistic update reducers for real-time interactions
    updatePostOptimistically: (state, action) => {
      const { posts } = action.payload;
      if (posts && Array.isArray(posts)) {
        state.feedPosts = posts;
      }
    },
    updatePostLikeOptimistically: (state, action) => {
      const { postId, likeState, userId } = action.payload;
      const post = state.feedPosts.find(p => p.id === postId);
      if (post) {
        if (likeState) {
          // Add like
          if (!post.likes.some(like => like.unifiedUserId === userId)) {
            post.likes.push({ unifiedUserId: userId });
            post._count.likes = (post._count.likes || 0) + 1;
          }
        } else {
          // Remove like
          post.likes = post.likes.filter(like => like.unifiedUserId !== userId);
          post._count.likes = Math.max(0, (post._count.likes || 0) - 1);
        }
      }
    },
    addCommentOptimistically: (state, action) => {
      const { postId, comment } = action.payload;
      const post = state.feedPosts.find(p => p.id === postId);
      if (post) {
        post.childrenPosts = [...(post.childrenPosts || []), comment];
        post._count.childrenPosts = (post._count.childrenPosts || 0) + 1;
      }
    },
    updateCommentOptimistically: (state, action) => {
      const { postId, commentId, updatedComment } = action.payload;
      const post = state.feedPosts.find(p => p.id === postId);
      if (post && post.childrenPosts) {
        const commentIndex = post.childrenPosts.findIndex(c => c.id === commentId);
        if (commentIndex !== -1) {
          post.childrenPosts[commentIndex] = {
            ...post.childrenPosts[commentIndex],
            ...updatedComment,
            updatedAt: new Date().toISOString()
          };
        }
      }
    },
    removeCommentOptimistically: (state, action) => {
      const { postId, commentId } = action.payload;
      const post = state.feedPosts.find(p => p.id === postId);
      if (post && post.childrenPosts) {
        post.childrenPosts = post.childrenPosts.filter(c => c.id !== commentId);
        post._count.childrenPosts = Math.max(0, (post._count.childrenPosts || 0) - 1);
      }
    },
    updatePollVoteOptimistically: (state, action) => {
      const { postId, optionId, userId } = action.payload;
      const post = state.feedPosts.find(p => p.id === postId);
      if (post) {
        // Update poll votes
        if (!post.votes) post.votes = {};
        post.votes[optionId] = (post.votes[optionId] || 0) + 1;
        
        // Update user's vote selection
        if (!post.UserPollOptionSelect) post.UserPollOptionSelect = [];
        post.UserPollOptionSelect.push({ unifiedUserId: userId, pollOptionsId: optionId });
      }
    },
    addNewPostOptimistically: (state, action) => {
      const { post } = action.payload;
      if (post) {
        state.feedPosts = [post, ...state.feedPosts];
      }
    },
    updateFeedLikeMap: (state, action) => {
      const { likeMap } = action.payload;
      if (likeMap) {
        state.feedLikeMap = { ...state.feedLikeMap, ...likeMap };
      }
    }
  },
    extraReducers: (builder) => {
    // User Management
    builder.addCase(getUserById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUserById.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
    });
    builder.addCase(getUserById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(updateUserById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUserById.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.success = "User updated successfully";
    });
    builder.addCase(updateUserById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(deleteUserById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteUserById.fulfilled, (state, action) => {
      state.loading = false;
      state.success = action.payload.message;
    });
    builder.addCase(deleteUserById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(getAllUsers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getAllUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.allUsers = action.payload;
    });
    builder.addCase(getAllUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Profile Management
    builder.addCase(getUserProfileProgress.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUserProfileProgress.fulfilled, (state, action) => {
      state.loading = false;
      state.profileProgress = action.payload.profileProgress;
    });
    builder.addCase(getUserProfileProgress.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(getUserRecentActivities.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUserRecentActivities.fulfilled, (state, action) => {
      state.loading = false;
      state.recentActivities = action.payload.activities;
    });
    builder.addCase(getUserRecentActivities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Sessions Management
    builder.addCase(setUserSessions.fulfilled, (state, action) => {
      state.sessions = {
        sessions: action.payload.session,
        completedSessions: action.payload.completedSessions,
      };
      state.attendance = action.payload.attendance;
    });

    builder.addCase(addUserSession.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addUserSession.fulfilled, (state, action) => {
      state.loading = false;
      state.success = "Session added successfully";
    });
    builder.addCase(addUserSession.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(markUserAttendance.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(markUserAttendance.fulfilled, (state, action) => {
      state.loading = false;
      state.success = "Attendance marked successfully";
    });
    builder.addCase(markUserAttendance.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(buySession.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(buySession.fulfilled, (state, action) => {
      state.loading = false;
      state.success = "Session purchased successfully";
    });
    builder.addCase(buySession.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(deleteUserSession.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteUserSession.fulfilled, (state, action) => {
      state.loading = false;
      state.success = "Session deleted successfully";
    });
    builder.addCase(deleteUserSession.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Cart Management
    builder.addCase(setUserCart.fulfilled, (state, action) => {
      state.cart = action.payload.cart;
    });

    builder.addCase(deleteCartSessions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteCartSessions.fulfilled, (state, action) => {
      state.loading = false;
      state.success = "Cart items deleted successfully";
    });
    builder.addCase(deleteCartSessions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Communities Management
    builder.addCase(setUserCommunities.fulfilled, (state, action) => {
      state.communities = action.payload[0];
      state.weeklyPass = action.payload[1];
      state.communitySessions = action.payload[2];
    });

    builder.addCase(getUserInitialCommunities.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUserInitialCommunities.fulfilled, (state, action) => {
      state.loading = false;
      state.initialCommunities = action.payload;
    });
    builder.addCase(getUserInitialCommunities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(getUserSubscribedCommunities.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUserSubscribedCommunities.fulfilled, (state, action) => {
      state.loading = false;
      state.subscribedCommunities = action.payload;
    });
    builder.addCase(getUserSubscribedCommunities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(getUserNonSubscribedCommunities.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUserNonSubscribedCommunities.fulfilled, (state, action) => {
      state.loading = false;
      state.nonSubscribedCommunities = action.payload;
    });
    builder.addCase(getUserNonSubscribedCommunities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(getUserRequestedCommunities.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUserRequestedCommunities.fulfilled, (state, action) => {
      state.loading = false;
      state.requestedCommunities = action.payload;
    });
    builder.addCase(getUserRequestedCommunities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(getSessionsFromCommunity.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getSessionsFromCommunity.fulfilled, (state, action) => {
      state.loading = false;
      state.communitySessions = action.payload;
    });
    builder.addCase(getSessionsFromCommunity.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Community Tags Management
    builder.addCase(getCommunityTags.pending, (state) => {
      state.communityTagsLoading = true;
      state.communityTagsError = null;
      state.communityTagsLoaded = false;
    });
    builder.addCase(getCommunityTags.fulfilled, (state, action) => {
      state.communityTagsLoading = false;
      // getCommunityTags returns array directly
      state.communityTags = Array.isArray(action.payload) ? action.payload : [];
      state.communityTagsLoaded = true;
    });
    builder.addCase(getCommunityTags.rejected, (state, action) => {
      state.communityTagsLoading = false;
      state.communityTagsError = action.payload;
      state.communityTagsLoaded = false;
    });

    builder.addCase(getPopularCommunityTags.pending, (state) => {
      state.communityTagsLoading = true;
      state.communityTagsError = null;
    });
    builder.addCase(getPopularCommunityTags.fulfilled, (state, action) => {
      state.communityTagsLoading = false;
      // getPopularCommunityTags returns { success: true, tags: [...], total: ... }
      state.communityTags = action.payload.tags || [];
    });
    builder.addCase(getPopularCommunityTags.rejected, (state, action) => {
      state.communityTagsLoading = false;
      state.communityTagsError = action.payload;
    });

    // Events Management
    builder.addCase(getUserEvents.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUserEvents.fulfilled, (state, action) => {
      state.loading = false;
      state.userEvents = action.payload.events;
      state.completedEvents = action.payload.completedEvents;
    });
    builder.addCase(getUserEvents.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Session Management
    builder.addCase(getUserSubscribedSessions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUserSubscribedSessions.fulfilled, (state, action) => {
      state.loading = false;
      state.subscribedSessions = action.payload.sessions;
      // Update pagination with safety check
      if (!state.sessionPagination) {
        state.sessionPagination = {
          subscribed: { page: 1, limit: 10, total: 0, pages: 0 },
          nonSubscribed: { page: 1, limit: 10, total: 0, pages: 0 }
        };
      }
      state.sessionPagination.subscribed = {
        page: action.payload.page,
        limit: action.payload.limit,
        total: action.payload.total,
        pages: action.payload.pages
      };
    });
    builder.addCase(getUserSubscribedSessions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(getUserNonSubscribedSessions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUserNonSubscribedSessions.fulfilled, (state, action) => {
      state.loading = false;
      state.nonSubscribedSessions = action.payload.sessions;
      // Update pagination with safety check
      if (!state.sessionPagination) {
        state.sessionPagination = {
          subscribed: { page: 1, limit: 10, total: 0, pages: 0 },
          nonSubscribed: { page: 1, limit: 10, total: 0, pages: 0 }
        };
      }
      state.sessionPagination.nonSubscribed = {
        page: action.payload.page,
        limit: action.payload.limit,
        total: action.payload.total,
        pages: action.payload.pages
      };
    });
    builder.addCase(getUserNonSubscribedSessions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(checkUserSubscribedToSession.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(checkUserSubscribedToSession.fulfilled, (state, action) => {
      state.loading = false;
      state.sessionSubscriptionStatus = action.payload;
    });
    builder.addCase(checkUserSubscribedToSession.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(getUserSessionJoinStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUserSessionJoinStatus.fulfilled, (state, action) => {
      state.loading = false;
      state.sessionJoinStatus = action.payload;
    });
    builder.addCase(getUserSessionJoinStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(getUserSessionStats.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUserSessionStats.fulfilled, (state, action) => {
      state.loading = false;
      state.sessionStats = action.payload.stats;
    });
    builder.addCase(getUserSessionStats.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Ongoing Sessions Management
    builder.addCase(getUserOngoingSessions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getUserOngoingSessions.fulfilled, (state, action) => {
      state.loading = false;
      state.ongoingSessions = action.payload;
    });
    builder.addCase(getUserOngoingSessions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Notifications Management
    builder.addCase(createNotification.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createNotification.fulfilled, (state, action) => {
      state.loading = false;
      state.success = "Notification created successfully";
    });
    builder.addCase(createNotification.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(getAllNotifications.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getAllNotifications.fulfilled, (state, action) => {
      state.loading = false;
      state.notifications = action.payload;
    });
    builder.addCase(getAllNotifications.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // User data initialization
    builder.addCase(initializeUserData.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(initializeUserData.fulfilled, (state, action) => {
      state.loading = false;
      state.profileProgress = action.payload.profileProgress;
      state.initialCommunities = action.payload.initialCommunities;
      state.subscribedCommunities = action.payload.subscribedCommunities;
      state.nonSubscribedCommunities = action.payload.nonSubscribedCommunities;
      state.subscribedSessions = action.payload.subscribedSessions;
      state.nonSubscribedSessions = action.payload.nonSubscribedSessions;
      state.sessionStats = action.payload.sessionStats;
      state.recentActivities = action.payload.recentActivities;
      state.sessionPagination = action.payload.sessionPagination;
      state.isUserDataInitialized = true;
    });
    builder.addCase(initializeUserData.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Feed/Thread data management
    builder.addCase(fetchUserFeed.pending, (state) => {
      state.feedLoading = true;
      state.feedError = null;
    });
    builder.addCase(fetchUserFeed.fulfilled, (state, action) => {
      state.feedLoading = false;
      state.feedPosts = action.payload.posts;
      state.feedLikeMap = action.payload.likeMap;
    });
    builder.addCase(fetchUserFeed.rejected, (state, action) => {
      state.feedLoading = false;
      state.feedError = action.payload;
      state.feedPosts = [];
      state.feedLikeMap = {};
    });

    builder.addCase(refreshUserFeed.pending, (state) => {
      state.feedLoading = true;
      state.feedError = null;
    });
    builder.addCase(refreshUserFeed.fulfilled, (state, action) => {
      state.feedLoading = false;
      state.feedPosts = action.payload.posts;
      state.feedLikeMap = action.payload.likeMap;
    });
    builder.addCase(refreshUserFeed.rejected, (state, action) => {
      state.feedLoading = false;
      state.feedError = action.payload;
    });
  },
});

export default userSlice;

// Selectors
export const selectUser = (state) => state.user.user;
export const selectNextPage = (state) => state.user.nextpage;
export const selectUserSessions = (state) => state.user.sessions;
export const selectOneSession = (state) => state.user.selectedSession;
export const selectUserAttendance = (state) => state.user.attendance;
export const selectUserCommunities = (state) => state.user.communities;
export const selectUserPass = (state) => state.user.weeklyPass;
export const selectUserCommunitySessions = (state) => state.user.communitySessions;
export const selectUserCart = (state) => state.user.cart;
export const selectUserMeetingLink = (state) => state.user.meetingLink;
export const selectLoading = (state) => state.user.loading;
export const selectFromDetails = (state) => state.user.from;
export const selectMeetDetails = (state) => state.user.meetdetails;

// New selectors
export const selectProfileProgress = (state) => state.user.profileProgress;
export const selectRecentActivities = (state) => state.user.recentActivities;
export const selectInitialCommunities = (state) => state.user.initialCommunities;
export const selectSubscribedCommunities = (state) => state.user.subscribedCommunities;
export const selectNonSubscribedCommunities = (state) => state.user.nonSubscribedCommunities;
export const selectRequestedCommunities = (state) => state.user.requestedCommunities;
export const selectUserEvents = (state) => state.user.userEvents;
export const selectCompletedEvents = (state) => state.user.completedEvents;
export const selectNotifications = (state) => state.user.notifications;
export const selectAllUsers = (state) => state.user.allUsers;
export const selectError = (state) => state.user.error;
export const selectSuccess = (state) => state.user.success;

// Session management selectors
export const selectSubscribedSessions = (state) => state.user.subscribedSessions;
export const selectNonSubscribedSessions = (state) => state.user.nonSubscribedSessions;
export const selectOngoingSessions = (state) => state.user.ongoingSessions;
export const selectSessionStats = (state) => state.user.sessionStats;
export const selectSessionJoinStatus = (state) => state.user.sessionJoinStatus;
export const selectSessionSubscriptionStatus = (state) => state.user.sessionSubscriptionStatus;
export const selectSessionPagination = (state) => state.user.sessionPagination || {
  subscribed: { page: 1, limit: 10, total: 0, pages: 0 },
  nonSubscribed: { page: 1, limit: 10, total: 0, pages: 0 }
};

// Feed/Thread selectors
export const selectFeedPosts = (state) => state.user.feedPosts;
export const selectFeedLikeMap = (state) => state.user.feedLikeMap;
export const selectFeedLoading = (state) => state.user.feedLoading;
export const selectFeedError = (state) => state.user.feedError;

// User data initialization selector
export const selectIsUserDataInitialized = (state) => state.user.isUserDataInitialized;

// Community Tags selectors
export const selectCommunityTags = (state) => state.user.communityTags;
export const selectCommunityTagsLoading = (state) => state.user.communityTagsLoading;
export const selectCommunityTagsError = (state) => state.user.communityTagsError;
export const selectCommunityTagsLoaded = (state) => state.user.communityTagsLoaded;

// Add this selector for compatibility with RecommendedCommunitySection
export const selectUserNonSubscribedCommunities = (state) => state.user.nonSubscribedCommunities;

export const {
  setUser,
  logoutUser,
  setNextPage,
  resetNextPage,
  setSelectedUserSession,
  resetSelectedUserSession,
  addToCart,
  clearCart,
  deleteItem,
  setMeetingLink,
  resetMeetingLink,
  setLoading,
  setFromPage,
  setMeetDetails,
  clearError,
  clearSuccess,
  setUserDataInitialized,
  clearSessionStatus,
  resetSessionPagination,
  updateSessionPagination,
  updatePostOptimistically,
  updatePostLikeOptimistically,
  addCommentOptimistically,
  updateCommentOptimistically,
  removeCommentOptimistically,
  updatePollVoteOptimistically,
  addNewPostOptimistically,
  updateFeedLikeMap,
} = userSlice.actions;

