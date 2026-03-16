import React from 'react';
import { MdVideocam, MdPlayArrow, MdClose } from 'react-icons/md';

const LiveCatchupBanner = ({ 
  isVisible, 
  onJoin, 
  onClose, 
  catchupType = "instant", // "instant" or "scheduled"
  hostName = "Unknown",
  isHost = false
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Icon and message */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <MdVideocam className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">
                {isHost 
                  ? "You are hosting a live catchup" 
                  : `A ${catchupType === "instant" ? "catchup" : "meeting"} is currently live`
                }
              </p>
              {!isHost && (
                <p className="text-sm text-green-100">
                  Hosted by {hostName}
                </p>
              )}
            </div>
          </div>

          {/* Right side - Join button and close */}
          <div className="flex items-center gap-3">
            {!isHost && (
              <button
                onClick={onJoin}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors shadow-sm"
              >
                <MdPlayArrow className="w-4 h-4" />
                Join Now
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-green-400 rounded transition-colors"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveCatchupBanner; 