import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

// Base URL normalisation: expect VITE_API_URL to be the root (e.g. http://localhost:3001)
// We automatically append /api so callers only specify endpoint paths like /products
const RAW_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const API_BASE = `${RAW_BASE}/api`;

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  withCredentials: true, // Enable credentials for CORS
});

// Helpful debug (can be toggled by VITE_DEV_MODE)
if (import.meta.env.VITE_DEV_MODE) {
  console.log('[API] Base URL:', API_BASE); // dev aid
}

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    console.log('Axios interceptor - token from store:', token, typeof token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Axios interceptor - Authorization header set to:', config.headers.Authorization);
    } else {
      console.log('Axios interceptor - No token found');
    }
    
    // If sending FormData, let the browser set the correct multipart boundary
    try {
      const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
      if (isFormData && config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
  } catch {
      // no-op
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors - but be more selective
    if (error.response?.status === 401) {
      // Only auto-logout for auth-related endpoints, not profile views
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/') || url.includes('/login') || url.includes('/refresh');
      
      if (isAuthEndpoint) {
        // Clear auth state and redirect to login only for auth endpoints
        useAuthStore.getState().clearAuth();
        window.location.href = '/signin';
      }
      // For other 401s (like unauthorized profile access), just let the component handle it
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      // You can show a toast notification here
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
