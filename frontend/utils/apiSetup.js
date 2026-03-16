import axios from "axios";
import { toast } from "react-toastify";
import { logoutUser, setLoading } from "../store/features/userSlice";
import data from "./data";

// Environment-specific URLs
const ENV_URLS = {
  development: "/api/v1",  // Use relative URL for Next.js rewrite
  production: "https://pvl.ifcaindia.com/api/api/v1",
  test: "http://65.2.74.65:8000/api/v1"
};

// Get current environment
const currentEnv = process.env.NODE_ENV || 'production';

const getBaseUrl = () => {
  // Use relative URL to work with Next.js rewrites
  return '/api/v1';
};

let store;

export let injectStore = (_store) => {
  store = _store;
};

// Cache for API requests - REDUCED CACHE DURATION for real-time updates
const requestCache = new Map();
const pendingRequests = new Map();

// Cache configuration - MUCH SHORTER CACHE DURATION
const CACHE_DURATION = 30 * 1000; // 30 seconds instead of 5 minutes
const CACHE_KEYS = {
  USER_COMMUNITIES: 'user_communities',
  USER_SESSIONS: 'user_sessions',
  ALL_COMMUNITIES: 'all_communities',
  ALL_SESSIONS: 'all_sessions',
  USER_PROFILE_PROGRESS: 'user_profile_progress',
  USER_INITIAL_COMMUNITIES: 'user_initial_communities',
  USER_SUBSCRIBED_COMMUNITIES: 'user_subscribed_communities',
  USER_NON_SUBSCRIBED_COMMUNITIES: 'user_non_subscribed_communities',
  USER_SUBSCRIBED_SESSIONS: 'user_subscribed_sessions',
  USER_NON_SUBSCRIBED_SESSIONS: 'user_non_subscribed_sessions',
  USER_SESSION_STATS: 'user_session_stats',
  USER_RECENT_ACTIVITIES: 'user_recent_activities',
  FEED_POSTS: 'feed_posts'
};

// Endpoints that should NEVER be cached (always fresh data)
const NO_CACHE_ENDPOINTS = [
  '/thread/user/', // Feed posts
  '/thread/', // Thread-related endpoints (including likes)
  '/user/recent-activities', // Recent activities
  '/user/profile-progress', // Profile progress
  '/user/sessions/ongoing', // Ongoing sessions
  '/user/sessions/stats', // Session stats
  '/user/community/subscribed', // Subscribed communities
  '/user/community/non-subscribed', // Non-subscribed communities
  '/user/sessions/subscribed', // Subscribed sessions
  '/user/sessions/non-subscribed', // Non-subscribed sessions
  '/user/intial-community', // Initial communities
];

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableMethods: ['GET', 'POST', 'PUT', 'PATCH']
};

// Cache utility functions
export const getCacheKey = (endpoint, params = {}) => {
  const token = localStorage.getItem("ifca-jwt");
  return `${endpoint}_${JSON.stringify(params)}_${token || 'no-token'}`;
};

export const getCachedData = (key) => {
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  if (cached) {
    requestCache.delete(key);
  }
  return null;
};

export const setCachedData = (key, data) => {
  requestCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

export const clearCache = (pattern = null) => {
  if (pattern) {
    for (const [key] of requestCache) {
      if (key.includes(pattern)) {
        requestCache.delete(key);
      }
    }
  } else {
    requestCache.clear();
  }
};

// Enhanced cache clearing for specific patterns
export const clearUserDataCache = () => {
  const patterns = [
    'user/',
    'thread/',
    'community/',
    'sessions/',
    'profile-progress',
    'recent-activities'
  ];
  
  patterns.forEach(pattern => {
    clearCache(pattern);
  });
};

export const isRequestPending = (key) => {
  return pendingRequests.has(key);
};

export const setPendingRequest = (key, promise) => {
  pendingRequests.set(key, promise);
  promise.finally(() => {
    pendingRequests.delete(key);
  });
};

// Check if endpoint should be cached
const shouldCacheEndpoint = (url) => {
  return !NO_CACHE_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

// Retry utility function
const shouldRetry = (error, retryCount) => {
  if (retryCount >= RETRY_CONFIG.maxRetries) return false;
  
  const status = error.response?.status;
  const method = error.config?.method?.toUpperCase();
  
  return (
    RETRY_CONFIG.retryableStatusCodes.includes(status) &&
    RETRY_CONFIG.retryableMethods.includes(method)
  );
};

const getRetryDelay = (retryCount) => {
  return RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);
};

// Enhanced request function with retry logic
const makeRequestWithRetry = async (config, retryCount = 0) => {
  try {
    return await api.request(config);
  } catch (error) {
    if (shouldRetry(error, retryCount)) {
      const delay = getRetryDelay(retryCount);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeRequestWithRetry(config, retryCount + 1);
    }
    throw error;
  }
};

const api = axios.create({
  // baseURL: 'https://pvl.ifcaindia.com/api/api/v1',
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  // Add withCredentials for CORS requests
  withCredentials: currentEnv === 'production',
  // Add timeout
  timeout: 30000, // 30 seconds
});

// Request interceptor
api.interceptors.request.use(
  (request) => {
    // Add authorization token - use unified token
    const token = localStorage.getItem("ifca-jwt");
    if (token) {
      request.headers.common["authorization"] = `Bearer ${token}`;
    }

    // Add cache-busting headers for GET requests to prevent 304 issues
    if (request.method?.toLowerCase() === 'get') {
      request.headers.common["Cache-Control"] = "no-cache";
      request.headers.common["Pragma"] = "no-cache";
    }

    // Add request timestamp for debugging
    request.metadata = {
      startTime: Date.now(),
      retryCount: 0
    };

    return request;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Handle 304 Not Modified responses
    if (response.status === 304) {
      // 304 means not modified; return response as-is and let callers handle it.
      return response;
    }
    
    // Clear cache for mutations to ensure fresh data
    const method = response.config.method?.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      clearUserDataCache();
    }
    
    return response;
  },
  async (error) => {
    // Check if this is an auto-refresh request (silent fail)
    const isAutoRefresh = error.config?.url?.includes('/user/') && 
                         (error.config?.url?.includes('/profile-progress') || 
                          error.config?.url?.includes('/recent-activities') ||
                          error.config?.url?.includes('/community/') ||
                          error.config?.url?.includes('/sessions/'));

    // Log errors concisely. Avoid noisy dumps for optional debate endpoint 404s.
    const status = error.response?.status;
    const url = error.config?.url || '';
    const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());

    if (!isAutoRefresh) {
      if (status === 404 && url.includes('/huddle/activity/') && url.includes('/debate')) {
        // Backend doesn't support debate endpoint yet — log a concise warning.
        console.warn(`Response 404 for optional debate endpoint: ${url} (${duration}ms)`);
      } else {
        console.error('Response error:', {
          status: status,
          data: error.response?.data,
          url,
          duration
        });
      }
    }

    // Handle 403 unauthorized
    if (error.response?.status === 403) {
      toast.error("Session expired. Please login again.");
      store?.dispatch(logoutUser());
      window.location.href = "/";
      return Promise.reject(error);
    }

    // Handle network errors (only show toast for non-auto-refresh)
    if (!error.response) {
      if (!isAutoRefresh) {
        if (error.code === 'ECONNABORTED') {
          toast.error("Request timed out. Please check your connection and try again.");
        } else if (error.message === 'Network Error') {
          toast.error("Network error. Please check your internet connection.");
        } else {
          toast.error("Unable to reach the server. Please check your connection.");
        }
      }
      return Promise.reject(error);
    }

    // Handle different HTTP status codes (only show toast for non-auto-refresh)
    if (!isAutoRefresh) {
      const message = error.response?.data?.message || "Something went wrong";
      // Suppress toast for optional debate endpoint 404s (client falls back to local state)
      if (status === 404 && url.includes('/huddle/activity/') && url.includes('/debate')) {
        // no toast
      } else {
        switch (status) {
          case 400:
            toast.error(`Bad request: ${message}`);
            break;
          case 401:
            toast.error("Authentication required. Please login again.");
            store?.dispatch(logoutUser());
            window.location.href = "/";
            break;
          case 404:
            toast.error(`Resource not found: ${message}`);
            break;
          case 408:
            toast.error("Request timeout. Please try again.");
            break;
          case 429:
            toast.error("Too many requests. Please wait a moment and try again.");
            break;
          case 500:
            toast.error("Server error. Please try again later.");
            break;
          case 502:
          case 503:
          case 504:
            toast.error("Service temporarily unavailable. Please try again later.");
            break;
          default:
            toast.error(message);
        }
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

// Enhanced API methods with SMART caching (no cache for critical endpoints)
export const apiWithRetry = {
  get: async (url, config = {}) => {
    // NEVER cache critical endpoints for real-time updates
    if (!shouldCacheEndpoint(url) || config.forceRefresh) {
      return await makeRequestWithRetry({ ...config, method: 'GET', url });
    }
    
    // Only cache non-critical endpoints for very short periods
    const cacheKey = getCacheKey(url, config.params);
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return { data: cachedData, fromCache: true };
    }
    
    const response = await makeRequestWithRetry({ ...config, method: 'GET', url });
    setCachedData(cacheKey, response.data);
    return response;
  },
  
  post: async (url, data, config = {}) => {
    // Clear cache on mutations
    clearUserDataCache();
    return await makeRequestWithRetry({ ...config, method: 'POST', url, data });
  },
  
  put: async (url, data, config = {}) => {
    // Clear cache on mutations
    clearUserDataCache();
    return await makeRequestWithRetry({ ...config, method: 'PUT', url, data });
  },
  
  patch: async (url, data, config = {}) => {
    // Clear cache on mutations
    clearUserDataCache();
    return await makeRequestWithRetry({ ...config, method: 'PATCH', url, data });
  },
  
  delete: async (url, config = {}) => {
    // Clear cache on mutations
    clearUserDataCache();
    return await makeRequestWithRetry({ ...config, method: 'DELETE', url });
  }
};

// Health check function
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    return { healthy: true, response: response.data };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};

// Fallback data for offline scenarios
export const getFallbackData = (endpoint) => {
  const fallbackData = {
    '/user/communities': { communities: [] },
    '/user/sessions': { sessions: [] },
    '/thread/user/community': { posts: [], like_map: {} },
    '/user/profile-progress': { profileProgress: 0 },
    '/user/recent-activities': { activities: [] }
  };
  
  return fallbackData[endpoint] || null;
};

// Enhanced error handler
export const handleApiError = (error, context = '') => {
  console.error(`API Error in ${context}:`, error);
  
  // Check if we're offline
  if (!navigator.onLine) {
    toast.error("You're currently offline. Please check your internet connection.");
    return { offline: true, error };
  }
  
  // Handle specific error types
  if (error.code === 'ECONNABORTED') {
    toast.error("Request timed out. Please try again.");
  } else if (error.response?.status >= 500) {
    toast.error("Server error. Please try again later.");
  } else if (error.response?.status === 404) {
    toast.error("Resource not found.");
  } else {
    toast.error(error.message || "An unexpected error occurred.");
  }
  
  return { error };
};

export default api;
