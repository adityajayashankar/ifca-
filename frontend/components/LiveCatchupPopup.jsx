import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/features/userSlice';
import { toast } from 'react-hot-toast';
import api from '@/utils/apiSetup';
import axios from 'axios';
import { MdVideocam, MdClose, MdAccessTime } from 'react-icons/md';

const LiveCatchupPopup = () => {
  const [liveCatchups, setLiveCatchups] = useState([]);
  const [visiblePopups, setVisiblePopups] = useState({});
  const user = useSelector(selectUser);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log('Audio play failed:', err);
      });
    }
  };

  // Check for live catchups
  const checkLiveCatchups = async () => {
    if (!user?.unifiedUser?.id) return;

    try {
      const response = await api.get(`/catchup/user/${user.unifiedUser.id}/active-catchups`);
      if (response.data.success) {
        const activeCatchups = response.data.catchups;
        
        // Filter for truly live catchups (ongoing meetings)
        const liveOnes = activeCatchups.filter(catchup => {
          // Check if the catchup is currently live
          return catchup.isLive || catchup.status === 'live' || catchup.isInProgress;
        });

        // Check for new live catchups that weren't visible before
        const newLiveCatchups = liveOnes.filter(
          catchup => !visiblePopups[catchup.roomId]
        );

        // Show popups for new live catchups
        newLiveCatchups.forEach(catchup => {
          playNotificationSound();
          setVisiblePopups(prev => ({
            ...prev,
            [catchup.roomId]: true
          }));
        });

        // Remove popups for catchups that are no longer live
        const currentRoomIds = liveOnes.map(c => c.roomId);
        setVisiblePopups(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(roomId => {
            if (!currentRoomIds.includes(roomId)) {
              delete updated[roomId];
            }
          });
          return updated;
        });

        setLiveCatchups(liveOnes);
      }
    } catch (error) {
      console.error('Error checking live catchups:', error);
    }
  };

  // Handle joining a catchup
  const handleJoinCatchup = async (catchup) => {
    try {
      // Get token for 100ms
      const tkn = await api.get("/session/token");
      
      // Create guest code for the room
      const response = await axios.post(
        `https://api.100ms.live/v2/room-codes/room/${catchup.roomId}`,
        {
          user_id: user?.unifiedUser?.id,
          user_name: user?.name || 'User'
        },
        {
          headers: {
            Authorization: `Bearer ${tkn.data.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.data.length === 0) {
        toast.error('Unable to join catchup. Please try again.');
        return;
      }

      // Find appropriate code based on user role
      let joinCode;
      if (catchup.isHost) {
        const hostCode = response.data.data.find(item => item.role === 'host');
        joinCode = hostCode?.code;
      } else {
        const guestCode = response.data.data.find(item => item.role === 'guest');
        joinCode = guestCode?.code;
      }

      if (joinCode) {
        const redirectUrl = `https://aluminaries.app.100ms.live/meeting/${joinCode}`;
        window.open(redirectUrl, "_blank");
        
        // Remove the popup after joining
        setVisiblePopups(prev => {
          const updated = { ...prev };
          delete updated[catchup.roomId];
          return updated;
        });
      } else {
        toast.error('Unable to generate join link. Please try again.');
      }

    } catch (error) {
      console.error('Error joining catchup:', error);
      toast.error('Failed to join catchup. Please try again.');
    }
  };

  // Close a specific popup
  const closePopup = (roomId) => {
    setVisiblePopups(prev => {
      const updated = { ...prev };
      delete updated[roomId];
      return updated;
    });
  };

  // Set up polling interval
  useEffect(() => {
    if (!user?.unifiedUser?.id) return;

    // Initial check
    checkLiveCatchups();

    // Set up interval
    intervalRef.current = setInterval(checkLiveCatchups, 15000); // Check every 15 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user?.unifiedUser?.id]);

  // Don't render if no user
  if (!user?.unifiedUser?.id) {
    return null;
  }

  return (
    <>
      {/* Hidden audio element for notification sound */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>

      {/* Live Catchup Popups */}
      {liveCatchups.map(catchup => 
        visiblePopups[catchup.roomId] && (
          <div
            key={catchup.roomId}
            className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-2xl border border-orange-200 animate-slide-up"
            style={{
              animation: 'slideUp 0.3s ease-out'
            }}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 bg-orange-100 px-2 py-1 rounded-full">
                    <MdVideocam className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-medium text-orange-600">LIVE</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <MdAccessTime className="w-3 h-3" />
                    <span className="text-xs">Now</span>
                  </div>
                </div>
                <button
                  onClick={() => closePopup(catchup.roomId)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <img
                    className="w-12 h-12 rounded-lg object-cover"
                    src={catchup.communityBanner || '/comPic.svg'}
                    alt={catchup.communityName}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    Live Catchup in {catchup.communityName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {catchup.isHost ? 'You are the host' : `Hosted by ${catchup.creatorName}`}
                  </p>
                  <p className="text-xs text-orange-600 font-medium mt-1">
                    Click to join the live session!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleJoinCatchup(catchup)}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <MdVideocam className="w-4 h-4" />
                  <span>Join Live</span>
                </button>
                <button
                  onClick={() => closePopup(catchup.roomId)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default LiveCatchupPopup; 