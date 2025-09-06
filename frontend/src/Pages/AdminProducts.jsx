import React, { useState } from 'react';
import { useProducts, useDeleteProduct, useCategories, useBrands, useCreateProduct, useUpdateProduct } from '../hooks/useEcommerceApi';

const AdminProducts = () => {
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
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
  
  const { data: products, isLoading, error, refetch } = useProducts(filters);
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const deleteProductMutation = useDeleteProduct();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  // CRUD Functions
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('description', formData.description);
      fd.append('price', formData.price);
      fd.append('category', formData.category);
      if (formData.brand) fd.append('brand', formData.brand);
      fd.append('inventory', JSON.stringify(formData.inventory));
      fd.append('status', formData.status);
      
      formData.images.forEach(image => {
        fd.append('images', image);
      });

      await createProductMutation.mutateAsync(fd);
      handleCloseModal();
      refetch();
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('description', formData.description);
      fd.append('price', formData.price);
      fd.append('category', formData.category);
      if (formData.brand) fd.append('brand', formData.brand);
      fd.append('inventory', JSON.stringify(formData.inventory));
      fd.append('status', formData.status);
      
      formData.images.forEach(image => {
        fd.append('images', image);
      });

      await updateProductMutation.mutateAsync({
        id: editingProduct._id,
        formData: fd
      });
      handleCloseModal();
      refetch();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProductMutation.mutateAsync(productId);
        refetch();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
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
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
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
  };

  // Debug logging
  console.log('AdminProducts - products data:', products);
  console.log('AdminProducts - isLoading:', isLoading);
  console.log('AdminProducts - error:', error);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value || undefined
    }));
  };

  if (isLoading) {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="bg-white rounded-lg shadow p-6 border">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Products</h1>
            <div className="mx-auto max-w-xl rounded-md border border-red-300 bg-red-50 text-red-700 px-4 py-3 mb-4">
              Failed to load products. Please try again later.
            </div>
            <button 
              onClick={() => refetch()} 
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const productList = products?.data?.products || [];
  const categoriesList = categories?.data?.categories || categories || [];
  const brandsList = brands?.data?.brands || brands || [];

  // Debug extracted data
  console.log('AdminProducts - productList:', productList);
  console.log('AdminProducts - productList length:', productList.length);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-1">Manage all products in the system</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
            <p className="text-2xl font-bold text-blue-600">{productList.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Active Products</h3>
            <p className="text-2xl font-bold text-green-600">
              {productList.filter(p => p.status === 'active').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Low Stock</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {productList.filter(p => p.inventory?.quantity <= (p.inventory?.lowStockThreshold || 5)).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Out of Stock</h3>
            <p className="text-2xl font-bold text-red-600">
              {productList.filter(p => p.inventory?.quantity === 0).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categoriesList?.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => handleFilterChange('brand', e.target.value)}
              >
                <option value="">All Brands</option>
                {brandsList?.map((brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="">Default</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="createdAt">Date Added</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>
        </div>

        {productList.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {productList.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${product.images[0]}`}
                          alt={product.name} 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No Image</span>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                            <span>Vendor: {product.vendor?.businessName || 'Unknown'}</span>
                            <span>Category: {product.category?.name || 'Uncategorized'}</span>
                            <span>Brand: {product.brand?.name || 'No Brand'}</span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-lg font-bold text-indigo-600">
                              ${product.price?.toFixed(2) || '0.00'}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              product.stock > 10 
                                ? 'bg-green-100 text-green-800'
                                : product.stock > 0
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                            </span>
                            {product.rating && (
                              <div className="flex items-center">
                                <span className="text-yellow-400">
                                  {'★'.repeat(Math.floor(product.rating))}
                                </span>
                                <span className="text-gray-300">
                                  {'★'.repeat(5 - Math.floor(product.rating))}
                                </span>
                                <span className="ml-1 text-gray-500">
                                  ({product.reviewCount || 0})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          <a 
                            href={`/products/${product._id}`}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </a>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            disabled={deleteProductMutation.isPending}
                            className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {deleteProductMutation.isPending ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
