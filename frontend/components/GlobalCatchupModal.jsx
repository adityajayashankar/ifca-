import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdVideocam, MdSchedule, MdAccessTime, MdPerson, MdCheckCircle, MdPlayCircle } from 'react-icons/md';
import moment from 'moment';

const GlobalCatchupModal = ({ 
  isOpen, 
  onClose, 
  catchup, 
  onJoinCatchUp, 
  onScheduleCatchUp,
  onInstantCatchUp,
  communityName = 'Community'
}) => {
  const [currentTime, setCurrentTime] = useState(moment());

  // Update current time every minute
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setCurrentTime(moment());
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper function to check if catchup is within joinable time window (10 minutes before to 10 minutes after)
  const isWithinJoinableWindow = (scheduledDate) => {
    const timeUntilStart = scheduledDate.diff(currentTime, 'minutes');
    const timeAfterStart = currentTime.diff(scheduledDate, 'minutes');
    
    // Joinable from 10 minutes before to 10 minutes after start time
    return timeUntilStart >= -10 && timeAfterStart <= 10;
  };

  // Helper function to get time status text
  const getTimeStatusText = (scheduledDate) => {
    const timeUntilStart = scheduledDate.diff(currentTime, 'minutes');
    const timeAfterStart = currentTime.diff(scheduledDate, 'minutes');
    
    if (timeUntilStart > 10) {
      return `Starts in ${Math.ceil(timeUntilStart)} minutes`;
    } else if (timeUntilStart > 0) {
      return `Starting in ${Math.ceil(timeUntilStart)} minutes`;
    } else if (timeAfterStart <= 10) {
      return timeAfterStart > 0 ? `Started ${Math.ceil(timeAfterStart)} minutes ago` : 'Join now!';
    } else {
      return `Ended ${Math.ceil(timeAfterStart)} minutes ago`;
    }
  };

  const handleJoinCatchUp = () => {
    if (catchup && onJoinCatchUp) {
      onJoinCatchUp(catchup);
    }
    onClose();
  };

  const handleScheduleCatchUp = () => {
    if (onScheduleCatchUp) {
      onScheduleCatchUp();
    }
    onClose();
  };

  const handleInstantCatchUp = () => {
    if (onInstantCatchUp) {
      onInstantCatchUp();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <MdVideocam className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">CatchUp</h2>
                  <p className="text-sm text-gray-500">{communityName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <MdClose className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {catchup ? (
                // Show specific catchup details
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{catchup.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{catchup.desc}</p>
                    
                    {/* Status Badge */}
                    <div className="mb-4">
                      {catchup.isCompleted && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                          <MdCheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </span>
                      )}
                      {catchup.isInProgress && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                          <MdPlayCircle className="w-3 h-3 mr-1" />
                          Live Now
                        </span>
                      )}
                      {isWithinJoinableWindow(moment(catchup.scheduledAt)) && !catchup.isCompleted && !catchup.isInProgress && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                          <MdVideocam className="w-3 h-3 mr-1" />
                          Joinable
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MdSchedule className="w-4 h-4 text-gray-400" />
                        <span>{moment(catchup.scheduledAt).format('MMMM Do, YYYY')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MdAccessTime className="w-4 h-4 text-gray-400" />
                        <span>{moment(catchup.scheduledAt).format('h:mm A')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MdPerson className="w-4 h-4 text-gray-400" />
                        <span>Hosted by {catchup.creatorName || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {(catchup.isInProgress || isWithinJoinableWindow(moment(catchup.scheduledAt))) && !catchup.isCompleted && (
                      <button
                        onClick={handleJoinCatchUp}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                      >
                        <MdVideocam className="w-4 h-4" />
                        {catchup.isInProgress ? 'Join Live' : 'Join CatchUp'}
                      </button>
                    )}
                    
                    {!catchup.isInProgress && !isWithinJoinableWindow(moment(catchup.scheduledAt)) && !catchup.isCompleted && (
                      <div className="text-center py-3">
                        <p className="text-sm text-gray-500 mb-2">{getTimeStatusText(moment(catchup.scheduledAt))}</p>
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium">
                          {moment(catchup.scheduledAt).isBefore(currentTime) ? (
                            <>
                              <MdCheckCircle className="w-4 h-4" />
                              Ended
                            </>
                          ) : (
                            <>
                              <MdSchedule className="w-4 h-4" />
                              Too Early
                            </>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Show options to create new catchup
                <div>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MdVideocam className="w-8 h-8 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a CatchUp</h3>
                    <p className="text-sm text-gray-600">Choose how you want to start a CatchUp for {communityName}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleInstantCatchUp}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                      <MdVideocam className="w-4 h-4" />
                      Start Instant CatchUp
                    </button>
                    
                    <button
                      onClick={handleScheduleCatchUp}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                      <MdSchedule className="w-4 h-4" />
                      Schedule CatchUp
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalCatchupModal;








