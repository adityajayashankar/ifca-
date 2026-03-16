import ScheduleIcon from "@mui/icons-material/Schedule";
import { useSelector } from "react-redux";
import { selectCommunitySessions } from "@/store/features/communitySlice";
import moment from "moment";
import { motion } from "framer-motion";
import api from "@/utils/apiSetup";
import axios from "axios";
import { toast } from "react-toastify";
import { selectUser } from "@/store/features/userSlice";
import { useState, useRef, useEffect } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const EventCard = ({ slot, isFeatured, onJoin }) => {
  const user = useSelector(selectUser);
  
  const handleJoinClick = async (e) => {
    e.stopPropagation();
    if (onJoin && slot.sessionId) {
      await onJoin(slot.sessionId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={`
        ${isFeatured
          ? "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-900"
          : "bg-white text-gray-800 hover:bg-orange-50 border border-gray-100"
        } 
        flex items-center justify-between
        p-6 rounded-2xl
        transition-all duration-200 ease-in-out
        shadow-sm hover:shadow-md
        w-[calc(50%-12px)]
        min-w-[calc(50%-12px)]
        flex-shrink-0
        cursor-pointer
      `}
      style={{ minHeight: 120 }}
      onClick={handleJoinClick}
    >
      <div className="flex items-center gap-6 min-w-0 w-full">
        {/* Date Box */}
        <div className="bg-orange-400 rounded-xl text-center min-w-[70px] px-4 py-2 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-white mb-1 uppercase tracking-wide">
            {moment(slot.startTime).format("MMM")}
          </p>
          <p className="text-2xl font-bold text-white leading-none">
            {moment(slot.startTime).format("DD")}
          </p>
        </div>
        {/* Session Details */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-base font-bold mb-1 truncate ${isFeatured ? "text-orange-900" : "text-gray-900"}`}>{slot.topicName || slot.sessionTitle}</h4>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ScheduleIcon className="w-4 h-4 text-orange-400" />
            <span className="whitespace-nowrap">
              {moment(slot.startTime).format("dddd")}, {moment(slot.startTime).format("hh:mm a")} - {moment(slot.endTime).format("hh:mm a")}
            </span>
          </div>
        </div>
      </div>
      {/* Join Button */}
      <div className="flex items-center">
        <button
          onClick={handleJoinClick}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          Join
        </button>
      </div>
    </motion.div>
  );
};

const SectionTitle = ({ children }) => (
  <div className="flex items-center gap-2 mb-4">
    <h3 className="text-base font-semibold text-gray-900">{children}</h3>
    <div className="flex-1 h-px bg-gray-200"></div>
  </div>
);

const EventSchedule = ({ registeredSessions = [] }) => {
  const user = useSelector(selectUser);
  
  // Helper function to join 100ms session directly
  const handleJoin100ms = async (sessionId) => {
    try {
      // Find the session from registeredSessions
      const session = registeredSessions.find(s => s.id === sessionId);
      if (!session?.roomId) {
        toast.error("Session room not available");
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
        const redirectUrl = `https://aluminaries.app.100ms.live/meeting/${guestCode.code}?name=${encodeURIComponent(user?.name || 'User')}`;
        if (typeof window !== "undefined") {
          window.open(redirectUrl, "_blank");
          toast.success(`Joining session as ${user?.name || 'User'}`);
        }
      } else {
        toast.error("Failed to get room access code");
      }
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error("Failed to join session. Please try again.");
    }
  };

  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Get all slots from registered sessions and sort them by start time
  const allSlots = registeredSessions
    .flatMap(session => 
      session.SessionSlot?.map(slot => ({
        ...slot,
        sessionTitle: session.title,
        sessionId: session.id,
        roomId: session.roomId
      })) || []
    )
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  // Filter to only show sessions within 1 week
  const now = moment();
  const oneWeekFromNow = moment().add(7, 'days');
  const upcomingSlots = allSlots.filter(slot => {
    const slotStart = moment(slot.startTime);
    return slotStart.isAfter(now) && slotStart.isBefore(oneWeekFromNow);
  });

  // Check scroll position and update arrow visibility
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollPosition();
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [upcomingSlots]);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  if (!allSlots || allSlots.length === 0 || upcomingSlots.length === 0) {
    return null; // Don't show empty state if no registered sessions
  }

  const hasMoreThanTwo = upcomingSlots.length > 2;

  return (
    <div className="relative">
      {/* Left Arrow - Only show if more than 2 sessions */}
      {hasMoreThanTwo && showLeftArrow && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-orange-50 transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="w-6 h-6 text-orange-500" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className={`flex gap-6 overflow-x-auto scrollbar-hide ${
          hasMoreThanTwo ? 'scroll-smooth' : ''
        }`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {upcomingSlots.map((slot, idx) => (
          <EventCard 
            key={slot.id} 
            slot={slot} 
            isFeatured={idx === 0}
            onJoin={handleJoin100ms}
          />
        ))}
      </div>

      {/* Right Arrow - Only show if more than 2 sessions */}
      {hasMoreThanTwo && showRightArrow && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-orange-50 transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="w-6 h-6 text-orange-500" />
        </button>
      )}
    </div>
  );
};

export default EventSchedule;
