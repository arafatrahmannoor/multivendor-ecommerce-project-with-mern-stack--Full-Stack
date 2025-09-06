// API configuration and base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  REFRESH_TOKEN: `${API_BASE_URL}/api/auth/refresh`,
  
  // User endpoints
  USERS: `${API_BASE_URL}/api/users`,
  USER_BY_ID: (id) => `${API_BASE_URL}/api/users/${id}`,
  UPDATE_USER: (id) => `${API_BASE_URL}/api/users/update/${id}`,
  DELETE_USER: (id) => `${API_BASE_URL}/api/users/delete/${id}`,
  UPDATE_PROFILE_PICTURE: (id) => `${API_BASE_URL}/api/users/profile_picture/${id}`,
  CHANGE_PASSWORD: (id) => `${API_BASE_URL}/api/users/change_password/${id}`,
  
  // Product endpoints
  PRODUCTS: `${API_BASE_URL}/api/products`,
  PRODUCT_BY_ID: (id) => `${API_BASE_URL}/api/products/${id}`,
  
  // Category endpoints
  CATEGORIES: `${API_BASE_URL}/api/categories`,
  
  // Cart endpoints
  CART: `${API_BASE_URL}/api/cart`,
  ADD_TO_CART: `${API_BASE_URL}/api/cart/add`,
  REMOVE_FROM_CART: (id) => `${API_BASE_URL}/api/cart/remove/${id}`,
  
  // Order endpoints
  ORDERS: `${API_BASE_URL}/api/orders`,
  ORDER_BY_ID: (id) => `${API_BASE_URL}/api/orders/${id}`,
  CREATE_ORDER: `${API_BASE_URL}/api/orders/create`,
};

export default API_ENDPOINTS;
