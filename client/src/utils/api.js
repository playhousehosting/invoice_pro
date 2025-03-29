import axios from 'axios';

// Create an axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '' // Empty string for relative URLs in production
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

export default api;

// Helper function to get full URL for assets (like images)
export const getAssetUrl = (path) => {
  if (!path) return '';
  
  // If path already includes http/https, return as is
  if (path.startsWith('http')) {
    return path;
  }
  
  // In production, use relative URLs
  if (process.env.NODE_ENV === 'production') {
    return path;
  }
  
  // In development, prepend localhost
  return `http://localhost:5000${path}`;
};
