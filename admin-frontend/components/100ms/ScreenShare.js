import { React, useEffect, useRef } from "react";
import {
  useHMSActions,
  useHMSStore,
  selectScreenShareByPeerID,
  selectPeerAudioByID,
} from "@100mslive/react-sdk";

const ScreenShare = ({ peer, isLocal }) => {
  const hmsActions = useHMSActions();
  const screenRef = useRef(null);
  const audioRef = useRef(null);
  const screenTrack = useHMSStore(selectScreenShareByPeerID(peer.id));
  const peerAudioLevel = useHMSStore(selectPeerAudioByID(peer.id)) || 0;

  useEffect(() => {
    let cancelled = false;
    const videoEl = screenRef.current;
    if (!videoEl || !screenTrack) return;

    async function attach() {
      try {
        await hmsActions.attachVideo(screenTrack.id, videoEl);
        // Try to play unmuted first (for screen share audio from videos)
        videoEl.muted = false;
        try {
          await videoEl.play();
        } catch (e) {
          // If autoplay is blocked, try muted
          console.warn("Screen share video autoplay blocked, trying muted:", e);
          try {
            videoEl.muted = true;
            await videoEl.play();
            // After successful play, try to unmute (user interaction may be needed)
            setTimeout(() => {
              if (videoEl && !cancelled) {
                videoEl.muted = false;
              }
            }, 100);
          } catch (e2) {
            console.warn("Screen share video autoplay blocked even when muted:", e2);
          }
        }
      } catch (error) {
        console.error("Error attaching screen share video:", error);
      }
    }

    async function detach() {
      try {
        await hmsActions.detachVideo(screenTrack.id, videoEl);
      } catch (error) {
        console.error("Error detaching screen share video:", error);
      }
    }

    if (screenTrack.enabled) attach();
    else detach();

    return () => {
      cancelled = true;
      detach();
    };
  }, [screenTrack?.id, screenTrack?.enabled, hmsActions]);

  // Ensure peer's audio track is played for screen share audio
  // When sharing a Chrome tab with "Share tab audio", the audio comes through peer's audioTrack
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !peer?.audioTrack || !screenTrack?.enabled) return;

    async function setupAudio() {
      try {
        // Use attachAudio if available, otherwise the SDK should handle it automatically
        if (hmsActions.attachAudio) {
          await hmsActions.attachAudio(peer.audioTrack.id, audioEl);
        }
        audioEl.volume = 1.0;
        audioEl.muted = false;
        try {
          await audioEl.play();
        } catch (e) {
          // If autoplay is blocked, user interaction may be needed
          console.warn("Screen share audio autoplay blocked, audio will play after user interaction:", e);
        }
      } catch (error) {
        // If attachAudio doesn't exist or fails, that's okay - 100ms SDK handles audio automatically
        console.warn("Could not explicitly attach screen share audio (SDK may handle it automatically):", error);
      }
    }

    setupAudio();

    return () => {
      if (audioEl && peer?.audioTrack && hmsActions.detachAudio) {
        try {
          hmsActions.detachAudio(peer.audioTrack.id, audioEl);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [peer?.audioTrack?.id, screenTrack?.enabled, hmsActions]);

  // Don't render if no screen track or track is disabled
  if (!screenTrack || !screenTrack.enabled) {
    return null;
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          ref={screenRef}
          autoPlay={true}
          playsInline
          muted={false}
          className="w-full h-full object-contain"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
        {/* Hidden audio element for screen share audio */}
        {peer?.audioTrack && (
          <audio
            ref={audioRef}
            autoPlay
            playsInline
            style={{ display: 'none' }}
          />
        )}
      </div>
    </div>
  );
};

export default ScreenShare;