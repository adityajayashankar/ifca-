/**
 * useFeedOptimization Hook
 * Provides optimized feed loading with caching, deduplication, and smart refresh
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { requestDeduplicator } from '@/utils/requestDeduplicator';
import { cacheManager } from '@/utils/cacheManager';
import {
  selectFeedPosts,
  selectFeedLoading,
  fetchUserFeed,
  refreshUserFeed
} from '@/store/features/userSlice';

export const useFeedOptimization = (unifiedUserId, options = {}) => {
  const dispatch = useDispatch();
  const feedPosts = useSelector(selectFeedPosts);
  const feedLoading = useSelector(selectFeedLoading);
  
  const {
    autoRefreshInterval = 5 * 60 * 1000, // 5 minutes
    cacheStrategy = 'smart', // 'smart', 'aggressive', 'lazy'
    enableMetrics = false
  } = options;

  const lastRefreshRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const dedupeKeyRef = useRef(`feed_${unifiedUserId}`);

  // Memoized feed data to prevent unnecessary re-renders
  const memoizedFeedPosts = useMemo(() => {
    return feedPosts || [];
  }, [feedPosts]);

  // Initialize feed with deduplication and caching
  const initializeFeed = useCallback(async () => {
    if (!unifiedUserId) return;

    if (enableMetrics) {
      performanceMonitor.start('feed_initialization');
    }

    try {
      // Use deduplication to prevent multiple requests
      const dedupeKey = dedupeKeyRef.current;
      
      // Check cache first for smart strategy
      if (cacheStrategy === 'smart' || cacheStrategy === 'aggressive') {
        const cachedData = await cacheManager.get(dedupeKey);
        if (cachedData && feedPosts.length === 0) {
          console.log('⚡ Loaded feed from cache');
          return cachedData;
        }
      }

      // Deduplicate the request
      await requestDeduplicator.dedupe(dedupeKey, () =>
        dispatch(fetchUserFeed(unifiedUserId)).unwrap()
      );

      lastRefreshRef.current = Date.now();
      
      if (enableMetrics) {
        performanceMonitor.end('feed_initialization');
      }
    } catch (error) {
      console.error('Error initializing feed:', error);
      if (enableMetrics) {
        performanceMonitor.end('feed_initialization');
      }
    }
  }, [unifiedUserId, dispatch, cacheStrategy, feedPosts.length, enableMetrics]);

  // Smart refresh - only refresh if cache is stale
  const smartRefresh = useCallback(async () => {
    if (!unifiedUserId || feedLoading) return;

    const now = Date.now();
    const lastRefresh = lastRefreshRef.current;
    const shouldRefresh = !lastRefresh || (now - lastRefresh) > autoRefreshInterval;

    if (!shouldRefresh) {
      console.log('⏭️ Skipping refresh - cache is still fresh');
      return;
    }

    if (enableMetrics) {
      performanceMonitor.start('feed_refresh');
    }

    try {
      const dedupeKey = `${dedupeKeyRef.current}_refresh`;
      
      // Silent refresh in background
      await requestDeduplicator.dedupe(dedupeKey, () =>
        dispatch(refreshUserFeed(unifiedUserId)).unwrap()
      );

      lastRefreshRef.current = Date.now();
      console.log('✅ Feed refreshed silently');

      if (enableMetrics) {
        performanceMonitor.end('feed_refresh');
      }
    } catch (error) {
      console.warn('Background refresh failed:', error.message);
      if (enableMetrics) {
        performanceMonitor.end('feed_refresh');
      }
    }
  }, [unifiedUserId, feedLoading, autoRefreshInterval, dispatch, enableMetrics]);

  // Set up auto-refresh with cleanup
  useEffect(() => {
    initializeFeed();

    if (cacheStrategy === 'smart' || cacheStrategy === 'aggressive') {
      refreshTimeoutRef.current = setInterval(smartRefresh, autoRefreshInterval);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, [unifiedUserId, cacheStrategy, autoRefreshInterval, initializeFeed, smartRefresh]);

  // Log metrics on demand
  const logMetrics = useCallback(() => {
    if (enableMetrics) {
      performanceMonitor.logSummary();
    }
  }, [enableMetrics]);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    return cacheManager.getStats();
  }, []);

  // Force refresh
  const forceRefresh = useCallback(async () => {
    if (!unifiedUserId) return;

    if (enableMetrics) {
      performanceMonitor.start('feed_force_refresh');
    }

    try {
      cacheManager.delete(dedupeKeyRef.current);
      requestDeduplicator.clear(dedupeKeyRef.current);
      
      await dispatch(fetchUserFeed(unifiedUserId)).unwrap();
      lastRefreshRef.current = Date.now();
      
      console.log('🔄 Feed force refreshed');
      
      if (enableMetrics) {
        performanceMonitor.end('feed_force_refresh');
      }
    } catch (error) {
      console.error('Force refresh failed:', error);
      if (enableMetrics) {
        performanceMonitor.end('feed_force_refresh');
      }
    }
  }, [unifiedUserId, dispatch, enableMetrics]);

  return {
    feedPosts: memoizedFeedPosts,
    feedLoading,
    initializeFeed,
    smartRefresh,
    forceRefresh,
    logMetrics,
    getCacheStats,
    isStale: lastRefreshRef.current ? (Date.now() - lastRefreshRef.current) > autoRefreshInterval : true
  };
};

export default useFeedOptimization;
