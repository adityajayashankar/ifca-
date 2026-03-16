import { useState } from "react";
import {
    useHMSStore,
    useHMSActions,
    selectIsPeerAudioEnabled,
    selectIsPeerVideoEnabled,
    selectPeerMetadata,
    selectPeerAudioByID
} from "@100mslive/react-sdk";

import {BiMicrophone, BiMicrophoneOff, BiVideoOff, BiVideo} from "react-icons/bi"
import {HiHand} from "react-icons/hi"
import {HiUserRemove} from "react-icons/hi"
import {BsThreeDots} from "react-icons/bs"
import { toast } from "react-toastify";

function NameCard({ peer, showHandRaised = false, dominantSpeakerId, isModerator = false, permissions = null, localPeerId = null }) {

    const audioEnabled = useHMSStore(selectIsPeerAudioEnabled(peer?.id))
    const videoEnabled = useHMSStore(selectIsPeerVideoEnabled(peer?.id))
    const metaData = useHMSStore(selectPeerMetadata(peer?.id))
    const audioLevel = useHMSStore(selectPeerAudioByID(peer?.id)) || 0
    // Only show hand raised indicator if it's been raised for at least 1 minute
    const isHandRaised = (metaData?.isHandRaised || false) && showHandRaised
    const isSpeaking = dominantSpeakerId === peer.id && audioLevel > 0.1
    const [showMenu, setShowMenu] = useState(false);
    
    const hmsActions = useHMSActions();
    
    // Don't show controls for local peer
    const isLocalPeer = peer?.id === localPeerId;
    const showControls = isModerator && permissions && !isLocalPeer && (permissions?.mute || permissions?.removeOthers);

    const handleMutePeer = async () => {
        try {
            if (!peer?.audioTrack) {
                toast.error("No audio track found");
                return;
            }
            await hmsActions.setRemoteTrackEnabled(peer.audioTrack, !audioEnabled);
            toast.success(`${audioEnabled ? 'Muted' : 'Unmuted'} ${peer.name || 'participant'}`);
            setShowMenu(false);
        } catch (error) {
            console.error("Error muting peer:", error);
            toast.error("Failed to mute/unmute participant");
        }
    };

    const handleToggleVideo = async () => {
        try {
            if (!peer?.videoTrack) {
                toast.error("No video track found");
                return;
            }
            await hmsActions.setRemoteTrackEnabled(peer.videoTrack, !videoEnabled);
            toast.success(`${videoEnabled ? 'Turned off' : 'Turned on'} video for ${peer.name || 'participant'}`);
            setShowMenu(false);
        } catch (error) {
            console.error("Error toggling video:", error);
            toast.error("Failed to toggle video");
        }
    };

    const handleRemovePeer = async () => {
        try {
            if (!peer?.id) {
                toast.error("Invalid peer ID");
                return;
            }
            const reason = 'Removed by admin';
            await hmsActions.removePeer(peer.id, reason);
            toast.success(`Removed ${peer?.name || 'participant'} from room`);
            setShowMenu(false);
        } catch (error) {
            console.error("Error removing peer:", error);
            toast.error("Failed to remove participant");
        }
    };

    return (
        <div className={`flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded-lg transition-all duration-300 ${
            isSpeaking 
                ? 'bg-green-500 bg-opacity-20 border-2 border-green-500' 
                : isHandRaised 
                    ? 'bg-yellow-500 bg-opacity-20 border-2 border-yellow-500' 
                    : 'bg-gray-700 hover:bg-gray-650 border-2 border-transparent'
        }`}>
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                isSpeaking 
                    ? 'bg-green-500 ring-2 ring-green-400 ring-opacity-50' 
                    : isHandRaised 
                        ? 'bg-yellow-500' 
                        : 'bg-orange-500'
            }`}>
                <span className="text-white font-semibold text-xs md:text-sm">
                    {peer?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
                {isSpeaking && (
                    <span className="absolute inline-flex h-3 w-3 -mt-1 -mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`font-medium text-xs md:text-sm truncate ${isSpeaking ? 'text-green-400' : 'text-white'}`}>
                    {peer?.name || 'Unknown'}
                </p>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
                {isHandRaised && (
                    <HiHand className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400" title="Hand Raised" />
                )}
                {audioEnabled ? (
                    <BiMicrophone className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400" />
                ) : (
                    <BiMicrophoneOff className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" />
                )}
                {videoEnabled ? (
                    <BiVideo className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400" />
                ) : (
                    <BiVideoOff className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" />
                )}
                {showControls && (
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1 hover:bg-gray-600 rounded transition-colors"
                            title="Admin controls"
                        >
                            <BsThreeDots className="w-4 h-4 md:w-5 md:h-5 text-gray-300" />
                        </button>
                        {showMenu && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl z-20 border border-gray-200">
                                    {permissions?.mute && (
                                        <>
                                            <button
                                                onClick={handleMutePeer}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                {audioEnabled ? (
                                                    <>
                                                        <BiMicrophoneOff className="w-4 h-4 text-red-500" />
                                                        Mute
                                                    </>
                                                ) : (
                                                    <>
                                                        <BiMicrophone className="w-4 h-4 text-green-500" />
                                                        Unmute
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={handleToggleVideo}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                {videoEnabled ? (
                                                    <>
                                                        <BiVideoOff className="w-4 h-4 text-red-500" />
                                                        Turn off video
                                                    </>
                                                ) : (
                                                    <>
                                                        <BiVideo className="w-4 h-4 text-green-500" />
                                                        Turn on video
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    )}
                                    {permissions?.removeOthers && (
                                        <button
                                            onClick={handleRemovePeer}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-200"
                                        >
                                            <HiUserRemove className="w-4 h-4" />
                                            Remove from room
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default NameCard