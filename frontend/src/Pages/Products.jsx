import { useProducts, useCategories, useBrands } from "../hooks/useEcommerceApi";
import { useState } from "react";
import { Link } from "react-router-dom";
import useTheme from "../hooks/useTheme";
import useCartStore from "../store/useCartStore";
import ProductFilters from "../Components/ProductFilters";
import Pagination from "../Components/Pagination";

const Products = () => {
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const { theme } = useTheme();
  const { addItem } = useCartStore();
  
  const { data: products, isLoading, error } = useProducts({
    ...filters,
    page: currentPage,
    limit: itemsPerPage
  });
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen transition-colors ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse">
            <div className={`h-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded w-1/4 mb-8`}></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className={`rounded-lg shadow-sm overflow-hidden border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} h-48`}></div>
                  <div className="p-4">
                    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} h-4 rounded mb-2`}></div>
                    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} h-3 rounded mb-3`}></div>
                    <div className="flex justify-between items-center">
                      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} h-6 rounded w-1/3`}></div>
                      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} h-8 rounded w-1/3`}></div>
                    </div>
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
      <div className={`min-h-screen transition-colors ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="text-center">
            <h1 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Products</h1>
            <div className={`mx-auto max-w-xl rounded-md border px-4 py-3 mb-4 ${
              theme === 'dark' 
                ? 'border-red-900 bg-red-950/50 text-red-300' 
                : 'border-red-300 bg-red-50 text-red-700'
            }`}>
              Failed to load products. Please try again later.
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 shadow-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const productList = products?.data?.products || [];
  const totalProducts = products?.data?.pagination?.total || 0;

  return (
    <div className={`min-h-screen transition-colors ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Products</h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Browse our latest items</p>
        </div>

        {/* Enhanced Filters */}
        <div className="mb-8">
          <ProductFilters
            categories={categories?.data?.categories || []}
            brands={brands?.data?.brands || []}
            onFilterChange={handleFiltersChange}
          />
        </div>

        {productList.length === 0 ? (
          <div className="text-center py-12">
            <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>No products found</h3>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productList.map((product) => (
              <div key={product._id || product.id} className={`rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
                theme === 'dark' 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}>
                <Link to={`/products/${product._id}`} className="block">
                  <div className={`h-48 flex items-center justify-center ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${product.images[0].url || product.images[0]}`}
                        alt={product.images[0].alt || product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No Image</span>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/products/${product._id}`} className="block hover:text-indigo-600">
                    <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{product.name}</h3>
                  </Link>
                  <p className={`mb-3 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{product.description}</p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    {typeof product.averageRating === 'number' && (
                      <div className="flex items-center">
                        <span className="text-yellow-400">{'★'.repeat(Math.round(product.averageRating))}</span>
                        <span className="text-gray-300">{'★'.repeat(5 - Math.round(product.averageRating))}</span>
                        <span className={`text-sm ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>({product.totalReviews || 0})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xl font-bold text-indigo-600">
                        ${product.price?.toFixed(2) || '0.00'}
                      </span>
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className={`text-sm line-through ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          ${product.comparePrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => addItem(product, 1)}
                      disabled={product.stock === 0}
                      className={`px-4 py-2 rounded shadow-sm transition-colors ${
                        product.stock === 0 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                  
                  {product.stock !== undefined && product.stock > 0 && (
                    <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {product.stock <= 10 ? `Only ${product.stock} left` : `${product.stock} in stock`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalProducts > itemsPerPage && (
          <Pagination
            totalItems={totalProducts}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};

export default Products
