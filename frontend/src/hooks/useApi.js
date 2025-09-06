import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '../lib/axios';
import { API_ENDPOINTS } from '../config/api';
import useAuthStore from '../store/useAuthStore';

// Auth API functions
export const authAPI = {
  register: async (userData) => {
    const response = await apiClient.post(API_ENDPOINTS.REGISTER, userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, credentials);
    return response.data;
  },
  
  logout: async () => {
    const response = await apiClient.post(API_ENDPOINTS.LOGOUT);
    return response.data;
  },
};

// Products API functions
export const productsAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS, { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCT_BY_ID(id));
    return response.data;
  },
};

// User API functions
export const userAPI = {
  getProfile: async () => {
    const response = await apiClient.get(API_ENDPOINTS.PROFILE);
    return response.data;
  },
  
  updateProfile: async (profileData) => {
    const response = await apiClient.put(API_ENDPOINTS.UPDATE_PROFILE, profileData);
    return response.data;
  },
  
  changePassword: async (passwordData) => {
    const response = await apiClient.put(API_ENDPOINTS.CHANGE_PASSWORD, passwordData);
    return response.data;
  },
  
  uploadAvatar: async (formData) => {
    const response = await apiClient.post(API_ENDPOINTS.UPLOAD_AVATAR, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// React Query hooks for auth
export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  
  return useMutation({
    mutationFn: authAPI.register,
    onSuccess: (data) => {
      const { token, user } = data;
      setAuth(token, user.role, user);
    },
    onError: (error) => {
      // If backend is not available, show a friendly message
      if (!error.response) {
        console.warn('Backend server not available. Please start your backend server.');
      }
    },
  });
};

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  
  return useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      console.log('Login response data:', data);
      const { token, user } = data;
      setAuth(token, user.role, user);
    },
    onError: (error) => {
      console.error('Login error:', error);
      // If backend is not available, show a friendly message
      if (!error.response) {
        console.warn('Backend server not available. Please start your backend server.');
      }
    },
  });
};

export const useLogout = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  
  return useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      clearAuth();
    },
    onError: () => {
      // Even if logout fails on server, clear local auth
      clearAuth();
    },
  });
};

// React Query hooks for products
export const useProducts = (params = {}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsAPI.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProduct = (id) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productsAPI.getById(id),
    enabled: !!id,
  });
};

// React Query hooks for user
export const useProfile = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  
  return useQuery({
    queryKey: ['profile'],
    queryFn: userAPI.getProfile,
    enabled: isLoggedIn,
  });
};

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: userAPI.updateProfile,
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: userAPI.changePassword,
  });
};

export const useUploadAvatar = () => {
  return useMutation({
    mutationFn: userAPI.uploadAvatar,
  });
};
