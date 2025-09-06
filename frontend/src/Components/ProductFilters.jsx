import React, { useState } from 'react';
import useTheme from '../hooks/useTheme';

const ProductFilters = ({ onFilterChange, categories, brands }) => {
  const { theme } = useTheme();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const handleInputChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    onFilterChange(filters);
  };

  const resetFilters = () => {
    const resetFilters = {
      search: '',
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      sortBy: 'name',
      sortOrder: 'asc'
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} mb-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Filters</h3>
        <button
          onClick={resetFilters}
          className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            placeholder="Search products..."
            className={`w-full p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={filters.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={`w-full p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium mb-1">Brand</label>
          <select
            value={filters.brand}
            onChange={(e) => handleInputChange('brand', e.target.value)}
            className={`w-full p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand._id} value={brand._id}>{brand.name}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium mb-1">Sort By</label>
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleInputChange('sortBy', sortBy);
              handleInputChange('sortOrder', sortOrder);
            }}
            className={`w-full p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
            <option value="rating-desc">Rating (High to Low)</option>
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Price Range */}
      <div className="mt-4">
        <label className="block text-sm font-medium mb-2">Price Range</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleInputChange('minPrice', e.target.value)}
              placeholder="Min Price"
              className={`w-full p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleInputChange('maxPrice', e.target.value)}
              placeholder="Max Price"
              className={`w-full p-2 border rounded-md ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
        </div>
      </div>

      {/* Search Button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={applyFilters}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            theme === 'dark' 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          Search Products
        </button>
      </div>

      {/* Rating Filter */}
      <div className="mt-4">
        <label className="block text-sm font-medium mb-2">Minimum Rating</label>
        <div className="flex items-center gap-2">
          {[5, 4, 3, 2, 1].map(rating => (
            <button
              key={rating}
              onClick={() => handleInputChange('rating', filters.rating === rating ? '' : rating)}
              className={`flex items-center px-3 py-1 rounded-md border ${
                filters.rating === rating
                  ? 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200'
                  : `border-gray-300 dark:border-gray-700 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`
              }`}
            >
              <span className="text-yellow-400 mr-1">★</span>
              <span>{rating}+</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Display */}
      {Object.entries(filters).some(([key, value]) => value && key !== 'sortBy' && key !== 'sortOrder') && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">Active filters:</span>
            {Object.entries(filters).map(([key, value]) => {
              if (!value || key === 'sortBy' || key === 'sortOrder') return null;
              
              let displayValue = value;
              if (key === 'category') {
                const cat = categories.find(c => c._id === value);
                displayValue = cat?.name || value;
              } else if (key === 'brand') {
                const brand = brands.find(b => b._id === value);
                displayValue = brand?.name || value;
              } else if (key === 'rating') {
                displayValue = `${value}+ stars`;
              }
              
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                >
                  {displayValue}
                  <button
                    onClick={() => handleInputChange(key, '')}
                    className="ml-1 hover:text-indigo-600 dark:hover:text-indigo-300"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
