import React, { useState } from 'react';
import { useVendorProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/useEcommerceApi';
import { useCategories, useBrands } from '../hooks/useEcommerceApi';
import useTheme from '../hooks/useTheme';

const VendorProducts = () => {
  const { theme } = useTheme();
  const { data: productsData, isLoading, error } = useVendorProducts();
  const { data: categoriesData } = useCategories();
  const { data: brandsData } = useBrands();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    images: [],
    inventory: {
      quantity: 0,
      lowStockThreshold: 5,
      trackQuantity: true
    },
    status: 'active'
  });

  const products = productsData?.products || [];
  const categories = categoriesData?.data?.categories || [];
  const brands = brandsData?.data?.brands || [];

  // Separate products by status for notifications
  const pendingProducts = products.filter(p => p.status === 'pending');
  const approvedProducts = products.filter(p => p.status === 'active');
  const rejectedProducts = products.filter(p => p.status === 'rejected');

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', formData.name);
    fd.append('description', formData.description);
    fd.append('price', formData.price);
    fd.append('category', formData.category);
    if (formData.brand) fd.append('brand', formData.brand);
    fd.append('inventory', JSON.stringify(formData.inventory));
    fd.append('status', formData.status);
    
    // Only append images if they exist
    if (formData.images && formData.images.length > 0) {
      formData.images.forEach(image => {
        fd.append('productImages', image);
      });
    }

    if (editingId) {
      updateProduct.mutate({ id: editingId, formData: fd });
    } else {
      createProduct.mutate(fd, { 
        onSuccess: () => {
          setShowForm(false);
          setFormData({ 
            name: '', 
            description: '', 
            price: '', 
            category: '', 
            brand: '', 
            images: [],
            inventory: {
              quantity: 0,
              lowStockThreshold: 5,
              trackQuantity: true
            },
            status: 'active'
          });
        }
      });
    }
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category?._id || '',
      brand: product.brand?._id || '',
      images: [],
      inventory: product.inventory || {
        quantity: 0,
        lowStockThreshold: 5,
        trackQuantity: true
      },
      status: product.status || 'active'
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this product?')) {
      deleteProduct.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      description: '', 
      price: '', 
      category: '', 
      brand: '', 
      images: [],
      inventory: {
        quantity: 0,
        lowStockThreshold: 5,
        trackQuantity: true
      },
      status: 'active'
    });
    setShowForm(false);
  };

  if (isLoading) return <p>Loading products...</p>;

  if (error) return <p className="text-red-500">Failed to load products</p>;

  return (
    <div>
      {/* Notification Section */}
      {(pendingProducts.length > 0 || rejectedProducts.length > 0) && (
        <div className="mb-6 space-y-3">
          {pendingProducts.length > 0 && (
            <div className={`${theme === 'dark' ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                  {pendingProducts.length} product(s) awaiting admin approval
                </span>
              </div>
            </div>
          )}
          
          {rejectedProducts.length > 0 && (
            <div className={`${theme === 'dark' ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-red-800 dark:text-red-200">
                  {rejectedProducts.length} product(s) were rejected by admin
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Products</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {/* Product Form */}
      {showForm && (
        <div className={`bg-white dark:bg-gray-900 rounded-lg shadow p-6 border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} mb-6`}>
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className={`w-full p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={`w-full p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className={`w-full p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <select
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className={`w-full p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                >
                  <option value="">Select Brand</option>
                  {brands.map(brand => (
                    <option key={brand._id} value={brand._id}>{brand.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inventory Management Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={formData.inventory.quantity}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    inventory: { ...prev.inventory, quantity: parseInt(e.target.value) || 0 }
                  }))}
                  className={`w-full p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                  min="0"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Low Stock Alert</label>
                <input
                  type="number"
                  value={formData.inventory.lowStockThreshold}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    inventory: { ...prev.inventory, lowStockThreshold: parseInt(e.target.value) || 5 }
                  }))}
                  className={`w-full p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                  min="0"
                  placeholder="Alert threshold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className={`w-full p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Product Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setFormData(prev => ({ ...prev, images: Array.from(e.target.files) }))}
                className={`w-full p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createProduct.isPending || updateProduct.isPending}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {createProduct.isPending || updateProduct.isPending ? 'Saving...' : (editingId ? 'Update' : 'Create')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      <div className={`bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`${theme === 'dark' ? 'bg-gray-900 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
              {products.map((product) => (
                <tr key={product._id} className={`${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.images && product.images.length > 0 && (
                        <img
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}${product.images[0].url}`}
                          alt={product.name}
                          className="w-10 h-10 rounded-md object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {product.category?.name || 'No Category'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ${product.price?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {product.inventory?.quantity || 0}
                    </div>
                    {product.inventory?.quantity <= (product.inventory?.lowStockThreshold || 5) && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Low Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                    {product.status === 'rejected' && product.adminNote && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Reason: {product.adminNote}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(product)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        disabled={deleteProduct.isPending}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {products.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No products found. Create your first product!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorProducts;
