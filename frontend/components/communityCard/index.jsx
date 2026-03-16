import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Image from "next/image";
import { Groups } from '@mui/icons-material';

const CommunityCard = ({ details, noscroll, enroll, className = "", maxHeight, width }) => {
  const router = useRouter();

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`shrink-0 cursor-pointer ${className}`}
      style={{
        maxHeight: maxHeight,
        width: width
      }}
      onClick={() => 
        enroll
          ? window.location.href = `/comHome/${details.id}`
          : window.location.href = `/communityDetails/${details.id}`
      }
    >
      <div className="relative bg-white hover:bg-gray-50/50 transition-all duration-300 rounded-2xl md:rounded-3xl border-2 border-gray-200 hover:border-primary-500 hover:shadow-xl overflow-hidden group h-full">
        {/* Main Content Container */}
        <div className="relative flex flex-col h-full">
          {/* Banner Image with Overlay */}
          <div className="relative w-full h-[140px] md:h-[160px] overflow-hidden bg-gray-100 group-hover:bg-gray-50 transition-colors duration-300">
            {/* Main image - highest priority, always visible */}
            <div className="absolute inset-0" style={{ zIndex: 10 }}>
              <Image
                src={details?.bannerImg || "/communityCardImg.svg"}
                alt={details?.title}
                layout="fill"
                objectFit="contain"
                className="transition-transform duration-700 group-hover:scale-110"
                priority={false}
                unoptimized={false}
              />
            </div>
            
            {/* Background blur layer - behind image, very subtle */}
            <div 
              className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-10 group-hover:opacity-0 transition-opacity duration-300"
              style={{ 
                backgroundImage: `url(${details?.bannerImg || "/communityCardImg.svg"})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                zIndex: 1
              }}
            />
            
            {/* Light gradient overlay for text readability (only at bottom) - very subtle */}
            <div 
              className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none"
              style={{ zIndex: 15 }}
            />
            
            {/* Subtle hover overlay - very light tint, doesn't cover image */}
            <div 
              className="absolute inset-0 bg-gradient-to-b from-orange-500/0 to-transparent opacity-0 group-hover:opacity-2 transition-opacity duration-500 pointer-events-none"
              style={{ zIndex: 15 }}
            />
            
            {/* Top Badges */}
            <div className="absolute top-2 md:top-3 left-2 md:left-3 right-2 md:right-3 flex justify-between items-center z-30">
              {/* Community Badge */}
              <div className="flex items-center gap-1 md:gap-1.5 rounded-full bg-white/90 px-2 md:px-3 py-0.5 md:py-1 backdrop-blur-sm border border-white/20 shadow-lg">
                <Groups className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary-500" />
                <span className="text-[10px] md:text-[12px] font-semibold text-gray-800 hidden sm:inline">Community</span>
              </div>

              {/* Price Badge */}
              {details?.price === 0 ? (
                <div className="rounded-full bg-white/90 px-2 md:px-3 py-0.5 md:py-1 backdrop-blur-sm border border-white/20 shadow-lg">
                  <span className="text-[10px] md:text-[12px] font-semibold text-gray-800">Free</span>
                </div>
              ) : (
                <div className="rounded-full bg-white/90 px-2 md:px-3 py-0.5 md:py-1 backdrop-blur-sm border border-white/20 shadow-lg">
                  <span className="text-[10px] md:text-[12px] font-semibold text-primary-500">₹{details?.price}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="p-3 md:p-4 bg-white flex flex-col justify-start flex-grow">
            {/* Title */}
            <h6 className="text-sm md:text-base font-bold text-gray-800 mb-1 md:mb-1.5 line-clamp-1 leading-tight">
              {details?.title}
            </h6>

            {/* Description */}
            <div className="flex-grow">
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed md:leading-relaxed first-line:text-gray-900 text-start line-clamp-2">
                {details?.desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (noscroll) {
    return card;
  }

  return card;
};

export default CommunityCard;
