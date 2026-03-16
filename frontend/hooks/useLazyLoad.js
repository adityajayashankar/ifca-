import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Custom hook for lazy loading components with intersection observer
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Intersection threshold (0-1)
 * @param {string} options.rootMargin - Root margin for intersection observer
 * @param {boolean} options.triggerOnce - Whether to trigger only once
 * @param {Function} options.onIntersect - Callback when intersection occurs
 * @returns {Object} - { isVisible, hasLoaded, isLoading, setIsLoading, loadData }
 */
const useLazyLoad = (options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
    onIntersect = null
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const elementRef = useRef(null);

  const loadData = useCallback(async (dataLoader) => {
    if (isLoading || (triggerOnce && hasLoaded)) return;
    
    setIsLoading(true);
    setError(null);
    try {
      if (typeof dataLoader === 'function') {
        await dataLoader();
      }
      setHasLoaded(true);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error in lazy loading:', err);
      setError(err);
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasLoaded, triggerOnce]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!triggerOnce || !hasLoaded)) {
          setIsVisible(true);
          if (onIntersect) {
            onIntersect();
          }
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasLoaded, onIntersect]);

  return {
    elementRef,
    isVisible,
    hasLoaded,
    isLoading,
    setIsLoading,
    loadData,
    error,
    retryCount
  };
};

export default useLazyLoad; 