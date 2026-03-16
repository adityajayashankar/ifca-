import React from 'react';
import moment from 'moment';
import { CalendarIcon, ClockIcon, UserIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { MdVideocam, MdSchedule, MdCheckCircle, MdPlayArrow, MdAccessTime, MdEvent } from 'react-icons/md';

const ScheduledCatchup = ({ scheduledCatchups, onJoinCatchUp, showButtons, onInstantCatchUp, onScheduleCatchUp, isCheckingLiveCatchup, liveCatchup }) => {
  // Debug logging
  console.log("ScheduledCatchup props:", {
    scheduledCatchups: scheduledCatchups?.length,
    liveCatchup,
    showButtons,
    isCheckingLiveCatchup
  });

  // Check for joinable scheduled catchups
  const checkJoinableScheduledCatchups = () => {
    if (!scheduledCatchups.length) return null;
    
    const now = moment();
    return scheduledCatchups.find(catchup => {
      const scheduledTime = moment(catchup.scheduledAt);
      const timeUntilStart = scheduledTime.diff(now, 'minutes');
      const timeAfterStart = now.diff(scheduledTime, 'minutes');
      
      // Joinable if within 5 minutes before or 30 minutes after start
      return timeUntilStart <= 5 && timeAfterStart <= 30 && !catchup.isCompleted;
    });
  };

  const joinableScheduled = checkJoinableScheduledCatchups();
  
  console.log("ScheduledCatchup render:", {
    hasScheduledCatchups: scheduledCatchups?.length > 0,
    liveCatchup,
    joinableScheduled
  });

  // Get status for a catchup
  const getCatchupStatus = (catchup) => {
    const scheduledDate = moment(catchup.scheduledAt);
    const now = moment();
    const timeUntilStart = scheduledDate.diff(now, 'minutes');
    const timeAfterStart = now.diff(scheduledDate, 'minutes');
    
    if (catchup.isCompleted) {
      return { status: 'completed', label: 'Completed', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
    }
    
    if (timeUntilStart > 5) {
      return { status: 'upcoming', label: 'Upcoming', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' };
    }
    
    if (timeAfterStart > 30) {
      return { status: 'ended', label: 'Ended', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
    }
    
    return { status: 'live', label: 'Live Now', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' };
  };
  
  if (!scheduledCatchups || scheduledCatchups.length === 0) {
    return (
      <div className="space-y-6">
        {/* Live CatchUp Notification - Show when there's a live catchup */}
        {liveCatchup && (
          <div className="bg-gradient-to-r from-red-50 via-red-100 to-red-50 rounded-2xl p-6 border border-red-200 shadow-lg mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <div>
                  <p className="font-bold text-red-800 text-lg">
                    {liveCatchup.isHost 
                      ? "🎥 You are hosting a live catchup" 
                      : "🔴 Live CatchUp in Progress"
                    }
                  </p>
                  {!liveCatchup.isHost && (
                    <p className="text-sm text-red-600 mt-1">
                      Join the ongoing session now
                    </p>
                  )}
                </div>
              </div>
              <button
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:scale-105"
                onClick={() => onJoinCatchUp(liveCatchup)}
              >
                <MdPlayArrow className="w-5 h-5" />
                {liveCatchup.isHost ? 'Continue Hosting' : 'Join Now'}
              </button>
            </div>
          </div>
        )}

        {/* Loading state when checking for live catchup */}
        {isCheckingLiveCatchup && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-6"></div>
            <p className="text-gray-600 font-medium">Checking for live sessions...</p>
          </div>
        )}

        {/* Buttons only - Centered when no scheduled catchups, no message */}
        {!isCheckingLiveCatchup && showButtons && !liveCatchup && (
          <div className="flex justify-center gap-4">
            <button
              onClick={onInstantCatchUp}
              className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <MdVideocam className="w-5 h-5" />
              Instant CatchUp
            </button>
            <button
              onClick={onScheduleCatchUp}
              className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <MdSchedule className="w-5 h-5" />
              Schedule CatchUp
            </button>
          </div>
        )}

        {/* Meeting in Progress Button - Show when host has live catchup */}
        {!isCheckingLiveCatchup && liveCatchup && liveCatchup.isHost && (
          <div className="flex justify-center">
            <button
              disabled
              className="inline-flex items-center gap-3 px-6 py-3 bg-gray-400 text-white rounded-xl font-bold cursor-not-allowed opacity-75"
            >
              <MdVideocam className="w-5 h-5" />
              Meeting in progress...
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live CatchUp Notification - Show when there's a live catchup */}
      {console.log("Rendering live catchup notification (with scheduled):", liveCatchup)}
      {liveCatchup && (
        <div className="bg-gradient-to-r from-red-50 via-red-100 to-red-50 rounded-2xl p-6 border border-red-200 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <div>
                <p className="font-bold text-red-800 text-lg">
                  {liveCatchup.isHost 
                    ? "🎥 You are hosting a live catchup" 
                    : "🔴 Live CatchUp in Progress"
                  }
                </p>
                {!liveCatchup.isHost && (
                  <p className="text-sm text-red-600 mt-1">
                    Join the ongoing session now
                  </p>
                )}
              </div>
            </div>
            <button
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:scale-105"
              onClick={() => onJoinCatchUp(liveCatchup)}
            >
              <MdPlayArrow className="w-5 h-5" />
              {liveCatchup.isHost ? 'Continue Hosting' : 'Join Now'}
            </button>
          </div>
        </div>
      )}

      {/* Title and Buttons on same line - Only show when there are scheduled catchups */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          Scheduled CatchUps
          <span className="ml-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {scheduledCatchups.length}
          </span>
        </h3>
        
        {/* CatchUp Buttons - Show Instant/Schedule when no live catchup */}
        {showButtons && !liveCatchup && (
          <div className="flex gap-4">
            <button
              onClick={onInstantCatchUp}
              className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <MdVideocam className="w-5 h-5" />
              Instant CatchUp
            </button>
            <button
              onClick={onScheduleCatchUp}
              className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <MdSchedule className="w-5 h-5" />
              Schedule CatchUp
            </button>
          </div>
        )}

        {/* Meeting in Progress Button - Show when host has live catchup */}
        {liveCatchup && liveCatchup.isHost && (
          <button
            disabled
            className="inline-flex items-center gap-3 px-6 py-3 bg-gray-400 text-white rounded-xl font-bold cursor-not-allowed opacity-75"
          >
            <MdVideocam className="w-5 h-5" />
            Meeting in progress...
          </button>
        )}
      </div>
    
      {/* Scheduled Catchup Notification - Show when there's a joinable scheduled catchup */}
      {console.log("Rendering scheduled catchup notification:", { joinableScheduled, liveCatchup })}
      {joinableScheduled && !liveCatchup && (
        <div className="bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 rounded-2xl p-6 border border-blue-200 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <div>
                <p className="font-bold text-blue-800 text-lg">
                  🕒 Scheduled CatchUp is Live
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Join the scheduled meeting now
                </p>
              </div>
            </div>
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:scale-105"
              onClick={() => onJoinCatchUp(joinableScheduled)}
            >
              <MdPlayArrow className="w-5 h-5" />
              Join Now
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {scheduledCatchups.map((catchup) => {
              const status = getCatchupStatus(catchup);
              const isJoinable = status.status === 'live';
              
              return (
                <div
                  key={catchup.id}
                  className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition-colors">
                          {catchup.title || 'Untitled CatchUp'}
                        </h4>
                        <span className={`px-3 py-1 ${status.bgColor} ${status.textColor} text-xs font-bold rounded-full`}>
                          {status.label}
                        </span>
                      </div>
                      
                      {catchup.description && (
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{catchup.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MdEvent className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-700">
                        {moment(catchup.scheduledAt).format('dddd, MMMM D, YYYY')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <MdAccessTime className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-semibold text-gray-700">
                        {moment(catchup.scheduledAt).format('h:mm A')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-semibold text-gray-700">
                        Hosted by {catchup.creatorName || 'Community Member'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 font-medium">
                      {moment(catchup.scheduledAt).fromNow()}
                    </div>
                    
                    <div className="flex gap-2">
                      {isJoinable ? (
                        <button
                          onClick={() => onJoinCatchUp(catchup)}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:scale-105"
                        >
                          <VideoCameraIcon className="w-4 h-4" />
                          Join Meeting
                        </button>
                      ) : (
                        <span className={`px-6 py-2 rounded-xl text-sm font-bold ${status.bgColor} ${status.textColor}`}>
                          {status.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledCatchup; 