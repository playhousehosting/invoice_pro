import axios from 'axios';

// Get the base URL based on environment
const getBaseUrl = () => {
  // In production (Vercel), use relative path
  if (window.location.hostname.includes('vercel.app')) {
    return '';  // Use relative paths in production
  }
  // In development, use localhost
  return 'http://localhost:5000';
};

// Create an axios instance with base configuration
const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for Vercel JWT cookie
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
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear token on auth errors
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to get full URL for assets (like images)
const getAssetUrl = (path) => {
  const baseUrl = getBaseUrl();
  if (path.startsWith('http')) {
    return path;
  }
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export { getAssetUrl };
export default api;
