import axios from 'axios';

// API Configuration
// Set to true to use production API, false for local development
// Defaults to production mode
const USE_PRODUCTION = import.meta.env.VITE_USE_PRODUCTION !== 'false';

// Production API URL
const PRODUCTION_URL = 'https://apitgts.codeology.solutions/api';

// Local development URLs
const LOCAL_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get API URL based on configuration
const API_URL = USE_PRODUCTION ? PRODUCTION_URL : LOCAL_URL;

console.log('API Configuration:', {
  mode: USE_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT',
  url: API_URL,
  env: {
    VITE_USE_PRODUCTION: import.meta.env.VITE_USE_PRODUCTION,
    VITE_API_URL: import.meta.env.VITE_API_URL,
  }
});

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token and handle production URL pattern
api.interceptors.request.use(
  (config) => {
    // Ensure headers object exists
    if (!config.headers) {
      config.headers = {} as any;
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      // Always set Authorization header, even for FormData requests
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Log warning if token is missing for protected endpoints
      const protectedEndpoints = ['/documents/', '/media/', '/users/', '/events/'];
      const isProtected = protectedEndpoints.some(endpoint => config.url?.includes(endpoint));
      if (isProtected) {
        console.warn('No auth token found for protected endpoint:', config.url);
      }
    }
    
    // For FormData requests, don't set Content-Type manually
    // Axios will automatically set it with the correct boundary
    if (config.data instanceof FormData) {
      // Remove Content-Type if it was set manually, let axios handle it
      if (config.headers['Content-Type'] === 'multipart/form-data') {
        delete config.headers['Content-Type'];
      }
      // Ensure Authorization header is preserved for FormData
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Handle production server's double /api/api pattern
    // Health endpoint uses single /api, all other endpoints use double /api/api
    if (USE_PRODUCTION && config.url) {
      // Skip if it's the health endpoint (uses single /api)
      if (!config.url.includes('/health')) {
        // Base URL is already /api, so we need to add another /api prefix for production
        // Example: /media/123 -> /api/media/123 (becomes /api/api/media/123 with baseURL)
        if (config.url.startsWith('/')) {
          config.url = `/api${config.url}`;
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log full error for debugging
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullError: error
    });
    
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      console.warn('Unauthorized access - clearing auth tokens');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if we're not already on login page
      if (window.location.pathname !== '/login') {
        // window.location.href = '/login'; // Commented out for now since we don't have login page yet
      }
    } else if (error.response?.status === 0 || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      // Network error - could be CORS, connection refused, or server down
      const apiUrl = error.config?.baseURL || API_URL;
      console.error('Network error connecting to backend:', apiUrl);
      console.error('This could be due to:');
      console.error('1. CORS configuration issue - backend needs to allow your domain');
      console.error('2. Backend server is not running or not accessible');
      console.error('3. Network connectivity issues');
      console.error('Current origin:', window.location.origin);
      console.error('Backend URL:', apiUrl);
      console.error('Backend server is not reachable. Please check your connection and ensure the backend is running.');
    } else if (error.response?.status) {
      // HTTP error response received
      const status = error.response.status;
      const statusText = error.response.statusText;
      const method = error.config?.method?.toUpperCase();
      const url = error.config?.url;
      const fullUrl = error.config?.baseURL + url;
      
      console.error(`HTTP ${status}: ${statusText}`);
      console.error(`Request: ${method} ${fullUrl}`);
      
      // Special handling for method not allowed errors
      if (status === 405) {
        console.error('Method Not Allowed - This usually means:');
        console.error('1. The HTTP method (GET/POST/PUT/DELETE) is not supported for this endpoint');
        console.error('2. The URL might be incorrect (check for double /api/api pattern in production)');
        console.error('3. CORS preflight (OPTIONS) might be failing');
        console.error(`Attempted: ${method} ${fullUrl}`);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

