import { useState, useRef, useEffect } from "react";
import { MdPlayArrow, MdPause, MdShare, MdFullscreen, MdFullscreenExit } from "react-icons/md";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";

export default function AnthemActivity({ activity, activityData, isModerator }) {
  const user = useSelector(selectUser);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const lastSyncTimeRef = useRef(0);
  const isSyncingRef = useRef(false);
  const lastStateRef = useRef({ isPlaying: false, currentTime: 0 });
  const isMountedRef = useRef(true);
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const isPollingVideoStateRef = useRef(false);
  const checkVideoReadyTimeoutRef = useRef(null);

  // Track mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Clear interval on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const videoUrl = activityData.videoUrl || activity.linkUrl || activityData.url;

  // Load initial video state from backend
  useEffect(() => {
    if (!activity?.id || !videoUrl) return;

    const loadVideoState = async () => {
      try {
        const response = await api.get(`/huddle/activity/${activity.id}/video-state`);
        if (response.data.success && response.data.videoState) {
          const { isPlaying: serverIsPlaying, currentTime: serverCurrentTime } = response.data.videoState;
          lastStateRef.current = { isPlaying: serverIsPlaying, currentTime: serverCurrentTime };
          
          // Restore state after video loads
          const video = videoRef.current;
          if (video) {
            video.addEventListener('loadedmetadata', () => {
              if (serverCurrentTime > 0 && serverCurrentTime < video.duration) {
                video.currentTime = serverCurrentTime;
              }
              if (serverIsPlaying) {
                video.play().catch(err => console.error('Error playing video:', err));
              }
            }, { once: true });
          }
        }
      } catch (error) {
        console.error('Error loading video state:', error);
      }
    };

    loadVideoState();
  }, [activity?.id, videoUrl]);

  // Update refs when state changes (to avoid dependency issues)
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    currentTimeRef.current = currentTime;
  }, [isPlaying, currentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      const newTime = video.currentTime;
      setCurrentTime(newTime);
      
      // Update backend state periodically (only if moderator and state changed)
      if (isModerator && !isSyncingRef.current) {
        const timeSinceLastUpdate = Date.now() - lastSyncTimeRef.current;
        // Update every 1 second or if play/pause state changed
        if (timeSinceLastUpdate > 1000 || (video.paused !== !isPlaying)) {
          updateVideoStateOnBackend(video.paused === false, newTime);
        }
      }
    };

    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => {
      setIsPlaying(true);
      if (isModerator) {
        updateVideoStateOnBackend(true, video.currentTime);
      }
    };
    const handlePause = () => {
      setIsPlaying(false);
      if (isModerator) {
        updateVideoStateOnBackend(false, video.currentTime);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if (isModerator) {
        updateVideoStateOnBackend(false, 0);
      }
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isModerator]);

  // Update video state on backend (only for moderators)
  const updateVideoStateOnBackend = async (playing, time) => {
    if (!activity?.id || !isModerator || isSyncingRef.current) return;

    // Don't update if state hasn't changed significantly
    if (lastStateRef.current.isPlaying === playing && 
        Math.abs(lastStateRef.current.currentTime - time) < 0.5) {
      return;
    }

    isSyncingRef.current = true;
    try {
      const userId = user?.unifiedUserId || user?.id;
      await api.post(`/huddle/activity/${activity.id}/video-state`, {
        isPlaying: playing,
        currentTime: time,
        userId: userId
      });
      lastStateRef.current = { isPlaying: playing, currentTime: time };
      lastSyncTimeRef.current = Date.now();
    } catch (error) {
      console.error('Error updating video state:', error);
    } finally {
      isSyncingRef.current = false;
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    // Only moderators can control playback
    if (!isModerator) {
      toast.info('Only moderators can control video playback');
      return;
    }

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !isModerator) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * duration;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: activityData.title || 'Ritual Anthem',
      text: activityData.description || 'Check out this anthem video',
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link copied to clipboard!');
        } catch (clipboardError) {
          toast.error('Failed to share');
        }
      }
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No video URL provided</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-black relative">
      {/* Video Player - Full Screen */}
      <div className="flex-1 relative flex items-center justify-center min-h-0">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain max-w-full max-h-full"
          controls={false}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Play Button Overlay (centered) - Only show if moderator or video is paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <button
              onClick={togglePlay}
              disabled={!isModerator}
              className={`w-20 h-20 md:w-24 md:h-24 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-opacity pointer-events-auto ${
                !isModerator ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={!isModerator ? 'Only moderators can control playback' : 'Play video'}
            >
              <MdPlayArrow className="w-12 h-12 md:w-16 md:h-16 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Controls Bar - Bottom (Relative to container) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-95 backdrop-blur-sm px-3 md:px-6 py-2 md:py-3 z-40 border-t border-gray-800">
        <div className="flex items-center justify-between">
          {/* Play/Pause Button - Only enabled for moderators */}
          <button
            onClick={togglePlay}
            disabled={!isModerator}
            className={`text-white transition-colors p-2 ${
              isModerator ? 'hover:text-orange-500' : 'opacity-50 cursor-not-allowed'
            }`}
            title={!isModerator ? 'Only moderators can control playback' : isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <MdPause className="w-5 h-5 md:w-6 md:h-6" />
            ) : (
              <MdPlayArrow className="w-5 h-5 md:w-6 md:h-6" />
            )}
          </button>

          {/* Progress Bar - Only seekable by moderators */}
          <div
            className={`flex-1 mx-3 md:mx-4 h-1.5 md:h-2 bg-gray-700 rounded-full relative ${
              isModerator ? 'cursor-pointer' : 'cursor-default'
            }`}
            onClick={handleSeek}
          >
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Time Display */}
          <span className="text-white text-xs md:text-sm font-mono min-w-[80px] md:min-w-[100px] text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="ml-2 md:ml-4 text-white hover:text-orange-500 transition-colors p-2"
            title="Share video"
          >
            <MdShare className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="ml-2 md:ml-4 text-white hover:text-orange-500 transition-colors p-2"
            title="Toggle fullscreen"
          >
            {isFullscreen ? (
              <MdFullscreenExit className="w-5 h-5 md:w-6 md:h-6" />
            ) : (
              <MdFullscreen className="w-5 h-5 md:w-6 md:h-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

