import React, { useState } from 'react';
import { usePendingProducts, useUpdateProductStatus, useUpdateProduct } from '../hooks/useEcommerceApi';
import { useCategories, useBrands } from '../hooks/useEcommerceApi';
import useTheme from '../hooks/useTheme';

const AdminPendingProducts = () => {
  const { theme } = useTheme();
  const { data, isLoading, error } = usePendingProducts();
  const { data: categoriesData } = useCategories();
  const { data: brandsData } = useBrands();
  const updateProductStatus = useUpdateProductStatus();
  const updateProduct = useUpdateProduct();
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionType, setActionType] = useState('approve'); // 'approve' or 'reject'
  const [reason, setReason] = useState('');
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: ''
  });

  const products = data?.data || [];
  const categories = categoriesData?.data?.categories || [];
  const brands = brandsData?.data?.brands || [];

  const handleAction = (product, action) => {
    setSelectedProduct(product);
    setActionType(action);
    setShowModal(true);
    setReason('');
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setEditFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category?._id || '',
      brand: product.brand?._id || ''
    });
    setShowEditModal(true);
  };

  const confirmEdit = () => {
    const formData = new FormData();
    formData.append('name', editFormData.name);
    formData.append('description', editFormData.description);
    formData.append('price', editFormData.price);
    formData.append('category', editFormData.category);
    if (editFormData.brand) formData.append('brand', editFormData.brand);

    updateProduct.mutate({
      id: selectedProduct._id,
      formData
    }, {
      onSuccess: () => {
        setShowEditModal(false);
        setSelectedProduct(null);
      }
    });
  };

  const confirmAction = () => {
    const status = actionType === 'approve' ? 'active' : 'rejected';
    updateProductStatus.mutate({
      id: selectedProduct._id,
      status,
      reason: reason || undefined
    }, {
      onSuccess: () => {
        setShowModal(false);
        setSelectedProduct(null);
        setReason('');
      }
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (isLoading) return <p>Loading pending products...</p>;
  if (error) return <p className="text-red-500">Failed to load pending products</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pending Products for Review</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {products.length} products awaiting approval
        </div>
      </div>

      {products.length === 0 ? (
        <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-8 text-center`}>
          <div className="text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">No pending products</h3>
            <p>All vendor-submitted products have been reviewed.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {products.map((product) => (
            <div key={product._id} className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
              <div className="flex gap-6">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${product.images.find(img => img.isMain)?.url || product.images[0]?.url}`}
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className={`w-24 h-24 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg flex items-center justify-center`}>
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        by {product.vendor?.name} ({product.vendor?.email})
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        {product.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatPrice(product.price)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Category: {product.category?.name}
                      </div>
                      {product.brand && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Brand: {product.brand.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">SKU:</span>
                      <div className="font-medium">{product.sku || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Stock:</span>
                      <div className="font-medium">{product.inventory?.quantity || 0}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Created:</span>
                      <div className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Status:</span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Pending
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(product)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleAction(product, 'approve')}
                      disabled={updateProductStatus.isPending}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(product, 'reject')}
                      disabled={updateProductStatus.isPending}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-md w-full p-6`}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {actionType === 'approve' ? 'Approve Product' : 'Reject Product'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {actionType === 'approve' 
                ? `Are you sure you want to approve "${selectedProduct?.name}"? It will become visible to customers.`
                : `Are you sure you want to reject "${selectedProduct?.name}"? The vendor will be notified.`
              }
            </p>
            
            {actionType === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for rejection (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={`w-full p-3 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  rows={3}
                  placeholder="Explain why this product was rejected..."
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={updateProductStatus.isPending}
                className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${
                  actionType === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {updateProductStatus.isPending ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto`}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Edit Product: {selectedProduct?.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full p-3 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full p-3 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, price: e.target.value }))}
                    className={`w-full p-3 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                    className={`w-full p-3 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand (Optional)
                </label>
                <select
                  value={editFormData.brand}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className={`w-full p-3 border rounded-md ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  <option value="">Select Brand</option>
                  {brands.map(brand => (
                    <option key={brand._id} value={brand._id}>{brand.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                Cancel
              </button>
              <button
                onClick={confirmEdit}
                disabled={updateProduct.isPending}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {updateProduct.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPendingProducts;
