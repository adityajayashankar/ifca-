import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { selectInitialCommunities, selectUser, selectRecentActivities } from "@/store/features/userSlice";
import moment from "moment";
import GroupsIcon from '@mui/icons-material/Groups';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import PollIcon from '@mui/icons-material/Poll';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import ArticleIcon from '@mui/icons-material/Article';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import EventIcon from '@mui/icons-material/Event';
import Drawer from '@mui/material/Drawer';
import CircularProgress from '@mui/material/CircularProgress';
import { Skeleton, Button, Alert, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import api from "@/utils/apiSetup";
import CommunityTagsSection from "./CommunityTagsSection";

const FeedRightSidebar = ({ 
  loading, 
  loadingStates = {},
  activitiesDrawerOpen, 
  setActivitiesDrawerOpen,
  retryCount = 0,
  onRetry,
  onRefresh,
  isAutoRefreshing,
  hasPosts = true
}) => {
  const router = useRouter();
  const user = useSelector(selectUser);
  const initialCommunities = useSelector(selectInitialCommunities);
  const recentActivities = useSelector(selectRecentActivities);

  // Local state for activities drawer
  const [activitiesDrawerList, setActivitiesDrawerList] = useState([]);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [activitiesPages, setActivitiesPages] = useState(1);
  const [activitiesTotal, setActivitiesTotal] = useState(0);
  const [activitiesLimit] = useState(20);
  const [activitiesDrawerLoading, setActivitiesDrawerLoading] = useState(false);

  // Local state for active huddles
  const [activeHuddles, setActiveHuddles] = useState([]);
  const [huddlesLoading, setHuddlesLoading] = useState(false);

  // Force data display - never show loading if data exists
  const showCommunitiesLoading = false; // Never show communities loading
  const showActivitiesLoading = false; // Never show activities loading

  const showError = retryCount >= 3;

  // Helper function to get activity display info
  const getActivityDisplayInfo = (activity) => {
    let icon = null;
    let text = "";
    let imageUrl = null;
    let link = null;
    let fallbackIcon = null;

    if (activity.type === "community_join") {
      icon = <GroupsIcon fontSize="small" className="text-orange-500" />;
      fallbackIcon = <GroupsIcon fontSize="small" className="text-orange-500" />;
      text = `Joined ${activity.communityTitle}`;
      imageUrl = activity.communityImg;
      link = `/comHome/${activity.communityId}`;
    } else if (activity.type === "session_subscription") {
      icon = <AccessTimeIcon fontSize="small" className="text-orange-500" />;
      fallbackIcon = <AccessTimeIcon fontSize="small" className="text-orange-500" />;
      text = `Subscribed to ${activity.sessionTitle}`;
      imageUrl = activity.sessionImg;
      link = `/classDetails/${activity.sessionId}`;
    } else if (activity.type === "post") {
      // Determine post type and set appropriate icon
      if (activity.isPoll) {
        icon = <PollIcon fontSize="small" className="text-orange-500" />;
        fallbackIcon = <PollIcon fontSize="small" className="text-orange-500" />;
        text = `Created poll: ${activity.title || activity.content?.slice(0, 30)}`;
      } else if (activity.isAsk) {
        icon = <QuestionAnswerIcon fontSize="small" className="text-orange-500" />;
        fallbackIcon = <QuestionAnswerIcon fontSize="small" className="text-orange-500" />;
        text = `Asked: ${activity.title || activity.content?.slice(0, 30)}`;
      } else if (activity.isGreeting) {
        icon = <WavingHandIcon fontSize="small" className="text-orange-500" />;
        fallbackIcon = <WavingHandIcon fontSize="small" className="text-orange-500" />;
        text = `Posted greeting: ${activity.title || activity.content?.slice(0, 30)}`;
      } else {
        icon = <ChatBubbleOutlineIcon fontSize="small" className="text-orange-500" />;
        fallbackIcon = <ChatBubbleOutlineIcon fontSize="small" className="text-orange-500" />;
        text = `Posted: ${activity.title || activity.content?.slice(0, 30)}`;
      }
      imageUrl = activity.postImage;
      // link = `/post/${activity.id}`;
      link = `/comHome/${activity.communityId}?postId=${activity.id}`;
    } else if (activity.type === "huddle_live") {
      icon = <VideoCallIcon fontSize="small" className="text-red-500" />;
      fallbackIcon = <VideoCallIcon fontSize="small" className="text-red-500" />;
      text = `Live huddle: ${activity.title || 'Huddle'}`;
      imageUrl = activity.communityImg;
      link = `/huddle/${activity.id}`;
    } else if (activity.type === "huddle_upcoming") {
      icon = <EventIcon fontSize="small" className="text-orange-500" />;
      fallbackIcon = <EventIcon fontSize="small" className="text-orange-500" />;
      text = `Upcoming huddle: ${activity.title || 'Huddle'}`;
      imageUrl = activity.communityImg;
      link = `/huddle/${activity.id}`;
    }

    return { icon, text, imageUrl, link, fallbackIcon };
  };

  // Handle refresh
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else if (onRetry) {
      onRetry();
    }
  };

  // Scroll lock functionality
  useEffect(() => {
    if (activitiesDrawerOpen) {
      // Only lock background scroll
      document.body.style.overflow = 'hidden';

      // Add keyboard event listener for Escape key
      const handleEscapeKey = (event) => {
        if (event.key === 'Escape') {
          handleCloseActivitiesDrawer();
        }
      };
      document.addEventListener('keydown', handleEscapeKey);

      // Focus management - focus the first focusable element in the drawer
      setTimeout(() => {
        const drawerElement = document.querySelector('[role="presentation"]');
        if (drawerElement) {
          const firstFocusable = drawerElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }
      }, 100);

      // Cleanup function to restore scrolling
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [activitiesDrawerOpen]);

  // Initialize drawer activities from Redux state
  useEffect(() => {
    if (recentActivities && recentActivities.length > 0) {
      setActivitiesDrawerList(recentActivities);
    }
  }, [recentActivities]);

  // Fetch active huddles from joined communities
  useEffect(() => {
    const fetchActiveHuddles = async () => {
      if (!user?.unifiedUser?.id) return;
      
      setHuddlesLoading(true);
      try {
        const res = await api.get(`/huddle/user/${user.unifiedUser.id}/active?limit=3`);
        if (res.data.success) {
          setActiveHuddles(res.data.huddles || []);
        }
      } catch (error) {
        console.error("Error fetching active huddles:", error);
      } finally {
        setHuddlesLoading(false);
      }
    };

    fetchActiveHuddles();
    
    // Refresh active huddles every 30 seconds
    const interval = setInterval(fetchActiveHuddles, 30000);
    
    return () => clearInterval(interval);
  }, [user?.unifiedUser?.id]);

  // Handler for opening the drawer and loading more
  const handleOpenActivitiesDrawer = () => {
    setActivitiesDrawerOpen(true);
    setActivitiesDrawerList(recentActivities || []);
    setActivitiesPage(1);
  };

  // Handler for closing the drawer
  const handleCloseActivitiesDrawer = () => {
    setActivitiesDrawerOpen(false);
  };

  // Infinite scroll handler for Drawer
  const handleDrawerScroll = async (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (
      !activitiesDrawerLoading &&
      activitiesPage < activitiesPages &&
      scrollTop + clientHeight >= scrollHeight - 50
    ) {
      setActivitiesDrawerLoading(true);
      const nextPage = activitiesPage + 1;
      try {
        const res = await api.get(`/user/${user.id}/recent-activities?page=${nextPage}&limit=${activitiesLimit}`);
        setActivitiesDrawerList(prev => [...prev, ...(res.data.activities || [])]);
        setActivitiesPage(nextPage);
      } catch (err) {
        console.error('Error loading more activities:', err);
      }
      setActivitiesDrawerLoading(false);
    }
  };

  // Skeleton components
  const CommunitiesSkeleton = () => (
    <div className="bg-white rounded-lg shadow px-4 pt-[2px] pb-2">
      <Skeleton variant="text" width="40%" height={24} className="py-2" />
      <div className="space-y-1">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center gap-2 p-1">
            <Skeleton variant="rectangular" width={36} height={36} />
            <div className="flex-1">
              <Skeleton variant="text" width="70%" height={16} />
              <Skeleton variant="text" width="50%" height={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ActivitiesSkeleton = () => (
    <div className="bg-white rounded-lg shadow px-4 pt-[2px]">
      <Skeleton variant="text" width="40%" height={24} className="py-2" />
      <div className="space-y-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 p-1">
            <Skeleton variant="rectangular" width={36} height={36} />
            <div className="flex-1">
              <Skeleton variant="text" width="80%" height={16} />
              <Skeleton variant="text" width="60%" height={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Error state component
  const ErrorState = ({ message, onRetry }) => (
    <div className="bg-white rounded-lg shadow p-4">
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
      >
        {message}
      </Alert>
    </div>
  );

  // Custom sidebar and backdrop rendering
  if (activitiesDrawerOpen) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleCloseActivitiesDrawer}
        />
        {/* Sidebar */}
        <aside
          className="fixed top-0 right-0 w-[400px] max-w-full h-full bg-white shadow-lg z-50 overflow-y-auto"
          tabIndex={-1}
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">All Recent Activities</h2>
              <button
                onClick={handleCloseActivitiesDrawer}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div
              className="space-y-2 overflow-y-auto pr-2 flex-1"
              style={{ height: 'calc(100vh - 80px)' }}
            >
              {activitiesDrawerList.length === 0 && (
                <div className="text-center py-8 text-gray-500">No activities found.</div>
              )}
              {activitiesDrawerList.map((activity, idx) => {
                const { icon, text, imageUrl, link, fallbackIcon } = getActivityDisplayInfo(activity);
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      handleCloseActivitiesDrawer();
                      router.push(link);
                    }}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={text}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full flex items-center justify-center ${imageUrl ? 'hidden' : 'flex'}`}
                        style={{ display: imageUrl ? 'none' : 'flex' }}
                      >
                        {fallbackIcon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate m-0 p-0">
                        {text}
                      </h4>
                      <p className="text-xs text-gray-500 truncate m-0 p-0">
                        {moment(activity.createdAt).fromNow()}
                      </p>
                    </div>
                  </div>
                );
              })}
              {activitiesDrawerLoading && (
                <div className="flex flex-col items-center py-4">
                  <CircularProgress size={24} color="primary" />
                  <span className="mt-2 text-gray-500 text-sm">Loading more activities...</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </>
    );
  }

  return (
    <aside className="hidden lg:block col-span-1 pb-2">
      <div className="space-y-4 fixed top-[88px] w-[calc(25%-1.5rem)] max-w-[300px] pr-4 pb-2">
        {/* Initial Communities */}
        {initialCommunities && initialCommunities.length > 0 && (showError ? (
          <ErrorState 
            message="Failed to load communities. Please try again." 
            onRetry={onRetry}
          />
        ) : showCommunitiesLoading ? (
          <CommunitiesSkeleton />
        ) : (
          <CommunityTagsSection 
            loading={loading}
            retryCount={retryCount}
            onRetry={onRetry}
            onRefresh={onRefresh}
            isAutoRefreshing={isAutoRefreshing}
          />
        ))}

        {/* Recent Activity */}
        {(recentActivities && recentActivities.length > 0) ? (
          showError ? (
            <ErrorState 
              message="Failed to load activities. Please try again." 
              onRetry={onRetry}
            />
          ) : showActivitiesLoading ? (
            <ActivitiesSkeleton />
          ) : (
            <div className="bg-white rounded-lg shadow px-4 pt-[2px]">
              <div className="flex items-center justify-between py-2">
                <h3 className="font-semibold text-base p-0 m-0">Recent Activity</h3>
                <div className="flex items-center"></div>
              </div>
              <div className="space-y-1">
                {recentActivities.slice(0, 3).map((activity, idx) => {
                  const { icon, text, imageUrl, link, fallbackIcon } = getActivityDisplayInfo(activity);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        router.push(link);
                      }}
                      className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={text}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-full h-full flex items-center justify-center ${imageUrl ? 'hidden' : 'flex'}`}
                          style={{ display: imageUrl ? 'none' : 'flex' }}
                        >
                          {fallbackIcon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate m-0 p-0">
                          {text}
                        </h4>
                        <p className="text-xs text-gray-500 truncate m-0 p-0">
                          {moment(activity.createdAt).fromNow()}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {recentActivities.length > 3 && (
                  <button
                    onClick={handleOpenActivitiesDrawer}
                    className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                  >
                    View more
                  </button>
                )}
              </div>
            </div>
          )
        ) : null}

        {/* Active Huddles from Joined Communities */}
        {activeHuddles && activeHuddles.length > 0 && (
          <div className="bg-white rounded-lg shadow px-4 pt-[2px]">
            <div className="flex items-center justify-between py-2">
              <h3 className="font-semibold text-base p-0 m-0 flex items-center gap-2">
                <div className="relative">
                  <VideoCallIcon className="text-red-500" fontSize="medium" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                </div>
                Active Huddles
              </h3>
            </div>
            <div className="space-y-2 pb-2">
              {activeHuddles.map((huddle, idx) => (
                <div
                  key={idx}
                  onClick={() => router.push(`/ritual/${huddle.id}`)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-red-100 bg-red-50/30"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center relative">
                    {huddle.community?.bannerImg ? (
                      <img
                        src={huddle.community.bannerImg}
                        alt={huddle.community.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full flex items-center justify-center ${huddle.community?.bannerImg ? 'hidden' : 'flex'}`}
                      style={{ display: huddle.community?.bannerImg ? 'none' : 'flex' }}
                    >
                      <VideoCallIcon className="text-red-500" />
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate m-0 p-0 flex items-center gap-1">
                      {huddle.title}
                      <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium">LIVE</span>
                    </h4>
                    <p className="text-xs text-gray-600 truncate m-0 p-0">
                      {huddle.community?.title}
                    </p>
                    <p className="text-xs text-gray-500 m-0 p-0 flex items-center gap-1">
                      <GroupsIcon fontSize="inherit" />
                      {huddle.attendeeCount || 0} attending
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default FeedRightSidebar; 