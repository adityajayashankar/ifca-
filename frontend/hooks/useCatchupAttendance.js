import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../utils/apiSetup';

export const useCatchupAttendance = (roomId, communityId, unifiedUserId) => {
  const dispatch = useDispatch();

  // Function to join catchup when user enters 100ms room
  const joinCatchupOnEnter = useCallback(async () => {
    if (!roomId || !communityId || !unifiedUserId) {
      console.log('Missing required data for joining catchup');
      return;
    }

    try {
      const response = await api.post('/catchup/join-on-enter', {
        roomId,
        communityId,
        unifiedUserId
      });

      if (response.data.success) {
        console.log('Successfully joined catchup:', response.data.message);
        return response.data.catchup;
      } else {
        console.error('Failed to join catchup:', response.data.message);
      }
    } catch (error) {
      console.error('Error joining catchup:', error);
    }
  }, [roomId, communityId, unifiedUserId]);

  // Function to leave catchup when user exits 100ms room
  const leaveCatchupOnExit = useCallback(async () => {
    if (!roomId || !communityId || !unifiedUserId) {
      console.log('Missing required data for leaving catchup');
      return;
    }

    try {
      const response = await api.patch(`/catchup/leave/${roomId}/${communityId}/${unifiedUserId}`);

      if (response.data.success) {
        console.log('Successfully left catchup:', response.data.message);
        return response.data;
      } else {
        console.error('Failed to leave catchup:', response.data.message);
      }
    } catch (error) {
      console.error('Error leaving catchup:', error);
    }
  }, [roomId, communityId, unifiedUserId]);

  // Function to get current catchup status
  const getCatchupStatus = useCallback(async () => {
    if (!roomId || !communityId) {
      console.log('Missing required data for getting catchup status');
      return;
    }

    try {
      const response = await api.get(`/catchup/status/${roomId}/${communityId}`);

      if (response.data.success) {
        console.log('Catchup status:', response.data.catchup);
        return response.data.catchup;
      } else {
        console.error('Failed to get catchup status:', response.data.message);
      }
    } catch (error) {
      console.error('Error getting catchup status:', error);
    }
  }, [roomId, communityId]);

  // Function to check if user is in attendees
  const checkUserAttendance = useCallback(async () => {
    const status = await getCatchupStatus();
    if (status && status.attendees) {
      return status.attendees.some(attendee => attendee.id === unifiedUserId);
    }
    return false;
  }, [getCatchupStatus, unifiedUserId]);

  return {
    joinCatchupOnEnter,
    leaveCatchupOnExit,
    getCatchupStatus,
    checkUserAttendance
  };
};
