import ErrorFiller from "../UI/ErrorFiller";
import ScheduleCard from "../scheduleCard";
import moment from "moment";
import { motion } from "framer-motion";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Skeleton, CircularProgress, Button, Alert } from '@mui/material';
import { toast } from 'react-toastify';
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import api from "@/utils/apiSetup";
import { useRouter } from "next/router";

// Discord-style icons using SVG
const DiscordIcons = {
  Calendar: () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  ),
  Video: () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
    </svg>
  ),
  Play: () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  Arrow: () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  ),
  Group: () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
    </svg>
  ),
  Refresh: () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
  ),
  Error: () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
};

const EmptyState = ({ message }) => (
  <div className="text-center py-12">
    <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
      <DiscordIcons.Calendar className="text-orange-500" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'gg sans, "Noto Sans", "Helvetica Neue", Arial, sans-serif' }}>
      No sessions available
    </h3>
    <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto">{message}</p>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="text-center py-12">
    <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
      <DiscordIcons.Error className="text-red-500" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'gg sans, "Noto Sans", "Helvetica Neue", Arial, sans-serif' }}>
      Something went wrong
    </h3>
    <p className="text-gray-600 text-base mb-6 max-w-md mx-auto">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 mx-auto"
        style={{ fontFamily: 'gg sans, "Noto Sans", "Helvetica Neue", Arial, sans-serif' }}
      >
        <DiscordIcons.Refresh />
        Try Again
      </button>
    )}
  </div>
);

const SessionCardList = (props) => {
  const scrollContainerRef = useRef(null);
  const [isFullyScrolled, setIsFullyScrolled] = useState(false);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const router = useRouter();
  
  const view = props.recommended ? 'recommended' : 'upcoming';
  const [sessions, setSessions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const user = useSelector(selectUser);
  const cardWidth = view === 'upcoming' ? 'w-[280px]' : 'w-[240px] md:w-[calc(50%-8px)]';

  const fetchSessions = useCallback(async (pageNum) => {
    if (!user?.id || view !== 'upcoming') return;
    
    const isLoadingMore = pageNum > 1;
    if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await api.get(`/user/${user.id}/sessions/upcoming-slots?page=${pageNum}&limit=10`);
      const newSessions = response.data.sessions || [];
      setSessions(prev => isLoadingMore ? [...prev, ...newSessions] : newSessions);
      setHasMore(pageNum < response.data.pages);
      setPage(pageNum + 1);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions');
      
      // Retry logic
      if (retryCount < maxRetries) {
        toast.warning(`Retrying... (${retryCount + 1}/${maxRetries})`);
        setRetryCount(prev => prev + 1);
        
        // Retry after a delay
        setTimeout(() => {
          fetchSessions(pageNum);
        }, 2000 * (retryCount + 1)); // Exponential backoff
      } else {
        toast.error(`Failed to load sessions after ${maxRetries} attempts.`);
        setRetryCount(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user?.id, view, retryCount, maxRetries]);

  useEffect(() => {
    if (props.Sessions && props.Sessions.length > 0) {
      // If Sessions prop is provided, use it regardless of view type
      setSessions(props.Sessions);
      setLoading(false);
      setHasMore(false);
      setError(null);
    } else if (view === 'recommended') {
      setSessions(props.Sessions || []);
      setLoading(false);
      setHasMore(false);
      setError(null);
    } else {
      setSessions([]);
      setPage(1);
      setHasMore(true);
      setRetryCount(0);
      fetchSessions(1);
    }
  }, [view, user?.id, props.Sessions, fetchSessions]);

  const observer = useRef();
  const lastSessionElementRef = useCallback(node => {
    if (loading || loadingMore || view !== 'upcoming') return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchSessions(page);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, page, view, fetchSessions]);
  

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const isLargeScreen = window.innerWidth >= 768; // md breakpoint
    const cardElement = container.querySelector('.session-card');
    
    if (cardElement) {
      const cardWidthValue = cardElement.offsetWidth;
      const gap = isLargeScreen ? 16 : 8; // md:gap-4 vs gap-2
      const scrollAmount = isLargeScreen ? (cardWidthValue + gap) * 2 : cardWidthValue + gap;
      
      const newPosition = direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleScrollCheck = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setShowLeftButton(container.scrollLeft > 0);
      const isScrolledToEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 10;
      setIsFullyScrolled(isScrolledToEnd);
      
      // If we are in upcoming view and scrolled to end, hide right arrow if no more pages
      if (view === 'upcoming' && isScrolledToEnd && !hasMore) {
        setIsFullyScrolled(true);
      }
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScrollCheck);
      handleScrollCheck();
      return () => container.removeEventListener('scroll', handleScrollCheck);
    }
  }, [sessions, hasMore, view]);

  // Discord-style skeleton component
  const SessionsSkeleton = () => (
    <div className="py-6">
      <div className="h-8 bg-gray-200 rounded-lg mb-6 w-1/3 animate-pulse"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="space-y-4">
              <div className="relative h-48 bg-gray-200 animate-pulse">
                <div className="absolute top-3 left-3 w-12 h-12 bg-gray-300 rounded-lg animate-pulse"></div>
                <div className="absolute top-3 right-3 w-16 h-6 bg-gray-300 rounded-full animate-pulse"></div>
              </div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Always show the section, even if empty
  if (loading && view !== 'recommended') {
    return (
      <div className="mx-auto max-w-[1920px]">
        <div className="flex md:items-center justify-between mb-6 flex-col md:flex-row gap-y-3 md:gap-y-0">
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'gg sans, "Noto Sans", "Helvetica Neue", Arial, sans-serif' }}>
            {props.recommended ? "Recommended Sessions" : "Upcoming Sessions"}
          </h1>
        </div>
        <SessionsSkeleton />
      </div>
    );
  }

  if (error && retryCount >= maxRetries) {
    return (
      <div className="mx-auto max-w-[1920px]">
        <div className="flex md:items-center justify-between mb-6 flex-col md:flex-row gap-y-3 md:gap-y-0">
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'gg sans, "Noto Sans", "Helvetica Neue", Arial, sans-serif' }}>
            {props.recommended ? "Recommended Sessions" : "Upcoming Sessions"}
          </h1>
        </div>
        <ErrorState 
          message={error} 
          onRetry={() => {
            setRetryCount(0);
            fetchSessions(1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1920px]">
      <div className="flex md:items-center justify-between mb-6 flex-col md:flex-row gap-y-3 md:gap-y-0">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'gg sans, "Noto Sans", "Helvetica Neue", Arial, sans-serif' }}>
          {props.recommended ? "Recommended Sessions" : "Upcoming Sessions"}
        </h1>
      </div>

      {!sessions?.length ? (
        <EmptyState message={props.recommended ? "No recommended sessions available at the moment." : "No upcoming sessions available."} />
      ) : (
        <div className="relative">
          <div className="relative">
            <div
              ref={scrollContainerRef}
              onScroll={handleScrollCheck}
              className="flex gap-4 md:gap-6 overflow-x-auto py-4 snap-x snap-mandatory scroll-smooth pb-4 md:pb-6 scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {sessions
                .map((session, index) => (
                  <motion.div
                    ref={sessions.length === index + 1 ? lastSessionElementRef : null}
                    key={`${session.id}-${session.sessionSlots?.[0]?.id || index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: Math.min(index * 0.1, 0.3),
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    className={`${cardWidth} shrink-0 session-card snap-start`}
                  >
                    <ScheduleCard
                      session={session}
                      recommended={props.recommended}
                      yours={props.yours}
                      completed={props.completed}
                      cardWidth={cardWidth}
                    />
                  </motion.div>
                ))}
                {loadingMore && (
                  <div className="flex justify-center items-center p-6 shrink-0">
                    <div className="relative">
                      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-t-orange-400 rounded-full animate-spin" style={{ animationDelay: '0.5s' }}></div>
                    </div>
                  </div>
                )}
            </div>

            {showLeftButton && (
              <button
                onClick={() => handleScroll('left')}
                className="absolute left-[-20px] top-1/2 transform -translate-y-1/2 z-20 bg-white text-gray-800 shadow-lg hover:bg-gray-50 p-3 rounded-full hidden lg:flex border border-gray-200"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            )}

            {!isFullyScrolled && (
              <button
                onClick={() => handleScroll('right')}
                className="absolute right-[-20px] top-1/2 transform -translate-y-1/2 z-10 bg-white text-gray-800 shadow-lg hover:bg-gray-50 p-3 rounded-full hidden lg:flex border border-gray-200"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionCardList;
