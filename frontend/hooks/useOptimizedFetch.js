import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api, { 
  getCacheKey, 
  getCachedData, 
  setCachedData, 
  isRequestPending, 
  setPendingRequest,
  clearCache 
} from '@/utils/apiSetup';

/**
 * Custom hook for optimized data fetching with caching
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Configuration options
 * @param {Object} options.params - Query parameters
 * @param {number} options.cacheDuration - Cache duration in milliseconds
 * @param {boolean} options.forceRefresh - Force refresh ignoring cache
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback
 * @param {boolean} options.enabled - Whether to enable the fetch
 * @returns {Object} - { data, loading, error, refetch }
 */
const useOptimizedFetch = (endpoint, options = {}) => {
  const {
    params = {},
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    forceRefresh = false,
    onSuccess = null,
    onError = null,
    enabled = true
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  const cacheKey = getCacheKey(endpoint, params);
  const isInitialized = useRef(false);

  const fetchData = async (force = false) => {
    // Check if request is already pending
    if (isRequestPending(cacheKey)) {
      console.log(`Request already pending for: ${endpoint}`);
      return;
    }

    // Check cache if not forcing refresh
    if (!force) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log(`Using cached data for: ${endpoint}`);
        setData(cachedData);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const requestPromise = api.get(endpoint, { params });
      setPendingRequest(cacheKey, requestPromise);
      
      const response = await requestPromise;
      const responseData = response.data;
      
      // Cache the response
      setCachedData(cacheKey, responseData);
      
      setData(responseData);
      setLastFetchTime(Date.now());
      
      if (onSuccess) {
        onSuccess(responseData);
      }
      
      console.log(`Successfully fetched data for: ${endpoint}`);
    } catch (err) {
      console.error(`Error fetching data for ${endpoint}:`, err);
      setError(err);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchData(true);
  };

  const clearData = () => {
    setData(null);
    setError(null);
    clearCache(cacheKey);
  };

  useEffect(() => {
    if (enabled && !isInitialized.current) {
      isInitialized.current = true;
      fetchData(forceRefresh);
    }
  }, [enabled, endpoint, JSON.stringify(params), forceRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear pending request if component unmounts
      if (isRequestPending(cacheKey)) {
        console.log(`Cleaning up pending request for: ${endpoint}`);
      }
    };
  }, [cacheKey, endpoint]);

  return {
    data,
    loading,
    error,
    refetch,
    clearData,
    lastFetchTime
  };
};

export default useOptimizedFetch; 