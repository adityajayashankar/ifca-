import Footer from "@/components/footer";
import Topbar from "@/components/topbar/Topbar";
import Head from "next/head";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import { useRouter } from "next/router";
import OnBoard from "../onBoard";
import moment from "moment";
import { motion } from "framer-motion";
import api from "@/utils/apiSetup";
import axios from "axios";
import { toast } from "react-hot-toast";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange } from "react-date-range";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  VideoCameraIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const handleJoinNow = async (session, sessionSlot, user) => {
  try {
    if (!session?.roomId) {
      if (typeof window !== "undefined") {
        window.location.href = `/classDetails/${session.id}`;
      }
      return;
    }

    const tokenResponse = await api.get("/session/token");
    const management_Token = tokenResponse.data.token;
    
    const response = await axios.post(
      `https://api.100ms.live/v2/room-codes/room/${session.roomId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${management_Token}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    const guestCode = response.data.data.find(item => item.role === 'guest');
    if (guestCode) {
      const redirectUrl = `https://aluminaries.app.100ms.live/meeting/${guestCode.code}`;
      if (typeof window !== "undefined") {
        window.open(redirectUrl, "_blank");
        toast.success(`Joining session as ${user?.name}`);
      }
    } else {
      toast.error("Failed to get room access code");
    }
  } catch (error) {
    console.error("Error joining session:", error);
    if (session?.id && typeof window !== "undefined") {
      window.location.href = `/classDetails/${session.id}`;
    }
    toast.error("Failed to join session. Redirecting to session details.");
  }
};

const MySchedule = () => {
  const router = useRouter();
  const { view: queryView, date: queryDate, tab: queryTab, list: queryList } = router.query;
  
  // Initialize state from query params or defaults
  const getInitialViewMode = () => {
    if (queryTab && typeof queryTab === 'string') {
      const validModes = ['month', 'week', 'day'];
      if (validModes.includes(queryTab.toLowerCase())) {
        return queryTab.toLowerCase();
      }
    }
    return 'month';
  };

  const getInitialDate = () => {
    if (queryDate && typeof queryDate === 'string') {
      const parsedDate = moment(queryDate, 'YYYY-MM-DD');
      if (parsedDate.isValid()) {
        return parsedDate;
      }
    }
    return moment();
  };

  const getInitialView = () => {
    if (queryView && typeof queryView === 'string') {
      const validViews = ['mySchedule', 'completed'];
      if (validViews.includes(queryView.toLowerCase())) {
        return queryView.toLowerCase();
      }
    }
    return 'mySchedule';
  };

  const getInitialShowList = () => {
    return queryList === 'true';
  };

  const getInitialDateRange = (viewType) => {
    const today = moment();
    if (viewType === 'completed') {
      // For completed: past week (7 days ago to today)
      return {
        startDate: today.clone().subtract(7, 'days').toDate(),
        endDate: today.toDate(),
        key: 'selection'
      };
    } else {
      // For upcoming: next week (today to 7 days ahead)
      return {
        startDate: today.toDate(),
        endDate: today.clone().add(7, 'days').toDate(),
        key: 'selection'
      };
    }
  };

  const [viewMode, setViewMode] = useState(getInitialViewMode());
  const [currentDate, setCurrentDate] = useState(getInitialDate());
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(getInitialView());
  const [searchQuery, setSearchQuery] = useState("");
  const [showList, setShowList] = useState(getInitialShowList());
  const [dateRange, setDateRange] = useState(getInitialDateRange(getInitialView()));
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);

  const currentUser = useSelector(selectUser);

  // Sync state with query params when router is ready
  useEffect(() => {
    if (router.isReady) {
      const newViewMode = getInitialViewMode();
      const newDate = getInitialDate();
      const newView = getInitialView();
      const newShowList = getInitialShowList();
      
      if (newViewMode !== viewMode) {
        setViewMode(newViewMode);
      }
      if (!newDate.isSame(currentDate, 'day')) {
        setCurrentDate(newDate);
      }
      if (newView !== view) {
        setView(newView);
        // Reset date range when view changes
        setDateRange(getInitialDateRange(newView));
      }
      if (newShowList !== showList) {
        setShowList(newShowList);
      }
    }
  }, [router.isReady, queryTab, queryDate, queryView, queryList]);

  // Update URL query params when state changes
  useEffect(() => {
    if (!router.isReady) return;
    
    const currentTab = router.query.tab;
    const currentDateParam = router.query.date;
    const currentViewParam = router.query.view;
    const currentListParam = router.query.list;
    
    const dateMatches = currentDateParam === currentDate.format('YYYY-MM-DD');
    const tabMatches = currentTab === viewMode;
    const viewMatches = currentViewParam === view;
    const listMatches = (currentListParam === 'true') === showList;
    
    if (!dateMatches || !tabMatches || !viewMatches || !listMatches) {
      router.push(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            tab: viewMode,
            date: currentDate.format('YYYY-MM-DD'),
            view: view,
            list: showList ? 'true' : 'false'
          }
        },
        undefined,
        { shallow: true }
      );
    }
  }, [viewMode, currentDate, view, showList]);

  useEffect(() => {
    if (!localStorage.getItem('ifca-jwt')) {
      router.push("/onBoard");
    }
  }, [router]);

  if (!localStorage.getItem('ifca-jwt')) return <OnBoard />;

  // Fetch sessions function
  const fetchSessions = useCallback(async (showLoading = true) => {
    if (!currentUser?.id) return;
    
    try {
      if (showLoading) setLoading(true);
      setIsRefreshing(true);
      
      let startDate, endDate;

      if (view === 'completed') {
        // For completed view: always use date range (default shows all, but can be filtered)
      if (showList) {
          // Use date range from date picker
          startDate = moment(dateRange.startDate).format('YYYY-MM-DD');
          endDate = moment(dateRange.endDate).format('YYYY-MM-DD');
        } else {
          // For calendar views in completed mode, use a wide range to show all completed sessions
          // But still respect the date range if user has set one
          startDate = moment(dateRange.startDate).format('YYYY-MM-DD');
          endDate = moment(dateRange.endDate).format('YYYY-MM-DD');
        }
      } else if (showList) {
        // Use date range for list view
        startDate = moment(dateRange.startDate).format('YYYY-MM-DD');
        endDate = moment(dateRange.endDate).format('YYYY-MM-DD');
      } else if (viewMode === 'month') {
        startDate = currentDate.clone().startOf('month').format('YYYY-MM-DD');
        endDate = currentDate.clone().endOf('month').format('YYYY-MM-DD');
      } else if (viewMode === 'week') {
        startDate = currentDate.clone().startOf('week').format('YYYY-MM-DD');
        endDate = currentDate.clone().endOf('week').format('YYYY-MM-DD');
      } else { // day
        startDate = currentDate.clone().format('YYYY-MM-DD');
        endDate = currentDate.clone().format('YYYY-MM-DD');
      }

      const params = {
        userId: currentUser.id,
        view: view,
        startDate,
        endDate
      };

      const response = await api.get('session/slots', { params });
      // Handle both old and new response formats
      const data = response.data?.data || response.data || {};
      setSessionData(data);
      setLastUpdateTime(moment());
    } catch (error) {
      console.error('Error fetching sessions:', error);
      if (showLoading) {
        toast.error('Failed to load sessions');
      }
    } finally {
      if (showLoading) setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser?.id, currentDate, view, viewMode, showList, dateRange]);

  // Initial fetch and real-time updates
  useEffect(() => {
    if (currentUser?.id) {
      fetchSessions(true);
    }
  }, [currentUser?.id, currentDate, view, viewMode, showList, dateRange]);

  // Real-time polling (every 30 seconds)
  useEffect(() => {
    if (!currentUser?.id) return;

    // Only poll if page is visible
    const startPolling = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      refreshIntervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchSessions(false); // Don't show loading spinner for auto-refresh
        }
      }, 30000); // 30 seconds
    };

    const stopPolling = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };

    startPolling();

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startPolling();
        fetchSessions(false); // Refresh when page becomes visible
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser?.id, fetchSessions]);

  // Get all sessions - handle both groupedSlots and slots array
  const allSessions = useMemo(() => {
    if (!sessionData) return [];
    // If slots array exists, use it directly
    if (Array.isArray(sessionData.slots)) {
      return sessionData.slots;
    }
    // Otherwise use groupedSlots
    if (sessionData.groupedSlots) {
    return Object.values(sessionData.groupedSlots).flat();
    }
    return [];
  }, [sessionData]);

  // Filter sessions by search
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return allSessions;
    const query = searchQuery.toLowerCase();
    return allSessions.filter(slot => {
      const title = (slot.topicName || slot.session.title || '').toLowerCase();
      const community = (slot.session?.community?.title || '').toLowerCase();
      const host = (slot.session?.user?.name || '').toLowerCase();
      return title.includes(query) || community.includes(query) || host.includes(query);
    });
  }, [allSessions, searchQuery]);

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped = {};
    filteredSessions.forEach(slot => {
      const dateKey = moment(slot.startTime).format('YYYY-MM-DD');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(slot);
    });
    return grouped;
  }, [filteredSessions]);

  // Calendar helpers
  const getDaysInMonth = () => {
    const start = currentDate.clone().startOf('month').startOf('week');
    const end = currentDate.clone().endOf('month').endOf('week');
    const days = [];
    let day = start.clone();
    while (day.isSameOrBefore(end, 'day')) {
      days.push(day.clone());
      day.add(1, 'day');
    }
    return days;
  };

  const getDaysInWeek = () => {
    const start = currentDate.clone().startOf('week');
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(start.clone().add(i, 'days'));
    }
    return days;
  };

  const navigateDate = (direction) => {
    const newDate = currentDate.clone();
    if (viewMode === 'month') {
      newDate.add(direction, 'month');
    } else if (viewMode === 'week') {
      newDate.add(direction, 'week');
    } else {
      newDate.add(direction, 'day');
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(moment());
    // Always reset date range to default for current view
      setDateRange(getInitialDateRange(view));
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleViewChange = (newView) => {
    setView(newView);
    // Always reset date range when switching views
    setDateRange(getInitialDateRange(newView));
    // If switching to completed view, also reset current date to today
    if (newView === 'completed') {
      setCurrentDate(moment());
    }
  };

  // Update date range when view changes (reset to default range)
  useEffect(() => {
    // Reset date range when view changes, especially for completed view
      setDateRange(getInitialDateRange(view));
  }, [view]);

  const handleToggleList = () => {
    setShowList(!showList);
  };

  const isToday = (day) => {
    return day.isSame(moment(), 'day');
  };

  const isCurrentMonth = (day) => {
    return day.isSame(currentDate, 'month');
  };

  const getSessionsForDate = (date) => {
    const dateKey = date.format('YYYY-MM-DD');
    return sessionsByDate[dateKey] || [];
  };

  // Get session image with community fallback
  const getSessionImage = (slot) => {
    return slot.session?.images?.primaryImage || 
           slot.session?.images?.banner ||
           slot.session?.infoImgs?.[0] || 
           slot.session?.bannerImgs?.[0] || 
           slot.session?.community?.bannerImg ||
           null;
  };

  const hasSessionImage = (slot) => {
    return !!(slot.session?.images?.primaryImage || 
              slot.session?.images?.banner ||
              slot.session?.infoImgs?.[0] || 
              slot.session?.bannerImgs?.[0] ||
              slot.session?.community?.bannerImg);
  };

  // Time slots for day/week view (6 AM to 11 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      slots.push(moment().hour(hour).minute(0));
    }
    return slots;
  }, []);

  // Calculate session position and height for time-based views
  const getSessionPosition = (slot) => {
    const start = moment(slot.startTime);
    const end = moment(slot.endTime);
    const startHour = start.hour() + start.minute() / 60;
    const endHour = end.hour() + end.minute() / 60;
    const startMinutes = (startHour - 6) * 60;
    const endMinutes = (endHour - 6) * 60;
    const totalMinutes = 18 * 60; // 18 hours * 60 minutes
    const top = (startMinutes / totalMinutes) * 100;
    const height = ((endMinutes - startMinutes) / totalMinutes) * 100;
    return { top: `${top}%`, height: `${Math.max(height, 2)}%` };
  };

  // Render session event block
  const SessionEvent = ({ slot, compact = false }) => {
    const startTime = moment(slot.startTime);
    const endTime = moment(slot.endTime);
    const now = moment();
    const isLive = slot.isLive || (now.isSameOrAfter(startTime) && now.isSameOrBefore(endTime));
    const sessionImage = getSessionImage(slot);
    const hasImage = hasSessionImage(slot);

    if (compact) {
      return (
        <div
          onClick={() => router.push(`/classDetails/${slot.session.id}`)}
          className={`absolute left-1 right-1 mx-0.5 rounded px-2 py-1 text-xs cursor-pointer border-l-4 shadow-sm ${
            isLive 
              ? 'bg-red-50 border-l-red-500 text-red-900 hover:bg-red-100' 
              : 'bg-blue-50 border-l-blue-500 text-blue-900 hover:bg-blue-100'
          } transition-all z-10`}
          style={getSessionPosition(slot)}
        >
          <div className="font-semibold truncate text-[11px]">{slot.topicName || slot.session.title}</div>
          <div className="text-[10px] opacity-75 mt-0.5">
            {startTime.format('h:mm A')} - {endTime.format('h:mm A')}
          </div>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => router.push(`/classDetails/${slot.session.id}`)}
        className={`absolute left-1 right-1 mx-0.5 rounded-lg p-2.5 cursor-pointer border-l-4 shadow-md z-10 ${
          isLive 
            ? 'bg-red-50 border-l-red-500 hover:bg-red-100 hover:shadow-lg' 
            : 'bg-blue-50 border-l-blue-500 hover:bg-blue-100 hover:shadow-lg'
        } transition-all`}
        style={getSessionPosition(slot)}
      >
        <div className="flex items-start gap-2">
          {hasImage ? (
            <img
              src={sessionImage}
              alt=""
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-200"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextElementSibling) {
                  e.target.nextElementSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <VideoCameraIcon className={`w-8 h-8 text-blue-500 flex-shrink-0 ${hasImage ? 'hidden' : 'flex'}`} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{slot.topicName || slot.session.title}</div>
            <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              {startTime.format('h:mm A')} - {endTime.format('h:mm A')}
            </div>
            {slot.session?.community?.title && (
              <div className="text-xs text-gray-500 truncate mt-1 flex items-center gap-1">
                <UsersIcon className="w-3 h-3" />
                {slot.session.community.title}
              </div>
            )}
          </div>
          {isLive && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full flex-shrink-0 font-semibold animate-pulse">
              LIVE
            </span>
          )}
        </div>
      </motion.div>
    );
  };

  // Session Card for List View
  const SessionCard = ({ slot }) => {
    const startTime = moment(slot.startTime);
    const endTime = moment(slot.endTime);
    const now = moment();
    const isLive = slot.isLive || (now.isSameOrAfter(startTime) && now.isSameOrBefore(endTime));
    const isToday = startTime.isSame(moment(), 'day');
    const sessionImage = getSessionImage(slot);
    const hasImage = hasSessionImage(slot);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => router.push(`/classDetails/${slot.session.id}`)}
        className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      >
        <div className="flex flex-col md:flex-row">
          {/* Session Image */}
          <div className="relative w-full md:w-64 h-48 overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
            {hasImage ? (
              <img
                src={sessionImage}
                alt={slot.topicName || slot.session.title}
                className="w-full h-full max-h-48 object-contain group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextElementSibling) {
                    e.target.nextElementSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <VideoCameraIcon className={`w-20 h-20 text-orange-400 ${hasImage ? 'hidden' : 'flex'}`} />
            
            {/* Overlay badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
              {isLive && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  LIVE
                </span>
              )}
              {slot.isRegistered && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                  Registered
                </span>
              )}
            </div>
            
            {/* Date badge */}
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-md z-10">
              <div className="text-xs font-bold text-gray-900">{startTime.format('MMM D')}</div>
              <div className="text-xs text-gray-600">{startTime.format('ddd')}</div>
            </div>
          </div>

          {/* Session Details */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                {slot.topicName || slot.session.title}
              </h3>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-orange-500" />
                  <span>{startTime.format('MMM D, YYYY')} • {startTime.format('h:mm A')} - {endTime.format('h:mm A')}</span>
                  {isToday && <span className="text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded">Today</span>}
                </div>
                
                {slot.session?.community?.title && (
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-orange-500" />
                    <span>{slot.session.community.title}</span>
                  </div>
                )}
                
                {slot.session?.user && (
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-orange-500" />
                    <span>{slot.session.user.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            {view !== 'completed' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoinNow(slot.session, slot.room, currentUser);
                }}
                className={`w-full md:w-auto px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  isLive 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg'
                }`}
              >
                <PlayIcon className="w-4 h-4" />
                {isLive ? 'Join Live' : 'Join Session'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const getViewTitle = () => {
    if (showList) {
      return 'List View';
    } else if (viewMode === 'month') {
      return currentDate.format('MMMM YYYY');
    } else if (viewMode === 'week') {
      const start = currentDate.clone().startOf('week');
      const end = currentDate.clone().endOf('week');
      if (start.month() === end.month()) {
        return `${start.format('MMM D')} - ${end.format('D, YYYY')}`;
      }
      return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
    } else {
      return currentDate.format('dddd, MMMM D, YYYY');
    }
  };

  // List view sessions sorted by date
  const listViewSessions = useMemo(() => {
    return filteredSessions.sort((a, b) => 
      moment(a.startTime).diff(moment(b.startTime))
    );
  }, [filteredSessions]);

  return (
    <>
      <Head>
        <title>My Schedule | IFCA</title>
      </Head>
      <header>
        <Topbar />
      </header>
      <main className="mx-auto px-2 sm:px-4 py-4 max-w-[1800px] mt-20 min-h-screen">
        {/* Header */}
        <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Back Button */}
                    <button
                      onClick={() => router.back()}
                      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                      aria-label="Go back"
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Schedule</h1>
                {lastUpdateTime && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Updated {lastUpdateTime.fromNow()}</span>
                  </div>
                )}
              </div>
                  <p className="text-sm text-gray-600 mt-1 ml-11">
                {view === 'mySchedule' ? 'View and manage your upcoming sessions' : 'Review your completed sessions'}
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleViewChange('mySchedule')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === 'mySchedule'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => handleViewChange('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === 'completed'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
                  <button
                    onClick={() => router.push('/allSessions')}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-orange-500 text-white shadow-md hover:bg-orange-600 flex items-center gap-2"
                  >
                    <span>Explore</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Calendar/List Toggle and Controls */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 md:p-4 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleToggleList}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  showList
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ListBulletIcon className="w-4 h-4" />
                List View
              </button>
              
              {!showList && (
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => handleViewModeChange('month')}
                    className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                      viewMode === 'month'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Squares2X2Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">Month</span>
                  </button>
                  <button
                    onClick={() => handleViewModeChange('week')}
                    className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                      viewMode === 'week'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Week</span>
                  </button>
                  <button
                    onClick={() => handleViewModeChange('day')}
                    className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                      viewMode === 'day'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Day</span>
                  </button>
                </div>
              )}
            </div>

            {/* Navigation */}
            {!showList && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 md:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Today
                </button>
                <h2 className="text-base md:text-lg font-semibold text-gray-900 min-w-[200px] md:min-w-[250px] text-center">
                  {getViewTitle()}
                </h2>
                <button
                  onClick={() => navigateDate(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Next"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchSessions(true)}
              disabled={isRefreshing}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading schedule...</p>
            </div>
          </div>
        ) : showList ? (
          /* List View - Split Layout: Cards (75%) | Date Range & Calendar (25%) */
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Side - Session Cards (75%) */}
            <div className="w-full lg:w-3/4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Sessions ({listViewSessions.length})
                </h3>
                <span className="text-sm text-gray-500">
                  {moment(dateRange.startDate).format('MMM D')} - {moment(dateRange.endDate).format('MMM D, YYYY')}
                </span>
              </div>
              
              {listViewSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listViewSessions.map((slot, index) => (
                    <SessionCard key={index} slot={slot} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <CalendarIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions found</h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    {searchQuery
                      ? `No sessions match "${searchQuery}". Try a different search term.`
                      : `No sessions found for the selected date range. Explore available sessions to find what interests you.`}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => router.push('/allSessions')}
                      className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
                    >
                      <span>Explore Sessions</span>
                      <ArrowRightIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Side - Date Range Selector (25%) - Sticky */}
            <div className="w-full lg:w-1/4">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 md:p-4 sticky top-24">
                <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3">Select Date Range</h3>
                <DateRange
                  ranges={[dateRange]}
                  onChange={(item) => {
                    setDateRange(item.selection);
                  }}
                  minDate={view === 'completed' ? undefined : new Date()} // For upcoming: no past dates
                  maxDate={view === 'completed' ? new Date() : undefined} // For completed: no future dates
                  className="w-full"
                  showDateDisplay={true}
                  rangeColors={['#f97316']}
                />
                <button
                  onClick={goToToday}
                  className="w-full mt-3 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  {view === 'completed' ? 'Reset to All Sessions' : 'Reset to Today'}
                </button>
              </div>
            </div>
          </div>
        ) : viewMode === 'month' ? (
          /* Month View - Google Calendar Style */
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-white border-b border-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 divide-x divide-gray-200" style={{ minHeight: '600px' }}>
              {getDaysInMonth().map((day, index) => {
                const daySessions = getSessionsForDate(day);
                const isTodayDate = isToday(day);
                const isCurrentMonthDate = isCurrentMonth(day);

                return (
                  <div
                    key={index}
                    onClick={() => {
                      setCurrentDate(day);
                      handleViewModeChange('day');
                    }}
                    className={`relative border-b border-gray-200 p-2 cursor-pointer transition-all overflow-hidden flex flex-col min-h-[85px] ${
                      isTodayDate
                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                        : isCurrentMonthDate 
                          ? 'bg-white hover:bg-gray-50' 
                          : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    {/* Date number */}
                    <div className={`text-sm font-medium mb-1 flex-shrink-0 ${
                      isTodayDate 
                        ? 'text-blue-600 font-bold bg-blue-100 rounded-full w-7 h-7 flex items-center justify-center' 
                        : isCurrentMonthDate 
                          ? 'text-gray-900' 
                          : 'text-gray-400'
                    }`}>
                      {day.format('D')}
                    </div>
                    {/* Sessions */}
                    <div className="flex-1 space-y-1 overflow-y-auto">
                      {daySessions.slice(0, 3).map((slot, idx) => {
                        const slotStart = moment(slot.startTime);
                        const slotEnd = moment(slot.endTime);
                        const now = moment();
                        const isLive = slot.isLive || (now.isSameOrAfter(slotStart) && now.isSameOrBefore(slotEnd));
                        const sessionImage = getSessionImage(slot);
                        return (
                          <div
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/classDetails/${slot.session.id}`);
                            }}
                            className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer truncate border-l-4 transition-all hover:shadow-sm ${
                              isLive
                                ? 'bg-red-50 border-l-red-500 text-red-900 font-semibold'
                                : 'bg-blue-50 border-l-blue-500 text-blue-900'
                            }`}
                            title={`${moment(slot.startTime).format('h:mm A')} - ${slot.topicName || slot.session.title}`}
                          >
                            <span className="font-medium">{moment(slot.startTime).format('h:mm')}</span>
                            <span className="ml-1 truncate">{slot.topicName || slot.session.title}</span>
                          </div>
                        );
                      })}
                      {daySessions.length > 3 && (
                        <div className="text-[10px] text-gray-500 font-medium text-center py-1 hover:text-gray-700">
                          +{daySessions.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewMode === 'week' ? (
          /* Week View - Google Calendar Style */
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-8 border-b border-gray-200 bg-white">
              <div className="p-3 border-r border-gray-200"></div>
              {getDaysInWeek().map((day, idx) => (
                <div
                  key={idx}
                  className={`p-3 text-center border-r border-gray-200 ${isToday(day) ? 'bg-blue-50' : 'bg-white'}`}
                >
                  <div className={`text-xs font-medium uppercase ${isToday(day) ? 'text-blue-600' : 'text-gray-600'}`}>
                    {day.format('ddd')}
                  </div>
                  <div className={`text-xl font-semibold mt-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}`}>
                    {day.format('D')}
                  </div>
                </div>
              ))}
            </div>
            {/* Time grid */}
            <div className="relative overflow-x-auto" style={{ height: 'calc(100vh - 400px)', minHeight: '600px', maxHeight: '800px' }}>
              {/* Time column - sticky */}
              <div className="absolute left-0 top-0 bottom-0 w-16 border-r border-gray-200 bg-white z-10">
                {timeSlots.map((time, idx) => (
                  <div 
                    key={idx} 
                    className="border-b border-gray-100 text-xs text-gray-500 pr-2 text-right flex items-start justify-end pt-1"
                    style={{ height: 'calc(100% / 18)' }}
                  >
                    {time.format('h A')}
                  </div>
                ))}
              </div>
              {/* Days columns */}
              <div className="ml-16 grid grid-cols-7 h-full divide-x divide-gray-200 relative">
                {getDaysInWeek().map((day, dayIdx) => {
                  const daySessions = getSessionsForDate(day);
                  const isTodayDay = isToday(day);
                  return (
                    <div
                      key={dayIdx}
                      className={`relative ${isTodayDay ? 'bg-blue-50/30' : 'bg-white'}`}
                    >
                      {/* Time grid lines - Matching time column exactly */}
                      {timeSlots.map((_, idx) => (
                        <div 
                          key={idx} 
                          className="border-b border-gray-100"
                          style={{ height: 'calc(100% / 18)' }}
                        ></div>
                      ))}
                      {/* Current time indicator */}
                      {isTodayDay && (
                        <div
                          className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                          style={{ top: `${((moment().hour() + moment().minute() / 60 - 6) / 18) * 100}%` }}
                        >
                          <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                      )}
                      {/* Sessions */}
                      {daySessions.map((slot, idx) => (
                        <SessionEvent key={idx} slot={slot} compact={true} />
                      ))}
                    </div>
                  );
                })}
                {/* Empty state overlay for week view */}
                {filteredSessions.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-30">
                    <div className="text-center py-8 px-4 max-w-md">
                      <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions found</h3>
                      <p className="text-gray-600 mb-4">
                        {searchQuery
                          ? `No sessions match "${searchQuery}". Try a different search term.`
                          : `No sessions scheduled for this week. Explore available sessions to find what interests you.`}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={() => router.push('/allSessions')}
                          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
                        >
                          <span>Explore Sessions</span>
                          <ArrowRightIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Day View - Google Calendar Style */
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Day header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">{getViewTitle()}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {getSessionsForDate(currentDate).length} {getSessionsForDate(currentDate).length === 1 ? 'session' : 'sessions'}
              </p>
            </div>
            {/* Time grid */}
            <div className="relative flex overflow-x-auto" style={{ height: 'calc(100vh - 400px)', minHeight: '600px', maxHeight: '800px' }}>
              {/* Time column - sticky */}
              <div className="w-20 border-r border-gray-200 bg-white flex-shrink-0 z-10">
                {timeSlots.map((time, idx) => (
                  <div 
                    key={idx} 
                    className="border-b border-gray-100 flex items-start justify-end pr-3 pt-1"
                    style={{ height: 'calc(100% / 18)' }}
                  >
                    <span className="text-xs text-gray-500 font-medium">{time.format('h A')}</span>
                  </div>
                ))}
              </div>
              {/* Day column */}
              <div className="flex-1 relative min-w-0 bg-white">
                {/* Time grid lines - Matching time column exactly */}
                {timeSlots.map((_, idx) => (
                  <div 
                    key={idx} 
                    className="border-b border-gray-100"
                    style={{ height: 'calc(100% / 18)' }}
                  ></div>
                ))}
                {/* Current time indicator */}
                {isToday(currentDate) && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                    style={{ top: `${((moment().hour() + moment().minute() / 60 - 6) / 18) * 100}%` }}
                  >
                    <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                )}
                {/* Sessions */}
                {getSessionsForDate(currentDate).length > 0 ? (
                  getSessionsForDate(currentDate).map((slot, idx) => (
                  <SessionEvent key={idx} slot={slot} />
                  ))
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center py-8 px-4">
                      <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions found</h3>
                      <p className="text-gray-600 mb-4 max-w-md mx-auto">
                        No sessions scheduled for {currentDate.format('MMMM D, YYYY')}. Explore available sessions to find what interests you.
                      </p>
                      <button
                        onClick={() => router.push('/allSessions')}
                        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
                      >
                        <span>Explore Sessions</span>
                        <ArrowRightIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default MySchedule;
