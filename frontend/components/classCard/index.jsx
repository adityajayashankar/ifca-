import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import moment from "moment";
import { useRouter } from "next/router";

const ClassCard = ({ details, users, communityImage, isRegistered }) => {
  const router = useRouter();
  
  const participants = details?.SessionSlot?.reduce((total, item) => {
    return total + item.participantLimit;
  }, 0);
  const totalPrice = details?.SessionSlot[0]?.price;
  
  // Get session image with fallback to community image, then default
  const sessionImage = details?.infoImgs?.[0] || 
                       details?.bannerImgs?.[0] || 
                       communityImage || 
                       "/default-session.jpg";

  const dayCheckList = details?.SessionSlot.map((item) => {
    return (
      new Date(item.startTime).getDay === 6 ||
      new Date(item.startTime).getDay === 0
    );
  });

  const isWeekends = dayCheckList?.every((val) => {
    return val === true;
  });
  const isWeekdays = dayCheckList?.every((val) => {
    return val === false;
  });

  const discount = 0;

  const startDate = details?.SessionSlot.map((item) => {
    return item.startTime;
  })[0];

  const endDate = details?.SessionSlot.map((item) => {
    return item.startTime;
  }).slice(-1)[0];

  const isLive = details?.SessionSlot.filter((item) => {
    return (
      new Date().getTime() >= new Date(item.startTime).getTime() &&
      new Date().getTime() <= new Date(item.endTime).getTime()
    );
  }).length > 0;

  return (
    <div
      className="bg-white rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01] border border-gray-100 w-full"
      onClick={() => router.push(`/classDetails/${details?.id}`)}
    >
          {/* Image Section - Reduced height */}
          <div className="relative h-28 md:h-32 overflow-hidden bg-gray-50 border-b border-gray-100">
            <img
              className="w-full h-full object-contain transition-transform duration-300 hover:scale-105 p-2"
              src={sessionImage}
              alt={details?.title}
              onError={(e) => {
                // Fallback chain: community image -> default
                if (e.target.src !== communityImage && communityImage) {
                  e.target.src = communityImage;
                } else {
                  e.target.src = "/default-session.jpg";
                  e.target.onerror = null; // Prevent infinite loop
                }
              }}
            />
        
        {/* Live Badge - Smaller and positioned better */}
        {isLive && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            LIVE
          </div>
        )}
        
        {/* Registered Badge */}
        {isRegistered && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 z-10">
            <CheckCircleIcon className="w-3 h-3" />
            Registered
          </div>
        )}
        
        {/* Price Badge - Smaller and positioned better */}
        <div className={`absolute top-2 ${isRegistered ? 'right-2' : 'right-2'} bg-white/95 backdrop-blur-sm text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-bold`}>
          {totalPrice === 0 ? "FREE" : `₹${totalPrice}`}
      </div>
        
        {/* Bottom Info Bar - More compact with black inner shadow */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <div className="flex items-center justify-between text-white">
            <span className="text-[10px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{participants} participants</span>
            <span className="text-[10px] font-medium bg-white/20 px-1.5 py-0.5 rounded-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {moment(new Date(details?.SessionSlot[0].startTime)).format("hh:mm a")}
            </span>
          </div>
        </div>
      </div>

      {/* Content Section - Reduced padding */}
      <div className="p-2.5 md:p-3">
        {/* Title and Date in one line */}
        <div className="flex items-start justify-between mb-1.5 md:mb-2 gap-2">
          <h3 className="text-[13px] md:text-[14px] font-bold text-gray-900 line-clamp-2 leading-tight flex-1">
            {details?.title}
          </h3>
          <span className="text-[9px] md:text-[10px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
            {details?.SessionSlot.length} Sessions
          </span>
        </div>

        {/* Description - Shorter */}
        <p className="text-[11px] md:text-[12px] text-gray-600 mb-1.5 md:mb-2 line-clamp-2 leading-relaxed">
          {details?.desc}
        </p>

        {/* Bottom Section - More compact */}
        <div className="flex items-center justify-between flex-wrap gap-1.5 md:gap-0">
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            {/* Date Range */}
            <span className="text-[9px] md:text-[10px] text-gray-500">
              {moment(startDate).format("DD MMM")} - {moment(endDate).format("DD MMM")}
            </span>
            
            {/* Schedule Type */}
            <span className="text-[9px] md:text-[10px] text-gray-500">
              {isWeekdays ? "Weekdays" : isWeekends ? "Weekends" : "All Days"}
            </span>
          </div>
          
          {/* Exclusive Badge or Start Date */}
          <div className="flex items-center gap-1">
          {details?.isExclusive && (
              <div className="flex items-center gap-1 text-[9px] md:text-[10px] font-medium text-green-600">
                <CheckCircleIcon className="w-2.5 h-2.5 md:w-3 md:h-3" />
                <span>Exclusive</span>
            </div>
          )}
            {!isLive && !details?.isExclusive && (
              <span className="text-[9px] md:text-[10px] font-semibold text-orange-600">
                Starts {moment(details?.SessionSlot[0].startTime).format("DD MMM")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
