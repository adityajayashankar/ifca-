import ScheduleIcon from "@mui/icons-material/Schedule";
import { useSelector } from "react-redux";
import { selectCommunitySessions } from "@/store/features/communitySlice";
import moment from "moment";
import { motion } from "framer-motion";

const EventCard = ({ slot, isFeatured }) => {
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
        w-full
        min-w-0
      `}
      style={{ minHeight: 120 }}
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
          <h4 className={`text-base font-bold mb-1 truncate ${isFeatured ? "text-orange-900" : "text-gray-900"}`}>
            {slot.topicName || slot.sessionTitle}
          </h4>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ScheduleIcon className="w-4 h-4 text-orange-400" />
            <span className="whitespace-nowrap">
              {moment(slot.startTime).format("dddd")}, {moment(slot.startTime).format("hh:mm a")} - {moment(slot.endTime).format("hh:mm a")}
            </span>
          </div>
        </div>
      </div>
      {/* Status Icon */}
      <div className="flex items-center">
        <div className="bg-orange-100 p-3 rounded-full flex items-center justify-center">
          <img src="/sessQuiz.svg" alt="" className="w-6 h-6" />
        </div>
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

const EventSchedule = () => {
  const communitySessions = useSelector(selectCommunitySessions);

  // Get all slots from all sessions and sort them by start time
  const allSlots = communitySessions
    .flatMap(session => 
      session.SessionSlot.map(slot => ({
        ...slot,
        sessionTitle: session.title,
        sessionId: session.id
      }))
    )
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  // Separate upcoming and past slots
  const now = new Date();
  const upcomingSlots = allSlots.filter(slot => new Date(slot.endTime) > now);

  if (!allSlots || allSlots.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 flex flex-col items-center justify-center text-center"
      >
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <ScheduleIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No sessions scheduled</h3>
        <p className="text-gray-500">Check back later for upcoming events!</p>
      </motion.div>
    );
  }

  // Show up to 2 upcoming sessions
  const displaySlots = upcomingSlots.slice(0, 2);

  return (
    <div className="space-y-6">
      <h4 className="text-base font-semibold text-gray-900 mb-4 mt-4 flex items-center gap-2">
        <ScheduleIcon className="w-5 h-5 text-orange-400" />
        Upcoming Sessions
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displaySlots.map((slot, idx) => (
          <EventCard key={slot.id} slot={slot} isFeatured={idx === 0} />
        ))}
      </div>
    </div>
  );
};

export default EventSchedule;
