import { useRouter } from "next/router";
import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";
import Head from "next/head";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import moment from "moment";
import { 
  MdPlayArrow, 
  MdPause, 
  MdSkipNext, 
  MdSkipPrevious, 
  MdPeople, 
  MdShare,
  MdClose,
  MdFullscreen,
  MdFullscreenExit,
  MdChevronLeft,
  MdChevronRight,
  MdExpandMore,
  MdExpandLess,
  MdMessage,
  MdNotifications,
  MdArrowUpward,
  MdArrowDownward,
  MdSettings
} from "react-icons/md";
import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai";
import { BiVideo, BiVideoOff } from "react-icons/bi";
import AnthemActivity from "@/components/ritual/AnthemActivity";
import QuizActivity from "@/components/ritual/QuizActivity";
import PollActivity from "@/components/ritual/PollActivity";
import AINewsActivity from "@/components/ritual/AINewsActivity";
import DiscussionActivity from "@/components/ritual/DiscussionActivity";
import DebateActivity from "@/components/ritual/DebateActivity";
import ContestActivity from "@/components/ritual/ContestActivity";
import StorySpotlightActivity from "@/components/ritual/StorySpotlightActivity";
import ReflectionActivity from "@/components/ritual/ReflectionActivity";
import AnnouncementActivity from "@/components/ritual/AnnouncementActivity";
import GuidedSessionActivity from "@/components/ritual/GuidedSessionActivity";

// 100ms imports
import {
  useHMSActions,
  useHMSStore,
  selectLocalPeer,
  selectPeers,
  selectHMSMessages,
  selectIsSomeoneScreenSharing,
  useHMSNotifications,
  HMSNotificationTypes,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectPeerMetadata,
  selectDominantSpeaker,
  selectPeerAudioByID,
} from "@100mslive/react-sdk";
import Controls from "@/components/100ms/Controls";
import Messages from "@/components/100ms/Messages";
import VideoSpaces from "@/components/100ms/VideoSpaces";
import ScreenShare from "@/components/100ms/ScreenShare";
import { HiOutlineArrowSmLeft, HiOutlineArrowSmRight } from "react-icons/hi";

// Broadcast message types for activity synchronization
const ACTIVITY_CHANGE = 'ACTIVITY_CHANGE';
const ACTIVITY_COMPLETED = 'ACTIVITY_COMPLETED';
const ADMIN_MUTE_ALL = 'ADMIN_MUTE_ALL';
const ADMIN_UNMUTE_ALL = 'ADMIN_UNMUTE_ALL';
const ADMIN_VIDEO_OFF_ALL = 'ADMIN_VIDEO_OFF_ALL';
const ADMIN_VIDEO_ON_ALL = 'ADMIN_VIDEO_ON_ALL';

export default function RitualPage() {
  const router = useRouter();
  const { id } = router.query;
  const user = useSelector(selectUser);
  const [huddle, setHuddle] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [activities, setActivities] = useState([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState(null);
  const [isModerator, setIsModerator] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hmsToken, setHmsToken] = useState(null);
  const [showChat, setShowChat] = useState(true);
  const [sideMenu, setSideMenu] = useState('chat'); // 'chat' or 'participants'
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [pinned, setPinned] = useState({ status: false, peer: {} });
  const [viewMode, setViewMode] = useState('split'); // 'split' or 'video' or 'activity'
  const [showAgenda, setShowAgenda] = useState(true);
  const [tilesExpanded, setTilesExpanded] = useState(true);
  const [peerScrollPosition, setPeerScrollPosition] = useState(0);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [handRaisedPeers, setHandRaisedPeers] = useState(new Set());
  const [handRaiseTimestamps, setHandRaiseTimestamps] = useState(new Map());
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [completedActivities, setCompletedActivities] = useState(new Set());
  
  const presentationRef = useRef(null);
  const peerScrollRef = useRef(null);
  const attendeesRef = useRef(null);
  // Prevent auto-unmute loops: we only auto-enable audio once right after join.
  const didAutoEnableAudioRef = useRef(false);
  const intervalRef = useRef(null);
  const previousPeerMetadataRef = useRef({});
  const handRaiseTimersRef = useRef(new Map());
  const controlsContainerRef = useRef(null);
  const lastAttendeesRef = useRef([]);
  const isPollingRef = useRef(false);
  const isJoiningRef = useRef(false); // Prevent duplicate joins
  const hasManuallyLeftRef = useRef(false); // Track if user manually left to prevent auto-rejoin
  const processedMessageKeysRef = useRef(new Set()); // Track processed broadcast messages
  const hasInitializedActivityIndexRef = useRef(false); // Track if we've initialized activity index from URL

  // 100ms hooks
  const hmsActions = useHMSActions();
  const localPeer = useHMSStore(selectLocalPeer);
  const peers = useHMSStore(selectPeers);
  const allMessages = useHMSStore(selectHMSMessages);
  const screenShared = useHMSStore(selectIsSomeoneScreenSharing);
  const notification = useHMSNotifications();
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const dominantSpeaker = useHMSStore(selectDominantSpeaker);

  // Load activity completion status from backend
  useEffect(() => {
    if (!id || !user?.unifiedUserId) return;
    
    const loadCompletions = async () => {
      try {
        // Get completions from backend
        const response = await api.get(`/huddle/${id}/user/${user.unifiedUserId}/completions`);
        if (response.data.success) {
          const completedIds = new Set(response.data.completions.map(c => c.activityId));
          setCompletedActivities(completedIds);
        }
      } catch (error) {
        console.error('Error loading activity completions:', error);
      }
    };
    
    loadCompletions();
  }, [id, user?.unifiedUserId]);

  // Broadcast activity completion to all participants
  const broadcastActivityCompleted = async (activityId, isCompleted) => {
    if (!hmsActions || !isModerator) return;
    
    try {
      const messageData = {
        type: ACTIVITY_COMPLETED,
        activityId: activityId,
        isCompleted: isCompleted
      };
      hmsActions.sendBroadcastMessage(JSON.stringify(messageData));
    } catch (error) {
      console.error('Error broadcasting activity completion:', error);
    }
  };

  // Toggle activity completion (for hosts - can mark complete/incomplete)
  const toggleActivityComplete = async (activityId) => {
    if (!id || !user?.unifiedUserId || !activityId || !isModerator) return;
    
    try {
      const response = await api.post(`/huddle/activity/${activityId}/toggle-complete`, {
        userId: user.unifiedUserId,
        huddleId: parseInt(id)
      });
      
      if (response.data.success) {
        const isCompleted = response.data.isCompleted;
        
        // Update local state
        if (isCompleted) {
          setCompletedActivities(prev => new Set([...prev, activityId]));
          toast.success('Activity marked as completed!');
        } else {
          setCompletedActivities(prev => {
            const newSet = new Set(prev);
            newSet.delete(activityId);
            return newSet;
          });
          toast.success('Activity marked as incomplete!');
        }
        
        // Broadcast completion change
        await broadcastActivityCompleted(activityId, isCompleted);
      }
    } catch (error) {
      console.error('Error toggling activity completion:', error);
      toast.error('Failed to toggle activity completion');
    }
  };

  // Mark activity as completed (for regular users)
  const markActivityComplete = async (activityId) => {
    if (!id || !user?.unifiedUserId || !activityId) return;
    
    // If user is moderator, use toggle instead
    if (isModerator) {
      return toggleActivityComplete(activityId);
    }
    
    try {
      const response = await api.post(`/huddle/activity/${activityId}/complete`, {
        userId: user.unifiedUserId,
        huddleId: parseInt(id)
      });
      
      if (response.data.success) {
        setCompletedActivities(prev => new Set([...prev, activityId]));
        toast.success('Activity marked as completed!');
      }
    } catch (error) {
      console.error('Error marking activity as complete:', error);
      toast.error('Failed to mark activity as complete');
    }
  };

  // Check if user is moderator/admin
  // In admin-frontend, users with admin role should have admin privileges
  useEffect(() => {
    if (user) {
      const userUnifiedId = user?.unifiedUserId || user?.id;
      // Check if user is admin (multiple ways to determine this)
      const userType = typeof window !== 'undefined' ? localStorage.getItem('ifca-userType') : null;
      const isAdmin = user?.role === 'admin' || 
                      user?.userType === 'admin' || 
                      user?.type === 'admin' ||
                      user?.adminId !== undefined ||
                      userType === 'admin';
      
      // If huddle exists, check creator/leader status
      if (huddle) {
        const isCreator = huddle.creatorId === parseInt(userUnifiedId);
        const isLeader = huddle.leaderId === parseInt(userUnifiedId);
        setIsModerator(isCreator || isLeader || isAdmin);
      } else {
        // If no huddle yet, still set moderator if user is admin
        setIsModerator(isAdmin);
      }
    } else {
      setIsModerator(false);
    }
  }, [huddle, user]);

  // Check mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch huddle data
  useEffect(() => {
    if (!id || !router.isReady) return;

    // Reset initialization flag and processed broadcast keys when loading new huddle
    hasInitializedActivityIndexRef.current = false;
    processedMessageKeysRef.current = new Set();

    const fetchHuddle = async () => {
      try {
          setLoading(true);
        // Reset state when fetching (in case of re-join)
        setHmsToken(null);
        setIsLive(false);
        setHuddle(null);
        setActivities([]);
        setAttendees([]);
        
        const response = await api.get(`/huddle/${id}`);
        if (response.data.success) {
          const huddleData = response.data.huddle;
          setHuddle(huddleData);
          // If the huddle already ended, force isLive off so we don't auto-join
          setIsLive(huddleData.isLive && !huddleData.endTime);
          
          // Fetch activities
          const activitiesResponse = await api.get(`/huddle/${id}/activities`);
          if (activitiesResponse.data.success) {
            setActivities(activitiesResponse.data.activities || []);
            // Don't set currentActivityIndex here - URL will drive it
          }

          // Fetch attendees (only once on initial load)
          try {
            setLoadingAttendees(true);
          const attendeesResponse = await api.get(`/huddle/${id}/attendees`);
          if (attendeesResponse.data.success) {
            setAttendees(attendeesResponse.data.attendees || []);
              lastAttendeesRef.current = attendeesResponse.data.attendees || [];
            }
          } catch (err) {
            console.error('Error fetching attendees:', err);
          } finally {
            setLoadingAttendees(false);
          }

          // If live and has roomId, get 100ms token
          // Only auto-join if user hasn't manually left
          if (huddleData.isLive && !huddleData.endTime && huddleData.roomId && user && !hasManuallyLeftRef.current) {
            // Wait a bit for hmsActions to be ready
            setTimeout(async () => {
              if (hmsActions) {
                await join100msRoom(huddleData.roomId);
              } else {
                // Retry if hmsActions not ready
                const retryInterval = setInterval(() => {
                  if (hmsActions) {
                    clearInterval(retryInterval);
                    join100msRoom(huddleData.roomId);
                  }
                }, 500);
                setTimeout(() => clearInterval(retryInterval), 10000);
              }
            }, 500);
          }
        }
      } catch (error) {
        console.error('Error fetching huddle:', error);
        toast.error('Failed to load ritual');
      } finally {
        setLoading(false);
      }
    };

    fetchHuddle();
  }, [id, router.isReady, user]);

  // Initialize activity index from URL query parameter on mount only
  useEffect(() => {
    if (!router.isReady || activities.length === 0) return;
    
    // Only initialize once per huddle
    if (hasInitializedActivityIndexRef.current) return;
    hasInitializedActivityIndexRef.current = true;

    // Initialize from URL query parameter if present, otherwise default to 0
    const tabParam = router.query.tab;
    let initialIndex = 0;

    if (tabParam !== undefined && tabParam !== null) {
      const tabIndex = parseInt(tabParam, 10);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex < activities.length) {
        initialIndex = tabIndex;
      }
    }

    setCurrentActivityIndex(initialIndex);
  }, [router.isReady, activities.length]);

  // Update URL when currentActivityIndex changes
  const updateActivityInUrl = useCallback((newIndex) => {
    if (!router.isReady) return;

    router.replace(
      {
        pathname: `/admin/ritual/[id]`,
        query: { id, tab: newIndex }
      },
      `/admin/ritual/${id}?tab=${newIndex}`,
      { shallow: true }
    );
  }, [id, router]);

  // Join 100ms room
  const join100msRoom = async (roomId) => {
    // Prevent duplicate joins
    if (isJoiningRef.current) {
      console.log('Admin-frontend: Already joining, skipping duplicate call');
      return;
    }
    
    // Check if already joined
    if (localPeer && hmsToken) {
      console.log('Admin-frontend: Already joined to room');
      return;
    }
    
    try {
      isJoiningRef.current = true;
      const userUnifiedId = user?.unifiedUserId || user?.id;
      if (!userUnifiedId) {
        console.error('Admin-frontend: No user ID available');
        isJoiningRef.current = false;
        return;
      }
      
      if (!hmsActions) {
        console.warn('Admin-frontend: hmsActions not ready, retrying...');
        isJoiningRef.current = false;
        setTimeout(() => join100msRoom(roomId), 500);
        return;
      }
      
      const userName = user?.name || user?.email || 'Admin User';

      // First, record attendance by calling join endpoint
      try {
        const joinResponse = await api.post(`/huddle/${id}/join`, { userId: userUnifiedId });
        if (joinResponse.data.success) {
          console.log('Admin-frontend: Successfully recorded huddle attendance');
          // Don't immediately refresh - let 100ms peers update naturally or wait for next poll
        }
      } catch (joinError) {
        // If already joined, that's okay - continue
        console.warn('Admin-frontend: Could not record attendance (might already be joined):', joinError.response?.data?.message || joinError.message);
      }

      // Then get token and join 100ms room
      const response = await api.post(`/huddle/${id}/token`, {
        userId: userUnifiedId
      });

      if (response.data.success && response.data.token) {
        setHmsToken(response.data.token);
        // Get the role from the token response (backend determines this based on user privileges)
        const tokenRole = response.data.role;
        const isHostRole = ['host', 'moderator', 'stage'].includes(tokenRole);
        // Update isModerator based on the role from backend
        if (isHostRole) {
          setIsModerator(true);
        }
        // Enable audio by default for moderators/hosts so their voice reaches everyone
        const shouldEnableAudio = isHostRole;
        await hmsActions.join({
          userName: userName,
          authToken: response.data.token,
          settings: {
            isAudioMuted: !shouldEnableAudio,
            isVideoMuted: false,
          },
        });
        toast.success('Joined ritual room!');
      }
    } catch (error) {
      console.error('Error joining 100ms room:', error);
      toast.error(error.response?.data?.message || 'Failed to join video room');
    } finally {
      isJoiningRef.current = false;
    }
  };

  // Track hand raises from peer metadata changes with 1-minute delay
  useEffect(() => {
    if (!peers || peers.length === 0 || !localPeer) return;

      peers.forEach((peer) => {
        const peerId = peer.id;
        const currentMetadata = peer.metadata || {};
        const previousMetadata = previousPeerMetadataRef.current[peerId] || {};
        
      // Check if hand was just raised
        if (currentMetadata.isHandRaised && !previousMetadata.isHandRaised && peer.id !== localPeer.id) {
          const peerName = peer.name || 'Someone';
          const timestamp = Date.now();
          
        // Store timestamp
        setHandRaiseTimestamps(prev => {
          const newMap = new Map(prev);
          newMap.set(peerId, timestamp);
          return newMap;
        });
        
        // Show notification after 1 minute
          setTimeout(() => {
          setHandRaisedPeers(prev => new Set([...prev, peerId]));
            toast.info(`✋ ${peerName} raised their hand`, {
              icon: '✋',
              autoClose: 3000,
            });
        }, 60000); // 1 minute delay
          
        // Auto-clear hand raise after 1 minute
          const timer = setTimeout(() => {
          // Clear from displayed peers
            setHandRaisedPeers(prev => {
              const newSet = new Set(prev);
              newSet.delete(peerId);
              return newSet;
            });
          // Clear timestamp
            setHandRaiseTimestamps(prev => {
              const newMap = new Map(prev);
              newMap.delete(peerId);
              return newMap;
            });
          // Clear timer reference
            handRaiseTimersRef.current.delete(peerId);
        }, 120000); // 2 minutes total (1 min delay + 1 min display)
          
          handRaiseTimersRef.current.set(peerId, timer);
        }
        
      // Check if hand was lowered manually
        if (!currentMetadata.isHandRaised && previousMetadata.isHandRaised) {
        // Clear timer if exists
          const timer = handRaiseTimersRef.current.get(peerId);
          if (timer) {
            clearTimeout(timer);
            handRaiseTimersRef.current.delete(peerId);
        }
        
          setHandRaisedPeers(prev => {
            const newSet = new Set(prev);
              newSet.delete(peerId);
            return newSet;
          });
          
          setHandRaiseTimestamps(prev => {
            const newMap = new Map(prev);
              newMap.delete(peerId);
            return newMap;
          });
        }
      
      // Update previous metadata
      previousPeerMetadataRef.current[peerId] = currentMetadata;
    });

    // Cleanup timers on unmount
    return () => {
      handRaiseTimersRef.current.forEach(timer => clearTimeout(timer));
      handRaiseTimersRef.current.clear();
    };
  }, [peers, localPeer]);

  // Listen for activity synchronization broadcast messages
  useEffect(() => {
    if (!allMessages || !localPeer || allMessages.length === 0 || !hmsActions) return;

    allMessages.forEach((message) => {
      // Skip if message is from self (admin shouldn't process their own broadcast)
      if (message.senderPeerId === localPeer.id || message.senderId === localPeer.id) {
        return;
      }

      // Create unique key for message and skip if already processed
      const messageKey = `${message.senderPeerId || message.senderId}-${message.message}-${message.time || ''}`;
      if (processedMessageKeysRef.current.has(messageKey)) {
        return;
      }
      processedMessageKeysRef.current.add(messageKey);

      // Try to parse as JSON (broadcast messages are JSON)
      try {
        const messageData = JSON.parse(message.message);
        const isHostRole = ['moderator', 'host', 'stage'].includes(localPeer.roleName);
        
        // Handle ACTIVITY_CHANGE message
        if (messageData.type === ACTIVITY_CHANGE && typeof messageData.activityIndex === 'number') {
          const newIndex = messageData.activityIndex;
          
          // Only update if different from current index and valid
          if (newIndex !== currentActivityIndex && newIndex >= 0 && newIndex < activities.length) {
            // Use functional update to ensure we're comparing with latest state
            setCurrentActivityIndex(prevIndex => {
              if (prevIndex !== newIndex) {
                console.log(`Activity synchronized to index ${newIndex} by host (was ${prevIndex})`);
                return newIndex;
              }
              return prevIndex;
            });
          }
        }
        
        // Handle ACTIVITY_COMPLETED message
        if (messageData.type === ACTIVITY_COMPLETED && messageData.activityId) {
          const activityId = messageData.activityId;
          const isCompleted = messageData.isCompleted !== undefined ? messageData.isCompleted : true;
          
          // Update completed activities based on completion state
          setCompletedActivities(prev => {
            const newSet = new Set(prev);
            if (isCompleted) {
              newSet.add(activityId);
            } else {
              newSet.delete(activityId);
            }
            return newSet;
          });
          console.log(`Activity ${activityId} ${isCompleted ? 'marked as completed' : 'marked as incomplete'} by host`);
        }

        // Admin bulk AV controls - make state change immediately on each client
        // Process even if host (in case another admin sends the command)
        if (messageData.type === ADMIN_MUTE_ALL) {
          hmsActions.setLocalAudioEnabled(false).catch(err => {
            console.warn('Failed to mute local audio:', err);
          });
        }
        if (messageData.type === ADMIN_UNMUTE_ALL) {
          hmsActions.setLocalAudioEnabled(true).catch(err => {
            console.warn('Failed to unmute local audio:', err);
          });
        }
        if (messageData.type === ADMIN_VIDEO_OFF_ALL) {
          // Force video off immediately
          hmsActions.setLocalVideoEnabled(false).catch(err => {
            console.warn('Failed to turn off local video:', err);
          });
          // Also try to disable video track if available
          if (localPeer?.videoTrack) {
            hmsActions.setRemoteTrackEnabled(localPeer.videoTrack, false).catch(err => {
              console.warn('Failed to disable video track:', err);
            });
          }
        }
        if (messageData.type === ADMIN_VIDEO_ON_ALL) {
          // Force video on immediately
          hmsActions.setLocalVideoEnabled(true).catch(err => {
            console.warn('Failed to turn on local video:', err);
          });
          // Also try to enable video track if available
          if (localPeer?.videoTrack) {
            hmsActions.setRemoteTrackEnabled(localPeer.videoTrack, true).catch(err => {
              console.warn('Failed to enable video track:', err);
            });
          }
        }
      } catch (error) {
        // Not a JSON message, ignore (regular chat messages)
        // This is expected for non-broadcast messages
      }
    });
  }, [allMessages, localPeer, currentActivityIndex, activities.length, hmsActions]);

  // 100ms notifications
  useEffect(() => {
    if (!notification) return;

    switch (notification.type) {
      case HMSNotificationTypes.PEER_JOINED:
        toast.info(`${notification.data.name} joined`);
        break;
      case HMSNotificationTypes.PEER_LEFT:
        toast.info(`${notification.data.name} left`);
        break;
      case HMSNotificationTypes.ERROR:
        // Ignore autoplay errors - they're expected and handled by the SDK
        // Audio will work fine once user interacts (e.g., clicks unmute)
        if (notification.data?.name === 'AutoplayBlocked' || 
            notification.data?.code === 3008 ||
            notification.data?.message?.includes('autoplay') ||
            notification.data?.message?.includes('user didn\'t interact')) {
          // Silently ignore autoplay errors - they're not critical
          return;
        }
        toast.error(`Error: ${notification.data.message}`);
        break;
      case HMSNotificationTypes.RECONNECTING:
        toast.warning("Reconnecting...");
        break;
      case HMSNotificationTypes.RECONNECTED:
        toast.success("Reconnected successfully");
        break;
    }
  }, [notification]);

  // Automatically enable audio for moderators after joining
  useEffect(() => {
    if (!hmsActions || !localPeer) return;
    if (didAutoEnableAudioRef.current) return;
    
    // Check if user is moderator based on their role in the room
    const isRoomModerator = ['moderator', 'host', 'stage'].includes(localPeer.roleName);
    
    // Update isModerator based on the 100ms role
    if (isRoomModerator) {
      setIsModerator(true);
    } else {
      const isGuestRole = ['guest', 'participant'].includes(localPeer?.roleName);
      if (isGuestRole) {
        setIsModerator(false);
      }
    }
    
    // Enable audio automatically for moderators so their voice reaches everyone
    if (isRoomModerator && !isLocalAudioEnabled) {
      didAutoEnableAudioRef.current = true;
      // Enable audio after a short delay to ensure room is fully joined
      const enableAudioTimer = setTimeout(async () => {
        try {
          await hmsActions.setLocalAudioEnabled(true);
          console.log('Audio automatically enabled for moderator');
        } catch (error) {
          console.error('Error enabling audio for moderator:', error);
          // Don't show error toast - user can manually enable if needed
        }
      }, 1000); // 1 second delay to ensure room is fully initialized
      
      return () => clearTimeout(enableAudioTimer);
    }
  }, [hmsActions, localPeer, isLocalAudioEnabled]);

  // Poll for updates - Only when needed and with debouncing
  useEffect(() => {
    if (!id || !isLive || !localPeer) {
      // Clear interval if conditions not met
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const pollUpdates = async () => {
      // Skip if already polling
      if (isPollingRef.current) return;
      
      // Skip if we have peers from 100ms (more accurate real-time data)
      // Only poll if we need backend attendance data
      if (peers && peers.length > 0) {
        // Use 100ms peers as source of truth, only poll occasionally for backend sync
        return;
      }

      isPollingRef.current = true;
      setLoadingAttendees(true);
      
      try {
        const res = await api.get(`/huddle/${id}/attendees`);
        if (res.data.success && res.data.attendees) {
          // Only update if count changed or data is different
          const newCount = res.data.attendees.length;
          const lastCount = lastAttendeesRef.current.length;
          const lastData = JSON.stringify(lastAttendeesRef.current);
          const newData = JSON.stringify(res.data.attendees);
          
          if (newCount !== lastCount || newData !== lastData) {
            setAttendees(res.data.attendees || []);
            lastAttendeesRef.current = res.data.attendees;
          }
        }
      } catch (err) {
        console.error('Error polling attendees:', err);
      } finally {
        setLoadingAttendees(false);
        isPollingRef.current = false;
      }
    };

    // Poll less frequently - every 30 seconds instead of 5
    // And only if we don't have 100ms peers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(pollUpdates, 30000);
    
    // Initial poll only if no peers
    if (!peers || peers.length === 0) {
      pollUpdates();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [id, isLive, localPeer, peers?.length]);

  // Calculate time until start
  useEffect(() => {
    if (!huddle || isLive || huddle.endTime) {
      setTimeUntilStart(null);
      return;
    }

    const calculateTimeUntilStart = () => {
      const now = moment();
      const scheduled = moment(huddle.scheduledTime);
      const diff = scheduled.diff(now, 'seconds');

      if (diff > 0) {
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setTimeUntilStart(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeUntilStart(null);
        if (!isLive && !huddle.endTime) {
          handleLaunch();
        }
      }
    };

    calculateTimeUntilStart();
    const interval = setInterval(calculateTimeUntilStart, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [huddle, isLive]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      }
    }
  };

  const handleLaunch = async () => {
    if (huddle?.endTime) {
      toast.info('This huddle has already been completed.');
      return;
    }
    try {
      const response = await api.post(`/huddle/${id}/launch`);
      if (response.data.success) {
        setIsLive(true);
          toast.success('Ritual started!');
        if (huddle?.roomId && user) {
          await join100msRoom(huddle.roomId);
        }
      }
    } catch (error) {
      console.error('Error launching huddle:', error);
      toast.error('Failed to start ritual');
    }
  };

  const handleJoin = async () => {
    if (huddle?.endTime) {
      toast.info('This huddle has already been completed.');
      return;
    }
    try {
      const userUnifiedId = user?.unifiedUserId || user?.id;
      if (!userUnifiedId) {
        toast.error('User not available');
        return;
      }
      
      const response = await api.post(`/huddle/${id}/join`, { userId: userUnifiedId });
      if (response.data.success) {
        toast.success('Joined ritual!');
        // Don't immediately fetch attendees - will be updated via 100ms peers or polling
        // Join 100ms room if available
        if (huddle?.roomId) {
          await join100msRoom(huddle.roomId);
        } else {
          // If no roomId, refresh to get it
          setTimeout(async () => {
            try {
              const refreshResponse = await api.get(`/huddle/${id}`);
              if (refreshResponse.data.success && refreshResponse.data.huddle.roomId) {
                const refreshedData = refreshResponse.data.huddle;
                setHuddle(refreshedData);
                setIsLive(refreshedData.isLive || false);
                  await join100msRoom(refreshedData.roomId);
              }
            } catch (err) {
              console.error('Error refreshing huddle:', err);
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error joining huddle:', error);
      const errorMessage = error.response?.data?.message || 'Failed to join ritual';
      toast.error(errorMessage);
    }
  };

  const handleLeaveClick = () => {
    setShowLeaveModal(true);
  };

  const handleLeaveConfirm = async () => {
    try {
      const userUnifiedId = user?.unifiedUserId || user?.id;
      
      // Mark that user manually left to prevent auto-rejoin
      hasManuallyLeftRef.current = true;
      
      // Leave 100ms room if joined
      if (hmsToken && localPeer && hmsActions) {
        try {
          hmsActions.leave();
        } catch (error) {
          console.error('Error leaving 100ms room:', error);
        }
      }
      
      // Try to leave huddle (record attendance)
      try {
      await api.post(`/huddle/${id}/leave`, { userId: userUnifiedId });
        console.log('Admin-frontend: Successfully left huddle');
      } catch (leaveError) {
        // If user wasn't in attendance, that's okay
        if (leaveError.response?.status === 404 && leaveError.response?.data?.message?.includes('not in this huddle')) {
          console.warn('Admin-frontend: User not in attendance records, but leaving 100ms room anyway');
        } else {
          throw leaveError;
        }
      }
      
      // Reset all state
      setShowLeaveModal(false);
      setHmsToken(null);
      setIsLive(false);
      setHuddle(null);
      setActivities([]);
      setAttendees([]);
      setCurrentActivityIndex(0);
      setHandRaisedPeers(new Set());
      setHandRaiseTimestamps(new Map());
      setPinned({ status: false, peer: {} });
      setViewMode('split');
      
      toast.success('Left ritual');
      
      // Navigate back to huddle detail page
      router.push(`/admin/huddle/${id}`);
    } catch (error) {
      console.error('Error leaving huddle:', error);
      toast.success('Left video room');
      setShowLeaveModal(false);
      setHmsToken(null);
      setIsLive(false);
      
      // Still navigate back even on error
      router.push(`/admin/huddle/${id}`);
    }
  };

  // Broadcast activity change to all participants
  const broadcastActivityChange = async (newIndex) => {
    if (!hmsActions || !isModerator) return;
    
    try {
      // Update backend with new activity index
      const userUnifiedId = user?.unifiedUserId || user?.id;
      await api.post(`/huddle/${id}/current-activity`, {
        activityIndex: newIndex,
        userId: userUnifiedId
      });
      
      // Broadcast to all participants
      const messageData = {
        type: ACTIVITY_CHANGE,
        activityIndex: newIndex
      };
      hmsActions.sendBroadcastMessage(JSON.stringify(messageData));
    } catch (error) {
      console.error('Error broadcasting activity change:', error);
      toast.error('Failed to sync activity change');
    }
  };

  const handleNextActivity = async () => {
    // Only moderators can switch activities
    if (!isModerator) {
      toast.error('Only moderators can switch activities');
      return;
    }
    
    if (currentActivityIndex < activities.length - 1) {
      const newIndex = currentActivityIndex + 1;
      setCurrentActivityIndex(newIndex);
      updateActivityInUrl(newIndex);
      if (typeof broadcastActivityChange === 'function' && newIndex !== currentActivityIndex) {
        broadcastActivityChange(newIndex);
      }
      toast.info('Moving to next activity');
    }
  };

  const handlePreviousActivity = async () => {
    // Only moderators can switch activities
    if (!isModerator) {
      toast.error('Only moderators can switch activities');
      return;
    }
    
    if (currentActivityIndex > 0) {
      const newIndex = currentActivityIndex - 1;
      setCurrentActivityIndex(newIndex);
      updateActivityInUrl(newIndex);
      if (typeof broadcastActivityChange === 'function' && newIndex !== currentActivityIndex) {
        broadcastActivityChange(newIndex);
      }
      toast.info('Rewinding to previous activity');
    }
  };

  const renderActivity = () => {
    if (!activities || activities.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>No activities scheduled</p>
        </div>
      );
    }

    const currentActivity = activities[currentActivityIndex];
    if (!currentActivity) return null;

    const activityData = currentActivity.activityData || {};

    switch (currentActivity.activityType) {
      case 'AI_VIDEO_MESSAGE':
      case 'ANTHEM':
        return <AnthemActivity activity={currentActivity} activityData={activityData} isModerator={isModerator} />;
      case 'QUIZ':
        return <QuizActivity activity={currentActivity} activityData={activityData} isModerator={isModerator} />;
      case 'VOTING_SURVEY':
        return <PollActivity activity={currentActivity} activityData={activityData} isModerator={isModerator} />;
      case 'AI_SLIDESHOW':
        return <AINewsActivity activity={currentActivity} activityData={activityData} isModerator={isModerator} />;
      case 'DISCUSSION_TOPIC':
        return <DiscussionActivity activity={currentActivity} activityData={activityData} isModerator={isModerator} />;
      case 'STORY_SPOTLIGHT':
        return <StorySpotlightActivity activity={currentActivity} activityData={activityData} isModerator={isModerator} />;
      case 'DEBATE':
        return <DebateActivity activity={currentActivity} activityData={activityData} isModerator={isModerator} />;
      case 'CONTEST':
        return <ContestActivity activity={currentActivity} activityData={activityData} isModerator={isModerator} />;
      case 'REFLECTION':
        return <ReflectionActivity activity={currentActivity} activityData={activityData} isModerator={isModerator} />;
      case 'ANNOUNCEMENT':
        return <AnnouncementActivity activity={currentActivity} activityData={activityData} isModerator={isModerator} />;
      case 'GUIDED_SESSION':
        return <GuidedSessionActivity activity={currentActivity} activityData={activityData} isModerator={isModerator} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Activity type not supported: {currentActivity.activityType}</p>
          </div>
        );
    }
  };

  const getCurrentVideoCards = () => {
    // Combine localPeer with peers to ensure all participants are shown
    // selectPeers might not always include localPeer, so we merge them
    const allPeers = [];
    if (localPeer) {
      allPeers.push(localPeer);
    }
    if (peers && peers.length > 0) {
      peers.forEach(peer => {
        // Only add if not already added (avoid duplicates)
        if (!allPeers.find(p => p.id === peer.id)) {
          allPeers.push(peer);
        }
      });
    }
    
    // For Video Only view, show all peers (no pagination limit)
    if (viewMode === 'video') {
      return allPeers;
    }
    // For other views, use pagination
    const startIndex = currentPage * itemsPerPage;
    return allPeers.slice(startIndex, startIndex + itemsPerPage);
  };

  // Group peers by role (host/guest)
  const getGroupedPeers = () => {
    const allPeers = [];
    if (localPeer) {
      allPeers.push(localPeer);
    }
    if (peers && peers.length > 0) {
      peers.forEach(peer => {
        if (!allPeers.find(p => p.id === peer.id)) {
          allPeers.push(peer);
        }
      });
    }
    
    const hostRoles = ['host', 'moderator', 'stage'];
    const hosts = allPeers.filter(peer => hostRoles.includes(peer.roleName));
    const guests = allPeers.filter(peer => !hostRoles.includes(peer.roleName));
    
    return { hosts, guests };
  };

  const pages = Math.ceil(getCurrentVideoCards().length / itemsPerPage);

  const updateGridTemplate = () => {
    let participants = peers?.length || 0;
    if (participants === 1) return "1fr";
    if (participants === 2) return "1fr 1fr";
    return "repeat(auto-fit, minmax(300px, 1fr))";
  };

  // Calculate Google Meet-style grid layout for Video Only view
  const calculateVideoOnlyGrid = () => {
    const count = getCurrentVideoCards().length;
    // Check if sidebars are open (ritual agenda or chat/participants)
    const sidebarsOpen = showAgenda || showChat;
    
    // If sidebars are open, use vertical layout (one column)
    if (sidebarsOpen) {
      return { 
        cols: 1, 
        rows: count || 1, 
        tileWidth: '100%', 
        tileHeight: count > 0 ? `${100 / count}%` : '100%',
        isVertical: true
      };
    }
    
    // When sidebars are closed, use horizontal grid layout
    if (count === 0) return { cols: 1, rows: 1, tileWidth: '100%', tileHeight: '100%', isVertical: false };
    if (count === 1) return { cols: 1, rows: 1, tileWidth: '100%', tileHeight: '100%', isVertical: false };
    if (count === 2) return { cols: 2, rows: 1, tileWidth: '50%', tileHeight: '100%', isVertical: false };
    if (count === 3) return { cols: 2, rows: 2, tileWidth: '50%', tileHeight: '50%', isVertical: false };
    if (count === 4) return { cols: 2, rows: 2, tileWidth: '50%', tileHeight: '50%', isVertical: false };
    if (count <= 6) return { cols: 3, rows: 2, tileWidth: '33.33%', tileHeight: '50%', isVertical: false };
    if (count <= 9) return { cols: 3, rows: 3, tileWidth: '33.33%', tileHeight: '33.33%', isVertical: false };
    if (count <= 12) return { cols: 4, rows: 3, tileWidth: '25%', tileHeight: '33.33%', isVertical: false };
    if (count <= 16) return { cols: 4, rows: 4, tileWidth: '25%', tileHeight: '25%', isVertical: false };
    if (count <= 20) return { cols: 5, rows: 4, tileWidth: '20%', tileHeight: '25%', isVertical: false };
    if (count <= 25) return { cols: 5, rows: 5, tileWidth: '20%', tileHeight: '20%', isVertical: false };
    // For more than 25, calculate optimal grid
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    return { 
      cols, 
      rows, 
      tileWidth: `${100 / cols}%`, 
      tileHeight: `${100 / rows}%`,
      isVertical: false
    };
  };


  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-white">Loading ritual...</p>
        </div>
      </div>
    );
  }

  // Huddle completed state
  if (huddle?.endTime && !isLive) {
    const backHref = huddle?.communityId
      ? `/comHome/${huddle.communityId}?tab=huddles`
      : '/admin/huddles';

    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <Head>
          <title>{huddle?.title || 'Ritual'} - Completed</title>
        </Head>
        <div className="text-center p-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            {huddle?.title || 'Ritual'}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4">
            This huddle has been completed.
          </p>
          <p className="text-gray-400 mb-8">Please go back instead of starting it again.</p>
          <button
            onClick={() => router.push(backHref)}
            className="px-8 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Go to Huddles
          </button>
        </div>
      </div>
    );
  }

  // Countdown page (before ritual starts)
  if (!isLive && timeUntilStart) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <Head>
          <title>{huddle?.title || 'Ritual'} - Starting Soon</title>
        </Head>
        <div className="text-center p-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            {huddle?.title || 'Ritual'}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Starting in
          </p>
          <div className="text-6xl md:text-8xl font-mono font-bold text-orange-500 mb-8">
            {timeUntilStart}
          </div>
          {huddle?.description && (
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {huddle.description}
            </p>
          )}
          {user && !huddle?.endTime && (
            <button
              onClick={handleJoin}
              className="mt-8 px-8 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Join Ritual
            </button>
          )}
        </div>
      </div>
    );
  }

  // Desktop ritual interface with 100ms
  return (
    <div 
      ref={controlsContainerRef}
      className="fixed inset-0 bg-black flex flex-col overflow-hidden h-screen w-screen"
    >
      <Head>
        <title>{huddle?.title || 'Ritual'}</title>
        <style dangerouslySetInnerHTML={{__html: `
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}} />
      </Head>
      {/* Header - Orange Bar */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-3 md:px-6 py-2 md:py-4 flex-shrink-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm md:text-xl font-bold truncate">{huddle?.title || 'Ritual'}</h1>
            {huddle?.community && (
              <p className="text-orange-100 text-xs md:text-sm mt-0.5 truncate">{huddle.community.title}</p>
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-4 ml-2">
            {/* Participants Count - Toggleable */}
            {localPeer && peers && (
              <button
                onClick={() => setTilesExpanded(!tilesExpanded)}
                className="flex items-center gap-1.5 md:gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-2 md:px-3 py-1 md:py-1.5 rounded-lg transition-all cursor-pointer"
                title={tilesExpanded ? "Hide participants" : "Show participants"}
              >
                <MdPeople className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm font-semibold">{getCurrentVideoCards().length}</span>
                {tilesExpanded ? (
                  <MdExpandLess className="w-3 h-3 md:w-4 md:h-4" />
                ) : (
                  <MdExpandMore className="w-3 h-3 md:w-4 md:h-4" />
                )}
              </button>
            )}
            {/* Messages Count */}
            {localPeer && allMessages && allMessages.length > 0 && (
              <div className="flex items-center gap-1.5 md:gap-2 bg-white bg-opacity-20 px-2 md:px-3 py-1 md:py-1.5 rounded-lg">
                <MdMessage className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm font-semibold">{allMessages.length}</span>
              </div>
            )}
            {/* Hand Raised Count */}
            {localPeer && handRaisedPeers.size > 0 && (
              <div className="flex items-center gap-1.5 md:gap-2 bg-yellow-500 bg-opacity-90 px-2 md:px-3 py-1 md:py-1.5 rounded-lg animate-pulse">
                <MdNotifications className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm font-semibold">{handRaisedPeers.size}</span>
              </div>
            )}
            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="px-2 md:px-3 py-1 md:py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all flex items-center gap-1 md:gap-2"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <MdFullscreenExit className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <MdFullscreen className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
            <button
              onClick={handleLeaveClick}
              className="px-2 md:px-4 py-1.5 md:py-2 bg-white text-orange-600 rounded-lg text-xs md:text-base font-semibold hover:bg-orange-50 transition-colors flex items-center gap-1 md:gap-2 flex-shrink-0"
            >
              <MdClose className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative" style={{ height: 'calc(100vh - 73px)' }}>
        {/* Left Sidebar - Ritual Agenda */}
        {showAgenda ? (
          <div className="absolute md:relative inset-y-0 left-0 w-64 bg-gray-800 flex-shrink-0 flex flex-col border-r border-gray-700 transition-all z-30 md:z-auto">
            <div className="p-3 md:p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-base md:text-lg font-bold text-white">Ritual Agenda</h2>
              <button
                onClick={() => setShowAgenda(false)}
                className="text-gray-400 hover:text-white transition-colors md:hidden"
                title="Close agenda"
              >
                <MdClose className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowAgenda(false)}
                className="text-gray-400 hover:text-white transition-colors hidden md:block"
                title="Close agenda"
              >
                <MdChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2">
              {activities.map((activity, index) => {
                const isActive = index === currentActivityIndex;
                const isCompleted = completedActivities.has(activity.id);
                
                return (
                  <div
                    key={activity.id}
                    className={`p-2 md:p-3 rounded-lg transition-colors ${
                      isModerator ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                    } ${
                      isActive
                        ? 'bg-orange-600 border-2 border-orange-500 text-white'
                        : 'bg-gray-700 hover:bg-gray-650 border-2 border-transparent text-gray-300'
                    }`}
                    onClick={() => {
                      try {
                        // Only moderators can navigate between activities
                        if (!isModerator) {
                          toast.error('Only moderators can switch activities');
                          return;
                        }

                        const newIndex = index;
                        // Only update and broadcast if different from current
                        if (newIndex !== currentActivityIndex) {
                          setCurrentActivityIndex(newIndex);
                          updateActivityInUrl(newIndex);
                          if (typeof broadcastActivityChange === 'function') broadcastActivityChange(newIndex);
                        }
                      } catch (err) {
                        console.error('Error switching activity:', err);
                        toast.error('Could not switch activity');
                      }
                    }}
                    onDoubleClick={() => {
                      // Double-click to toggle completion
                      if (isModerator) {
                        // Hosts can toggle (complete/incomplete)
                        toggleActivityComplete(activity.id);
                      } else if (!isCompleted) {
                        // Regular users can only mark as complete
                        markActivityComplete(activity.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm font-medium">
                        {(activity.activityType || '').replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1">
                        {isCompleted && (
                          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                            ✓ Done
                          </span>
                        )}
                        {isActive && (
                          <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAgenda(true)}
            className="fixed left-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-r-lg hover:bg-gray-700 transition-colors z-20 border-r border-gray-700"
            title="Open agenda"
          >
            <MdChevronRight className="w-5 h-5" />
          </button>
        )}
        
        {/* Mobile overlay backdrop */}
        {showAgenda && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setShowAgenda(false)}
          />
        )}

        {/* Center - Video & Activity Area */}
        <div className={`flex-1 flex flex-col bg-black overflow-hidden ${showChat ? 'md:pr-80' : ''}`} style={{ width: '100%' }}>
          {screenShared ? (
            // Screen Share View - Google Meet style (full screen)
            <div className="flex-1 flex items-center justify-center bg-black w-full h-full relative overflow-hidden">
              {peers?.map((peer) => {
                // ScreenShare component will handle filtering - only render if track exists
                return <ScreenShare key={peer.id} isLocal={peer.isLocal} peer={peer} />;
              })}
            </div>
          ) : viewMode === 'activity' ? (
            // Activity Only View
            <div className="flex-1 flex flex-col bg-black relative" style={{ height: '100%' }}>
              {/* Navigation buttons available to all users */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1 md:gap-2">
                {isModerator && (
                  <button
                    onClick={() => setViewMode('split')}
                    className="px-2 md:px-3 py-1 bg-gray-700 bg-opacity-90 backdrop-blur-sm text-white rounded text-xs md:text-sm hover:bg-gray-600 border border-gray-600"
                    title="Split View (Video + Activity)"
                  >
                    <span className="hidden md:inline">Split View</span>
                    <span className="md:hidden">Split</span>
                  </button>
                )}
                {isModerator && (
                  <>
                <button
                  onClick={handlePreviousActivity}
                  disabled={currentActivityIndex === 0}
                  className="p-1.5 md:p-2 bg-gray-700 bg-opacity-90 backdrop-blur-sm text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MdSkipPrevious className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button
                  onClick={handleNextActivity}
                  disabled={currentActivityIndex === activities.length - 1}
                  className="p-1.5 md:p-2 bg-gray-700 bg-opacity-90 backdrop-blur-sm text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MdSkipNext className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                  </>
                )}
              </div>
              <div ref={presentationRef} className="flex-1 flex items-center justify-center overflow-hidden bg-black h-full">
                {renderActivity()}
              </div>
            </div>
          ) : viewMode === 'video' ? (
            // Video Only View
            <div className="flex-1 overflow-auto flex bg-black relative" style={{ height: '100%' }}>
              {/* View mode toggle button */}
              {isModerator && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1 md:gap-2">
                  <button
                    onClick={() => setViewMode('split')}
                    className="px-2 md:px-3 py-1 bg-gray-700 bg-opacity-90 backdrop-blur-sm text-white rounded text-xs md:text-sm hover:bg-gray-600"
                    title="Split View"
                  >
                    <span className="hidden md:inline">Split View</span>
                    <span className="md:hidden">Split</span>
                  </button>
                </div>
              )}
              {getCurrentVideoCards().length === 0 ? (
                // Empty state - You're the only one here
                <div className="w-full h-full flex flex-col items-center justify-center text-white">
                  <div className="text-center">
                    <div className="mb-8">
                      <svg className="w-32 h-32 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <h2 className="text-xl md:text-3xl font-semibold mb-3 px-4">You're the only one here</h2>
                    <p className="text-gray-400 text-sm md:text-lg px-4">Sit back and relax till others join</p>
                  </div>
                </div>
              ) : !pinned?.status ? (
                <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
                  {(() => {
                    const gridConfig = calculateVideoOnlyGrid();
                    return (
                      <>
                        <div className="w-full h-full overflow-y-auto p-2">
                          {(() => {
                            const { hosts, guests } = getGroupedPeers();
                            return (
                              <>
                                {hosts.length > 0 && (
                                  <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2 px-2">
                                      <span className="text-sm font-semibold text-orange-400 uppercase tracking-wide">Hosts ({hosts.length})</span>
                                      <div className="flex-1 h-px bg-gray-700"></div>
                                    </div>
                                    <div
                                      className="grid w-full"
                                      style={{
                                        gridTemplateColumns: gridConfig.isVertical 
                                          ? '1fr' 
                                          : `repeat(${Math.min(gridConfig.cols, hosts.length)}, 1fr)`,
                                        gridTemplateRows: gridConfig.isVertical
                                          ? `repeat(${Math.ceil(hosts.length / gridConfig.cols)}, minmax(0, 1fr))`
                                          : `repeat(${Math.ceil(hosts.length / gridConfig.cols)}, minmax(0, 1fr))`,
                                        gap: '2px',
                                        boxSizing: 'border-box'
                                      }}
                                    >
                                      {hosts.map((peer) => (
                                        <div 
                                          key={peer.id} 
                                          className="relative group bg-gray-900"
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            minWidth: 0,
                                            minHeight: 0,
                                            overflow: 'hidden',
                                          }}
                                        >
                                          <VideoSpaces
                                            islocal={localPeer?.id === peer.id}
                                            peer={peer}
                                            pinned={pinned}
                                            setPinned={setPinned}
                                            dominantSpeakerId={dominantSpeaker?.id}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {guests.length > 0 && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-2 px-2">
                                      <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Guests ({guests.length})</span>
                                      <div className="flex-1 h-px bg-gray-700"></div>
                                    </div>
                                    <div
                                      className="grid w-full"
                                      style={{
                                        gridTemplateColumns: gridConfig.isVertical 
                                          ? '1fr' 
                                          : `repeat(${Math.min(gridConfig.cols, guests.length)}, 1fr)`,
                                        gridTemplateRows: gridConfig.isVertical
                                          ? `repeat(${Math.ceil(guests.length / gridConfig.cols)}, minmax(0, 1fr))`
                                          : `repeat(${Math.ceil(guests.length / gridConfig.cols)}, minmax(0, 1fr))`,
                                        gap: '2px',
                                        boxSizing: 'border-box'
                                      }}
                                    >
                                      {guests.map((peer) => (
                                        <div 
                                          key={peer.id} 
                                          className="relative group bg-gray-900"
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            minWidth: 0,
                                            minHeight: 0,
                                            overflow: 'hidden',
                                          }}
                                        >
                                          <VideoSpaces
                                            islocal={localPeer?.id === peer.id}
                                            peer={peer}
                                            pinned={pinned}
                                            setPinned={setPinned}
                                            dominantSpeakerId={dominantSpeaker?.id}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <VideoSpaces
                    isLocal={false}
                    peer={pinned?.peer}
                    pinned={pinned}
                    setPinned={setPinned}
                    dominantSpeakerId={dominantSpeaker?.id}
                  />
                </div>
              )}
            </div>
          ) : (
            // Split View (Video + Activity)
            <div className="flex-1 flex flex-col" style={{ height: '100%' }}>
              {/* Video Grid */}
              {getCurrentVideoCards().length > 0 && (
                <div className={`bg-black border-b border-gray-800 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${tilesExpanded ? 'h-[200px] md:h-1/3' : 'h-0'}`}>
                  {tilesExpanded && (
                    <>
                      <div className="flex items-center justify-between px-2 md:px-4 py-1.5 md:py-2 border-b border-gray-800">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs md:text-sm font-medium">Participants ({getCurrentVideoCards().length})</span>
                          <button
                            onClick={() => setTilesExpanded(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Hide participants"
                          >
                            <MdExpandLess className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="relative overflow-y-auto" style={{ maxHeight: 'calc(100% - 50px)' }}>
                        {(() => {
                          const { hosts, guests } = getGroupedPeers();
                          return (
                            <>
                              {hosts.length > 0 && (
                                <div className="mb-3 px-2 md:px-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Hosts ({hosts.length})</span>
                                    <div className="flex-1 h-px bg-gray-700"></div>
                                  </div>
                                  <div 
                                    ref={peerScrollRef}
                                    className="overflow-x-auto scrollbar-hide flex gap-2 md:gap-4"
                                    style={{ scrollBehavior: 'smooth' }}
                                  >
                                    {hosts.map((peer) => (
                                      <div key={peer.id} className="flex-shrink-0 w-[140px] md:w-[180px] h-[140px] md:h-[180px]">
                                        <VideoSpaces
                                          islocal={localPeer?.id === peer.id}
                                          peer={peer}
                                          setPinned={setPinned}
                                          pinned={pinned}
                                          dominantSpeakerId={dominantSpeaker?.id}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {guests.length > 0 && (
                                <div className="px-2 md:px-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Guests ({guests.length})</span>
                                    <div className="flex-1 h-px bg-gray-700"></div>
                                  </div>
                                  <div 
                                    className="overflow-x-auto scrollbar-hide flex gap-2 md:gap-4"
                                    style={{ scrollBehavior: 'smooth' }}
                                  >
                                    {guests.map((peer) => (
                                      <div key={peer.id} className="flex-shrink-0 w-[140px] md:w-[180px] h-[140px] md:h-[180px]">
                                        <VideoSpaces
                                          islocal={localPeer?.id === peer.id}
                                          peer={peer}
                                          setPinned={setPinned}
                                          pinned={pinned}
                                          dominantSpeakerId={dominantSpeaker?.id}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      {getCurrentVideoCards().length > 2 && (
                        <>
                          <button
                            onClick={() => {
                              if (peerScrollRef.current) {
                                peerScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                              }
                            }}
                            className="absolute left-1 md:left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-80 hover:bg-opacity-100 text-white p-1.5 md:p-2 rounded-full transition-all z-10"
                            title="Scroll left"
                          >
                            <MdChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          <button
                            onClick={() => {
                              if (peerScrollRef.current) {
                                peerScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                              }
                            }}
                            className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-80 hover:bg-opacity-100 text-white p-1.5 md:p-2 rounded-full transition-all z-10"
                            title="Scroll right"
                          >
                            <MdChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
              
              {/* Activity Area */}
              <div className="flex-1 flex flex-col border-t border-gray-800 min-h-0 relative">
                {isModerator && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1 md:gap-2">
                    <button
                      onClick={() => setViewMode('split')}
                      className={`px-2 md:px-3 py-1 bg-opacity-90 backdrop-blur-sm text-white rounded text-xs md:text-sm hover:bg-gray-600 ${
                        viewMode === 'split' 
                          ? 'bg-orange-600 border-2 border-orange-500' 
                          : 'bg-gray-700'
                      }`}
                      title="Split View (Video + Activity)"
                    >
                      <span className="hidden md:inline">Split View</span>
                      <span className="md:hidden">Split</span>
                    </button>
                  <button
                    onClick={() => setViewMode('activity')}
                      className={`px-2 md:px-3 py-1 bg-opacity-90 backdrop-blur-sm text-white rounded text-xs md:text-sm hover:bg-gray-600 ${
                        viewMode === 'activity' 
                          ? 'bg-orange-600 border-2 border-orange-500' 
                          : 'bg-gray-700'
                      }`}
                      title="Activity Only"
                    >
                      <span className="hidden md:inline">Activity</span>
                      <span className="md:hidden">Act</span>
                    </button>
                  <button
                    onClick={() => setViewMode('video')}
                      className={`px-2 md:px-3 py-1 bg-opacity-90 backdrop-blur-sm text-white rounded text-xs md:text-sm hover:bg-gray-600 ${
                        viewMode === 'video' 
                          ? 'bg-orange-600 border-2 border-orange-500' 
                          : 'bg-gray-700'
                      }`}
                      title="Video Only"
                    >
                      <span className="hidden md:inline">Video</span>
                      <span className="md:hidden">Vid</span>
                    </button>
                </div>
                )}
                <div ref={presentationRef} className="w-full h-full flex items-center justify-center overflow-hidden">
                  {renderActivity()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Chat & Participants */}
        {showChat && (
          <>
            {/* Mobile overlay backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setShowChat(false)}
            />
            <div className="fixed md:absolute inset-y-0 right-0 w-full md:w-80 bg-gray-800 flex-shrink-0 flex flex-col border-l border-gray-700 z-50 md:z-30">
              <Messages
                sideMenu={sideMenu}
                setSideMenu={setSideMenu}
                handRaisedPeers={handRaisedPeers}
                dominantSpeakerId={dominantSpeaker?.id}
                isModerator={isModerator}
              />
            </div>
          </>
        )}
      </div>

      {/* Floating Controls Bar - Google Meet Style */}
      {localPeer && hmsToken && (
        <>
          {/* Main Floating Controls */}
          <div 
            className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
              showControls 
                ? 'opacity-100 translate-y-0 pointer-events-auto' 
                : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            <div className="bg-gray-900 bg-opacity-95 backdrop-blur-md rounded-full px-3 md:px-4 py-2 md:py-2.5 shadow-2xl border border-gray-700">
              <Controls
                huddleId={id}
                type="av"
                switches={() => {}}
                visible={showChat}
                setVisible={setShowChat}
                isAudio={false}
                Catchup={null}
                userId={user?.unifiedUserId || user?.id}
                onLeaveClick={handleLeaveClick}
                isModerator={isModerator}
              />
            </div>
          </div>

          {/* Toggle Button - Show when controls are hidden */}
          {!showControls && (
            <button
              onClick={() => setShowControls(true)}
              className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 bg-opacity-95 backdrop-blur-md rounded-full p-2 shadow-2xl border border-gray-700 text-white hover:bg-opacity-100 transition-all flex items-center justify-center"
              title="Show controls"
            >
              <MdArrowUpward className="w-5 h-5" />
            </button>
          )}

          {/* Manual Hide Button - Show when controls are visible */}
          {showControls && (
            <button
              onClick={() => setShowControls(false)}
              className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-full p-1.5 shadow-xl border border-gray-600 text-white hover:bg-opacity-100 transition-all flex items-center justify-center"
              title="Hide controls"
            >
              <MdArrowDownward className="w-4 h-4" />
            </button>
          )}
        </>
      )}
      

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-full">
              <MdClose className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">
              Leave Ritual?
            </h3>
            <p className="text-gray-300 text-center mb-6">
              Are you sure you want to leave this ritual? You will be disconnected from the video room and will need to rejoin if you want to participate again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveConfirm}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

