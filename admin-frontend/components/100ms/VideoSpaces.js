import { React, useEffect, useRef, useState } from "react";
import {
  useHMSActions,
  useHMSStore,
  selectLocalPeer,
  selectCameraStreamByPeerID,
  selectPeerMetadata,
  selectDominantSpeaker,
  selectPeerAudioByID,
  selectIsPeerAudioEnabled,
  selectIsPeerVideoEnabled,
  selectPermissions
} from "@100mslive/react-sdk";

import { HMSVideoTrack } from "@100mslive/hms-video";
import { BsThreeDots } from "react-icons/bs"
import { MdPushPin, MdOutlinePersonOutline } from "react-icons/md"
import { HiOutlineHand } from "react-icons/hi"
import { HiUserRemove } from "react-icons/hi"
import { BiMicrophone, BiMicrophoneOff, BiVideoOff, BiVideo } from "react-icons/bi"
import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai"
import { toast } from "react-toastify";

function VideoSpaces({ peer, islocal, pinned, setPinned, dominantSpeakerId }) {
  const hmsActions = useHMSActions();
  const videoRef = useRef(null);
  const videoTrack = useHMSStore(selectCameraStreamByPeerID(peer.id));
  const metaData = useHMSStore(selectPeerMetadata(peer?.id));
  const level = useHMSStore(selectPeerAudioByID(peer.id)) || 0;
  const isSpeaking = dominantSpeakerId === peer.id && level > 0.1;

  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    (async () => {
      if (videoRef.current && videoTrack) {
        if (videoTrack.enabled) {
          await hmsActions.attachVideo(videoTrack.id, videoRef.current);
        } else {
          await hmsActions.detachVideo(videoTrack.id, videoRef.current);
        }
      }
    })();
  }, [videoTrack]);
  const localPeer = useHMSStore(selectLocalPeer);
  const stage = localPeer?.roleName === "stage";

  // console.log("peer is ",peer)
  // console.log(stage)
  // console.log(videoTrack)
  const audioEnabled = useHMSStore(selectIsPeerAudioEnabled(peer?.id))
  const videoEnabled = useHMSStore(selectIsPeerVideoEnabled(peer?.id))

  const permissions = useHMSStore(selectPermissions);
  // console.log(permissions)

  async function removePeer(peerId) {
    try {
      if (!peerId) {
        toast.error("Invalid peer ID");
        return;
      }
      const reason = 'Removed by admin';
      await hmsActions.removePeer(peerId, reason);
      toast.success(`Removed ${peer?.name || 'participant'} from room`);
      setMenuOpen(false);
    } catch (error) {
      console.error("Error removing peer:", error);
      toast.error("Failed to remove participant");
    }
  }

  async function mutePeer(peer) {
    try {
      if (!peer?.audioTrack) {
        toast.error("No audio track found");
        return;
      }
      const currentState = audioEnabled;
      await hmsActions.setRemoteTrackEnabled(peer.audioTrack, !currentState);
      toast.success(`${currentState ? 'Muted' : 'Unmuted'} ${peer.name || 'participant'}`);
    } catch (error) {
      console.error("Error muting peer:", error);
      toast.error("Failed to mute/unmute participant");
    }
  }

  async function toggleVideoPeer(peer) {
    try {
      if (!peer?.videoTrack) {
        toast.error("No video track found");
        return;
      }
      const currentState = videoEnabled;
      await hmsActions.setRemoteTrackEnabled(peer.videoTrack, !currentState);
      toast.success(`${currentState ? 'Turned off' : 'Turned on'} video for ${peer.name || 'participant'}`);
    } catch (error) {
      console.error("Error toggling video:", error);
      toast.error("Failed to toggle video");
    }
  }
  // console.log(peer)
  // Determine if this is a compact tile (used in horizontal scroll)
  const isCompactTile = !pinned?.status;
  
  // Determine role badge styling
  const hostRoles = ['host', 'moderator', 'stage'];
  const isHost = hostRoles.includes(peer?.roleName);
  
  return (
    <div className={`flex items-center justify-center w-full h-full commScroll`}>
      <div className={`flex relative items-center justify-center flex-col w-full h-full bg-gray-800 overflow-hidden transition-all duration-300 rounded-lg border-2 ${
        isSpeaking 
          ? 'ring-2 ring-green-500 ring-opacity-75 border-green-500' 
          : isHost
          ? 'border-orange-500/50 shadow-lg shadow-orange-500/20'
          : 'border-gray-700 shadow-md'
      }`}>
        {videoEnabled ? (
          <video
            onClick={() => setMenuOpen(false)}
            ref={videoRef}
            autoPlay={true}
            playsInline
            muted={true}
            className={`object-cover w-full h-full
             ${islocal ? "mirror" : ""}
            `}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          ></video>
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gray-800`}>
            <div className="text-center">
              <div className={`${pinned?.status ? "w-20 h-20" : isCompactTile ? "w-16 h-16" : "w-12 h-12"} mx-auto ${isCompactTile ? "mb-2" : "mb-3"} rounded-full bg-gray-700 flex items-center justify-center`}>
                <span className={`text-gray-400 ${pinned?.status ? "text-2xl" : isCompactTile ? "text-xl" : "text-lg"} font-semibold`}>
                  {peer?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent ${isCompactTile ? 'p-2' : 'p-3'} rounded-b-lg`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {isHost && (
                <span className="flex-shrink-0 bg-orange-500 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                  Host
                </span>
              )}
              <span className={`font-semibold ${isCompactTile ? 'text-xs' : 'text-sm'} ${isSpeaking ? 'text-green-400' : 'text-white'} truncate`}>
                {(localPeer?.id === peer?.id) ? 'You' : peer.name}
                {isSpeaking && !isCompactTile && (
                  <span className="ml-2 inline-flex items-center">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  </span>
                )}
              </span>
              {metaData?.isHandRaised && (
                <span className="text-yellow-400 flex-shrink-0 animate-pulse">
                  <HiOutlineHand className={`${isCompactTile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {audioEnabled === false && (
                <div className={`bg-red-500 rounded-full ${isCompactTile ? 'p-0.5' : 'p-1'} flex-shrink-0`}>
                  <BiMicrophoneOff className={`${isCompactTile ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-white`} />
                </div>
              )}
              {videoEnabled === false && (
                <div className={`bg-gray-600 rounded-full ${isCompactTile ? 'p-0.5' : 'p-1'} flex-shrink-0`}>
                  <BiVideoOff className={`${isCompactTile ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-white`} />
                </div>
              )}
            </div>
          </div>
        </div>


        {(localPeer?.id !== peer?.id) && (
          <div className="main__video absolute right-2 top-2 text-white">
            {menuOpen && (<div className="menu__video flex flex-col bg-white rounded-lg mb-6 p-2">
              <div className="text-black w-full flex cursor-pointer" onClick={() => setPinned({ status: !pinned?.status, peer: peer })}>
                <span className="my-auto mr-2"><MdPushPin /></span> {pinned?.status ? "Remove pin" : "Pin tile"}
              </div>
              {permissions?.removeOthers && (
                <div className="text-black w-full flex cursor-pointer hover:bg-gray-100 p-1 rounded" onClick={() => removePeer(peer.id)}>
                  <span className="my-auto mr-2"><HiUserRemove /></span> Remove participant
                </div>
              )}
              {permissions?.mute && (
                <div className="text-black w-full flex cursor-pointer hover:bg-gray-100 p-1 rounded" onClick={() => mutePeer(peer)}>
                  <span className="my-auto mr-2">
                    {audioEnabled ? <AiOutlineAudioMuted /> : <AiOutlineAudio />}
                  </span>
                  {audioEnabled ? "Mute participant" : "Unmute participant"}
                </div>
              )}
              {permissions?.mute && (
                <div className="text-black w-full flex cursor-pointer hover:bg-gray-100 p-1 rounded" onClick={() => toggleVideoPeer(peer)}>
                  <span className="my-auto mr-2">
                    {videoEnabled ? <BiVideoOff /> : <BiVideo />}
                  </span>
                  {videoEnabled ? "Turn off video" : "Turn on video"}
                </div>
              )}
            </div>)}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="dots__video bg-gray-900/90 hover:bg-gray-800 text-white cursor-pointer rounded-full p-1.5 md:p-2 shadow-xl border border-gray-600 hover:border-orange-500 transition-all"
              title="Peer controls"
            >
              <BsThreeDots className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>)}
      </div>
    </div>
  );
}
export default VideoSpaces;
