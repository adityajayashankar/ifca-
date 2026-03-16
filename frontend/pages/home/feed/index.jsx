import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  selectUser,
  selectSubscribedCommunities,
  selectSubscribedSessions,
  selectInitialCommunities,
  selectProfileProgress,
  selectRecentActivities,
  selectFeedPosts,
  selectFeedLikeMap,
  selectFeedLoading,
  selectIsUserDataInitialized,
  selectError,
  selectSuccess,
  initializeUserData,
  fetchUserFeed,
  refreshUserFeed,
  clearError,
  clearSuccess,
  setUserDataInitialized,
  updatePostOptimistically,
  updatePostLikeOptimistically,
  addCommentOptimistically,
  getCommunityTags
} from "@/store/features/userSlice";
import Head from "next/head";
import moment from "moment";
import api, { clearUserDataCache } from "@/utils/apiSetup";
import Topbar from "@/components/topbar/Topbar";
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PostSearchDropdown from "@/components/PostSearchDropdown";
import FeedLeftSidebar from "@/components/feed/FeedLeftSidebar";
import FeedRightSidebar from "@/components/feed/FeedRightSidebar";
import FeedContent from "@/components/feed/FeedContent";
import { toast } from "react-toastify";
import RefreshIcon from '@mui/icons-material/Refresh';
import AssetModal from "@/components/common/AssetModal";
import LikesModal from '@/components/post/LikesModal';
import useLikesModal from '@/hooks/useLikesModal';

const Feed = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const subscribedCommunities = useSelector(selectSubscribedCommunities);
  const subscribedSessions = useSelector(selectSubscribedSessions);
  const initialCommunities = useSelector(selectInitialCommunities);
  const profileProgress = useSelector(selectProfileProgress);
  const recentActivities = useSelector(selectRecentActivities);
  const feedPosts = useSelector(selectFeedPosts);
  const feedLikeMap = useSelector(selectFeedLikeMap);
  const feedLoading = useSelector(selectFeedLoading);
  const isUserDataInitialized = useSelector(selectIsUserDataInitialized);
  const error = useSelector(selectError);
  const success = useSelector(selectSuccess);

  // State management
  const [showPostModal, setShowPostModal] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [sortOption, setSortOption] = useState('Recent');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [activitiesDrawerOpen, setActivitiesDrawerOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Auto-refresh system for sidebar data
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // LinkedIn-style progressive loading states
  const [loadingStates, setLoadingStates] = useState({
    userData: false,
    feedPosts: false,
    communities: false,
    sessions: false,
    activities: false
  });

  // Post interaction state
  const [menuOpen, setMenuOpen] = useState(null);
  const [openComments, setOpenComments] = useState(null);
  const [likes, setLikes] = useState({});
  const [commentText, setCommentText] = useState({});
  const [childMenuOpen, setChildMenuOpen] = useState(null);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyContent, setEditingReplyContent] = useState('');

  // Sync likes state with Redux store when feedLikeMap changes
  useEffect(() => {
    if (feedLikeMap && Object.keys(feedLikeMap).length > 0) {
      // Initialize likes state from Redux store
      const initialLikes = {};
      Object.keys(feedLikeMap).forEach(postId => {
        if (feedLikeMap[postId] === 1) {
          initialLikes[postId] = true;
        }
      });
      setLikes(initialLikes);
    }
  }, [feedLikeMap]);

  // Helper function to check if a post is liked
  const isPostLiked = (postId) => {
    return likes[postId] === true || feedLikeMap[postId] === 1;
  };

  // Refs
  const postRefs = useRef({});
  const menuRefs = useRef({});
  const childMenuRefs = useRef({});
  const initializationTimeoutRef = useRef(null);

  // Refs for retry functions to avoid circular dependencies
  const retryFunctionsRef = useRef({
    initializeUserData: null,
    fetchFeed: null
  });

  // Default posts for empty feed
  const defaultPosts = useMemo(() => [
    {
      id: 'default-welcome',
      title: 'Welcome to IFCA Platform! 🎉',
      content: `Hello and welcome to the IFCA (Indian Federation of Culinary Associations) platform! \n\nWe're thrilled to have you join our vibrant community of learners, educators, and cultural enthusiasts. \n\nHere's what you can do on our platform:\n• Connect with like-minded individuals from around the world\n• Join specialized communities based on your interests\n• Participate in expert-led sessions and workshops\n• Share your knowledge and experiences\n• Explore cultural heritage and hospitality management\n\nStart by creating your first post, joining a community, or exploring upcoming sessions. We're here to support your learning journey!`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creator: {
        admin: {
          name: 'IFCA Team',
          photoURL: '/logoifca.png',
          subtitle: 'Platform Administrator'
        }
      },
      community: {
        title: 'IFCA Platform',
        bannerImg: '/logoifca.png'
      },
      _count: {
        likes: 0,
        childrenPosts: 0
      },
      likes: [],
      childrenPosts: [],
      assets: [],
      isPoll: false,
      isAsk: false,
      isGreeting: true
    }
  ], []);

  // Error handling and retry logic
  const handleError = useCallback((error, operation = 'operation') => {
    console.error(`Error in ${operation}:`, error);
    
    if (retryCount < maxRetries) {
      toast.warning(`Retrying ${operation}... (${retryCount + 1}/${maxRetries})`);
      setRetryCount(prev => prev + 1);
      
      // Retry after a delay
      setTimeout(() => {
        if (operation === 'initialization' && retryFunctionsRef.current.initializeUserData) {
          retryFunctionsRef.current.initializeUserData();
        } else if (operation === 'feed' && retryFunctionsRef.current.fetchFeed) {
          retryFunctionsRef.current.fetchFeed();
        }
      }, 2000 * (retryCount + 1)); // Exponential backoff
    } else {
      toast.error(`Failed to ${operation} after ${maxRetries} attempts. Please refresh the page.`);
      setRetryCount(0);
    }
  }, [retryCount]);

  // Direct initialization function (not wrapped in useCallback)
  const initializeUserDataDirect = async () => {
    if (!user?.id || isInitializing) return;
    
    console.log('🚀 Starting API calls for user:', user.id);
    
    // setIsInitializing(true);
    setLoadingStates(prev => ({ 
      ...prev, 
      userData: true,
      communities: true,
      feedPosts: true,
      sessions: true,
      activities: true
    }));
    
    try {
      console.log('📡 Calling initializeUserData API...');
      await dispatch(initializeUserData(user.id)).unwrap();
      console.log('✅ initializeUserData completed');
      
      // Update last user data update time
      localStorage.setItem('lastUserDataUpdate', Date.now().toString());
      setRetryCount(0); // Reset retry count on success
      
      // Fetch community tags
      console.log('📡 Calling getCommunityTags API...');
      await dispatch(getCommunityTags()).unwrap();
      console.log('✅ getCommunityTags completed');
      
      // Immediately fetch feed data if unified user is available
      if (user?.unifiedUser?.id) {
        console.log('📡 Calling fetchUserFeed API...');
        await dispatch(fetchUserFeed(user.unifiedUser.id)).unwrap();
        console.log('✅ fetchUserFeed completed');
        // Update last feed update time
        localStorage.setItem('lastFeedUpdate', Date.now().toString());
      }
      
    } catch (error) {
      console.error('❌ Error during initialization:', error);
      handleError(error, 'initialization');
    } finally {
      setIsInitializing(false);
      setLoadingStates(prev => ({ 
        ...prev, 
        userData: false,
        communities: false,
        feedPosts: false,
        sessions: false,
        activities: false
      }));
    }
  };

  // Smart direct feed fetch function - tracks update time
  const fetchFeedDirect = async () => {
    if (!user?.unifiedUser?.id || feedLoading) return;
    
    try {
      await dispatch(fetchUserFeed(user.unifiedUser.id)).unwrap();
      // Update last feed update time
      localStorage.setItem('lastFeedUpdate', Date.now().toString());
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('❌ Error fetching feed:', error);
      handleError(error, 'feed');
    } finally {
      setLoadingStates(prev => ({ ...prev, feedPosts: false }));
    }
  };

  // Store retry functions in ref
  useEffect(() => {
    retryFunctionsRef.current.initializeUserData = initializeUserDataDirect;
    retryFunctionsRef.current.fetchFeed = fetchFeedDirect;
  }, [user?.id, user?.unifiedUser?.id, isUserDataInitialized, isInitializing, feedLoading]);

  // Single, clear initialization effect with smart caching - runs immediately when user is available
  useEffect(() => {
    console.log('🔄 Initialization effect triggered:', { 
      userId: user?.id, 
      unifiedUserId: user?.unifiedUser?.id, 
      isInitializing 
    });
    
    if (user?.id && user?.unifiedUser?.id && !isInitializing) {
      // Check if we have ANY data in Redux
      const hasUserData = subscribedCommunities?.length > 0 || 
                         subscribedSessions?.length > 0 || 
                         recentActivities?.length > 0 ||
                         profileProgress !== null;
      
      console.log('📊 Redux data check:', { 
        hasUserData, 
        subscribedCommunities: subscribedCommunities?.length,
        subscribedSessions: subscribedSessions?.length,
        recentActivities: recentActivities?.length,
        profileProgress: !!profileProgress
      });
      
      // Check cache freshness for feed data
      const lastFeedUpdate = localStorage.getItem('lastFeedUpdate');
      const lastUserDataUpdate = localStorage.getItem('lastUserDataUpdate');
      const now = Date.now();
      const FEED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
      const USER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
      
      const isFeedCacheFresh = lastFeedUpdate && (now - parseInt(lastFeedUpdate)) < FEED_CACHE_TTL;
      const isUserCacheFresh = lastUserDataUpdate && (now - parseInt(lastUserDataUpdate)) < USER_CACHE_TTL;
      
      console.log('💾 Cache freshness check:', { 
        isFeedCacheFresh, 
        isUserCacheFresh,
        feedCacheAge: lastFeedUpdate ? Math.round((now - parseInt(lastFeedUpdate)) / 1000) + 's' : 'no cache',
        userCacheAge: lastUserDataUpdate ? Math.round((now - parseInt(lastUserDataUpdate)) / 1000) + 's' : 'no cache'
      });
      
      // Set initialization to true if we have data
      if (hasUserData) {
        console.log('✅ Setting isUserDataInitialized to true');
        dispatch(setUserDataInitialized(true));
      }
      
      // Smart API call strategy:
      // 1. If both caches are fresh, skip API calls entirely
      // 2. If caches are stale, fetch fresh data in background
      if (isFeedCacheFresh && isUserCacheFresh && hasUserData) {
        console.log('⚡ Using fresh caches, skipping API calls');
        dispatch(setUserDataInitialized(true));
      } else {
        console.log('🚀 Caches stale or missing, fetching fresh data...');
        initializeUserDataDirect();
      }
    }
  }, [user?.id, user?.unifiedUser?.id]); // Only depend on user, not other state

  // Force initialization state update when data becomes available
  useEffect(() => {
    if (user?.id) {
      const hasAnyData = subscribedCommunities?.length > 0 || 
                        subscribedSessions?.length > 0 || 
                        recentActivities?.length > 0 ||
                        profileProgress !== null ||
                        feedPosts?.length > 0;
      
      if (hasAnyData && !isUserDataInitialized) {
        dispatch(setUserDataInitialized(true));
      }
    }
  });

  // Background refresh effect - silently refresh stale data without blocking UI
  useEffect(() => {
    if (!user?.unifiedUser?.id) return;
    
    const now = Date.now();
    const lastFeedUpdate = localStorage.getItem('lastFeedUpdate');
    const REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh if older than 5 minutes
    
    const shouldRefresh = !lastFeedUpdate || (now - parseInt(lastFeedUpdate)) > REFRESH_THRESHOLD;
    
    if (shouldRefresh && isUserDataInitialized && feedPosts?.length > 0) {
      console.log('🔄 Background refresh: data is stale, fetching silently...');
      
      // Silent background refresh - don't show loading spinner
      (async () => {
        try {
          await dispatch(refreshUserFeed(user.unifiedUser.id)).unwrap();
          localStorage.setItem('lastFeedUpdate', Date.now().toString());
          console.log('✅ Silent background refresh completed');
        } catch (error) {
          console.log('⚠️ Background refresh failed (non-critical):', error.message);
          // Don't show error toast - it's just a background refresh
        }
      })();
    }
  }, [isUserDataInitialized, user?.unifiedUser?.id, dispatch]);

  // Remove the duplicate initialization effect to prevent double loading

  // Set sessions data when available
  useEffect(() => {
    if (isUserDataInitialized && subscribedSessions) {
      setUpcomingSessions(subscribedSessions);
    }
  }, [isUserDataInitialized, subscribedSessions]);

  // Handle error and success messages
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
    if (success) {
      toast.success(success);
      dispatch(clearSuccess());
    }
  }, [error, success]);

  // Handle poll vote with optimistic update
  const handlePollVote = async (postId, optionId) => {
    if (!user || !user.unifiedUser?.id) return;
    
    // Find the post to check if it's expired
    const post = feedPosts.find(p => p.id === postId);
    
    if (post?.pollExpiresAt && moment().isAfter(moment(post.pollExpiresAt))) {
      toast.error("This poll has expired. Voting is no longer allowed.");
      return;
    }
    
    try {
      // Optimistic update
      const updatedPosts = feedPosts.map(post => {
        if (post.id === postId) {
          const currentVotes = post.votes || {};
          const updatedVotes = {
            ...currentVotes,
            [optionId]: (currentVotes[optionId] || 0) + 1
          };
          return {
            ...post,
            votes: updatedVotes,
            UserPollOptionSelect: [
              ...(post.UserPollOptionSelect || []),
              { unifiedUserId: user.unifiedUser.id, pollOptionsId: optionId }
            ]
          };
        }
        return post;
      });
      
      // Update state immediately
      dispatch(updatePostOptimistically({ posts: updatedPosts }));
      
      // Make API call
      const res = await api.patch(`/thread/${postId}/user/${user.unifiedUser.id}/option/${optionId}`);
      
      // Clear cache to ensure fresh data
      clearUserDataCache();
      
      // Update with server response if different
      if (res.data && res.data.pollResults) {
        const serverUpdatedPosts = feedPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              votes: res.data.pollResults,
              UserPollOptionSelect: [
                ...(post.UserPollOptionSelect || []),
                { unifiedUserId: user.unifiedUser.id, pollOptionsId: optionId }
              ]
            };
          }
          return post;
        });
        dispatch(updatePostOptimistically({ posts: serverUpdatedPosts }));
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
      toast.error('Failed to vote on poll. Please try again.');
      // Revert optimistic update on error
      dispatch(refreshUserFeed(user.unifiedUser.id));
    }
  };

  // Poll countdown timer component
  const PollCountdownTimer = ({ expiresAt }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
      if (!expiresAt) return;

      const updateTimer = () => {
        const now = moment();
        const expiry = moment(expiresAt);
        const diff = expiry.diff(now);

        if (diff <= 0) {
          setTimeLeft('Poll ended');
          setIsExpired(true);
        } else {
          const duration = moment.duration(diff);
          const days = Math.floor(duration.asDays());
          const hours = duration.hours();
          const minutes = duration.minutes();
          const seconds = duration.seconds();

          let timeString = '';
          if (days > 0) {
            timeString = `${days}d ${hours}h ${minutes}m`;
          } else if (hours > 0) {
            timeString = `${hours}h ${minutes}m ${seconds}s`;
          } else if (minutes > 0) {
            timeString = `${minutes}m ${seconds}s`;
          } else {
            timeString = `${seconds}s`;
          }

          setTimeLeft(timeString);
          setIsExpired(false);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }, [expiresAt]);

    if (!expiresAt) return null;

    return (
      <div className={`text-xs font-medium px-2 py-1 rounded-full ${
        isExpired 
          ? 'bg-red-100 text-red-700' 
          : 'bg-orange-100 text-orange-700'
      }`}>
        {isExpired ? 'Poll ended' : `Ends in: ${timeLeft}`}
      </div>
    );
  };

  // Handle like with optimistic update
  const handleLike = async (postId) => {
    if (!user || !user.unifiedUser?.id) return;
    
    try {
      // Optimistic update
      const currentLikeState = isPostLiked(postId);
      const newLikeState = !currentLikeState;
      
      // Update local state immediately
      setLikes(prev => ({
        ...prev,
        [postId]: newLikeState
      }));
      
      // Update posts optimistically
      const updatedPosts = feedPosts.map(post => {
        if (post.id === postId) {
          const currentLikes = post.likes || [];
          const updatedLikes = newLikeState 
            ? [...currentLikes, { unifiedUserId: user.unifiedUser.id }]
            : currentLikes.filter(like => like.unifiedUserId !== user.unifiedUser.id);
          
          return {
            ...post,
            likes: updatedLikes,
            _count: {
              ...post._count,
              likes: newLikeState ? (post._count?.likes || 0) + 1 : Math.max(0, (post._count?.likes || 0) - 1)
            }
          };
        }
        return post;
      });
      
      dispatch(updatePostOptimistically({ posts: updatedPosts }));
      
      // Make API call
      const res = await api.patch(`/thread/${postId}/user/${user.unifiedUser.id}`);
      
      // Clear cache to ensure fresh data
      clearUserDataCache();
      
      // Update with server response
      if (res.data) {
        const serverLikeState = res.data.like;
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post. Please try again.');
      // Revert optimistic update on error
      setLikes(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));
    }
  };

  // Handle comment with optimistic update
  const handleComment = async (postId) => {
    if (!user || !user.unifiedUser?.id || !commentText[postId] || !feedPosts) return;
    
    const commentContent = commentText[postId];
    
    try {
      const post = feedPosts.find(p => p.id === postId);
      if (!post) return;
      
      // Create optimistic comment
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        content: commentContent,
        title: "",
        creatorId: user.unifiedUser.id,
        parentPostId: postId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creator: {
          user: {
            name: user.name,
            photoURL: user.photoURL
          }
        },
        _count: {
          likes: 0,
          childrenPosts: 0
        },
        likes: [],
        childrenPosts: [],
        assets: [],
        isOptimistic: true
      };
      
      // Update posts optimistically
      const updatedPosts = feedPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            childrenPosts: [...(p.childrenPosts || []), optimisticComment],
            _count: {
              ...p._count,
              childrenPosts: (p._count?.childrenPosts || 0) + 1
            }
          };
        }
        return p;
      });
      
      dispatch(updatePostOptimistically({ posts: updatedPosts }));
      
      // Clear comment text immediately
      setCommentText(prev => ({
        ...prev,
        [postId]: ''
      }));
      
      // Make API call
      const payload = {
        content: commentContent,
        title: "",
        assetsData: [],
        tagsData: [],
        creatorId: user.unifiedUser.id,
        communityId: post.communityId,
        parentPostId: postId
      };
      
      const res = await api.post('/thread', payload);
      
      // Clear cache to ensure fresh data
      clearUserDataCache();
      
      if (res.data && res.data.createdPost) {
        // Replace optimistic comment with real one
        const finalUpdatedPosts = updatedPosts.map(p => {
          if (p.id === postId) {
            const realComment = res.data.createdPost;
            return {
              ...p,
              childrenPosts: p.childrenPosts.map(child => 
                child.isOptimistic ? realComment : child
              )
            };
          }
          return p;
        });
        
        dispatch(updatePostOptimistically({ posts: finalUpdatedPosts }));
        toast.success('Comment posted successfully!');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment. Please try again.');
      // Revert optimistic update on error
      dispatch(refreshUserFeed(user.unifiedUser.id));
      // Restore comment text
      setCommentText(prev => ({
        ...prev,
        [postId]: commentContent
      }));
    }
  };

  // Add this function to highlight search words
  const highlightText = (text, searchQuery) => {
    if (!searchQuery || !text) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase()
        ? `<span class="highlight">${part}</span>`
        : part
    ).join('');
  };

  // Filter and sort posts
  useEffect(() => {
    let filtered = (!feedPosts || feedPosts.length === 0) ? defaultPosts : feedPosts;

    if (searchQuery.trim()) {
      filtered = filtered.filter(post => {
        const titleMatch = post.title?.toLowerCase().includes(searchQuery.toLowerCase());
        const contentMatch = post.content?.toLowerCase().includes(searchQuery.toLowerCase());
        return titleMatch || contentMatch;
      });
    }

    if (sortOption === 'Recent') {
      filtered = filtered.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOption === 'Most Liked') {
      filtered = filtered.slice().sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    } else if (sortOption === 'Top') {
      filtered = filtered.slice().sort((a, b) => {
        const aScore = (a._count?.childrenPosts || 0) + (a.likes?.length || 0);
        const bScore = (b._count?.childrenPosts || 0) + (b.likes?.length || 0);
        return bScore - aScore;
      });
    }
    setFilteredPosts(filtered);
  }, [searchQuery, feedPosts, sortOption, defaultPosts]);

  // Scroll to post and highlight
  const handleDropdownClick = (postId) => {
    setShowSearchBar(false);
    setTimeout(() => {
      if (postRefs.current[postId]) {
        postRefs.current[postId].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // Smart auto-refresh sidebar data - only refresh if data is stale
  const autoRefreshSidebarData = useCallback(async () => {
    if (!user?.id || isAutoRefreshing) return;
    
    // Check if we have recent data (less than 5 minutes old)
    const lastDataTime = localStorage.getItem('lastUserDataUpdate');
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (lastDataTime && (now - parseInt(lastDataTime)) < fiveMinutes) {
      // Data is still fresh, skip refresh
      return;
    }
    
    setIsAutoRefreshing(true);
    try {
      // Refresh only the data that changes: communities, sessions, activities
      await dispatch(initializeUserData(user.id)).unwrap();
      // Update last refresh time
      localStorage.setItem('lastUserDataUpdate', now.toString());
    } catch (error) {
      // Silent fail for auto-refresh to avoid user disruption
      console.error('❌ Error auto-refreshing sidebar data:', error);
    } finally {
      setIsAutoRefreshing(false);
    }
  }, [user?.id, isAutoRefreshing, dispatch]);

  // Improved auto-refresh with visibility check
  useEffect(() => {
    if (!user?.id || !isUserDataInitialized) return;

    let autoRefreshInterval;
    
    const startAutoRefresh = () => {
      autoRefreshInterval = setInterval(() => {
        // Only refresh if the page is visible and user is on the feed page
        if (document.visibilityState === 'visible' && router.asPath === '/home/feed') {
          autoRefreshSidebarData();
        }
      }, 60 * 1000); // 60 seconds - reduced frequency to avoid interference
    };

    const stopAutoRefresh = () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    };

    // Start auto-refresh
    startAutoRefresh();

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopAutoRefresh();
      } else if (document.visibilityState === 'visible' && router.asPath === '/home/feed') {
        startAutoRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopAutoRefresh();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, isUserDataInitialized, autoRefreshSidebarData, router.asPath]);

  // Smart manual refresh function - tracks last update time
  const fetchFeed = useCallback(() => {
    if (user?.unifiedUser?.id) {
      dispatch(refreshUserFeed(user.unifiedUser.id)).then(() => {
        // Update last feed update time
        localStorage.setItem('lastFeedUpdate', Date.now().toString());
        // Check for new posts after refreshing feed
        setTimeout(() => {
          checkForNewPosts();
        }, 500);
      });
    }
  }, [user?.unifiedUser?.id, dispatch, checkForNewPosts]);

  // Function to check for new posts when a new post is created
  const checkForNewPostsAfterCreation = useCallback(() => {
    if (user?.unifiedUser?.id) {
      // Update the last fetch time to now to avoid showing the newly created post as "new"
      lastFetchTimeRef.current = Date.now();
      
      // Check for any other new posts that might have been created by others
      setTimeout(() => {
        checkForNewPosts();
      }, 1000);
    }
  }, [user?.unifiedUser?.id, checkForNewPosts]);

  // Comprehensive refresh function that updates all data
  const refreshAllData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Refresh user data (communities, sessions, activities, profile progress)
      await dispatch(initializeUserData(user.id)).unwrap();
      
      // Refresh community tags
      await dispatch(getCommunityTags()).unwrap();
      
      // Refresh feed data
      if (user?.unifiedUser?.id) {
        await dispatch(refreshUserFeed(user.unifiedUser.id)).unwrap();
        
        // Check for new posts after refreshing feed
        setTimeout(() => {
          checkForNewPosts();
        }, 500);
      }
    } catch (error) {
      console.error('❌ Error refreshing all data:', error);
    }
  }, [user?.id, user?.unifiedUser?.id, dispatch, checkForNewPosts]);

  // Smart route change listener - only refresh if data is stale
  useEffect(() => {
    let routeChangeTimeout;
    
    const handleRouteChange = () => {
      // Only refresh if we're coming back to the feed page and data is stale
      if (router.asPath === '/home/feed' && user?.unifiedUser?.id) {
        // Check if we have recent feed data (less than 2 minutes old)
        const lastFeedTime = localStorage.getItem('lastFeedUpdate');
        const now = Date.now();
        const twoMinutes = 2 * 60 * 1000;
        
        const hasRecentFeedData = lastFeedTime && (now - parseInt(lastFeedTime)) < twoMinutes;
        const hasFeedData = feedPosts?.length > 0;
        
        // Only refresh if no recent data or no feed data
        if (!hasRecentFeedData || !hasFeedData) {
          // Clear any existing timeout
          if (routeChangeTimeout) {
            clearTimeout(routeChangeTimeout);
          }
          
          // Debounce the refresh to avoid multiple rapid calls
          routeChangeTimeout = setTimeout(() => {
            fetchFeed();
          }, 100);
        }
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      if (routeChangeTimeout) {
        clearTimeout(routeChangeTimeout);
      }
    };
  }, [router.asPath, user?.unifiedUser?.id, fetchFeed, feedPosts?.length]);

  // Redirect if no user and cleanup localStorage
  useEffect(() => {
    if (!user) {
      // Clear all localStorage timestamps when user logs out
      localStorage.removeItem('lastUserDataUpdate');
      localStorage.removeItem('lastFeedUpdate');
      localStorage.removeItem('lastRecommendedCommunitiesUpdate');
      router.push("/onBoard");
    }
  }, [router, user]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
    };
  }, []);

  // Smart loading state - check if data exists in Redux
  const hasUserData = subscribedCommunities?.length > 0 || 
                     subscribedSessions?.length > 0 || 
                     recentActivities?.length > 0 ||
                     profileProgress !== null;
  
  // Force data availability - if we have any data, consider it available
  const forceDataAvailable = hasUserData || feedPosts?.length > 0;
  
  // Force data display - completely bypass loading states when data exists
  const showLoading = {
    userData: false, // Never show user data loading
    feedPosts: (loadingStates.feedPosts || feedLoading) && !feedPosts?.length,
    communities: false, // Never show communities loading
    sessions: false, // Never show sessions loading
    activities: false // Never show activities loading
  };

  // Overall loading state - completely disabled when we have any data
  const isOverallLoading = false; // Never show overall loading

  const [newPosts, setNewPosts] = useState([]);
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
  const lastFetchTimeRef = useRef(Date.now());
  const currentPostIdsRef = useRef(new Set());

  // Update current post IDs when feed posts change
  useEffect(() => {
    if (feedPosts && feedPosts.length > 0) {
      currentPostIdsRef.current = new Set(feedPosts.map(post => post.id));
    }
  }, [feedPosts]);

  // Check for new posts when page is refreshed or when feed is manually refreshed
  const checkForNewPosts = useCallback(async () => {
    if (!user?.unifiedUser?.id) return;
    
    try {
      // Fetch posts newer than the last fetch time
      const res = await api.get(`/thread/user/${user.unifiedUser.id}/community`, {
        params: { since: lastFetchTimeRef.current }
      });
      
      if (res.data && res.data.posts && res.data.posts.length > 0) {
        // Filter out posts that already exist in current feed
        const trulyNewPosts = res.data.posts.filter(newPost => 
          !currentPostIdsRef.current.has(newPost.id)
        );
        
        // Check for updated posts (posts that exist but have changes)
        const updatedPosts = res.data.posts.filter(newPost => {
          if (currentPostIdsRef.current.has(newPost.id)) {
            const existingPost = feedPosts.find(post => post.id === newPost.id);
            if (existingPost) {
              // Check if there are meaningful changes
              const likesChanged = (newPost._count?.likes || 0) !== (existingPost._count?.likes || 0);
              const commentsChanged = (newPost._count?.childrenPosts || 0) !== (existingPost._count?.childrenPosts || 0);
              const updatedAtChanged = newPost.updatedAt !== existingPost.updatedAt;
              
              // Only consider it a significant update if:
              // - New comments were added (more than 1 new comment)
              // - Post content was updated
              // - Significant like activity (more than 2 new likes)
              const significantLikeChange = Math.abs((newPost._count?.likes || 0) - (existingPost._count?.likes || 0)) > 2;
              const significantCommentChange = Math.abs((newPost._count?.childrenPosts || 0) - (existingPost._count?.childrenPosts || 0)) > 1;
              
              return updatedAtChanged || significantCommentChange || significantLikeChange;
            }
          }
          return false;
        });
        

        
        // Only show banner if there are truly new posts or significant updates
        if (trulyNewPosts.length > 0 || updatedPosts.length > 0) {
          setNewPosts([...trulyNewPosts, ...updatedPosts]);
          setShowNewPostsBanner(true);
        }
      }
    } catch (err) {
      // Silent fail for new posts check
    }
  }, [user?.unifiedUser?.id, feedPosts]);

  // Check for new posts when page is refreshed
  useEffect(() => {
    if (user?.unifiedUser?.id && isUserDataInitialized) {
      // Small delay to ensure feed is loaded first
      setTimeout(() => {
        checkForNewPosts();
      }, 1000);
    }
  }, [user?.unifiedUser?.id, isUserDataInitialized, checkForNewPosts]);

  // Handler for clicking the new posts banner
  const handleShowNewPosts = () => {
    if (newPosts.length > 0) {
      // Merge new posts and existing posts, remove duplicates by ID
      const allPosts = [...newPosts, ...feedPosts];
      const uniquePostsMap = {};
      allPosts.forEach(post => {
        uniquePostsMap[post.id] = post;
      });
      const uniquePosts = Object.values(uniquePostsMap);
      // Sort by createdAt (newest first)
      uniquePosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      dispatch(updatePostOptimistically({ posts: uniquePosts }));
      setNewPosts([]);
      setShowNewPostsBanner(false);
      lastFetchTimeRef.current = Date.now();
    }
  };

  // Asset modal state
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetModalAssets, setAssetModalAssets] = useState([]);
  const [assetModalIndex, setAssetModalIndex] = useState(0);
  const [assetModalPost, setAssetModalPost] = useState(null);

  // Handler to open asset modal
  const handleOpenAssetModal = (assets, idx, post) => {
    setAssetModalAssets(assets);
    setAssetModalIndex(idx);
    setAssetModalPost(post);
    setAssetModalOpen(true);
  };

  // Handler to add a comment from the modal
  const handleAssetModalComment = async (postId, commentText) => {
    if (!user || !user.unifiedUser?.id || !commentText) return;
    const post = assetModalPost;
    if (!post) return;
    const payload = {
      content: commentText,
      title: "",
      assetsData: [],
      tagsData: [],
      creatorId: user.unifiedUser.id,
      communityId: post.communityId,
      parentPostId: postId
    };
    await api.post('/thread', payload);
    // Optionally refresh feed or update modal comments
    setTimeout(() => {
      // You may want to refresh the feed or refetch the post here
      // For now, just close and reopen modal to refresh comments
      setAssetModalOpen(false);
      setTimeout(() => setAssetModalOpen(true), 100);
    }, 500);
  };

  // Likes modal state at the root
  const {
    isOpen: likesModalOpen,
    currentPostId: likesModalPostId,
    currentLikeCount: likesModalLikeCount,
    openLikesModal,
    closeLikesModal
  } = useLikesModal();

  return (
    <>
      <Head>
        <title>IFCA - Feed</title>
        {/* Open Graph meta tags for better social media sharing */}
        <meta property="og:title" content="IFCA - Feed" />
        <meta property="og:description" content="Discover and share content with the IFCA community" />
        <meta property="og:image" content="/logoifca.png" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="IFCA Application" />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="IFCA - Feed" />
        <meta name="twitter:description" content="Discover and share content with the IFCA community" />
        <meta name="twitter:image" content="/logoifca.png" />
      </Head>
      <Topbar />
      {/* Fixed Search Bar */}
      {showSearchBar && (
        <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 p-4">
          <div className="max-w-2xl mx-auto relative">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  autoFocus
                />
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <button
                onClick={() => {
                  setShowSearchBar(false);
                  setSearchQuery("");
                }}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <CloseIcon />
              </button>
            </div>
            <PostSearchDropdown
              posts={filteredPosts}
              searchQuery={searchQuery}
              onSelect={handleDropdownClick}
            />
          </div>
        </div>
      )}
      <main className="flex-1 w-full bg-stone-100 min-h-[calc(100vh-60px)] mt-[60px]">
        <div className="max-w-7xl mx-auto md:px-4 md:py-6 min-h-screen">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <FeedLeftSidebar 
              loading={isOverallLoading} 
              loadingStates={showLoading}
              retryCount={retryCount}
              onRetry={initializeUserDataDirect}
              onRefresh={refreshAllData}
              isAutoRefreshing={isAutoRefreshing}
            />
            {/* Center Feed */}
            <FeedContent
              loading={isOverallLoading}
              loadingStates={showLoading}
              filteredPosts={filteredPosts}
              upcomingSessions={upcomingSessions}
              showPostModal={showPostModal}
              setShowPostModal={setShowPostModal}
              editingPost={editingPost}
              setEditingPost={setEditingPost}
              fetchFeed={fetchFeed}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showSearchBar={showSearchBar}
              setShowSearchBar={setShowSearchBar}
              sortOption={sortOption}
              setSortOption={setSortOption}
              showSortDropdown={showSortDropdown}
              setShowSortDropdown={setShowSortDropdown}
              postRefs={postRefs}
              handleDropdownClick={handleDropdownClick}
              handleLike={handleLike}
              handleComment={handleComment}
              handlePollVote={handlePollVote}
              likes={likes}
              commentText={commentText}
              setCommentText={setCommentText}
              openComments={openComments}
              setOpenComments={setOpenComments}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              menuRefs={menuRefs}
              childMenuOpen={childMenuOpen}
              setChildMenuOpen={setChildMenuOpen}
              childMenuRefs={childMenuRefs}
              editingReplyId={editingReplyId}
              setEditingReplyId={setEditingReplyId}
              editingReplyContent={editingReplyContent}
              setEditingReplyContent={setEditingReplyContent}
              like_map={feedLikeMap}
              highlightText={highlightText}
              retryCount={retryCount}
              onRetry={fetchFeedDirect}
              onRefresh={refreshAllData}
              isAutoRefreshing={isAutoRefreshing}
              showNewPostsBanner={showNewPostsBanner}
              handleShowNewPosts={handleShowNewPosts}
              checkForNewPostsAfterCreation={checkForNewPostsAfterCreation}
              handleOpenAssetModal={handleOpenAssetModal}
              openLikesModal={openLikesModal}
              closeLikesModal={closeLikesModal}
              likesModalOpen={likesModalOpen}
              likesModalPostId={likesModalPostId}
              likesModalLikeCount={likesModalLikeCount}
              PollCountdownTimer={PollCountdownTimer}
            />
            {/* Right Sidebar */}
            <FeedRightSidebar
              loading={isOverallLoading}
              loadingStates={showLoading}
              activitiesDrawerOpen={activitiesDrawerOpen}
              setActivitiesDrawerOpen={setActivitiesDrawerOpen}
              retryCount={retryCount}
              onRetry={initializeUserDataDirect}
              onRefresh={refreshAllData}
              isAutoRefreshing={isAutoRefreshing}
              hasPosts={feedPosts && feedPosts.length > 0}
            />
          </div>
        </div>
      </main>
      {/* Asset Modal */}
      <AssetModal
        show={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        assets={assetModalAssets}
        initialIndex={assetModalIndex}
        post={assetModalPost}
        onComment={handleAssetModalComment}
        user={user}
      />
      {/* Likes Modal at root for proper overlay */}
      <LikesModal
        open={likesModalOpen}
        onClose={closeLikesModal}
        postId={likesModalPostId}
        likeCount={likesModalLikeCount}
      />
    </>
  );
};

export default Feed; 