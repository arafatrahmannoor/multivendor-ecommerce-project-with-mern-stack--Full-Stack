import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/axios';
import { ENDPOINTS, buildEndpoint } from '../lib/endpoints';

// ==================== PRODUCT HOOKS ====================
export const useProducts = (filters = {}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await apiClient.get(
        `${ENDPOINTS.PRODUCTS.ALL}${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data;
    }
  });
};

export const useProduct = (id) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await apiClient.get(buildEndpoint(ENDPOINTS.PRODUCTS.BY_ID, { id }));
      return response.data;
    },
    enabled: !!id
  });
};

export const useVendorProducts = () => {
  return useQuery({
    queryKey: ['vendor-products'],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.PRODUCTS.VENDOR_PRODUCTS);
      return response.data;
    }
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => {
      console.log('Creating product with FormData:');
      // Log FormData contents
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      // Let the browser set the correct Content-Type for multipart/form-data
      const response = await apiClient.post(ENDPOINTS.PRODUCTS.CREATE, formData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
    },
    onError: (error) => {
      console.error('Error creating product:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
    }
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }) => {
      const response = await apiClient.put(buildEndpoint(ENDPOINTS.PRODUCTS.UPDATE, { id }), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    }
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(buildEndpoint(ENDPOINTS.PRODUCTS.DELETE, { id }));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
    }
  });
};

// ==================== VENDOR HOOKS ====================

// ==================== CATEGORY HOOKS ====================
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.CATEGORIES.ALL);
      return response.data;
    }
  });
};

export const useCategory = (id) => {
  return useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      const response = await apiClient.get(buildEndpoint(ENDPOINTS.CATEGORIES.BY_ID, { id }));
      return response.data;
    },
    enabled: !!id
  });
};

export const useSubCategories = (categoryId) => {
  return useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: async () => {
      const response = await apiClient.get(buildEndpoint(ENDPOINTS.CATEGORIES.SUBCATEGORIES, { categoryId }));
      return response.data;
    },
    enabled: !!categoryId
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => {
      const response = await apiClient.post(ENDPOINTS.CATEGORIES.CREATE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });
};

// ==================== BRAND HOOKS ====================
export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.BRANDS.ALL);
      return response.data;
    }
  });
};

export const useBrandsForSelect = () => {
  return useQuery({
    queryKey: ['brands-select'],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.BRANDS.SELECT);
      return response.data;
    }
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => {
      const response = await apiClient.post(ENDPOINTS.BRANDS.CREATE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands-select'] });
    }
  });
};

// ==================== REVIEW HOOKS ====================
export const useProductReviews = (productId) => {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const response = await apiClient.get(buildEndpoint(ENDPOINTS.REVIEWS.PRODUCT_REVIEWS, { productId }));
      return response.data;
    },
    enabled: !!productId
  });
};

export const useMyReviews = () => {
  return useQuery({
    queryKey: ['my-reviews'],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.REVIEWS.MY_REVIEWS);
      return response.data;
    }
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, formData }) => {
      const response = await apiClient.post(
        buildEndpoint(ENDPOINTS.REVIEWS.CREATE, { productId }), 
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    }
  });
};

// ==================== ORDER HOOKS ====================
export const useMyOrders = () => {
  return useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ORDERS.MY_ORDERS);
      return response.data;
    }
  });
};

export const useOrder = (id) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await apiClient.get(buildEndpoint(ENDPOINTS.ORDERS.BY_ID, { id }));
      return response.data;
    },
    enabled: !!id
  });
};

export const useVendorOrders = () => {
  return useQuery({
    queryKey: ['vendor-orders'],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ORDERS.VENDOR_ORDERS);
      return response.data;
    }
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }) => {
      const response = await apiClient.put(buildEndpoint(ENDPOINTS.ORDERS.CANCEL, { id }), { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
    }
  });
};

// ==================== PAYMENT HOOKS ====================
export const useInitializePayment = () => {
  return useMutation({
    mutationFn: async (paymentData) => {
      const response = await apiClient.post(ENDPOINTS.PAYMENT.INITIALIZE, paymentData);
      return response.data;
    }
  });
};

export const useValidatePayment = (orderNumber) => {
  return useQuery({
    queryKey: ['payment-validation', orderNumber],
    queryFn: async () => {
      const response = await apiClient.get(buildEndpoint(ENDPOINTS.PAYMENT.VALIDATE, { orderNumber }));
      return response.data;
    },
    enabled: !!orderNumber
  });
};

// ==================== ADMIN & EXTENDED HOOKS ====================
// Categories: update & delete
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }) => {
      const response = await apiClient.put(buildEndpoint(ENDPOINTS.CATEGORIES.UPDATE, { id }), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(buildEndpoint(ENDPOINTS.CATEGORIES.DELETE, { id }));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });
};

// Subcategories
export const useCreateSubCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await apiClient.post(ENDPOINTS.CATEGORIES.CREATE_SUBCATEGORY, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });
};

export const useDeleteSubCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(buildEndpoint(ENDPOINTS.CATEGORIES.DELETE_SUBCATEGORY, { id }));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });
};

// Brands: delete
export const useDeleteBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(buildEndpoint(ENDPOINTS.BRANDS.DELETE, { id }));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands-select'] });
    }
  });
};

// Admin Orders
export const useAdminOrders = () => {
  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ORDERS.ADMIN_ALL);
      return response.data;
    }
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await apiClient.put(buildEndpoint(ENDPOINTS.ORDERS.UPDATE_STATUS, { id }), { status });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
    }
  });
};

// Orders analytics
export const useOrdersAnalytics = () => {
  return useQuery({
    queryKey: ['orders-analytics'],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.ORDERS.ANALYTICS);
      return response.data;
    }
  });
};

// Users (admin)
export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await apiClient.get('/users/all');
      return response.data;
    }
  });
};

// Reviews moderation
export const useAdminReviews = () => {
  return useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.REVIEWS.ADMIN_ALL);
      return response.data;
    }
  });
};

export const useUpdateReviewStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await apiClient.put(buildEndpoint(ENDPOINTS.REVIEWS.ADMIN_UPDATE_STATUS, { id }), { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    }
  });
};

// Payment refund (admin)
export const useRefundPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }) => {
      const response = await apiClient.post(buildEndpoint(ENDPOINTS.PAYMENT.REFUND, { orderId }), { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    }
  });
};

// Admin vendor payments report
export const useAdminVendorPayments = (params = {}) => {
  return useQuery({
    queryKey: ['admin-vendor-payments', params],
    queryFn: async () => {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') qs.append(k, v); });
      const response = await apiClient.get(`${ENDPOINTS.PAYMENT.ADMIN_VENDOR_REPORT}${qs.toString() ? `?${qs.toString()}` : ''}`);
      return response.data;
    }
  });
};

export const useCreatePayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ vendorId, amount }) => {
      const response = await apiClient.post('/api/payment/admin/payouts', { vendorId, amount });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-payments'] });
    }
  });
};

// Admin stats overview
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/admin/stats');
      return response.data;
    }
  });
};

// Admin payment management
export const useAdminPayments = () => {
  return useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const response = await apiClient.get('/api/payment/admin/vendors');
      return response.data;
    }
  });
};

// User moderation hooks
export const useBanUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }) => {
      const response = await apiClient.patch(`/users/ban/${id}`, { reason });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });
};

export const useUnbanUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.patch(`/users/unban/${id}`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(`/users/delete/${id}`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });
};

// Update user details and role (admin only)
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userData }) => {
      const response = await apiClient.put(`/users/update/${id}`, userData);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });
};

// Get pending products for admin verification
export const usePendingProducts = () => {
  return useQuery({
    queryKey: ['pending-products'],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.PRODUCTS.ADMIN_PENDING);
      return response.data;
    }
  });
};

// Approve/reject product (admin only)
export const useUpdateProductStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }) => {
      const response = await apiClient.patch(buildEndpoint(ENDPOINTS.PRODUCTS.UPDATE_STATUS, { id }), { status, reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    }
  });
};
