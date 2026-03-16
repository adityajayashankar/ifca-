import React from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectSubscribedCommunities,
  selectSubscribedSessions,
  selectProfileProgress
} from "@/store/features/userSlice";
import moment from "moment";
import { Skeleton, Button, Alert, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { getUserPhotoURL } from "@/utils/userUtils";

const FeedLeftSidebar = ({ loading, loadingStates = {}, retryCount = 0, onRetry, onRefresh, isAutoRefreshing }) => {
  const router = useRouter();
  const user = useSelector(selectUser);
  const subscribedCommunities = useSelector(selectSubscribedCommunities);
  const subscribedSessions = useSelector(selectSubscribedSessions);
  const profileProgress = useSelector(selectProfileProgress);

  // Show loading if we don't have user data yet or if explicitly loading
  const showLoading = loading && !user;
  const showError = retryCount >= 3;

  // Force data display - never show loading if data exists
  const showProfileLoading = false; // Never show profile loading
  const showCommunitiesLoading = false; // Never show communities loading
  const showSessionsLoading = false; // Never show sessions loading

  // Function to get cooking-related banner image based on user name
  const getBannerImage = (userName) => {
    if (!userName || userName.trim() === '') {
      return "/advFirst.svg"; // Default banner
    }
    
    const name = userName.toLowerCase();
    const firstLetter = name.charAt(0);
    
    // Cooking-related images based on first letter - using high-quality food images
    const cookingImages = {
      'a': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=80&fit=crop&crop=center', // Apple
      'b': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=80&fit=crop&crop=center', // Bread
      'c': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=80&fit=crop&crop=center', // Cake
      'd': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=80&fit=crop&crop=center', // Donuts
      'e': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=80&fit=crop&crop=center', // Eggs
      'f': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=80&fit=crop&crop=center', // Fruits
      'g': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&h=80&fit=crop&crop=center', // Grapes
      'h': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=80&fit=crop&crop=center', // Honey
      'i': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=80&fit=crop&crop=center', // Ice cream
      'j': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center', // Jam
      'k': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center', // Kitchen
      'l': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center', // Lemon
      'm': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center', // Meat
      'n': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center', // Nuts
      'o': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center', // Orange
      'p': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=80&fit=crop&crop=center', // Pizza
      'q': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center', // Quiche
      'r': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center', // Rice
      's': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center', // Spaghetti
      't': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center', // Tomatoes
      'u': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center', // Utensils
      'v': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center', // Vegetables
      'w': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center', // Watermelon
      'x': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center', // Xmas cookies
      'y': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center', // Yogurt
      'z': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=80&fit=crop&crop=center'  // Zucchini
    };
    
    return cookingImages[firstLetter] || "/advFirst.svg";
  };

  // Handle refresh
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else if (onRetry) {
      onRetry();
    }
  };

  // Skeleton components
  const ProfileSkeleton = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="relative">
        <Skeleton variant="rectangular" height={80} />
        <div className="absolute -bottom-8 left-4">
          <Skeleton variant="circular" width={80} height={80} />
        </div>
      </div>
      <div className="pt-10 px-3 pb-3">
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" width="80%" height={16} />
        <div className="mt-3">
          <Skeleton variant="text" width="40%" height={16} />
          <Skeleton variant="rectangular" height={6} className="mt-1" />
        </div>
        <div className="mt-4 border-t pt-4">
          <Skeleton variant="text" width="50%" height={16} />
          <Skeleton variant="text" width="40%" height={16} className="mt-2" />
        </div>
      </div>
    </div>
  );

  const CommunitiesSkeleton = () => (
    <div className="bg-white rounded-lg shadow px-4 pt-[2px]">
      <Skeleton variant="text" width="40%" height={24} className="py-2" />
      <div className="space-y-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2 p-1.5">
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

  const SessionsSkeleton = () => (
    <div className="bg-white rounded-lg shadow px-4 pt-[2px]">
      <Skeleton variant="text" width="40%" height={24} className="py-2" />
      <div className="space-y-1">
        {[1, 2, 3, 4].map((i) => (
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

  return (
    <aside className="hidden lg:block col-span-1 space-y-4">
      {/* Profile Section */}
      {showError ? (
        <ErrorState 
          message="Failed to load profile data. Please try again." 
          onRetry={onRetry}
        />
      ) : showProfileLoading ? (
        <ProfileSkeleton />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="relative">
            <div className="h-20 w-full relative overflow-hidden">
              <Image
                src={getBannerImage(user?.name)}
                alt="Profile Banner"
                width={400}
                height={80}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.target.src = "/advFirst.svg";
                }}
              />
            </div>
            <div className="absolute -bottom-8 left-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
                  <Image
                    src={getUserPhotoURL(user)}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="object-cover"
                    onError={(e) => {
                      e.target.src = "/t6.svg";
                    }}
                  />
                </div>
                {/* Profile Progress Badge */}
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-lg">
                  <div className="relative w-8 h-8">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray="175.93"
                        strokeDashoffset={
                          175.93 - (175.93 * (profileProgress || 0)) / 100
                        }
                        className="text-orange-500 smooth-transition"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-semibold text-gray-700">
                      {profileProgress ?? 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-10 px-3 pb-3">
            <div className=" py-3 text-left">
              <button 
                onClick={() => {
                  window.location.href = `/user/${user?.unifiedUser?.id}`;
                }}
                className="hover:underline"
              >
                <h2 className="text-base font-semibold text-gray-900 p-0 m-0 ">{user?.name}</h2>
              </button>
              <p className="text-gray-600 text-sm p-0 m-0">{user?.email}</p>
            </div>

            {/* Profile Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-700">Profile Progress</span>
                <span className="text-xs font-semibold text-gray-700">{profileProgress ?? 0}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${profileProgress ?? 0}%` }}
                />
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Your Communities</span>
                <span className="text-orange-500 font-semibold">{subscribedCommunities ? subscribedCommunities.length : 0}</span>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-gray-600">Your Sessions</span>
                <span className="text-orange-500 font-semibold">{subscribedSessions ? subscribedSessions.length : 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Explore Communities link if no communities joined */}
      {(!showProfileLoading && !showError && (!subscribedCommunities || subscribedCommunities.length === 0)) && (
        <div className="bg-white rounded-lg shadow px-4 py-4 mt-4 flex flex-col items-center">
          <button
            onClick={() => {
              window.location.href = '/communities';
            }}
            className="w-full px-4 py-3 bg-orange-500 text-white text-base rounded-full hover:bg-orange-600 transition-colors font-semibold"
          >
            Explore Communities
          </button>
        </div>
      )}

      {/* Your Communities */}
      {subscribedCommunities && subscribedCommunities.length > 0 && (
        showError ? (
        <ErrorState 
          message="Failed to load communities. Please try again." 
          onRetry={onRetry}
        />
      ) : showCommunitiesLoading ? (
        <CommunitiesSkeleton />
      ) : (
        <div className="bg-white rounded-lg shadow px-4 pt-[2px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-base p-0 m-0">Your Communities</h3>
          </div>
          <div className="space-y-1">
                {subscribedCommunities.slice(0, 4).map((com) => (
                  <div 
                    key={com.id} 
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                    onClick={() => {
                      window.location.href = `/comHome/${com.id}`;
                    }}
                  >
                    <Image 
                      src={com.bannerImg || "/College_alumnis.png"} 
                      alt={com.title} 
                      width={36} 
                      height={36} 
                      className="rounded object-contain border-[2px] border-lime-700" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{com.title}</div>
                      <div className="text-xs text-gray-500 truncate">{com.desc || "Community"}</div>
                    </div>
                  </div>
                ))}
                {subscribedCommunities.length > 4 && (
                  <button 
                    onClick={() => {
                      window.location.href = '/communities/myCommunities';
                    }}
                    className="w-full text-center py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    View all {subscribedCommunities.length} communities
                  </button>
                )}
              </div>
          </div>
        )
      )}

      {/* Your Sessions */}
      {showError ? (
        <ErrorState 
          message="Failed to load sessions. Please try again." 
          onRetry={onRetry}
        />
      ) : showSessionsLoading ? (
        <SessionsSkeleton />
      ) : (subscribedSessions && subscribedSessions.length > 0) && (
        <div className="bg-white rounded-lg shadow px-4 pt-[2px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-base p-0 m-0">Your Sessions</h3>
          </div>
          <div className="space-y-1">
            {subscribedSessions.slice(0, 4).map((session) => {
              const sessionSlot = session?.SessionSlot?.[0] || session?.sessionSlots?.[0];
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    window.location.href = `/classDetails/${session.id}`;
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={session.infoImgs?.[0] || session.bannerImgs?.[0] || "/tablaSchedule.svg"}
                      alt={session.title}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = "/tablaSchedule.svg";
                        e.target.onerror = null; // Prevent infinite loop
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate m-0 p-0">
                      {session.title}
                    </h4>
                    <p className="text-xs text-gray-500 truncate m-0 p-0">
                      {sessionSlot?.isOnline ? moment(sessionSlot.startTime).format("MMM D, h:mm A") : "No schedule"}
                    </p>
                  </div>
                </div>
              );
            })}
            {subscribedSessions.length > 1 && (
              <button
                onClick={() => {
                  window.location.href = '/mySchedule';
                }}
                className="w-full text-center py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                View all {subscribedSessions.length} sessions
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default FeedLeftSidebar; 