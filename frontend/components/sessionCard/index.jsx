import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Card, Typography, Box, Chip } from '@mui/material';
import { CalendarMonth, AccessTime, Person, LiveTv } from "@mui/icons-material";
import moment from "moment";

const SessionCard = ({ session }) => {
  const router = useRouter();
  const sessionDate = moment(session?.SessionSlot[0]?.startTime);
  const isToday = sessionDate.isSame(moment(), 'day');
  const isTomorrow = sessionDate.isSame(moment().add(1, 'day'), 'day');

  // Get the best available image for the session
  const getSessionImage = () => {
    if (session?.bannerImgs && session.bannerImgs.length > 0) {
      return session.bannerImgs[0];
    }
    if (session?.infoImgs && session.infoImgs.length > 0) {
      return session.infoImgs[0];
    }
    return "/tablaSchedule.svg";
  };

  const sessionImage = getSessionImage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="w-[280px] md:w-[320px] aspect-square shrink-0 cursor-pointer"
      onClick={() => router.push("/classDetails/" + session?.id)}
    >
      <Card className="relative bg-white hover:bg-gray-50/50 transition-all duration-300 rounded-3xl border-2 border-gray-200 hover:border-primary-500 hover:shadow-xl overflow-hidden group h-full flex flex-col">
        {/* Main Content Container */}
        <div className="relative h-full flex flex-col">
          {/* Banner Image with Overlay */}
          <div className="relative w-full flex-shrink-0" style={{ height: '60%', maxHeight: '200px', minHeight: '160px' }}>
            {/* Background blur layer */}
            <div 
              className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-70"
              style={{ backgroundImage: `url(${sessionImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
            {/* Main image */}
            <div className="relative h-full w-full z-10 bg-gray-50">
              <img
                src={sessionImage}
                alt={session.title}
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                style={{ maxHeight: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  e.target.src = "/tablaSchedule.svg";
                  e.target.onerror = null; // Prevent infinite loop
                }}
              />
            </div>
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-25 pointer-events-none" />
            {/* Top Badges */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-30">
              {/* Session Badge */}
              <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 backdrop-blur-sm border border-white/20 shadow-lg">
                <LiveTv className="h-3 w-3 text-primary-500" />
                <span className="text-[10px] font-semibold text-gray-800">Session</span>
              </div>
              {/* Free/Paid Badge */}
              {session.price === 0 ? (
                <div className="rounded-full bg-white/90 px-2.5 py-1 backdrop-blur-sm border border-white/20 shadow-lg">
                  <span className="text-[10px] font-semibold text-gray-800">Free</span>
                </div>
              ) : (
                <div className="rounded-full bg-white/90 px-2.5 py-1 backdrop-blur-sm border border-white/20 shadow-lg">
                  <span className="text-[10px] font-semibold text-primary-500">₹{session.price}</span>
                </div>
              )}
            </div>
            {/* Title - Positioned at bottom with proper spacing */}
            <div className="absolute bottom-0 left-0 right-0 p-3 pb-4 z-30">
              <Typography 
                variant="h6" 
                className="text-base font-bold text-white line-clamp-2 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                style={{ 
                  textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.6)',
                  maxHeight: '3rem',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {session.title}
              </Typography>
            </div>
          </div>
          {/* Bottom Section */}
          <div className="flex-1 px-4 py-3 bg-white flex flex-col justify-between min-h-0">
            {/* Description */}
            <div className="pt-1">
              <Typography 
                variant="body2" 
                className="text-gray-600 text-xs leading-relaxed line-clamp-2"
              >
                {session.SessionSlot[0]?.topicName}
              </Typography>
            </div>
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {/* Date Chip */}
              <Chip 
                label={isToday ? 'Today' : isTomorrow ? 'Tomorrow' : sessionDate.format("MMM D, YYYY")}
                size="small"
                icon={<CalendarMonth className="h-3 w-3 text-primary-500" />}
                className="bg-primary-50 text-primary-600 text-[10px] font-medium h-5 px-2 rounded-full"
              />
              {/* Time Chip */}
              <Chip 
                label={sessionDate.format("h:mm A")}
                size="small"
                icon={<AccessTime className="h-3 w-3 text-primary-500" />}
                className="bg-primary-50 text-primary-600 text-[10px] font-medium h-5 px-2 rounded-full"
              />
              {/* Speaker Chip */}
              {session.SessionSlot[0]?.speakers?.[0]?.name && (
                <Chip 
                  label={session.SessionSlot[0]?.speakers?.[0]?.name}
                  size="small"
                  icon={<Person className="h-3 w-3 text-primary-500" />}
                  className="bg-primary-50 text-primary-600 text-[10px] font-medium h-5 px-2 rounded-full"
                />
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default SessionCard; 