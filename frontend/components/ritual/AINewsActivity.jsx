import { useState, useEffect, useRef, useMemo } from "react";
import { MdChevronLeft, MdChevronRight, MdPlayArrow, MdPause } from "react-icons/md";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/features/userSlice";
import api from "@/utils/apiSetup";
import { toast } from "react-toastify";

export default function AINewsActivity({ activity, activityData, isModerator }) {
  const user = useSelector(selectUser);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(null);
  const pollingIntervalRef = useRef(null);
  const lastSyncTimeRef = useRef(0);
  const isSyncingRef = useRef(false);
  const lastStateRef = useRef({ currentSlideIndex: 0, isAutoPlay: false });
  const localAutoPlayIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const isPollingSlideshowStateRef = useRef(false);

  const slides = activityData.slides || activityData.images || [];
  
  // Memoize slideDuration to prevent dependency array from changing on every render
  const slideDuration = useMemo(() => activityData.slideDuration || 5000, [activityData.slideDuration]);

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

  // Use refs to track current state for polling
  const currentSlideIndexRef = useRef(currentSlideIndex);
  const isAutoPlayRef = useRef(isAutoPlay);

  useEffect(() => {
    currentSlideIndexRef.current = currentSlideIndex;
    isAutoPlayRef.current = isAutoPlay;
  }, [currentSlideIndex, isAutoPlay]);

  // Load initial slideshow state from backend
  useEffect(() => {
    if (!activity?.id) return;

    const loadSlideshowState = async () => {
      try {
        const response = await api.get(`/huddle/activity/${activity.id}/slideshow-state`);
        if (response.data.success && response.data.slideshowState) {
          const { currentSlideIndex: serverIndex, isAutoPlay: serverAutoPlay } = response.data.slideshowState;
          lastStateRef.current = { currentSlideIndex: serverIndex, isAutoPlay: serverAutoPlay };
          
          // Restore state
          if (serverIndex >= 0 && serverIndex < slides.length) {
            setCurrentSlideIndex(serverIndex);
          }
          setIsAutoPlay(serverAutoPlay);
        }
      } catch (error) {
        console.error('Error loading slideshow state:', error);
      }
    };

    loadSlideshowState();
  }, [activity?.id, slides.length]);

  // Local autoplay timer (only if moderator controls it)
  useEffect(() => {
    if (isAutoPlay && slides.length > 0 && isModerator) {
      localAutoPlayIntervalRef.current = setInterval(() => {
        setCurrentSlideIndex((prev) => {
          const nextIndex = (prev + 1) % slides.length;
          // Update backend when auto-advancing
          updateSlideshowStateOnBackend(nextIndex, true);
          return nextIndex;
        });
      }, slideDuration);

      return () => {
        if (localAutoPlayIntervalRef.current) {
          clearInterval(localAutoPlayIntervalRef.current);
        }
      };
    } else if (localAutoPlayIntervalRef.current) {
      clearInterval(localAutoPlayIntervalRef.current);
      localAutoPlayIntervalRef.current = null;
    }
  }, [isAutoPlay, slides.length, slideDuration, isModerator]);

  // Update slideshow state on backend (only for moderators)
  const updateSlideshowStateOnBackend = async (slideIndex, autoPlay) => {
    if (!activity?.id || !isModerator || isSyncingRef.current) return;

    // Don't update if state hasn't changed
    if (lastStateRef.current.currentSlideIndex === slideIndex && 
        lastStateRef.current.isAutoPlay === autoPlay) {
      return;
    }

    isSyncingRef.current = true;
    try {
      const userId = user?.unifiedUserId || user?.id;
      await api.post(`/huddle/activity/${activity.id}/slideshow-state`, {
        currentSlideIndex: slideIndex,
        isAutoPlay: autoPlay,
        userId: userId
      });
      lastStateRef.current = { currentSlideIndex: slideIndex, isAutoPlay: autoPlay };
      lastSyncTimeRef.current = Date.now();
    } catch (error) {
      console.error('Error updating slideshow state:', error);
    } finally {
      isSyncingRef.current = false;
    }
  };

  const handleNext = () => {
    if (!isModerator) {
      toast.info('Only moderators can control slideshow');
      return;
    }
    if (currentSlideIndex < slides.length - 1) {
      const newIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(newIndex);
      updateSlideshowStateOnBackend(newIndex, isAutoPlay);
    }
  };

  const handlePrevious = () => {
    if (!isModerator) {
      toast.info('Only moderators can control slideshow');
      return;
    }
    if (currentSlideIndex > 0) {
      const newIndex = currentSlideIndex - 1;
      setCurrentSlideIndex(newIndex);
      updateSlideshowStateOnBackend(newIndex, isAutoPlay);
    }
  };

  const toggleAutoPlay = () => {
    if (!isModerator) {
      toast.info('Only moderators can control slideshow');
      return;
    }
    const newAutoPlayState = !isAutoPlay;
    setIsAutoPlay(newAutoPlayState);
    updateSlideshowStateOnBackend(currentSlideIndex, newAutoPlayState);
  };

  const currentSlide = slides[currentSlideIndex];

  if (!slides || slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No slides available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Slide Display */}
      <div className="flex-1 flex items-center justify-center relative p-8">
        {typeof currentSlide === 'string' ? (
          <img
            src={currentSlide}
            alt={`Slide ${currentSlideIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="max-w-4xl w-full bg-gray-800 rounded-lg p-8">
            {currentSlide.image && (
              <img
                src={currentSlide.image}
                alt={currentSlide.title || `Slide ${currentSlideIndex + 1}`}
                className="w-full h-auto rounded-lg mb-4"
              />
            )}
            {currentSlide.title && (
              <h3 className="text-2xl font-bold text-white mb-2">{currentSlide.title}</h3>
            )}
            {currentSlide.content && (
              <p className="text-gray-300 text-lg">{currentSlide.content}</p>
            )}
            {currentSlide.description && (
              <p className="text-gray-400 mt-2">{currentSlide.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Controls - Only show for moderators, but show disabled for others */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentSlideIndex === 0 || !isModerator}
          className={`p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            !isModerator ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={!isModerator ? 'Only moderators can control slideshow' : 'Previous slide'}
        >
          <MdChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4">
          <span className="text-white font-semibold">
            {currentSlideIndex + 1} / {slides.length}
          </span>
          <button
            onClick={toggleAutoPlay}
            disabled={!isModerator}
            className={`p-3 rounded-lg transition-colors ${
              isAutoPlay
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            } ${!isModerator ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!isModerator ? 'Only moderators can control slideshow' : isAutoPlay ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isAutoPlay ? (
              <MdPause className="w-6 h-6" />
            ) : (
              <MdPlayArrow className="w-6 h-6" />
            )}
          </button>
        </div>

        <button
          onClick={handleNext}
          disabled={currentSlideIndex === slides.length - 1 || !isModerator}
          className={`p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            !isModerator ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={!isModerator ? 'Only moderators can control slideshow' : 'Next slide'}
        >
          <MdChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="bg-gray-800 px-6 py-2 flex items-center justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isModerator) {
                toast.info('Only moderators can control slideshow');
                return;
              }
              setCurrentSlideIndex(index);
              updateSlideshowStateOnBackend(index, isAutoPlay);
            }}
            className={`h-2 rounded-full transition-all ${
              index === currentSlideIndex
                ? 'bg-orange-500 w-8'
                : 'bg-gray-600 w-2 hover:bg-gray-500'
            } ${!isModerator ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            disabled={!isModerator}
            title={!isModerator ? 'Only moderators can control slideshow' : `Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}










