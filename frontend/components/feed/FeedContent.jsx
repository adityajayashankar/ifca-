import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, selectSubscribedCommunities, selectUserNonSubscribedCommunities, getUserNonSubscribedCommunities } from "@/store/features/userSlice";
import SessionCardList from "@/components/sessionsCardList";
import RecommendedCommunitySection from "@/components/RecommendedCommunitySection";
import RecommendedSessionSection from "@/components/RecommendedSessionSection";
import PostModal from "@/components/post/PostModals";
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import PostSearchDropdown from "@/components/PostSearchDropdown";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PushPinIcon from '@mui/icons-material/PushPin';
import StarIcon from '@mui/icons-material/Star';
import GroupsIcon from '@mui/icons-material/Groups';
import ArchiveIcon from '@mui/icons-material/Archive';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SendIcon from '@mui/icons-material/Send';
import moment from "moment";
import api from "@/utils/apiSetup";
import { Skeleton, Button, Alert, CircularProgress, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { getUserPhotoURL } from "@/utils/userUtils";
import AssetModal from "@/components/common/AssetModal";
import ShareModal from "@/components/common/ShareModal";

const FeedContent = ({
  loading,
  loadingStates = {},
  filteredPosts,
  upcomingSessions,
  showPostModal,
  setShowPostModal,
  editingPost,
  setEditingPost,
  fetchFeed,
  searchQuery,
  setSearchQuery,
  showSearchBar,
  setShowSearchBar,
  sortOption,
  setSortOption,
  showSortDropdown,
  setShowSortDropdown,
  postRefs,
  handleDropdownClick,
  // Post interaction handlers
  handleLike,
  handleComment,
  handlePollVote,
  likes,
  commentText,
  setCommentText,
  openComments,
  setOpenComments,
  menuOpen,
  setMenuOpen,
  menuRefs,
  childMenuOpen,
  setChildMenuOpen,
  childMenuRefs,
  editingReplyId,
  setEditingReplyId,
  editingReplyContent,
  setEditingReplyContent,
  like_map,
  highlightText,
  retryCount = 0,
  onRetry,
  onRefresh,
  isAutoRefreshing,
  showNewPostsBanner,
  handleShowNewPosts,
  checkForNewPostsAfterCreation,
  handleOpenAssetModal,
  openLikesModal,
  closeLikesModal,
  likesModalOpen,
  likesModalPostId,
  likesModalLikeCount,
  PollCountdownTimer,
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const subscribedCommunities = useSelector(selectSubscribedCommunities);
  const recommendedCommunities = useSelector(selectUserNonSubscribedCommunities) || [];
  
  // State for managing carousel indices for each post
  const [carouselIndices, setCarouselIndices] = useState({});
  
  // Comment modal state
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalData, setShareModalData] = useState({});
  
  // Truncation state for post descriptions
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  const [expandedComments, setExpandedComments] = useState(new Set());

  // Truncation functions
  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const toggleCommentExpansion = (postId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Handler to add a comment from the modal
  const handleAssetModalComment = async (postId, commentText) => {
    if (!user || !user.unifiedUser?.id || !commentText) return;
    const post = selectedPost;
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
      setShowCommentModal(false);
      setTimeout(() => setShowCommentModal(true), 100);
    }, 500);
  };

  // Handler for share functionality
  const handleShare = (post) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const postUrl = `${baseUrl}/community/${post.communityId}/thread/${post.id}`;
    
    // Get community info for share content
    const community = subscribedCommunities.find(c => c.id === post.communityId) || {};
    
    setShareModalData({
      title: post.title || 'Check out this post',
      description: post.content || 'Interesting content from IFCA',
      url: postUrl,
      communityName: community.title || 'IFCA Community',
      communityDesc: community.desc || 'Join our community on IFCA',
      communityImage: community.bannerImg || '/comPic.svg',
      postId: post.id
    });
    setShowShareModal(true);
  };

  // Smart auto-refresh for recommended communities - only if data is stale
  useEffect(() => {
    if (!user?.id) return;
    
    let interval;
    
    const startInterval = () => {
      interval = setInterval(() => {
        // Only refresh if page is visible, user is on feed page, and data is stale
        if (document.visibilityState === 'visible' && router.asPath === '/home/feed') {
          // Check if we have recent recommended communities data (less than 10 minutes old)
          const lastRecommendedTime = localStorage.getItem('lastRecommendedCommunitiesUpdate');
          const now = Date.now();
          const tenMinutes = 10 * 60 * 1000;
          
          if (!lastRecommendedTime || (now - parseInt(lastRecommendedTime)) >= tenMinutes) {
            dispatch(getUserNonSubscribedCommunities(user.id));
            localStorage.setItem('lastRecommendedCommunitiesUpdate', now.toString());
          }
        }
      }, 30000);
    };
    
    const stopInterval = () => {
      if (interval) {
        clearInterval(interval);
      }
    };
    
    // Initial fetch only if no recent data
    const lastRecommendedTime = localStorage.getItem('lastRecommendedCommunitiesUpdate');
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    
    if (!lastRecommendedTime || (now - parseInt(lastRecommendedTime)) >= tenMinutes) {
      dispatch(getUserNonSubscribedCommunities(user.id));
      localStorage.setItem('lastRecommendedCommunitiesUpdate', now.toString());
    }
    
    // Start interval
    startInterval();
    
    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopInterval();
      } else if (document.visibilityState === 'visible' && router.asPath === '/home/feed') {
        startInterval();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, dispatch, router.asPath]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event) {
      // If the menu is open and the click is outside any menu, close it
      if (!event.target.closest('.post-menu-dropdown') && !event.target.closest('.post-menu-trigger')) {
        setMenuOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Skeleton components
  const CreatePostSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 animate-pulse">
      <div className="flex items-center space-x-3">
        <Skeleton variant="circular" width={40} height={40} animation="wave" />
        <Skeleton variant="rectangular" width="100%" height={40} animation="wave" />
      </div>
    </div>
  );

  const PostSkeleton = () => (
    <div className="bg-white md:rounded-lg md:shadow p-0 mb-2 relative border border-gray-100 animate-pulse">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start gap-3">
          <Skeleton variant="circular" width={48} height={48} animation="wave" />
          <div className="flex-1">
            <Skeleton variant="text" width="40%" height={20} animation="wave" />
            <Skeleton variant="text" width="60%" height={16} animation="wave" />
            <Skeleton variant="text" width="30%" height={14} animation="wave" />
          </div>
        </div>
      </div>
      <div className="border-b border-gray-300 mx-4" />
      <div className="px-4 py-4">
        <Skeleton variant="text" width="80%" height={20} className="mb-2" animation="wave" />
        <Skeleton variant="text" width="100%" height={16} className="mb-1" animation="wave" />
        <Skeleton variant="text" width="90%" height={16} className="mb-1" animation="wave" />
        <Skeleton variant="text" width="70%" height={16} className="mb-3" animation="wave" />
        <div className="flex justify-between">
          <Skeleton variant="text" width="20%" height={16} animation="wave" />
          <Skeleton variant="text" width="20%" height={16} animation="wave" />
          <Skeleton variant="text" width="20%" height={16} animation="wave" />
        </div>
      </div>
    </div>
  );

  // Progressive loading skeleton with staggered animation
  const ProgressivePostSkeleton = ({ delay = 0 }) => (
    <div 
      className="bg-white md:rounded-lg md:shadow p-0 mb-2 relative border border-gray-100"
      style={{
        animation: `fadeInUp 0.6s ease-out ${delay}ms both`
      }}
    >
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start gap-3">
          <Skeleton variant="circular" width={48} height={48} animation="wave" />
          <div className="flex-1">
            <Skeleton variant="text" width="40%" height={20} animation="wave" />
            <Skeleton variant="text" width="60%" height={16} animation="wave" />
            <Skeleton variant="text" width="30%" height={14} animation="wave" />
          </div>
        </div>
      </div>
      <div className="border-b border-gray-300 mx-4" />
      <div className="px-4 py-4">
        <Skeleton variant="text" width="80%" height={20} className="mb-2" animation="wave" />
        <Skeleton variant="text" width="100%" height={16} className="mb-1" animation="wave" />
        <Skeleton variant="text" width="90%" height={16} className="mb-1" animation="wave" />
        <Skeleton variant="text" width="70%" height={16} className="mb-3" animation="wave" />
        <div className="flex justify-between">
          <Skeleton variant="text" width="20%" height={16} animation="wave" />
          <Skeleton variant="text" width="20%" height={16} animation="wave" />
          <Skeleton variant="text" width="20%" height={16} animation="wave" />
        </div>
      </div>
    </div>
  );

  const ErrorState = ({ message, onRetry }) => (
    <div className="bg-white rounded-lg shadow p-6 text-center">
      <Alert 
        severity="error" 
        icon={<ErrorOutlineIcon />}
        action={
          onRetry && (
            <Button 
              color="inherit" 
              size="small" 
              onClick={onRetry}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          )
        }
        className="mb-4"
      >
        {message}
      </Alert>
      <p className="text-gray-600 text-sm">
        If the problem persists, please refresh the page or contact support.
      </p>
    </div>
  );

  const EmptyState = () => (
    <div className="space-y-6">
      {/* Default welcome post */}
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <GroupsIcon className="text-gray-400 text-2xl" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
      <p className="text-gray-600 mb-4">
        {subscribedCommunities && subscribedCommunities.length > 0 
          ? "Be the first to share something in your communities!"
          : "Join a community to start seeing posts and sharing your thoughts."
        }
      </p>
      {subscribedCommunities && subscribedCommunities.length > 0 ? (
        <button
          onClick={() => setShowPostModal(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Create Your First Post
        </button>
      ) : (
        <button
          onClick={() => router.push('/communities')}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Explore Communities
        </button>
      )}
      </div>
      
      {/* Recommended Communities */}
      <RecommendedCommunitySection communities={recommendedCommunities} />
      
      {/* Recommended Sessions */}
      <RecommendedSessionSection />
    </div>
  );

  return (
    <section className="col-span-1 lg:col-span-2 space-y-2">
      {/* Create Post Button */}
      {loadingStates.userData ? (
        <CreatePostSkeleton />
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full overflow-hidden">
              <Image
                src={getUserPhotoURL(user)}
                alt="Profile"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <button
              onClick={() => {
                setShowPostModal(true);
              }}
              className={`flex-1 text-left rounded-full px-4 py-2 text-base transition-colors ${
                (subscribedCommunities && subscribedCommunities.length > 0)
                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!(subscribedCommunities && subscribedCommunities.length > 0)}
              title={!(subscribedCommunities && subscribedCommunities.length > 0) ? "Join a community first to start posting" : "Start a post"}
            >
              {(subscribedCommunities && subscribedCommunities.length > 0) ? "Start a post..." : "Join a community to post..."}
            </button>
          </div>
        </div>
      )}

      {/* Sort Dropdown UI + Search Button */}
      {!loadingStates.userData && (
        <div className="flex items-center justify-end p-0 m-0">
          <div className="flex items-center w-full">
            <hr className="flex-1 border-gray-400" />
            <div className="ml-4 flex items-center">
              {/* Real-time indicator */}
              {(loadingStates.userData || loadingStates.communities || loadingStates.sessions || loadingStates.activities) && (
                <div className="flex items-center mr-3 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  <RefreshIcon className="animate-spin mr-1" style={{ fontSize: '14px' }} />
                  <span className="font-medium">Updating data...</span>
                </div>
              )}
              
              {/* Manual refresh button */}
              <Tooltip title="Refresh feed data" arrow>
                <IconButton
                  onClick={onRefresh}
                  disabled={isAutoRefreshing || loadingStates.userData}
                  size="small"
                  className="mr-2 text-gray-500 hover:text-orange-500 transition-colors"
                >
                  <RefreshIcon style={{ fontSize: '18px' }} />
                </IconButton>
              </Tooltip>
              <span className="text-gray-500 text-sm mr-1">Sort by:</span>
              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center text-gray-900 font-semibold text-sm focus:outline-none"
                  disabled={loading}
                >
                  {sortOption} <ArrowDropDownIcon className="ml-1" />
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
                    {['Recent', 'Most Liked', 'Top'].map(option => (
                      <button
                        key={option}
                        onClick={() => { setSortOption(option); setShowSortDropdown(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortOption === option ? 'font-bold text-orange-500' : ''}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Search Icon Button */}
              <button
                onClick={() => setShowSearchBar(true)}
                className="ml-2 rounded-full hover:bg-gray-100 focus:outline-none"
                aria-label="Open search"
                disabled={loading}
              >
                <SearchIcon className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Posts */}
      {showNewPostsBanner && (
        <div className="w-full bg-orange-100 text-orange-700 text-center py-2 cursor-pointer font-medium hover:bg-orange-200 transition-colors" onClick={handleShowNewPosts}>
          🔄 New posts and updates available – Click to refresh
        </div>
      )}
      {loadingStates.feedPosts ? (
        <div className="space-y-4">
          {/* Progressive post skeletons with staggered animation */}
          {[1, 2, 3, 4].map((i) => (
            <ProgressivePostSkeleton key={i} delay={i * 150} />
          ))}
        </div>
      ) : (
        <>
          {/* Show upcoming sessions before the first post if any */}
          {upcomingSessions && upcomingSessions.length > 0 && <div className="mb-6">
            <SessionCardList Sessions={upcomingSessions} recommended={false} />
          </div>}
          
          {/* Posts */}
          {filteredPosts.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {filteredPosts.map((post, idx) => {
              const isCreator = user && (post.creator?.id === user?.unifiedUser?.id);
              const userPhoto = post.creator?.user?.photoURL || post.creator?.partner?.photoURL || post.creator?.expert?.photoURL || post.creator?.admin?.photoURL || getUserPhotoURL(post.creator) || "/t6.svg";
              const userName = post.creator?.user?.name || post.creator?.partner?.name || post.creator?.expert?.name || post.creator?.admin?.name || "User";
              const userSubtitle = post.creator?.user?.subtitle || post.creator?.partner?.subtitle || post.creator?.expert?.subtitle || post.creator?.admin?.subtitle || post.community?.title || "";
              const isAdmin = !!post.creator?.adminId;
              const communityImg = post.community?.bannerImg || null;
              const isDefaultPost = typeof post.id === 'string' && post.id.startsWith('default-');
              
              return (
                <React.Fragment key={post.id}>
                  <div
                    ref={el => postRefs.current[post.id] = el}
                    className={`bg-white md:rounded-lg md:shadow p-0 mb-2 relative border border-gray-100 hover:shadow-lg transition-shadow ${isDefaultPost ? 'border-orange-200 bg-orange-50/30' : ''}`}
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${idx * 100}ms both`
                    }}
                  >
                    {/* Author 3-dot menu */}
                    {isCreator && !isDefaultPost && (
                      <div className="absolute top-2 right-2 z-20">
                        <button
                          className="p-1 rounded-full hover:bg-gray-100 focus:outline-none post-menu-trigger"
                          onClick={e => {
                            e.stopPropagation();
                            setMenuOpen(post.id);
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </button>
                        {menuOpen === post.id && (
                          <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-30 post-menu-dropdown">
                            <button
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              onClick={() => {
                                setEditingPost(post);
                                setShowPostModal(true);
                                setMenuOpen(null);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                              onClick={() => {
                                // Archive logic here
                                setMenuOpen(null);
                                // Optionally call an archive handler
                              }}
                            >
                              Archive
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Default Post Indicator */}
                    {isDefaultPost && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Platform Post
                        </span>
                      </div>
                    )}
                    
                    {/* Header Row */}
                    <div className="flex items-start gap-3 px-4 pt-4 pb-2">
                      {/* Community and User Images */}
                      {communityImg ? (
                        <div
                          className={`relative flex-shrink-0${isDefaultPost ? ' opacity-60 pointer-events-none' : ' cursor-pointer'}`}
                          {...(!isDefaultPost && { onClick: () => {
                            window.location.href = `/comHome/${post.community?.id}`;
                          }})}
                          style={isDefaultPost ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                        >
                          <img src={communityImg} alt={post.community?.title} className="w-12 h-12 rounded bg-white border-[2px] border-gray-200 object-contain" style={{ objectFit: 'contain' }} />
                                                     <img 
                             src={userPhoto} 
                             alt={userName} 
                             className="w-8  h-8 rounded-full object-contain border-[2px] border-gray-200 bg-white absolute -bottom-2 left-6 shadow" 
                             style={{ objectFit: 'contain' }}
                             onError={(e) => {
                               e.target.src = "/t6.svg";
                             }}
                           />
                        </div>
                      ) : (
                                                 <img 
                           src={userPhoto} 
                           alt={userName} 
                           className="w-5 h-5 rounded-full object-contain border border-gray-300" 
                           style={{ width: 20, height: 20, objectFit: 'contain' }}
                           onError={(e) => {
                             e.target.src = "/t6.svg";
                           }}
                         />
                      )}
                      
                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-semibold text-[16px] leading-tight text-gray-900">{userName}</span>
                        </div>
                        {post.community?.title ? (
                          <span
                            className={`text-[15px] text-gray-700 truncate max-w-xs md:max-w-md font-normal${isDefaultPost ? ' opacity-60 pointer-events-none' : ' cursor-pointer hover:underline'}`}
                            {...(!isDefaultPost && { onClick: () => {
                              window.location.href = `/comHome/${post.community?.id}`;
                            }})}
                            style={isDefaultPost ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                            tabIndex={isDefaultPost ? -1 : 0}
                          >
                            {post.community.title}
                          </span>
                        ) : (
                          <div className="text-[15px] text-gray-700 truncate max-w-xs md:max-w-md font-normal">{userSubtitle}</div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                          {isAdmin && <><StarIcon fontSize="inherit" className="text-blue-600" /><span className="font-semibold text-blue-600">Admin</span><span>•</span></>}
                          <span>{moment(post.createdAt).fromNow()}</span>
                          {post.updatedAt && post.updatedAt !== post.createdAt && <><span>•</span><span>Edited</span></>}
                          <span>•</span>
                          <GroupsIcon fontSize="inherit" />
                          {/* Inline Post Type Label */}
                          <span className="ml-2 text-xs text-gray-700 font-normal">
                            {post.isPoll ? 'Poll' : post.isAsk ? 'Ask' : 'Post'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Divider */}
                    <div className="border-b-[1px] border-gray-300 mx-4" />
                    
                    {/* Post Content */}
                    <div className="px-4 py-4">
                      {/* Show post title if present */}
                      {post.title && (
                        <div className="text-lg font-semibold text-gray-900 mb-1"
                          dangerouslySetInnerHTML={{ __html: highlightText(post.title, searchQuery) }}
                        />
                      )}
                      <div className="mb-2">
                        <div
                          className={`text-[15px] text-gray-900 leading-[1.6] whitespace-pre-line ${
                            !expandedPosts.has(post.id) && post.content.length > 150 ? 'overflow-hidden' : ''
                          }`}
                          style={{
                            display: !expandedPosts.has(post.id) && post.content.length > 150 ? '-webkit-box' : 'block',
                            WebkitLineClamp: !expandedPosts.has(post.id) && post.content.length > 150 ? 2 : 'unset',
                            WebkitBoxOrient: !expandedPosts.has(post.id) && post.content.length > 150 ? 'vertical' : 'unset',
                          }}
                          dangerouslySetInnerHTML={{ __html: highlightText(post.content, searchQuery) }}
                        />
                        {post.content.length > 150 && (
                          <button
                            onClick={() => togglePostExpansion(post.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
                          >
                            {expandedPosts.has(post.id) ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>

                      {/* Post Assets */}
                      {post.assets && post.assets.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {post.assets.length === 1 ? (
                            // Single asset - show directly
                            (() => {
                              const asset = post.assets[0];
                            // Handle Images
                            if (asset.type.startsWith('image/')) {
                            return (
                                <div key={asset.id || 0} className="relative rounded-lg overflow-hidden bg-gray-50 cursor-pointer" onClick={() => handleOpenAssetModal(post.assets, 0, post)}>
                                        <img
                                          src={asset.url}
                                      alt={`Post image`}
                                    className="w-full h-auto min-h-[200px] max-h-[500px] object-cover rounded-lg"
                                        />
                                      </div>
                              );
                            }

                            // Handle Videos
                                      if (asset.type.startsWith('video/')) {
                                        return (
                                <div key={asset.id || 0} className="relative rounded-lg overflow-hidden bg-gray-50 cursor-pointer" onClick={() => handleOpenAssetModal(post.assets, 0, post)}>
                                            <video
                                              className="w-full h-auto min-h-[200px] max-h-[500px] object-cover rounded-lg"
                                    preload="metadata"
                                              loop
                                              muted
                                              controls
                                              onPlay={(e) => {
                                                const container = e.target.closest('.group');
                                                const playIcon = container.querySelector('.play-icon');
                                                const pauseIcon = container.querySelector('.pause-icon');
                                                playIcon.style.display = 'none';
                                                pauseIcon.style.display = 'block';
                                              }}
                                              onPause={(e) => {
                                                const container = e.target.closest('.group');
                                                const playIcon = container.querySelector('.play-icon');
                                                const pauseIcon = container.querySelector('.pause-icon');
                                                playIcon.style.display = 'block';
                                                pauseIcon.style.display = 'none';
                                              }}
                                            >
                                              <source src={asset.url} type={asset.type} />
                                              Your browser does not support the video tag.
                                            </video>
                                            {/* Instagram-style video controls */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const video = e.target.closest('.group').querySelector('video');
                                                  if (video.paused) {
                                                    video.play();
                                                  } else {
                                                    video.pause();
                                                  }
                                                }}
                                                className="bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-all"
                                              >
                                                {/* Play Icon */}
                                                <svg className="w-6 h-6 play-icon" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M8 5v14l11-7z"/>
                                                </svg>
                                                {/* Pause Icon */}
                                                <svg className="w-6 h-6 pause-icon hidden" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                                </svg>
                                              </button>
                                            </div>
                                            {/* Mute/Unmute button */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const video = e.target.closest('.group').querySelector('video');
                                                const muteIcon = e.target.closest('.group').querySelector('.mute-icon');
                                                const unmuteIcon = e.target.closest('.group').querySelector('.unmute-icon');
                                                video.muted = !video.muted;
                                                if (video.muted) {
                                                  muteIcon.style.display = 'block';
                                                  unmuteIcon.style.display = 'none';
                                                } else {
                                                  muteIcon.style.display = 'none';
                                                  unmuteIcon.style.display = 'block';
                                                }
                                              }}
                                              className="absolute top-3 right-3 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                              {/* Mute Icon */}
                                              <svg className="w-4 h-4 mute-icon" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                                              </svg>
                                              {/* Unmute Icon */}
                                              <svg className="w-4 h-4 unmute-icon hidden" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                              </svg>
                                            </button>
                                          </div>
                                        );
                            }
                            
                            // Handle PDFs
                            if (asset.type === 'application/pdf') {
                                        return (
                                <div key={asset.id || 0} className="border border-gray-200 rounded-lg p-4 bg-gray-50 cursor-pointer" onClick={() => handleOpenAssetModal(post.assets, 0, post)}>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        PDF Document
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Click to view or download
                                      </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                            <a
                                              href={isDefaultPost ? undefined : asset.url}
                                              target={isDefaultPost ? undefined : "_blank"}
                                              rel={isDefaultPost ? undefined : "noopener noreferrer"}
                                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors${isDefaultPost ? ' opacity-60 pointer-events-none' : ''}`}
                                              style={isDefaultPost ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                                              tabIndex={isDefaultPost ? -1 : 0}
                                            >
                                        {isDefaultPost ? 'View' : 'Open PDF'}
                                            </a>
                                    </div>
                                  </div>
                                          </div>
                                        );
                                      }
                            
                            // Handle other file types
                            return (
                              <div key={asset.id || 0} className="border border-gray-200 rounded-lg p-4 bg-gray-50 cursor-pointer" onClick={() => handleOpenAssetModal(post.assets, 0, post)}>
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {asset.name || 'Document'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {asset.type}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <a
                                      href={isDefaultPost ? undefined : asset.url}
                                      target={isDefaultPost ? undefined : "_blank"}
                                      rel={isDefaultPost ? undefined : "noopener noreferrer"}
                                      className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors${isDefaultPost ? ' opacity-60 pointer-events-none' : ''}`}
                                      style={isDefaultPost ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                                      tabIndex={isDefaultPost ? -1 : 0}
                                    >
                                      {isDefaultPost ? 'View' : 'Download'}
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                            })()
                          ) : (
                            // Multiple assets - show carousel
                            (() => {
                              const currentAssetIndex = carouselIndices[post.id] || 0;
                              const currentAsset = post.assets[currentAssetIndex];
                              
                              const nextAsset = () => {
                                setCarouselIndices(prev => ({
                                  ...prev,
                                  [post.id]: (currentAssetIndex + 1) % post.assets.length
                                }));
                              };
                              
                              const prevAsset = () => {
                                setCarouselIndices(prev => ({
                                  ...prev,
                                  [post.id]: (currentAssetIndex - 1 + post.assets.length) % post.assets.length
                                }));
                              };
                              
                              const type = currentAsset.type || '';
                              return (
                                <div key={`carousel-${post.id}`} className="relative">
                                  {/* Asset Display */}
                                  <div className="relative rounded-lg overflow-hidden bg-gray-50 cursor-pointer" onClick={() => handleOpenAssetModal(post.assets, currentAssetIndex, post)}>
                                    {/* Handle Images */}
                                    {type.startsWith('image/') && (
                                      <img
                                        src={currentAsset.url}
                                        alt={`Post image ${currentAssetIndex + 1} of ${post.assets.length}`}
                                        className="w-full h-auto min-h-[200px] max-h-[500px] object-cover rounded-lg"
                                      />
                                    )}

                                    {/* Handle Videos */}
                                    {type.startsWith('video/') && (
                                      <>
                                        <video
                                          className="w-full h-auto min-h-[200px] max-h-[500px] object-cover rounded-lg"
                                          preload="metadata"
                                          loop
                                          muted
                                          controls
                                          onPlay={(e) => {
                                            const container = e.target.closest('.relative');
                                            const playIcon = container.querySelector('.carousel-play-icon');
                                            const pauseIcon = container.querySelector('.carousel-pause-icon');
                                            if (playIcon && pauseIcon) {
                                              playIcon.style.display = 'none';
                                              pauseIcon.style.display = 'block';
                                            }
                                          }}
                                          onPause={(e) => {
                                            const container = e.target.closest('.relative');
                                            const playIcon = container.querySelector('.carousel-play-icon');
                                            const pauseIcon = container.querySelector('.carousel-pause-icon');
                                            if (playIcon && pauseIcon) {
                                              playIcon.style.display = 'block';
                                              pauseIcon.style.display = 'none';
                                            }
                                          }}
                                        >
                                          <source src={currentAsset.url} type={type} />
                                          Your browser does not support the video tag.
                                        </video>
                                        {/* Instagram-style video controls */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const video = e.target.closest('.relative').querySelector('video');
                                              if (video.paused) {
                                                video.play();
                                              } else {
                                                video.pause();
                                              }
                                            }}
                                            className="bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-all"
                                          >
                                            {/* Play Icon */}
                                            <svg className="w-6 h-6 carousel-play-icon" fill="currentColor" viewBox="0 0 24 24">
                                              <path d="M8 5v14l11-7z"/>
                                            </svg>
                                            {/* Pause Icon */}
                                            <svg className="w-6 h-6 carousel-pause-icon hidden" fill="currentColor" viewBox="0 0 24 24">
                                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                            </svg>
                                          </button>
                                        </div>
                                        {/* Mute/Unmute button */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const video = e.target.closest('.relative').querySelector('video');
                                            const muteIcon = e.target.closest('.relative').querySelector('.carousel-mute-icon');
                                            const unmuteIcon = e.target.closest('.relative').querySelector('.carousel-unmute-icon');
                                            video.muted = !video.muted;
                                            if (video.muted) {
                                              muteIcon.style.display = 'block';
                                              unmuteIcon.style.display = 'none';
                                            } else {
                                              muteIcon.style.display = 'none';
                                              unmuteIcon.style.display = 'block';
                                            }
                                          }}
                                          className="absolute top-3 right-3 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                          {/* Mute Icon */}
                                          <svg className="w-4 h-4 carousel-mute-icon" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                                          </svg>
                                          {/* Unmute Icon */}
                                          <svg className="w-4 h-4 carousel-unmute-icon hidden" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                          </svg>
                                        </button>
                                      </>
                                    )}
                                    
                                    {/* Handle PDFs */}
                                    {type === 'application/pdf' && (
                                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 cursor-pointer" onClick={() => handleOpenAssetModal(post.assets, currentAssetIndex, post)}>
                                        <div className="flex items-center gap-3">
                                          <div className="flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                              PDF Document
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              Click to view or download
                                            </p>
                                          </div>
                                          <div className="flex-shrink-0">
                                            <a
                                              href={isDefaultPost ? undefined : currentAsset.url}
                                              target={isDefaultPost ? undefined : "_blank"}
                                              rel={isDefaultPost ? undefined : "noopener noreferrer"}
                                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors${isDefaultPost ? ' opacity-60 pointer-events-none' : ''}`}
                                              style={isDefaultPost ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                                              tabIndex={isDefaultPost ? -1 : 0}
                                            >
                                              {isDefaultPost ? 'View' : 'Open PDF'}
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Handle other file types */}
                                    {!type.startsWith('image/') && !type.startsWith('video/') && type !== 'application/pdf' && (
                                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 cursor-pointer" onClick={() => handleOpenAssetModal(post.assets, currentAssetIndex, post)}>
                                        <div className="flex items-center gap-3">
                                          <div className="flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                              {currentAsset.name || 'Document'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {currentAsset.type}
                                            </p>
                                          </div>
                                          <div className="flex-shrink-0">
                                            <a
                                              href={isDefaultPost ? undefined : currentAsset.url}
                                              target={isDefaultPost ? undefined : "_blank"}
                                              rel={isDefaultPost ? undefined : "noopener noreferrer"}
                                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors${isDefaultPost ? ' opacity-60 pointer-events-none' : ''}`}
                                              style={isDefaultPost ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                                              tabIndex={isDefaultPost ? -1 : 0}
                                            >
                                              {isDefaultPost ? 'View' : 'Download'}
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Navigation Arrows */}
                                  <button
                                    onClick={prevAsset}
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all z-10"
                                    aria-label="Previous asset"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                  </button>
                                  
                                  <button
                                    onClick={nextAsset}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all z-10"
                                    aria-label="Next asset"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                  
                                  {/* Asset Counter */}
                                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full z-10">
                                    {currentAssetIndex + 1} / {post.assets.length}
                                  </div>
                                  
                                  {/* Asset Indicators */}
                                  <div className="flex justify-center mt-2 space-x-1">
                                    {post.assets.map((_, index) => (
                                      <button
                                        key={index}
                                        onClick={() => setCarouselIndices(prev => ({
                                          ...prev,
                                          [post.id]: index
                                        }))}
                                        className={`w-2 h-2 rounded-full transition-all ${
                                          index === currentAssetIndex 
                                            ? 'bg-orange-500' 
                                            : 'bg-gray-300 hover:bg-gray-400'
                                        }`}
                                        aria-label={`Go to asset ${index + 1}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              );
                            })()
                          )}
                        </div>
                      )}

                      {/* Poll Options */}
                      {post.isPoll && post.PollOptions && post.PollOptions.length > 0 && (() => {
                        const votesArr = Array.isArray(post.votes) ? post.votes : [];
                        const totalVotes = votesArr.reduce((sum, v) => sum + (v.votes || 0), 0);
                        const hasVoted = post.UserPollOptionSelect?.some(sel => sel.unifiedUserId === user?.unifiedUser?.id);
                        const isPollExpired = post.pollExpiresAt && moment().isAfter(moment(post.pollExpiresAt));
                        const shouldShowResults = hasVoted || isPollExpired;
                        return (
                          <div className="mt-2 mb-2">
                            {/* Poll Countdown Timer */}
                            {post.pollExpiresAt && (
                              <div className="mb-3 flex justify-center">
                                <PollCountdownTimer expiresAt={post.pollExpiresAt} />
                              </div>
                            )}
                            
                            {post.PollOptions.map(option => {
                              const voteObj = votesArr.find(v => v.optionId === option.id);
                              const voteCount = voteObj ? voteObj.votes : 0;
                              const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                              const userVoted = post.UserPollOptionSelect?.some(sel => sel.unifiedUserId === user?.unifiedUser?.id && sel.pollOptionsId === option.id);
                              return (
                                <div key={option.id} className="mb-2">
                                  <button
                                    className={`block w-full text-left px-4 py-2 rounded transition-all relative font-medium flex justify-between items-center
                                      ${userVoted ? 'border-2 border-orange-400  text-orange-700' : 'border border-gray-300  text-gray-800'}
                                      ${shouldShowResults && !userVoted ? 'opacity-70' : 'hover:bg-orange-50'} `}
                                    onClick={() => !shouldShowResults && handlePollVote(post.id, option.id)}
                                    disabled={shouldShowResults}
                                    style={{ position: 'relative', overflow: 'hidden' }}
                                  >
                                    <span>{option.option}</span>
                                    {shouldShowResults && (
                                      <span className="ml-2 text-xs text-orange-700">{percent}% ({voteCount} vote{voteCount !== 1 ? 's' : ''})</span>
                                    )}
                                    {shouldShowResults && (
                                      <div className="absolute left-0 bottom-0 w-full h-2 bg-orange-100 rounded-b">
                                        <div
                                          className="bg-orange-400 h-2 rounded-b"
                                          style={{ width: `${percent}%` }}
                                        />
                                      </div>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                            {shouldShowResults && (
                              <div className="text-xs text-gray-500 mt-1">Total votes: {totalVotes}</div>
                            )}
                            {isPollExpired && !hasVoted && (
                              <div className="text-xs text-red-600 mt-2 text-center italic">
                                This poll has expired. You can no longer vote.
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Reactions Row */}
                      <div className="flex items-center justify-between px-0 py-2 border-b-[1px] border-t-[1px] border-gray-300">
                        <button
                          className={`flex items-center gap-2 font-medium px-2 py-1 rounded transition ${isDefaultPost ? 'text-gray-400 cursor-not-allowed' : likes?.[post.id] || like_map?.[post.id] === 1 ? 'text-blue-600' : 'text-gray-600'} ${!isDefaultPost ? 'hover:text-blue-700' : ''}`}
                          onClick={() => !isDefaultPost && handleLike?.(post.id)}
                          disabled={isDefaultPost}
                          title={isDefaultPost ? 'Platform posts cannot be liked' : 'Like this post'}
                        >
                          <ThumbUpOffAltIcon fontSize="small" className={likes?.[post.id] || like_map?.[post.id] === 1 ? 'text-blue-600' : ''} />
                          Like
                        </button>
                        <button
                          className={`flex items-center gap-2 font-medium px-2 py-1 rounded transition ${isDefaultPost ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-blue-700'}`}
                          onClick={() => !isDefaultPost && setOpenComments?.(openComments === post.id ? null : post.id)}
                          disabled={isDefaultPost}
                          title={isDefaultPost ? 'Platform posts cannot be commented on' : 'Comment on this post'}
                        >
                          <ChatBubbleOutlineIcon fontSize="small" /> Comment
                        </button>
                        <Tooltip 
                          title="Coming Soon" 
                          placement="top"
                          arrow
                          PopperProps={{
                            sx: {
                              '& .MuiTooltip-tooltip': {
                                backgroundColor: '#374151',
                                color: 'white',
                                fontSize: '12px',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                zIndex: 9999
                              },
                              '& .MuiTooltip-arrow': {
                                color: '#374151'
                              }
                            }
                          }}
                        >
                          <button
                            className={`flex items-center gap-2 text-gray-600 font-medium px-2 py-1 rounded transition${isDefaultPost ? ' opacity-60 cursor-not-allowed' : ' hover:text-blue-700'}`}
                            disabled={isDefaultPost}
                            tabIndex={isDefaultPost ? -1 : 0}
                            style={isDefaultPost ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                            onClick={() => !isDefaultPost && handleShare(post)}
                          >
                            <SendIcon fontSize="small" /> Send
                          </button>
                        </Tooltip>
                      </div>

                      {/* Comments Section */}
                      {openComments === post.id && (
                        <>
                          <div className="flex items-center gap-2 px-0 py-2 border-b border-gray-100">
                            <input
                              className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              placeholder="Add a comment..."
                              value={commentText?.[post.id] || ''}
                              onChange={(e) => setCommentText?.(prev => ({ ...prev, [post.id]: e.target.value }))}
                            />
                            <button
                              className="text-gray-500 hover:text-blue-600"
                              onClick={() => handleComment?.(post.id)}
                            >
                              <SendIcon fontSize="small" />
                            </button>
                          </div>
                          {/* Comments List */}
                          <div className="px-0 py-2">
                            {post.childrenPosts && post.childrenPosts.length === 0 ? (
                              <div className="text-gray-400 text-sm">No comments yet.</div>
                            ) : post.childrenPosts && post.childrenPosts.map(child => {
                              const isCreator = child.creatorId === user?.unifiedUser?.id;
                              const childUser = child.creator?.user || child.creator?.partner || child.creator?.expert || child.creator?.admin;
                              return (
                                <div key={child.id} className="flex gap-2 mb-4 items-start pl-4 border-l-[2px] border-gray-200 relative">
                                                                     <img 
                                     src={getUserPhotoURL(childUser)} 
                                     className="w-8 h-8 rounded-full object-cover"
                                     onError={(e) => {
                                       e.target.src = "/t6.svg";
                                     }}
                                   />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-1">
                                      <span className="font-semibold">{childUser?.name || 'User'}</span>
                                      {isCreator && <span className="bg-gray-200 text-xs px-2 py-0.5 rounded font-semibold">Author</span>}
                                      <span className="text-xs text-gray-500">{moment(child.createdAt).fromNow()}</span>
                                    </div>
                                    <div className="text-sm text-gray-800">
                                      {child.content}
                                      {child.updatedAt !== child.createdAt && (
                                        <span className="ml-2 text-xs text-gray-400">(Edited)</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                      
                      {/* Post Stats */}
                      <div className="mt-4 flex items-center justify-between text-gray-500 text-sm">
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                          <span className="flex items-center gap-1 text-xs sm:text-sm">
                            <GroupsIcon fontSize="small" className="text-gray-400" /> 
                            <span className="hidden sm:inline">Group</span>
                          </span>
                          <span 
                            className="flex items-center gap-1 text-xs sm:text-sm cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => {
                              setSelectedPost(post);
                              setShowCommentModal(true);
                            }}
                            title="Click to view all comments"
                          >
                            <svg width="14" height="14" className="sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M7 10v6M12 7v9M17 13v3" />
                            </svg> 
                            {post._count?.childrenPosts || 0} Comments
                          </span>
                          <span 
                            className={`flex items-center gap-1 text-xs sm:text-sm ${!isDefaultPost && (post.likes?.length || 0) > 0 ? 'cursor-pointer hover:text-blue-600' : ''}`}
                            onClick={() => openLikesModal(post.id, post.likes?.length || 0)}
                            title={!isDefaultPost && (post.likes?.length || 0) > 0 ? 'Click to see who liked this post' : ''}
                          >
                            <svg width="14" height="14" className="sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M6 21v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg> 
                            {isDefaultPost ? 'Platform Post' : (post.likes?.length || 0) + ' Likes'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{moment(post.createdAt).format("MMM D, YYYY h:mm A")}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Insert RecommendedSessionSection at 3, 9, 27, ... (powers of 3, not 1) */}
                  {(() => {
                    const n = idx + 1;
                    if (n > 1 && Number.isInteger(Math.log(n) / Math.log(3))) {
                      return <RecommendedSessionSection />;
                    }
                    return null;
                  })()}
                  
                  {/* Insert RecommendedCommunitySection after every 6 posts */}
                  {(idx + 1) % 6 === 0 && recommendedCommunities && recommendedCommunities.length > 0 && (
                    <RecommendedCommunitySection communities={recommendedCommunities} />
                  )}
                </React.Fragment>
              );
            })}
              
              {/* Show recommended communities and sessions at the end when there are 0-6 posts */}
              {filteredPosts.length <= 6 && (
                <>
                  <RecommendedSessionSection />
                  {recommendedCommunities && recommendedCommunities.length > 0 && (
                    <RecommendedCommunitySection communities={recommendedCommunities} />
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Post Modal */}
      <PostModal
        open={showPostModal}
        onClose={() => { setShowPostModal(false); setEditingPost(null); }}
        user={user}
        userCommunities={subscribedCommunities || []}
        refreshFeed={fetchFeed}
        editingPost={editingPost}
        setEditingPost={setEditingPost}
        onPostCreated={checkForNewPostsAfterCreation}
      />

      {/* Comment Modal */}
      <AssetModal
        show={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        assets={selectedPost?.assets || []}
        initialIndex={0}
        post={selectedPost}
        onComment={handleAssetModalComment}
        user={user}
        openLikesModal={openLikesModal}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareData={shareModalData}
      />

    
    </section>
  );
};

export default FeedContent; 