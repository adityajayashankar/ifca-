import React, { useState, useEffect } from 'react';
import { MdSchedule, MdAccessTime, MdPerson, MdVideocam, MdCheckCircle, MdPlayCircle, MdEvent, MdMoreVert, MdGroup, MdRefresh } from 'react-icons/md';
import moment from 'moment';
import api from '../utils/apiSetup';

const ScheduledCatchup = ({ scheduledCatchups, onJoinCatchUp, showButtons, onInstantCatchUp, onScheduleCatchUp, isCheckingLiveCatchup, liveCatchup, communityId }) => {
  const [catchupAttendees, setCatchupAttendees] = useState({});
  const [loadingAttendees, setLoadingAttendees] = useState({});

  // Sort catchups: live first, upcoming next, finished last
  const sortCatchups = (catchups) => {
    return catchups.sort((a, b) => {
      // Live catchups first (isInProgress)
      if (a.isInProgress && !b.isInProgress) return -1;
      if (!a.isInProgress && b.isInProgress) return 1;
      
      // Then upcoming catchups (isUpcoming)
      if (a.isUpcoming && !b.isUpcoming) return -1;
      if (!a.isUpcoming && b.isUpcoming) return 1;
      
      // Finally completed catchups (isCompleted)
      if (a.isCompleted && !b.isCompleted) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;
      
      // If same status, sort by start time
      return moment(a.startTime).diff(moment(b.startTime));
    });
  };

  // Function to fetch attendees for a catchup
  const fetchCatchupAttendees = async (catchupId, roomId, communityId) => {
    if (!roomId || !communityId) return;
    
    setLoadingAttendees(prev => ({ ...prev, [catchupId]: true }));
    
    try {
      console.log(`Fetching attendees for catchup ${catchupId}, room ${roomId}, community ${communityId}`);
      const response = await api.get(`/catchup/status/${roomId}/${communityId}`);
      console.log('Attendance response:', response?.data);
      
      if (response?.data?.success && response.data.catchup?.attendees) {
        const attendees = response.data.catchup.attendees;
        console.log(`Found ${attendees.length} attendees for catchup ${catchupId}:`, attendees);
        
        setCatchupAttendees(prev => ({
          ...prev,
          [catchupId]: attendees
        }));
      } else {
        console.log('No attendees found or invalid response for catchup:', catchupId);
        setCatchupAttendees(prev => ({
          ...prev,
          [catchupId]: []
        }));
      }
    } catch (error) {
      console.error('Error fetching attendees:', error);
      setCatchupAttendees(prev => ({
        ...prev,
        [catchupId]: []
      }));
    } finally {
      setLoadingAttendees(prev => ({ ...prev, [catchupId]: false }));
    }
  };

  // Fetch attendees for live catchups
  useEffect(() => {
    if (liveCatchup && liveCatchup.roomId && communityId) {
      fetchCatchupAttendees('live', liveCatchup.roomId, communityId);
    }
  }, [liveCatchup, communityId]);

  // Fetch attendees for all live catchups in the list
  useEffect(() => {
    if (scheduledCatchups && communityId) {
      scheduledCatchups.forEach(catchup => {
        if (catchup.isInProgress && catchup.roomId) {
          fetchCatchupAttendees(catchup.id, catchup.roomId, communityId);
        }
      });
    }
  }, [scheduledCatchups, communityId]);

  // Periodic refresh for live catchups
  useEffect(() => {
    const interval = setInterval(() => {
      if (scheduledCatchups && communityId) {
        scheduledCatchups.forEach(catchup => {
          if (catchup.isInProgress && catchup.roomId) {
            fetchCatchupAttendees(catchup.id, catchup.roomId, communityId);
          }
        });
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [scheduledCatchups, communityId]);

  const sortedCatchups = scheduledCatchups ? sortCatchups([...scheduledCatchups]) : [];

  if (!scheduledCatchups || scheduledCatchups.length === 0) {
    return (
      <div className="mt-6">
        {/* CatchUp Buttons - Above the title */}
        {showButtons && (
          <div className="flex justify-end gap-3 mb-4">
            <button
              onClick={onInstantCatchUp}
              disabled={isCheckingLiveCatchup}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md disabled:cursor-not-allowed"
            >
              <MdVideocam className="w-4 h-4" />
              {isCheckingLiveCatchup ? 'Checking...' : 'Instant CatchUp'}
            </button>
            <button
              onClick={onScheduleCatchUp}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
            >
              <MdSchedule className="w-4 h-4" />
              Schedule CatchUp
            </button>
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MdSchedule className="w-5 h-5 text-orange-500" />
          Scheduled CatchUps
        </h3>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdSchedule className="w-8 h-8 text-orange-500" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Scheduled CatchUps</h4>
          <p className="text-gray-500 text-sm">No CatchUps have been scheduled yet. Check back later!</p>
        </div>
      </div>
    );
  }

  // Helper function to check if catchup is within joinable time window (10 minutes before to 10 minutes after)
  const isWithinJoinableWindow = (scheduledDate) => {
    const now = moment();
    const timeUntilStart = scheduledDate.diff(now, 'minutes');
    const timeAfterStart = now.diff(scheduledDate, 'minutes');
    
    // Joinable from 10 minutes before to 10 minutes after start time
    return timeUntilStart >= -10 && timeAfterStart <= 10;
  };

  // Helper function to get time status text
  const getTimeStatusText = (scheduledDate) => {
    const now = moment();
    const timeUntilStart = scheduledDate.diff(now, 'minutes');
    const timeAfterStart = now.diff(scheduledDate, 'minutes');
    
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

  return (
    <div className="mt-6">
      {/* CatchUp Buttons - Above the title */}
      {showButtons && (
        <div className="flex justify-end gap-3 mb-4">
          <button
            onClick={onInstantCatchUp}
            disabled={isCheckingLiveCatchup}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md disabled:cursor-not-allowed"
          >
            <MdVideocam className="w-4 h-4" />
            {isCheckingLiveCatchup ? 'Checking...' : 'Instant CatchUp'}
          </button>
          <button
            onClick={onScheduleCatchUp}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
          >
            <MdSchedule className="w-4 h-4" />
            Schedule CatchUp
          </button>
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MdSchedule className="w-5 h-5 text-orange-500" />
        Scheduled CatchUps
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedCatchups.map((catchup) => {
          const startDate = moment(catchup.startTime);
          const endDate = moment(catchup.endTime);
          const isToday = startDate.isSame(moment(), 'day');
          const isTomorrow = startDate.isSame(moment().add(1, 'day'), 'day');
          
          // Use the status from backend
          const isCompleted = catchup.isCompleted;
          const isInProgress = catchup.isInProgress;
          const isUpcoming = catchup.isUpcoming;
          
          // Get attendees for this catchup
          const attendees = catchupAttendees[catchup.id] || [];
          const isLoadingAttendees = loadingAttendees[catchup.id];
          
          return (
            <div key={catchup.id} className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg group overflow-hidden">
              {/* Header with status */}
              <div className="p-4 border-b border-gray-100">
                <div className="mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-base font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors ${isCompleted ? 'text-gray-500' : ''}`}>
                      {catchup.title}
                    </h4>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {isCompleted && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      <MdCheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </span>
                  )}
                  {isInProgress && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 animate-pulse">
                      <MdPlayCircle className="w-3 h-3 mr-1" />
                      Live Now
                    </span>
                  )}
                  {isUpcoming && isToday && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      <MdEvent className="w-3 h-3 mr-1" />
                      Today
                    </span>
                  )}
                  {isUpcoming && isTomorrow && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      <MdEvent className="w-3 h-3 mr-1" />
                      Tomorrow
                    </span>
                  )}
                  {isUpcoming && !isToday && !isTomorrow && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <MdSchedule className="w-3 h-3 mr-1" />
                      Upcoming
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Description */}
                {catchup.desc && (
                  <p className={`text-sm text-gray-600 mb-4 line-clamp-2 ${isCompleted ? 'text-gray-400' : ''}`}>
                    {catchup.desc}
                  </p>
                )}

                {/* Meeting Details */}
                <div className="space-y-3 mb-4">
                  {/* Start Date and Time */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <MdSchedule className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {startDate.format('dddd, MMMM D')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {startDate.format('h:mm A')} - {endDate.format('h:mm A')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Host */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <MdPerson className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {catchup.creatorName || 'Unknown Host'}
                      </p>
                      <p className="text-sm text-gray-500">Host</p>
                    </div>
                  </div>

                  {/* Attendees (for live catchups) - Only show if there are attendees */}
                  {(isInProgress || catchup.roomId) && attendees.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <MdGroup className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {attendees.length} Attendee{attendees.length !== 1 ? 's' : ''}
                          </p>
                          <button
                            onClick={() => fetchCatchupAttendees(catchup.id, catchup.roomId, communityId)}
                            disabled={isLoadingAttendees}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Refresh attendees"
                          >
                            <MdRefresh className={`w-3 h-3 text-gray-500 ${isLoadingAttendees ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                        <div className="flex -space-x-2 mt-1">
                          {attendees.slice(0, 3).map((attendee, index) => (
                            <img
                              key={attendee.id || index}
                              src={attendee.photoURL || "/t6.svg"}
                              alt={attendee.name}
                              className="w-6 h-6 rounded-full border-2 border-white object-cover"
                              onError={e => { e.target.src = "/t6.svg"; }}
                              title={attendee.name}
                            />
                          ))}
                          {attendees.length > 3 && (
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-600 font-medium">+{attendees.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Section */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {isCompleted && (
                      <span>Completed {endDate.fromNow()}</span>
                    )}
                    {isInProgress && (
                      <span className="text-red-600 font-medium">🎥 Live now</span>
                    )}
                    {isUpcoming && (() => {
                      const now = moment();
                      const timeUntilStart = startDate.diff(now, 'minutes');
                      const timeAfterStart = now.diff(startDate, 'minutes');
                      
                      if (timeUntilStart > 5) {
                        // Use moment.js for better time formatting
                        const duration = moment.duration(timeUntilStart, 'minutes');
                        let timeText;
                        
                        if (duration.asDays() >= 1) {
                          timeText = `Starts in ${Math.floor(duration.asDays())} day${Math.floor(duration.asDays()) !== 1 ? 's' : ''}`;
                        } else if (duration.asHours() >= 1) {
                          timeText = `Starts in ${Math.floor(duration.asHours())} hour${Math.floor(duration.asHours()) !== 1 ? 's' : ''}`;
                        } else {
                          timeText = `Starts in ${Math.ceil(timeUntilStart)} minutes`;
                        }
                        
                        return <span>{timeText}</span>;
                      } else if (timeAfterStart > 10) {
                        return <span>Ended {Math.ceil(timeAfterStart)} minutes ago</span>;
                      } else {
                        return <span className="text-green-600 font-medium">Join now</span>;
                      }
                    })()}
                  </div>
                  
                  {/* Action Button */}
                  {isInProgress && (
                    <button
                      onClick={() => onJoinCatchUp(catchup)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <MdVideocam className="w-4 h-4" />
                      Join
                    </button>
                  )}

                  {isUpcoming && (() => {
                    const now = moment();
                    const timeUntilStart = startDate.diff(now, 'minutes');
                    const timeAfterStart = now.diff(startDate, 'minutes');
                    
                    if (timeUntilStart > 5) {
                      return (
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium">
                          <MdSchedule className="w-4 h-4" />
                          Too Early
                        </span>
                      );
                    } else if (timeAfterStart > 10) {
                      return (
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium">
                          <MdCheckCircle className="w-4 h-4" />
                          Ended
                        </span>
                      );
                    } else {
                      return (
                        <button
                          onClick={() => onJoinCatchUp(catchup)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <MdVideocam className="w-4 h-4" />
                          Join
                        </button>
                      );
                    }
                  })()}

                  {isCompleted && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium">
                      <MdCheckCircle className="w-4 h-4" />
                      Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduledCatchup; 