import { setSelectedSession } from "@/store/features/session";
import Image from "next/image";
import { useRouter } from "next/router";
import { MdAccessTime, MdCalendarToday, MdLocationOn, MdLiveTv, MdPerson } from "react-icons/md";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";

const Card = ({ session, baseURL, view, edit }) => {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleSaveAndRedirect = (session) => {
    dispatch(setSelectedSession(session));
    router.push(`/admin/session/${session?.id}`);
  };

  const handleEdit = (session) => {
    dispatch(setSelectedSession(session));
    router.push(`/admin/session/create/${session?.id}`);
  };

  const sessionDate = session?.SessionSlot[0]?.startTime ? new Date(session.SessionSlot[0].startTime) : null;
  const isToday = sessionDate ? new Date().toDateString() === sessionDate.toDateString() : false;
  const isTomorrow = sessionDate ? new Date(Date.now() + 86400000).toDateString() === sessionDate.toDateString() : false;

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl relative shadow-sm hover:shadow-md transition-all duration-300 border text-gray-800 group-hover:border-orange-200 group h-full"
    >
      {/* Top Banner with Date */}
      <div className="absolute top-0 left-0 right-0 h-[40px] bg-gradient-to-r from-gray-100 group-hover:from-orange-100  to-gray-200 group-hover:to-orange-200/70 rounded-t-xl flex items-center justify-between px-3 text-gray-800 group-hover:text-orange-700">
        <div className="flex items-center gap-1.5">
          <MdCalendarToday className="w-4 h-4" />
          <div>
            <span className="text-xs font-medium">
              {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : sessionDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <div className="flex items-center gap-1 text-gray-800 group-hover:text-orange-700">
              <MdAccessTime className="w-3 h-3" />
              <span className="text-[10px]">
                {sessionDate?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-2 py-0.5 bg-gradient-to-r text-gray-800 group-hover:from-orange-400  group-hover:to-orange-500  group-hover:text-white rounded-full flex items-center gap-1 shadow-sm"
        >
          {session.isVideoChannel || session.SessionSlot[0]?.isOnline ? (
            <MdLiveTv className="w-3 h-3" />
          ) : (
            <MdLocationOn className="w-3 h-3" />
          )}
          <span className="text-[10px] font-medium">
            {session.isVideoChannel || session.SessionSlot[0]?.isOnline ? "Online" : "Offline"}
          </span>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="pt-[50px] p-4 flex gap-3">
        {/* Left: Image */}
        <div className="w-[80px] h-[80px] rounded-lg overflow-hidden flex-shrink-0 border-2 text-gray-800 group-hover:border-orange-100">
          <motion.div
            className="h-full w-full"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.4 }}
          >
            <img
              src={session?.bannerImgs?.[0] || "/tablaSchedule.svg"}
              alt={session.title}
              className="h-full w-full object-contain"
            />
          </motion.div>
        </div>

        {/* Right: Content */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-bold text-gray-800 my-0 line-clamp-1 group-hover:text-orange-700 transition-colors"
            >
              {session.title}
            </motion.h3>
            {session.topicName && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="text-xs text-orange-600 font-medium leading-snug line-clamp-1 mt-0.5"
              >
                {session.topicName}
              </motion.p>
            )}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-xs text-gray-500 leading-[1.5] line-clamp-1 mt-1 min-h-[20px]"
            >
              {session.desc}
            </motion.p>
          </div>

          <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex items-center gap-2">
              {(() => {
                // Collect all unique speakers from all slots
                const allSpeakers = (session?.SessionSlot || [])
                  .flatMap(slot => Array.isArray(slot.speakers) ? slot.speakers : [])
                  .filter(Boolean);
                // Remove duplicates by id or name
                const uniqueSpeakers = [];
                const seen = new Set();
                for (const sp of allSpeakers) {
                  const key = sp.id || sp.name;
                  if (key && !seen.has(key)) {
                    uniqueSpeakers.push(sp);
                    seen.add(key);
                  }
                }
                if (uniqueSpeakers.length > 0) {
                  return <>
                    <div className="flex flex-col items-start">
                      <div className="flex gap-1 mb-1">
                        {uniqueSpeakers.slice(0, 2).map((sp, idx) =>
                          sp.photoURL ? (
                            <img
                              key={sp.id || sp.name || idx}
                              src={sp.photoURL}
                              alt={sp.name || "Speaker"}
                              className="w-5 h-5 rounded-md object-cover border border-gray-200 bg-white"
                            />
                          ) : (
                            <span key={sp.id || sp.name || idx} className="w-5 h-5 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-300">
                              <MdPerson className="w-4 h-4" />
                            </span>
                          )
                        )}
                        {uniqueSpeakers.length > 2 && (
                          <span className="w-5 h-5 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500">
                            +{uniqueSpeakers.length - 2}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-800 text-left block max-w-[120px] truncate">
                        {uniqueSpeakers.slice(0, 2).map(s => s.name).filter(Boolean).join(', ')}
                        {uniqueSpeakers.length > 2 && ` +${uniqueSpeakers.length - 2} more`}
              </span>
                    </div>
                  </>;
                } else {
                  return <div className="flex flex-col items-start">
                    <img
                      src="/user-default.png"
                      alt="No Speaker"
                      className="w-5 h-5 rounded-md object-cover border border-gray-200 mb-1"
                    />
                    <span className="text-xs text-gray-500 text-left">No Speaker</span>
                  </div>;
                }
              })()}
            </div>
            <div
              className="flex gap-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto translate-y-2 group-hover:translate-y-0 transition-all duration-300"
            >
              {view && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSaveAndRedirect(session)}
                  className="relative overflow-hidden bg-gradient-to-r from-orange-600 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium transition-colors hover:from-orange-500 hover:to-orange-600 focus:ring-2 focus:ring-orange-300"
                >
                  <span className="relative z-10">View</span>
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700 z-0"></div>
                </motion.button>
              )}
              {edit && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleEdit(session)}
                  className="relative overflow-hidden bg-gradient-to-r from-orange-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium transition-colors hover:from-orange-500 hover:to-orange-600 focus:ring-2 focus:ring-orange-300"
                >
                  <span className="relative z-10">Edit</span>
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700 z-0"></div>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Card;
