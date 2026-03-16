import ScheduleIcon from "@mui/icons-material/Schedule";
import axios from "axios";
import moment from "moment";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { LiveTv, Person, LocationOn, CalendarMonth, AccessTime } from "@mui/icons-material";
import Image from "next/image";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import { useState } from "react";
import { toast } from "react-hot-toast";
import api from "@/utils/apiSetup";

const ScheduleCard = ({ session, recommended, yours, completed, cardWidth }) => {
  const router = useRouter();
  const management_Token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3Nfa2V5IjoiNjUyYTM1NTNjYTU4NDhmMGUzZDQ2ZDlmIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJpYXQiOjE3MzYwMDU1MzgsIm5iZiI6MTczNjAwNTUzOCwiZXhwIjoyNTk5OTE5MTM4LCJqdGkiOiJmMDNhZTI4NS0wOWM2LTQzNGMtODRhNC1lZTRhNDIxMDg0NWQifQ.1HBmQv415bKF8bs2zZV__9JBzCw1cfQ9oJH9kFBeKc4';
  const user = useSelector(selectUser);
  const [isJoining, setIsJoining] = useState(false);

  // Handle both old SessionSlot and new sessionSlots structures
  const sessionSlot = session?.SessionSlot?.[0] || session?.sessionSlots?.[0];

  // Default card width if not provided
  const defaultCardWidth = "w-[240px] md:w-[280px]";
  const finalCardWidth = cardWidth || defaultCardWidth;

  const handleClick = async () => {
    try {
      // For registered upcoming sessions (not recommended, not completed), join directly to 100ms
      if (!recommended && !completed && (session.isVideoChannel || sessionSlot?.isOnline) && session?.roomId) {
        setIsJoining(true);
        
        // Get token from API instead of hardcoded
        let token = management_Token;
        try {
          const tokenResponse = await api.get("/session/token");
          token = tokenResponse.data.token;
        } catch (tokenError) {
          console.warn("Failed to get token from API, using fallback");
        }
        
        const response = await axios.post(
          `https://api.100ms.live/v2/room-codes/room/${session?.roomId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
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
      } else if (recommended || completed || !session?.roomId) {
        // For recommended, completed, or sessions without roomId, go to details page
        window.location.href = "/classDetails/" + session?.id;
      } else {
        // Fallback to details page
        window.location.href = "/classDetails/" + session?.id;
      }
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error("Failed to join session. Please try again.");
      // Fallback to details page on error
      window.location.href = "/classDetails/" + session?.id;
    } finally {
      setIsJoining(false);
    }
  };

  const sessionDate = moment(sessionSlot?.startTime);
  const isToday = sessionDate.isSame(moment(), 'day');
  const isTomorrow = sessionDate.isSame(moment().add(1, 'day'), 'day');

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ${finalCardWidth} border border-gray-100 group flex flex-col  space-y-2`}
    >
      {/* Header Section */}
      <div className="flex justify-between items-start text-xs bg-gradient-to-r from-orange-50 to-orange-100 px-2 py-1">
        <div className="flex items-center gap-1.5 text-orange-700">
          <CalendarMonth className="w-4 h-4 flex-shrink-0" />
          <div className="-space-y-1">
            <p className="font-semibold text-gray-800 text-[11px]">
              {isToday ? 'Today' : sessionDate.format("MMM D")}
              <span className="font-normal text-gray-600 ml-1">{sessionDate.format("h:mm")}</span>
            </p>
            <p className="text-gray-500 text-[10px] text-left">{sessionDate.format("A")}</p>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-gray-700">
          {session.isVideoChannel || sessionSlot?.isOnline ? <LiveTv className="w-2 h-2" /> : <LocationOn className="w-2 h-2" />}
          <span className="text-[10px] font-medium">{session.isVideoChannel || sessionSlot?.isOnline ? "Online" : "Offline"}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex items-center gap-2 px-2 py-2">
        <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
          <img
            className="h-full w-full object-cover"
            src={session.infoImgs?.[0] || session.bannerImgs?.[0] || "/tablaSchedule.svg"}
            alt={session.title}
            onError={(e) => {
              e.target.src = "/tablaSchedule.svg";
              e.target.onerror = null; // Prevent infinite loop
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-bold text-gray-900 truncate">{session.title}</h3>
          <h2 className="text-[10px] font-bold text-gray-900 truncate">{sessionSlot?.topicName}</h2>
          <div className="flex items-center text-gray-500 mt-0.5">
            <Person className="w-4 h-4" />
             {/* Speaker name is hidden to match the design, but can be re-added if needed */}
             <span className="text-xs truncate ml-1">{sessionSlot?.speakers?.[0]?.name}</span>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="!mt-auto px-2 pb-2 flex gap-2">
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = "/classDetails/" + session?.id;
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gray-100 text-gray-700 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
        >
          View Details
        </motion.button>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            if (!isJoining) {
              handleJoinNow(session, sessionSlot, user);
            }
          }}
          disabled={isJoining}
          whileHover={{ scale: isJoining ? 1 : 1.02 }}
          whileTap={{ scale: isJoining ? 1 : 0.98 }}
          className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            isJoining 
              ? 'bg-orange-200 text-orange-400 cursor-not-allowed' 
              : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
          }`}
        >
          {isJoining ? 'Joining...' : 'Join Now'}
        </motion.button>
      </div>
    </motion.div>
  );
};

const handleJoinNow = async (session, sessionSlot, user) => {
  try {
    if (session.isVideoChannel || sessionSlot?.isOnline) {
      const management_Token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3Nfa2V5IjoiNjUyYTM1NTNjYTU4NDhmMGUzZDQ2ZDlmIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJpYXQiOjE3MzYwMDU1MzgsIm5iZiI6MTczNjAwNTUzOCwiZXhwIjoyNTk5OTE5MTM4LCJqdGkiOiJmMDNhZTI4NS0wOWM2LTQzNGMtODRhNC1lZTRhNDIxMDg0NWQifQ.1HBmQv415bKF8bs2zZV__9JBzCw1cfQ9oJH9kFBeKc4';
      const response = await axios.post(
        `https://api.100ms.live/v2/room-codes/room/${session?.roomId}`,
        { user_name: user?.name },
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
    }
  } catch (error) {
    console.error("Error joining session:", error);
    toast.error("Failed to join session. Please try again.");
  }
};

export default ScheduleCard;