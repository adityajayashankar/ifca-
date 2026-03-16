import axios from "axios";
import { toast } from "react-toastify";
import { logoutUser, setLoading } from "store/features/userSlice";
import data from "./data";

// Environment-specific URLs
const ENV_URLS = {
  development: "http://localhost:3001/api/v1",  // Updated to port 3001
  production: "https://pvl.ifcaindia.com/api/api/v1",
  test: "http://65.2.74.65:8000/api/v1"
};

const getBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  console.log("Using API Base URL:", baseUrl);
  return baseUrl;
};

let store;

export let injectStore = (_store) => {
  store = _store;
};

const currentEnv = process.env.NODE_ENV || 'development';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || ENV_URLS[currentEnv],
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  // Add withCredentials for CORS requests
  withCredentials: process.env.NODE_ENV === 'production',
});

// Request interceptor
api.interceptors.request.use(
  (request) => {
    // Log request URL for debugging
    console.log('Making request to:', request.baseURL + request.url);
    // Add authorization token - use unified token
    const token = localStorage.getItem("ifca-jwt");
    console.log("Token:", token);
    if (token) {
      request.headers.common["authorization"] = `Bearer ${token}`;
    }

    return request;
  },
  (error) => {
    console.error('Request error:', error);
    store?.dispatch(setLoading(false));
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Only hide loader if it was shown (not for polling endpoints)
    const isPollingEndpoint = 
      response.config?.url?.includes('/video-state') ||
      response.config?.url?.includes('/guided-session-state') ||
      response.config?.url?.includes('/discussion/messages') ||
      response.config?.url?.includes('/discussion/message') ||
      response.config?.url?.includes('/slideshow-state') ||
      (response.config?.url?.includes('/thread/') && response.config?.method?.toLowerCase() === 'get');
    
    if (!isPollingEndpoint && response.config?.url !== "/message" && !response.config?.headers?.["noLoad"]) {
      store?.dispatch(setLoading(false));
    }
    return response;
  },
  (error) => {
    // Only hide loader if it was shown (not for polling endpoints)
    const isPollingEndpoint = 
      error.config?.url?.includes('/video-state') ||
      error.config?.url?.includes('/guided-session-state') ||
      error.config?.url?.includes('/discussion/messages') ||
      error.config?.url?.includes('/discussion/message') ||
      error.config?.url?.includes('/slideshow-state') ||
      (error.config?.url?.includes('/thread/') && error.config?.method?.toLowerCase() === 'get');
    
    if (!isPollingEndpoint && error.config?.url !== "/message" && !error.config?.headers?.["noLoad"]) {
      store?.dispatch(setLoading(false));
    }

    // Log concise error info for optional debate 404s, otherwise detailed
    const status = error.response?.status;
    const url = error.config?.url || '';
    if (status === 404 && url.includes('/huddle/activity/') && url.includes('/debate')) {
      console.warn(`Response 404 for optional debate endpoint: ${url}`);
    } else {
      console.error('Response error:', {
        status: status,
        data: error.response?.data,
        config: error.config
      });
    }

    // Handle 403 unauthorized
    if (error.response?.status === 403) {
      toast.error("Session expired. Please login again.");
      store?.dispatch(logoutUser());
      window.location.href = "/";
      return Promise.reject(error);
    }

    // Handle different types of errors
    if (error.response) {
      // Server responded with error
      // Suppress toast for optional debate endpoint 404s (handled client-side)
      if (!(error.response?.status === 404 && url.includes('/huddle/activity/') && url.includes('/debate'))) {
        const errorMessage = error.response.data?.message || "Something went wrong";
        toast.error(errorMessage);
      }
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Request made but no response
      toast.error("Unable to reach the server. Please check your connection.");
      console.error('No response received:', error.request);
    } else {
      // Error in request setup
      toast.error("An error occurred while setting up the request.");
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;