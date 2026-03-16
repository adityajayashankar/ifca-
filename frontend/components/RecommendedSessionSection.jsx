import React, { useRef, useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAllSessions, setSessions } from "@/store/features/sessionSlice";
import { selectUser, selectUserSessions, setUserSessions } from "@/store/features/userSlice";
import ErrorFiller from "./UI/ErrorFiller";
import { PiCaretLeftFill, PiCaretRightFill } from "react-icons/pi";
import { useRouter } from "next/router";
import moment from "moment";
import useLazyLoad from "@/hooks/useLazyLoad";
import { Skeleton, Button, Alert, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import api from "@/utils/apiSetup";
import ClassCard from "@/components/classCard";

const RecommendedSessionSection = () => {
  const user = useSelector(selectUser);
  const userSessions = useSelector(selectUserSessions)?.sessions;
  const sessions = useSelector(selectAllSessions);
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  const router = useRouter();
  const [communityImages, setCommunityImages] = useState({});
  const [loadingCommunities, setLoadingCommunities] = useState({});

  // Use custom lazy load hook
  const { elementRef, isVisible, hasLoaded, isLoading, loadData, error, retryCount } = useLazyLoad({
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true
  });

  // Load data when component becomes visible
  useEffect(() => {
    if (isVisible && !hasLoaded) {
      const dataLoader = async () => {
        console.log('RecommendedSessionSection - Starting data load', user ? `for user: ${user.id}` : 'for guest');
        try {
          const loadPromises = [dispatch(setSessions()).unwrap()];
          if (user?.id) {
            loadPromises.push(dispatch(setUserSessions(user.id)).unwrap());
          }
          const results = await Promise.all(loadPromises);
          console.log('RecommendedSessionSection - Data loaded successfully:', {
            allSessions: results[0],
            userSessions: user?.id ? results[1] : null
          });
        } catch (error) {
          console.error('RecommendedSessionSection - Error loading data:', error);
          throw error; // Re-throw to trigger error handling in loadData
        }
      };
      loadData(dataLoader);
    }
  }, [isVisible, user, hasLoaded, dispatch, loadData]);

  // Filter out sessions the user is already enrolled in
  const filteredSessions = sessions?.filter(
    (item) => !userSessions?.some((uItem) => uItem.id === item.id)
  ) || [];

  // Debug logging to check session data structure
  useEffect(() => {
    if (filteredSessions.length > 0) {
      console.log('RecommendedSessionSection - Session data sample:', filteredSessions[0]);
      console.log('Session image fields:', {
        bannerImgs: filteredSessions[0]?.bannerImgs,
        infoImgs: filteredSessions[0]?.infoImgs,
        title: filteredSessions[0]?.title
      });
    }
  }, [filteredSessions]);

  // Responsive: 2 cards on md+, 1 card on mobile
  const cardsPerView = typeof window !== "undefined" && window.innerWidth >= 768 ? 2 : 1;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleScroll = (dir) => {
    if (scrollRef.current) {
      // Responsive scroll amount: card width + gap
      const cardWidth = isMobile ? 260 : 280;
      const gap = isMobile ? 16 : 24;
      const scrollAmount = cardWidth + gap;
      scrollRef.current.scrollBy({
        left: dir * scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Fetch community image (can be called on hover or proactively)
  const fetchCommunityImage = useCallback(async (communityId) => {
    if (!communityId || communityImages[communityId] || loadingCommunities[communityId]) {
      return;
    }

    setLoadingCommunities(prev => ({ ...prev, [communityId]: true }));
    
    try {
      // Fetch community data from API
      const response = await api.get(`/community/${communityId}`);
      
      // Check for bannerImg in the response
      const bannerImg = response.data?.community?.bannerImg || 
                       response.data?.bannerImg ||
                       response.data?.bannerImg;
      
      if (bannerImg) {
        setCommunityImages(prev => ({
          ...prev,
          [communityId]: bannerImg
        }));
      } else {
        // If no banner image, set to null to prevent repeated requests
        setCommunityImages(prev => ({
          ...prev,
          [communityId]: null
        }));
      }
    } catch (error) {
      console.error('Error fetching community image:', error);
      // Set null on error to prevent repeated failed requests
      setCommunityImages(prev => ({
        ...prev,
        [communityId]: null
      }));
    } finally {
      setLoadingCommunities(prev => {
        const newState = { ...prev };
        delete newState[communityId];
        return newState;
      });
    }
  }, [communityImages, loadingCommunities]);

  // Pre-fetch community images for sessions that might need fallback
  useEffect(() => {
    if (filteredSessions.length > 0) {
      // Fetch community images for sessions that have communityId
      filteredSessions.forEach(session => {
        if (session?.communityId && !communityImages[session.communityId] && !loadingCommunities[session.communityId]) {
          // Pre-fetch community images for potential fallback use
          fetchCommunityImage(session.communityId);
        }
      });
    }
  }, [filteredSessions, communityImages, loadingCommunities, fetchCommunityImage]);

  // Skeleton component
  const SessionsSkeleton = () => (
    <div className="bg-white md:rounded-lg md:shadow p-0 relative border border-gray-100 hover:shadow-lg transition-shadow px-4 py-2">
      <div className="flex md:items-center justify-between mb-2 flex-col md:flex-row gap-y-4 ">
        <div className="flex items-center justify-between w-full gap-2">
          <Skeleton variant="text" width="40%" height={24} />
        </div>
      </div>
      <div className="relative w-full md:max-w-[740px] mx-auto px-0 md:px-4">
        <div className="flex gap-4 md:gap-6 w-full overflow-x-auto overflow-y-hidden scroll-smooth pb-2 orange-scrollbar md:px-0 px-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#f97316 transparent', scrollSnapType: "x mandatory", WebkitOverflowScrolling: 'touch' }}>
          <style dangerouslySetInnerHTML={{
            __html: `
              .orange-scrollbar::-webkit-scrollbar {
                height: 8px;
              }
              .orange-scrollbar::-webkit-scrollbar-track {
                background: transparent;
                border-radius: 10px;
              }
              .orange-scrollbar::-webkit-scrollbar-thumb {
                background: #f97316;
                border-radius: 10px;
              }
              .orange-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #ea580c;
              }
              @media (max-width: 767px) {
                .orange-scrollbar::-webkit-scrollbar {
                  height: 4px;
                }
              }
            `
          }} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0" style={{ width: '260px', minWidth: '260px', maxWidth: '260px', scrollSnapAlign: "start" }}>
              <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
                <Skeleton variant="rectangular" width={260} height={128} />
                <div className="p-3">
                  <Skeleton variant="text" width="60%" height={16} className="mb-2" />
                <Skeleton variant="text" width="80%" height={20} className="mb-1" />
                  <Skeleton variant="text" width="50%" height={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Error state component
  const ErrorState = ({ message, onRetry }) => (
    <div className="bg-white md:rounded-lg md:shadow p-0 relative border border-gray-100 hover:shadow-lg transition-shadow px-4 py-2">
      <div className="flex md:items-center justify-between mb-2 flex-col md:flex-row gap-y-4 ">
        <div className="flex items-center justify-between w-full gap-2">
          <h1 className="text-[16px] font-[600]">Recommended Sessions</h1>
        </div>
      </div>
      <div className="text-center py-8">
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
    </div>
  );

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div ref={elementRef}>
        <SessionsSkeleton />
      </div>
    );
  }

  // Show error state if there's an error
  if (error && retryCount >= 3) {
    return (
      <div ref={elementRef}>
      <ErrorState 
        message="Failed to load recommended sessions. Please try again." 
        onRetry={() => {
          // Reset and retry
          window.location.reload();
        }}
      />
      </div>
    );
  }

  // Hide component if no sessions available (only after data has been loaded)
  if (hasLoaded && filteredSessions.length === 0) {
    return null;
  }

  // Show skeleton if data hasn't been loaded yet (initial state)
  if (!hasLoaded && !isLoading) {
    return (
      <div ref={elementRef}>
        <SessionsSkeleton />
      </div>
    );
  }

  return (
    <div 
      ref={elementRef}
      className="bg-white md:rounded-lg md:shadow p-0 relative border border-gray-100 hover:shadow-lg transition-shadow px-3 md:px-4 py-2 md:py-3"
    >
      <div className="flex md:items-center justify-between mb-3 md:mb-4 flex-col md:flex-row gap-y-2 md:gap-y-0">
        <div className="flex items-center justify-between w-full gap-2">
          <h1 className="text-[14px] md:text-[16px] font-[600]">Recommended Sessions</h1>
          <button
            onClick={() => window.location.href = '/allSessions'}
            className="text-[#4E795E] text-xs md:text-sm font-medium hover:text-[#3a5e47] transition-colors flex items-center gap-1"
          >
            View All
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="relative w-full mx-auto md:max-w-[740px] px-0 md:px-4">
        {/* Navigation buttons - hidden on mobile, visible on desktop */}
        <button
          onClick={() => handleScroll(-1)}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-2 shadow-md z-20 hover:bg-gray-50 transition-colors"
          aria-label="Scroll left"
        >
          <PiCaretLeftFill className="text-[#4E795E]" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-6 w-full overflow-x-auto overflow-y-hidden scroll-smooth pb-2 orange-scrollbar md:px-0 px-4"
          style={{ 
            scrollSnapType: "x mandatory",
            scrollbarWidth: 'thin',
            scrollbarColor: '#f97316 transparent',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
              .orange-scrollbar::-webkit-scrollbar {
                height: 8px;
              }
              .orange-scrollbar::-webkit-scrollbar-track {
                background: transparent;
                border-radius: 10px;
              }
              .orange-scrollbar::-webkit-scrollbar-thumb {
                background: #f97316;
                border-radius: 10px;
              }
              .orange-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #ea580c;
              }
              @media (max-width: 767px) {
                .orange-scrollbar::-webkit-scrollbar {
                  height: 4px;
                }
              }
            `
          }} />
          {filteredSessions.length === 0 ? (
            <div className="text-gray-400 text-center w-full py-8">No Recommended Sessions!!</div>
          ) : (
            filteredSessions.map((session, index) => (
              <div
                key={index}
                className="flex-shrink-0"
                style={{
                  width: isMobile ? '260px' : '280px',
                  minWidth: isMobile ? '260px' : '280px',
                  maxWidth: isMobile ? '260px' : '280px',
                  scrollSnapAlign: "start",
                }}
              >
                <ClassCard 
                  details={session}
                  communityImage={session.communityId && communityImages[session.communityId] ? communityImages[session.communityId] : null}
                />
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => handleScroll(1)}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-2 shadow-md z-20 hover:bg-gray-50 transition-colors"
          aria-label="Scroll right"
        >
          <PiCaretRightFill className="text-[#4E795E]" />
        </button>
      </div>
    </div>
  );
};

export default RecommendedSessionSection; 