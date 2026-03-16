import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  useHMSActions,
  useHMSStore,
  selectPeers,
  selectLocalPeer,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectPermissions,
  selectIsLocalScreenShared,
  selectPeerMetadata,
} from "@100mslive/react-sdk";

import { BiVideoOff, BiVideo } from "react-icons/bi";
import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai";
import { IoExitOutline } from "react-icons/io5";
// import { FiMessageSquare } from "react-icons/fi"
import { MdOutlineScreenShare, MdOutlineStopScreenShare, MdMoreHoriz } from "react-icons/md";
// import {TbHandOff, TbHandStop} from "react-icons/tb"
// import {HiOutlineHandRaised} from "react-icons/hi"
import { BiMessageRoundedDots, BiMessageRoundedX } from "react-icons/bi";
import { HiHand, HiOutlineHand } from "react-icons/hi";
import { BsFillRecord2Fill } from "react-icons/bs";
import axios from "axios";
import { useRouter } from "next/router";
import { setMeetDetails, selectMeetDetails } from "@/store/features/userSlice";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { selectCatchUp, setCommunityCatchup, setLeaveCatchup } from "@/store/features/communitySlice";
import { useCatchupAttendance } from "@/hooks/useCatchupAttendance";
import api from "@/utils/apiSetup";

function Controls({ switches, visible, setVisible, isAudio ,Catchup,userId, onLeaveClick, isModerator = false, huddleId = null}) {
  const hmsActions = useHMSActions();
  const dispatch = useDispatch();
  const router = useRouter();
  const localPeer = useHMSStore(selectLocalPeer);
  const stage = localPeer?.roleName === "stage";
  const peers = useHMSStore(selectPeers);
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const isLocalScreenShared = useHMSStore(selectIsLocalScreenShared);
  const permissions = useHMSStore(selectPermissions);

  const [handRaised, setHandRaised] = useState(false);
  const handRaiseTimerRef = useRef(null);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const adminMenuRef = useRef(null);

  const [toggler, setToggler] = useState(false);

  const catchup = useSelector(selectCatchUp)
  // console.log(localPeer)
  // const localPeerId = useHMSStore(localPeer?.id);
  const metaData = useHMSStore(selectPeerMetadata(localPeer?.id));

  // Initialize catchup attendance tracking
  const { joinCatchupOnEnter, leaveCatchupOnExit } = useCatchupAttendance(
    catchup?.roomId,
    catchup?.comId,
    userId
  );

  // Check if connected to 100ms room
  const isConnected = !!localPeer;

  // Close admin menu on outside click
  useEffect(() => {
    if (!showAdminMenu) return;
    function handleClickOutside(event) {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setShowAdminMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAdminMenu]);

  // console.log(metaData)
  const toggleRaiseHand = useCallback(async () => {
    if (!isConnected) {
      toast.error("Not connected to room");
      return;
    }
    try {
      const isCurrentlyRaised = metaData?.isHandRaised || false;
      
      // Clear existing timer if lowering hand manually
      if (isCurrentlyRaised && handRaiseTimerRef.current) {
        clearTimeout(handRaiseTimerRef.current);
        handRaiseTimerRef.current = null;
      }
      
      setHandRaised(!isCurrentlyRaised);
      const newMetadata = { ...(metaData || {}), isHandRaised: !isCurrentlyRaised };
      await hmsActions.changeMetadata(newMetadata);
      
      // Auto-lower hand after 1 minute
      if (!isCurrentlyRaised) {
        handRaiseTimerRef.current = setTimeout(async () => {
          try {
            const updatedMetadata = { ...(metaData || {}), isHandRaised: false };
            await hmsActions.changeMetadata(updatedMetadata);
            setHandRaised(false);
            handRaiseTimerRef.current = null;
          } catch (error) {
            console.error("Error auto-lowering hand:", error);
          }
        }, 60000); // 1 minute
      }
    } catch (error) {
      console.error("Error raising hand:", error);
      toast.error("Failed to raise hand");
    }
  }, [hmsActions, metaData, isConnected]);

  const SwitchAudio = async () => {
    if (!isConnected) {
      toast.error("Not connected to room");
      return;
    }
    try {
      await hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled);
    } catch (error) {
      console.error("Error toggling audio:", error);
      toast.error("Failed to toggle audio");
    }
  };
  const ScreenShare = async () => {
    if (!isConnected) {
      toast.error("Not connected to room");
      return;
    }
    
    // Allow screen sharing for moderators and users with screenShare permission
    // Note: Browser permission dialog will appear when setScreenShareEnabled is called
    const isModeratorRole = ['moderator', 'host', 'stage'].includes(localPeer?.roleName);
    const hasScreenSharePermission = permissions?.screenShare;
    // Always allow moderators/admins to try - let browser handle actual permission
    // For regular users, check if they have explicit permission
    const canShareScreen = isModerator || isModeratorRole || hasScreenSharePermission;
    
    // Log for debugging
    console.log("Screen Share Debug:", {
      isModerator,
      isModeratorRole,
      hasScreenSharePermission,
      canShareScreen,
      localPeerRole: localPeer?.roleName,
      permissions,
      isLocalScreenShared
    });

    try {
      const enableScreenShare = !isLocalScreenShared;
      
      console.log("Attempting to", enableScreenShare ? "start" : "stop", "screen share");
      
      if (enableScreenShare) {
        toast.info("Starting screen share...");
      }
      
      // Call 100ms API to enable/disable screen share
      // NOTE: screen share audio works only when user shares a Chrome tab and enables "Share tab audio"
      try {
        await hmsActions.setScreenShareEnabled(enableScreenShare, { audio: true });
        if (enableScreenShare) {
          toast.info('Tip: To share audio, share a browser tab and enable "Share tab audio".', { autoClose: 3500 });
        }
      } catch (e) {
        // Fallback for older SDKs that don't accept the second arg
        await hmsActions.setScreenShareEnabled(enableScreenShare);
      }
      
      if (enableScreenShare) {
        toast.success("Screen sharing started");
      } else {
        toast.success("Screen sharing stopped");
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      });
      
      const errorMessage = error.message || error.toString() || "Failed to toggle screen share";
      
      // Handle specific browser errors
      if (errorMessage.includes("Permission denied") || 
          errorMessage.includes("NotAllowedError") || 
          error.code === "NotAllowedError" ||
          error.name === "NotAllowedError") {
        toast.error("Screen share permission denied. Please allow screen sharing in your browser settings.");
      } else if (errorMessage.includes("NotReadableError") || error.code === "NotReadableError") {
        toast.error("Cannot access screen. Make sure no other application is using your screen.");
      } else if (errorMessage.includes("AbortError") || error.code === "AbortError") {
        toast.info("Screen share cancelled");
      } else if (errorMessage.includes("NotFoundError") || error.code === "NotFoundError") {
        toast.error("Screen share source not found. Please try again.");
      } else {
        toast.error(`Failed to toggle screen share: ${errorMessage}`);
      }
    }
  };
  const SwitchVideo = async () => {
    if (!isConnected) {
      toast.error("Not connected to room");
      return;
    }
    try {
      await hmsActions.setLocalVideoEnabled(!isLocalVideoEnabled);
    } catch (error) {
      console.error("Error toggling video:", error);
      toast.error("Failed to toggle video");
    }
  };

  // Admin bulk actions (host only)
  const getRemotePeers = () => (peers || []).filter(p => p.id !== localPeer?.id);
  const broadcastAdmin = (type, payload = {}) => {
    try {
      hmsActions.sendBroadcastMessage(JSON.stringify({ type, ...payload, ts: Date.now() }));
    } catch (e) {
      // ignore
    }
  };

  const muteAll = async () => {
    try {
      // First, broadcast so clients can react immediately
      broadcastAdmin('ADMIN_MUTE_ALL');
      
      // Then update remote peers
      const remotePeers = getRemotePeers();
      const promises = remotePeers.map(peer => {
        if (peer.audioTrack) {
          return hmsActions.setRemoteTrackEnabled(peer.audioTrack, false).catch(err => {
            console.warn(`Failed to mute peer ${peer.id}:`, err);
          });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      
      // Also mute admin's own mic for consistency
      if (isLocalAudioEnabled) {
        await hmsActions.setLocalAudioEnabled(false);
      }
      
      toast.success("Muted all participants");
    } catch (error) {
      console.error("Error muting all:", error);
      toast.error("Failed to mute all");
    }
  };

  const unmuteAll = async () => {
    try {
      // First, broadcast so clients can react immediately
      broadcastAdmin('ADMIN_UNMUTE_ALL');
      
      // Then update remote peers
      const remotePeers = getRemotePeers();
      const promises = remotePeers.map(peer => {
        if (peer.audioTrack) {
          return hmsActions.setRemoteTrackEnabled(peer.audioTrack, true).catch(err => {
            console.warn(`Failed to unmute peer ${peer.id}:`, err);
          });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      
      toast.success("Unmuted all participants");
    } catch (error) {
      console.error("Error unmuting all:", error);
      toast.error("Failed to unmute all");
    }
  };

  const videoOffAll = async () => {
    try {
      // First, broadcast so clients can react immediately
      broadcastAdmin('ADMIN_VIDEO_OFF_ALL');
      
      // Then update remote peers
      const remotePeers = getRemotePeers();
      const promises = remotePeers.map(peer => {
        if (peer.videoTrack) {
          return hmsActions.setRemoteTrackEnabled(peer.videoTrack, false).catch(err => {
            console.warn(`Failed to turn off video for peer ${peer.id}:`, err);
          });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      
      // Also turn off admin's own video for consistency
      if (isLocalVideoEnabled) {
        await hmsActions.setLocalVideoEnabled(false);
      }
      
      toast.success("Turned off video for all participants");
    } catch (error) {
      console.error("Error turning off video for all:", error);
      toast.error("Failed to turn off video for all");
    }
  };

  const videoOnAll = async () => {
    try {
      // First, broadcast so clients can react immediately
      broadcastAdmin('ADMIN_VIDEO_ON_ALL');
      
      // Then update remote peers
      const remotePeers = getRemotePeers();
      const promises = remotePeers.map(peer => {
        if (peer.videoTrack) {
          return hmsActions.setRemoteTrackEnabled(peer.videoTrack, true).catch(err => {
            console.warn(`Failed to turn on video for peer ${peer.id}:`, err);
          });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      
      toast.success("Turned on video for all participants");
    } catch (error) {
      console.error("Error turning on video for all:", error);
      toast.error("Failed to turn on video for all");
    }
  };

  const ExitRoom = () => {
    if (isConnected) {
      try {
        hmsActions.leave();
      } catch (error) {
        console.error("Error leaving room:", error);
      }
    }
    dispatch(setMeetDetails({}));
    toast.success("Meeting left");
    router.back();
    //exit a room
  };

  console.log(permissions);

  const endRoom = async () => {
    //end the meeting
    try {
      const lock = false; // A value of true disallow rejoins
      const reason = "Meeting is over";
      await hmsActions.endRoom(lock, reason);
      router.push("/");
    } catch (error) {
      // Permission denied or not connected to room
      console.error(error);
    }
  };

  const endHuddle = async () => {
    if (!huddleId) {
      toast.error("Huddle ID not available");
      return;
    }
    
    if (!isModerator && !stage) {
      toast.error("Only hosts can end the huddle");
      return;
    }

    // Confirm before ending
    if (!confirm("Are you sure you want to end this huddle? The next recurring huddle will be scheduled automatically.")) {
      return;
    }

    try {
      // Call backend to end huddle (this will schedule next one if recurring)
      const response = await api.post(`/huddle/${huddleId}/end`);
      
      if (response.data.success) {
        toast.success("Huddle ended successfully. Next huddle scheduled if recurring.");
        
        // End 100ms room
        try {
          const lock = false;
          const reason = "Huddle ended by host";
          await hmsActions.endRoom(lock, reason);
        } catch (roomError) {
          console.error("Error ending 100ms room:", roomError);
        }
        
        // Navigate back to community huddles
        setTimeout(() => {
          router.push('/comHome/141?tab=huddles');
        }, 800);
      } else {
        toast.error(response.data.message || "Failed to end huddle");
      }
    } catch (error) {
      console.error("Error ending huddle:", error);
      toast.error(error.response?.data?.message || "Failed to end huddle");
    }
  };

  const ExitCatchup = async () => {
    try {
      // First, leave the 100ms room
      hmsActions.leave();
      
      // Then, update our attendance tracking
      await leaveCatchupOnExit();
      
      // Update Redux state
      dispatch(setCommunityCatchup({}));
      dispatch(setLeaveCatchup({roomId: Catchup.roomId, comId: Catchup.comId, userId: userId}));
      
      toast.success("Meeting left");
      router.back();
    } catch (error) {
      console.error("Error leaving catchup:", error);
      toast.error("Error leaving catchup");
      router.back();
    }
  }
  console.log("localpeer is ", localPeer);

  // Don't render controls if not connected to 100ms room
  if (!isConnected || !localPeer) {
    return null;
  }

  return (
    <div className="w-full flex justify-center items-center text-white">
      <div className="flex flex-row gap-1 md:gap-2 items-center flex-wrap justify-center">
        {/* {(localPeer?.roleName !== "listener") && (<button
          className={`uppercase px-5 py-2 rounded-lg ${isLocalVideoEnabled ? "bg-slate-600" : "bg-slate-400"}`}
          onClick={StartRecording}
        >
          <BsFillRecord2Fill />
        </button>)} */}

        {!isAudio && (
          <button
            disabled={!isConnected}
            className={`p-2 md:p-2.5 rounded-full transition-all shadow-lg ${
              isLocalVideoEnabled 
                ? "bg-gray-700 hover:bg-gray-600 text-white" 
                : "bg-red-600 hover:bg-red-700 text-white"
            } ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={SwitchVideo}
            title={isLocalVideoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {isLocalVideoEnabled ? (
              <BiVideo className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <BiVideoOff className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>
        )}

        {localPeer?.roleName !== "listener" && (
          <button
            disabled={!isConnected}
            className={`p-2 md:p-2.5 rounded-full transition-all shadow-lg ${
              isLocalAudioEnabled 
                ? "bg-gray-700 hover:bg-gray-600 text-white" 
                : "bg-red-600 hover:bg-red-700 text-white"
            } ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={SwitchAudio}
            title={isLocalAudioEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {isLocalAudioEnabled ? (
              <AiOutlineAudio className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <AiOutlineAudioMuted className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>
        )}

        {!isAudio && localPeer?.roleName !== "listener" && (
          <button
            disabled={!isConnected}
            className={`p-2 md:p-2.5 rounded-full transition-all shadow-lg ${
              isLocalScreenShared 
                ? "bg-orange-600 hover:bg-orange-700 text-white" 
                : "bg-gray-700 hover:bg-gray-600 text-white"
            } ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={ScreenShare}
            title={isLocalScreenShared ? "Stop sharing screen" : "Share your screen"}
          >
            {isLocalScreenShared ? (
              <MdOutlineStopScreenShare className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <MdOutlineScreenShare className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>
        )}

        <button
          onClick={toggleRaiseHand}
          disabled={!isConnected}
          className={`p-2 md:p-2.5 rounded-full transition-all shadow-lg ${
            metaData?.isHandRaised 
              ? "bg-yellow-500 hover:bg-yellow-600 text-white" 
              : "bg-gray-700 hover:bg-gray-600 text-white"
          } ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
          title={metaData?.isHandRaised ? "Lower hand" : "Raise hand"}
        >
          {metaData?.isHandRaised ? (
            <HiHand className="w-4 h-4 md:w-5 md:h-5" />
          ) : (
            <HiOutlineHand className="w-4 h-4 md:w-5 md:h-5" />
          )}
        </button>

        <button
          onClick={() => setVisible(!visible)}
          className={`p-2 md:p-2.5 rounded-full transition-all shadow-lg ${
            visible 
              ? "bg-gray-700 hover:bg-gray-600 text-white border-2 border-orange-500" 
              : "bg-gray-700 hover:bg-gray-600 text-white"
          }`}
          title={visible ? "Hide chat" : "Show chat"}
        >
          {visible ? (
            <BiMessageRoundedX className="w-4 h-4 md:w-5 md:h-5" />
          ) : (
            <BiMessageRoundedDots className="w-4 h-4 md:w-5 md:h-5" />
          )}
        </button>

        {/* Admin Controls - moved into 3-dots menu */}
        {isModerator && peers && peers.length > 1 && (
          <div ref={adminMenuRef} className="relative">
            <button
              disabled={!isConnected}
              onClick={() => setShowAdminMenu(v => !v)}
              className={`p-2 md:p-2.5 rounded-full transition-all shadow-lg ${
                showAdminMenu ? "bg-gray-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
              } ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
              title="Admin controls"
            >
              <MdMoreHoriz className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {showAdminMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-[9999]">
                <div className="px-3 py-2 text-xs font-semibold text-gray-300 border-b border-gray-800">
                  Admin controls
                </div>

                <button
                  onClick={async () => { setShowAdminMenu(false); await muteAll(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-800 transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center">
                    <AiOutlineAudioMuted className="w-4 h-4" />
                  </span>
                  <span className="text-sm text-gray-100">Mute all</span>
                </button>

                <button
                  onClick={async () => { setShowAdminMenu(false); await unmuteAll(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-800 transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-green-600/20 text-green-400 flex items-center justify-center">
                    <AiOutlineAudio className="w-4 h-4" />
                  </span>
                  <span className="text-sm text-gray-100">Unmute all</span>
                </button>

                <div className="h-px bg-gray-800" />

                <button
                  onClick={async () => { setShowAdminMenu(false); await videoOffAll(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-800 transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                    <BiVideoOff className="w-4 h-4" />
                  </span>
                  <span className="text-sm text-gray-100">Video off for all</span>
                </button>

                <button
                  onClick={async () => { setShowAdminMenu(false); await videoOnAll(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-800 transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-teal-600/20 text-teal-400 flex items-center justify-center">
                    <BiVideo className="w-4 h-4" />
                  </span>
                  <span className="text-sm text-gray-100">Video on for all</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* End Huddle Button - Only for hosts/moderators */}
        {(isModerator || stage) && huddleId && (
          <button
            className="p-2 md:p-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg"
            onClick={endHuddle}
            title="End huddle (will schedule next one if recurring)"
          >
            <IoExitOutline className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden md:inline ml-1 text-xs">End Huddle</span>
          </button>
        )}
        
        {/* Leave Button - For non-hosts */}
        {(!isModerator && !stage) && (
          <button
            className="p-2 md:p-2.5 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-all shadow-lg"
            onClick={onLeaveClick || (Catchup!=null?ExitCatchup:ExitRoom)}
            title="Leave meeting"
          >
            <IoExitOutline className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        )}
        
        {/* Legacy endRoom button for stage role */}
        {stage && permissions?.endRoom && !huddleId && (
          <button
            className="p-2 md:p-2.5 rounded-full bg-red-400 hover:bg-red-500 text-white transition-all shadow-lg"
            onClick={endRoom}
            title="End room"
          >
            <IoExitOutline className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        )}
        {/* <button
          className={`uppercase px-5 py-2 rounded-lg ${toggle ? "bg-slate-600" : "bg-slate-400"}`}
          onClick={() => {
            setToggle(!toggle)
          }}
        >
          {toggle ? <MdWindow /> : <FiMessageSquare />}
        </button> */}
      </div>
    </div>
  );
}

export default Controls;
