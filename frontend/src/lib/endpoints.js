export const ENDPOINTS = {
  // Auth endpoints (existing)
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh'
  },

  // User endpoints (existing)
  USER: {
    PROFILE: '/users/:id',
    UPDATE: '/users/update/:id',
    CHANGE_PASSWORD: '/users/change_password/:id',
    PROFILE_PICTURE: '/users/profile_picture/:id',
    ALL: '/users/all'
  },

  // Product endpoints
  PRODUCTS: {
    ALL: '/products',
    BY_ID: '/products/:id',
    CREATE: '/products',
    UPDATE: '/products/:id',
    DELETE: '/products/:id',
    VENDOR_PRODUCTS: '/products/vendor/my-products',
    REMOVE_IMAGE: '/products/:id/images',
    SET_MAIN_IMAGE: '/products/:id/main-image',
    ADMIN_PENDING: '/products/admin/pending',
    UPDATE_STATUS: '/products/:id/status'
  },

  // Category endpoints
  CATEGORIES: {
    ALL: '/categories',
    BY_ID: '/categories/:id',
    CREATE: '/categories',
    UPDATE: '/categories/:id',
    DELETE: '/categories/:id',
    SUBCATEGORIES: '/categories/:categoryId/subcategories',
    CREATE_SUBCATEGORY: '/categories/subcategories',
    UPDATE_SUBCATEGORY: '/categories/subcategories/:id',
    DELETE_SUBCATEGORY: '/categories/subcategories/:id'
  },

  // Brand endpoints
  BRANDS: {
    ALL: '/brands',
    SELECT: '/brands/select',
    BY_ID: '/brands/:id',
    CREATE: '/brands',
    UPDATE: '/brands/:id',
    DELETE: '/brands/:id'
  },

  // Review endpoints
  REVIEWS: {
    PRODUCT_REVIEWS: '/reviews/product/:productId',
    CREATE: '/reviews/product/:productId',
    MY_REVIEWS: '/reviews/my-reviews',
    UPDATE: '/reviews/:id',
    DELETE: '/reviews/:id',
    VOTE_HELPFUL: '/reviews/:id/helpful',
    REPORT: '/reviews/:id/report',
    VENDOR_REPLY: '/reviews/:id/reply',
    ADMIN_ALL: '/reviews/admin/all',
    ADMIN_UPDATE_STATUS: '/reviews/admin/:id/status'
  },

  // Order endpoints
  ORDERS: {
    MY_ORDERS: '/orders/my-orders',
    BY_ID: '/orders/:id',
    CANCEL: '/orders/:id/cancel',
    VENDOR_ORDERS: '/orders/vendor/orders',
    UPDATE_STATUS: '/orders/:id/status',
    ANALYTICS: '/orders/analytics/overview',
    ADMIN_ALL: '/orders/admin/all'
  },

  // Payment endpoints
  PAYMENT: {
    INITIALIZE: '/payment/initialize',
    SUCCESS: '/payment/success',
    FAILED: '/payment/failed',
    CANCELLED: '/payment/cancelled',
    VALIDATE: '/payment/validate/:orderNumber',
    REFUND: '/payment/:orderId/refund',
    // Admin payment & vendor financial reporting
    ADMIN_VENDOR_REPORT: '/payments/admin/vendors',
    ADMIN_PAYOUTS: '/payments/admin/payouts',
    // Vendor self financial views
    VENDOR_PAYOUTS: '/payments/vendor/payouts',
    VENDOR_SERVICE_CHARGES: '/payments/vendor/service-charges'
  },

  // Platform stats
  STATS: {
    ADMIN_OVERVIEW: '/admin/stats'
  },

  // User moderation (admin)
  USER_ADMIN: {
    BAN: '/users/ban/:id',
    UNBAN: '/users/unban/:id',
    DELETE: '/users/delete/:id'
  }
};

// Helper function to replace route parameters
export const buildEndpoint = (endpoint, params = {}) => {
  let url = endpoint;
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  return url;
};

export default ENDPOINTS;
