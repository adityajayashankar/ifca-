import { useState, useEffect, useRef } from "react";
import { MdPlayArrow, MdPause, MdSkipNext, MdSkipPrevious } from "react-icons/md";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";

export default function GuidedSessionActivity({ activity, activityData, isModerator }) {
  const user = useSelector(selectUser);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const pollingIntervalRef = useRef(null);
  const lastSyncTimeRef = useRef(0);
  const isSyncingRef = useRef(false);
  const lastStateRef = useRef({ currentStep: 0, isPlaying: false, timeElapsed: 0 });
  const timerIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const isPollingSessionStateRef = useRef(false);

  const instructions = activityData.instructions || [];
  const title = activityData.title || "Guided Session";
  const currentInstruction = instructions[currentStep];

  // Load initial session state from backend
  useEffect(() => {
    if (!activity?.id) return;

    const loadSessionState = async () => {
      try {
        const response = await api.get(`/huddle/activity/${activity.id}/guided-session-state`);
        if (response.data.success && response.data.sessionState) {
          const { currentStep: serverStep, isPlaying: serverPlaying, timeElapsed: serverTime } = response.data.sessionState;
          lastStateRef.current = { currentStep: serverStep, isPlaying: serverPlaying, timeElapsed: serverTime };
          
          // Restore state
          if (serverStep >= 0 && serverStep < instructions.length) {
            setCurrentStep(serverStep);
          }
          setIsPlaying(serverPlaying);
          setTimeElapsed(serverTime);
        }
      } catch (error) {
        console.error('Error loading session state:', error);
      }
    };

    loadSessionState();
  }, [activity?.id, instructions.length]);

  // Use refs to track current state for polling (avoid dependency issues)
  const currentStepRef = useRef(currentStep);
  const isPlayingRef = useRef(isPlaying);
  const timeElapsedRef = useRef(timeElapsed);

  useEffect(() => {
    currentStepRef.current = currentStep;
    isPlayingRef.current = isPlaying;
    timeElapsedRef.current = timeElapsed;
  }, [currentStep, isPlaying, timeElapsed]);

  // Track mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // Poll for session state updates (every 3 seconds - reduced frequency to prevent infinite loops)
  useEffect(() => {
    if (!activity?.id || !instructions.length) return;

    // Clear any existing interval first
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isPollingSessionStateRef.current = false;

    const pollSessionState = async () => {
      // Don't poll if unmounted, syncing, or already polling
      if (!isMountedRef.current || isSyncingRef.current || isPollingSessionStateRef.current) return;

      isPollingSessionStateRef.current = true;
      try {
        const response = await api.get(`/huddle/activity/${activity.id}/guided-session-state`, {
          headers: {
            'Cache-Control': 'no-cache',
            'noLoad': true // Prevent loader from showing
          }
        });
        
        // Handle 304 Not Modified gracefully (no changes, skip update)
        if (response.status === 304) {
          return;
        }

        if (response.data?.success && response.data.sessionState) {
          const { currentStep: serverStep, isPlaying: serverPlaying, timeElapsed: serverTime, lastUpdated } = response.data.sessionState;
          const lastUpdatedTime = lastUpdated ? new Date(lastUpdated).getTime() : 0;

          // Only sync if state is newer and different from local state
          if (lastUpdatedTime > lastSyncTimeRef.current) {
            // Sync step
            if (serverStep !== currentStepRef.current && serverStep >= 0 && serverStep < instructions.length) {
              setCurrentStep(serverStep);
            }

            // Sync play/pause state
            if (serverPlaying !== isPlayingRef.current) {
              setIsPlaying(serverPlaying);
            }

            // Sync time elapsed (only if difference is significant)
            if (Math.abs(serverTime - timeElapsedRef.current) > 2) {
              setTimeElapsed(serverTime);
            }

            lastSyncTimeRef.current = lastUpdatedTime;
            lastStateRef.current = { currentStep: serverStep, isPlaying: serverPlaying, timeElapsed: serverTime };
          }
        }
      } catch (error) {
        // Silently handle errors (including 304)
        if (error.response?.status !== 304) {
          console.error('Error polling session state:', error);
        }
      } finally {
        isPollingSessionStateRef.current = false;
      }
    };

    pollingIntervalRef.current = setInterval(pollSessionState, 3000); // Increased to 3 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      isPollingSessionStateRef.current = false;
    };
  }, [activity?.id, instructions.length]); // Removed state dependencies

  // Timer for playing state (only if moderator controls it)
  useEffect(() => {
    if (isPlaying && currentInstruction && isModerator) {
      timerIntervalRef.current = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 1;
          const duration = currentInstruction.duration || 30;
          
          if (newTime >= duration) {
            if (currentStep < instructions.length - 1) {
              // Move to next step
              const nextStep = currentStep + 1;
              setCurrentStep(nextStep);
              updateSessionStateOnBackend(nextStep, true, 0);
              return 0;
            } else {
              // Session complete
              setIsPlaying(false);
              updateSessionStateOnBackend(currentStep, false, 0);
              return 0;
            }
          }
          
          // Update backend periodically
          if (newTime % 5 === 0) { // Update every 5 seconds
            updateSessionStateOnBackend(currentStep, true, newTime);
          }
          
          return newTime;
        });
      }, 1000);
      
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [isPlaying, currentStep, currentInstruction, instructions.length, isModerator]);

  // Update session state on backend (only for moderators)
  const updateSessionStateOnBackend = async (step, playing, time) => {
    if (!activity?.id || !isModerator || isSyncingRef.current) return;

    // Don't update if state hasn't changed significantly
    if (lastStateRef.current.currentStep === step && 
        lastStateRef.current.isPlaying === playing && 
        Math.abs(lastStateRef.current.timeElapsed - time) < 2) {
      return;
    }

    isSyncingRef.current = true;
    try {
      const userId = user?.unifiedUserId || user?.id;
      await api.post(`/huddle/activity/${activity.id}/guided-session-state`, {
        currentStep: step,
        isPlaying: playing,
        timeElapsed: time,
        userId: userId
      });
      lastStateRef.current = { currentStep: step, isPlaying: playing, timeElapsed: time };
      lastSyncTimeRef.current = Date.now();
    } catch (error) {
      console.error('Error updating session state:', error);
    } finally {
      isSyncingRef.current = false;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentInstruction) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">No instructions available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <span className="text-gray-300 text-sm">
            Step {currentStep + 1} of {instructions.length}
          </span>
        </div>
        {isPlaying && currentInstruction.duration && (
          <div className="text-orange-400 text-sm">
            Time: {formatTime(timeElapsed)} / {formatTime(currentInstruction.duration)}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
        <div className="flex gap-1">
          {instructions.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-2 rounded ${
                idx === currentStep
                  ? 'bg-orange-600'
                  : idx < currentStep
                  ? 'bg-green-500'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Current Instruction */}
      <div className="flex-1 p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h4 className="text-xl md:text-2xl font-bold text-white mb-4">
            {currentInstruction.title || `Step ${currentStep + 1}`}
          </h4>
          <div className="bg-gray-800 rounded-lg p-6 md:p-8">
            <p className="text-gray-300 text-lg md:text-xl whitespace-pre-wrap leading-relaxed">
              {currentInstruction.content || currentInstruction.text || ""}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => {
              if (!isModerator) {
                toast.info('Only moderators can control the session');
                return;
              }
              if (currentStep > 0) {
                const newStep = currentStep - 1;
                setCurrentStep(newStep);
                setTimeElapsed(0);
                setIsPlaying(false);
                updateSessionStateOnBackend(newStep, false, 0);
              }
            }}
            disabled={currentStep === 0 || !isModerator}
            className={`flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              !isModerator ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={!isModerator ? 'Only moderators can control the session' : 'Previous step'}
          >
            <MdSkipPrevious className="w-5 h-5" />
            <span className="hidden md:inline">Previous</span>
          </button>

          <button
            onClick={() => {
              if (!isModerator) {
                toast.info('Only moderators can control the session');
                return;
              }
              const newPlayingState = !isPlaying;
              setIsPlaying(newPlayingState);
              if (!newPlayingState) {
                setTimeElapsed(0);
                updateSessionStateOnBackend(currentStep, false, 0);
              } else {
                updateSessionStateOnBackend(currentStep, true, timeElapsed);
              }
            }}
            disabled={!isModerator}
            className={`flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors ${
              !isModerator ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={!isModerator ? 'Only moderators can control the session' : isPlaying ? 'Pause session' : 'Start session'}
          >
            {isPlaying ? (
              <>
                <MdPause className="w-5 h-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <MdPlayArrow className="w-5 h-5" />
                <span>Start Session</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              if (!isModerator) {
                toast.info('Only moderators can control the session');
                return;
              }
              if (currentStep < instructions.length - 1) {
                const newStep = currentStep + 1;
                setCurrentStep(newStep);
                setTimeElapsed(0);
                setIsPlaying(false);
                updateSessionStateOnBackend(newStep, false, 0);
              }
            }}
            disabled={currentStep === instructions.length - 1 || !isModerator}
            className={`flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              !isModerator ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={!isModerator ? 'Only moderators can control the session' : 'Next step'}
          >
            <span className="hidden md:inline">Next</span>
            <MdSkipNext className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

