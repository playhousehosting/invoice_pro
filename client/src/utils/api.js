import axios from 'axios';

// Create an axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '/api' // Use /api prefix in production
    : 'http://localhost:5000', // Use localhost in development
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      // Return the error response for other error codes
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper function to get full URL for assets (like images)
export const getAssetUrl = (path) => {
  if (!path) return '';
  
  // If path already includes http/https, return as is
  if (path.startsWith('http')) {
    return path;
  }
  
  // In production, use /api prefix
  if (process.env.NODE_ENV === 'production') {
    return `/api${path}`;
  }
  
  // In development, prepend localhost
  return `http://localhost:5000${path}`;
};
