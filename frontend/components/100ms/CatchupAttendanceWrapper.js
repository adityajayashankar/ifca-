import React, { useEffect, useState } from 'react';
import { useCatchupAttendance } from '@/hooks/useCatchupAttendance';

const CatchupAttendanceWrapper = ({ children, roomId, communityId, unifiedUserId }) => {
  const { joinCatchupOnEnter, getCatchupStatus } = useCatchupAttendance(roomId, communityId, unifiedUserId);
  const [hasJoined, setHasJoined] = useState(false);
  const [catchupStatus, setCatchupStatus] = useState(null);

  useEffect(() => {
    const handleJoinCatchup = async () => {
      if (!roomId || !communityId || !unifiedUserId || hasJoined) {
        return;
      }

      try {
        // First check if user is already in attendees
        const status = await getCatchupStatus();
        if (status) {
          setCatchupStatus(status);
          
          const isAlreadyAttending = status.attendees?.some(attendee => attendee.id === unifiedUserId);
          
          if (!isAlreadyAttending) {
            // User is not in attendees, so join them
            const result = await joinCatchupOnEnter();
            if (result) {
              setHasJoined(true);
              console.log('User automatically joined catchup attendance');
            }
          } else {
            setHasJoined(true);
            console.log('User already in catchup attendance');
          }
        }
      } catch (error) {
        console.error('Error handling catchup attendance:', error);
      }
    };

    // Small delay to ensure 100ms room is fully loaded
    const timer = setTimeout(handleJoinCatchup, 2000);

    return () => clearTimeout(timer);
  }, [roomId, communityId, unifiedUserId, hasJoined, joinCatchupOnEnter, getCatchupStatus]);

  // This component doesn't render anything, it just handles the attendance logic
  return <>{children}</>;
};

export default CatchupAttendanceWrapper;
