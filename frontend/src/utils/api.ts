import axios from 'axios';

// Create AXIOS client
// In development, Vite dev server proxies `/api` requests to backend http://localhost:8000
const api = axios.create({
  baseURL: window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    ? ''
    : 'https://irvision-ai.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT Token if saved
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

// Response interceptor: Global error formatting and 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // User session expired or unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // If not on login/landing page, trigger window reload to redirect to login
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/' && currentPath !== '/register') {
          window.location.href = '/login?expired=true';
        }
      }
      
      // Return custom structured message
      const message = error.response.data?.detail || 'An unexpected server error occurred.';
      return Promise.reject(new Error(message));
    }
    return Promise.reject(new Error('Network error. Check connection to backend.'));
  }
);

export default api;
