import Notifications from "@mui/icons-material/Notifications";
import ArticleIcon from "@mui/icons-material/Article";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import SchoolIcon from "@mui/icons-material/School";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import moment from "moment";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

const typeIconMap = {
  NEW_POST: {
    icon: <ArticleIcon className="text-blue-500" />, // Post
    bg: "bg-blue-100",
  },
  BLOG_PUBLISHED: {
    icon: <AnnouncementIcon className="text-pink-500" />, // Blog
    bg: "bg-pink-100",
  },
  SESSION_REMINDER: {
    icon: <EventAvailableIcon className="text-green-600" />, // Catchup/Session
    bg: "bg-green-100",
  },
  SYSTEM_ANNOUNCEMENT: {
    icon: <AnnouncementIcon className="text-yellow-600" />, // Resource
    bg: "bg-yellow-100",
  },
  COURSE_UPDATE: {
    icon: <SchoolIcon className="text-purple-600" />, // Course
    bg: "bg-purple-100",
  },
  FORM_SUBMISSION: {
    icon: <AssignmentTurnedInIcon className="text-orange-600" />, // Service Request
    bg: "bg-orange-100",
  },
  COMMUNITY_INVITATION: {
    icon: <GroupAddIcon className="text-teal-600" />, // New Member
    bg: "bg-teal-100",
  },
};

const Notification = ({ notifications, scrollToBottom }) => {
  const router = useRouter();
  const containerRef = useRef();

  useEffect(() => {
    if (scrollToBottom && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [notifications, scrollToBottom]);

  const handleNotificationClick = (data) => {
    if (data.assets && data.assets.length > 0) {
      router.push(`/comThreads/6?postId=${data.id}`);
    } else {
      router.push(`/comThreads/6?postId=${data.id}`);
    }
  };

  // Reverse notifications so newest at the bottom
  const displayNotifications = notifications ? [...notifications].reverse() : [];

  return (
    <div ref={containerRef} className="max-h-[85vh] min-h-[80vh] overflow-y-auto pr-1 custom-scrollbar bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-100 w-full md:p-0">
      {displayNotifications.length > 0 ? (
        <div className="flex flex-col gap-1 w-full">
          {displayNotifications.map((data, index) => {
            const iconData = typeIconMap[data.type] || {
              icon: <Notifications className="text-gray-400" />, bg: "bg-gray-100"
            };
            return (
              <motion.div
                key={data.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.07 }}
                onClick={() => handleNotificationClick(data)}
                className="bg-white border border-gray-200 rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-300 cursor-pointer group relative overflow-hidden flex items-center gap-3 md:gap-4 w-full active:bg-primary-50"
              >
                <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${iconData.bg} shadow-sm`}>{iconData.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                      <span className="font-semibold text-gray-800 group-hover:text-primary-500 transition-colors text-sm md:text-base truncate">
                        {data?.creator?.user?.name}
                      </span>
                      <span className="text-gray-400 text-xs">•</span>
                      <span className="text-gray-500 text-xs font-medium truncate">{data.title}</span>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2 md:ml-4">{moment(data.createdAt).fromNow()}</span>
                  </div>
                  <div className="text-xs md:text-sm text-gray-700 truncate">
                    {data.message}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="min-h-[40vh] flex flex-col gap-4 items-center justify-center bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-100 p-6"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
            <Notifications className="text-3xl text-primary-500" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700 mb-1">No notifications yet</p>
            <p className="text-sm text-gray-400 max-w-sm">You'll see your notifications here when there are new announcements or polls in your community.</p>
          </div>
        </motion.div>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e0e7ef;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        @media (max-width: 768px) {
          .custom-scrollbar {
            border-radius: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Notification;
