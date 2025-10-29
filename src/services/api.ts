import axios from 'axios';

// Get API URL from environment or use default
// Production backend: https://apitgts.codeology.solutions
// Development: http://localhost:80
const API_URL = import.meta.env.VITE_API_URL || 'https://apitgts.codeology.solutions/api';

console.log('API Base URL:', API_URL); // Debug log

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    // Log error for debugging
    console.error('API Error:', error.message);
    
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      console.warn('Unauthorized access - clearing auth tokens');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if we're not already on login page
      if (window.location.pathname !== '/login') {
        // window.location.href = '/login'; // Commented out for now since we don't have login page yet
      }
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('Backend server is not reachable. Please check your connection and ensure the backend is running.');
    }
    return Promise.reject(error);
  }
);

export default api;

