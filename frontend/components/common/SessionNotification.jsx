import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, selectOngoingSessions, getUserOngoingSessions } from '../../store/features/userSlice';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const SessionNotification = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector(selectUser);
  const ongoingSessions = useSelector(selectOngoingSessions);
  const [lastNotificationTime, setLastNotificationTime] = useState({});
  const [isPageVisible, setIsPageVisible] = useState(true);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log('Audio play failed:', err);
        // Fallback: try to play a simple beep using Web Audio API
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        } catch (fallbackErr) {
          console.log('Fallback audio also failed:', fallbackErr);
        }
      });
    }
  };

  // Show notification toast
  const showSessionNotification = (session) => {
    // Only show notifications when page is visible
    if (!isPageVisible) {
      return;
    }

    const sessionKey = `${session.id}-${session.sessionSlots?.[0]?.id}`;
    const now = Date.now();
    
    // Check if we've already shown a notification for this session in the last 2 minutes
    if (lastNotificationTime[sessionKey] && (now - lastNotificationTime[sessionKey]) < 120000) {
      return;
    }

    // Play sound
    playNotificationSound();

    // Show toast notification
    toast.custom(
      (t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <img 
                  className="h-12 w-12 rounded-lg object-cover" 
                  src={session.bannerImgs?.[0] || session.infoImgs?.[0] || '/default-session.png'} 
                  alt={session.title}
                  onError={(e) => {
                    e.target.src = '/default-session.png';
                    e.target.onerror = null; // Prevent infinite loop
                  }}
                />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Session Starting Soon!
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {session.title}
                </p>
                {session.sessionSlots?.[0] && (
                  <p className="mt-1 text-xs text-orange-600 font-medium">
                    {new Date(session.sessionSlots[0].startTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push(`/sessions/${session.id}`);
                }}
                className="flex-1 bg-orange-500 text-white text-xs px-3 py-2 rounded-md hover:bg-orange-600 transition-colors"
              >
                View Details
              </button>
              {session.sessionSlots?.[0]?.attendanceDetails?.link && (
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    window.open(session.sessionSlots[0].attendanceDetails.link, '_blank');
                  }}
                  className="flex-1 bg-green-500 text-white text-xs px-3 py-2 rounded-md hover:bg-green-600 transition-colors"
                >
                  Join Now
                </button>
              )}
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              ×
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        position: 'top-right',
      }
    );

    // Update last notification time
    setLastNotificationTime(prev => ({
      ...prev,
      [sessionKey]: now
    }));
  };

  // Check for ongoing sessions and show notifications
  useEffect(() => {
    if (ongoingSessions?.sessions && ongoingSessions.sessions.length > 0) {
      console.log('Checking ongoing sessions:', ongoingSessions.sessions.length);
      ongoingSessions.sessions.forEach(session => {
        if (session.sessionSlots && session.sessionSlots.length > 0) {
          const slot = session.sessionSlots[0];
          const startTime = new Date(slot.startTime);
          const now = new Date();
          const timeDiff = startTime.getTime() - now.getTime();
          
          console.log(`Session ${session.title}: starts in ${Math.round(timeDiff / 1000 / 60)} minutes`);
          
          // Show notification if session starts within 5 minutes and hasn't started yet
          if (timeDiff > 0 && timeDiff <= 300000) { // 5 minutes in milliseconds
            console.log(`Showing notification for session: ${session.title}`);
            showSessionNotification(session);
          }
        }
      });
    }
  }, [ongoingSessions]);

  // Set up interval to check for ongoing sessions every 30 seconds
  useEffect(() => {
    if (user?.id && user.id !== 0) {
      // Initial check
      dispatch(getUserOngoingSessions(user.id));
      
      // Set up interval only if page is visible
      if (isPageVisible) {
        intervalRef.current = setInterval(() => {
          dispatch(getUserOngoingSessions(user.id));
        }, 30000); // 30 seconds
      }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [user?.id, dispatch, isPageVisible]);

  // Update interval when page visibility changes
  useEffect(() => {
    if (user?.id && user.id !== 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (isPageVisible) {
        intervalRef.current = setInterval(() => {
          dispatch(getUserOngoingSessions(user.id));
        }, 30000);
      }
    }
  }, [isPageVisible, user?.id]);

  // Don't render anything if user is not authenticated
  if (!user?.id || user.id === 0) {
    return null;
  }

  return (
    <>
      {/* Hidden audio element for notification sound */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>
    </>
  );
};

export default SessionNotification; 