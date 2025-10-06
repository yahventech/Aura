import React, { useState, useRef, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import {  
  XMarkIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const FilterSidebar = ({ isMobileOpen, onMobileClose }) => {
  const { filters, updateFilters, products } = useProducts();
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    rating: true,
    features: false
  });
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [tempPriceRange, setTempPriceRange] = useState([0, 1000]);
  const sidebarRef = useRef(null);

  // Enhanced filter options with icons and counts
  const categories = [
    { value: 'all', label: 'All Categories', count: products.length, icon: '🛍️' },
    { value: 'electronics', label: 'Electronics', count: products.filter(p => p.category === 'electronics').length, icon: '📱' },
    { value: 'clothing', label: 'Fashion', count: products.filter(p => p.category === 'clothing').length, icon: '👕' },
    { value: 'home', label: 'Home & Garden', count: products.filter(p => p.category === 'home').length, icon: '🏠' },
    { value: 'sports', label: 'Sports', count: products.filter(p => p.category === 'sports').length, icon: '⚽' },
    { value: 'accessories', label: 'Accessories', count: products.filter(p => p.category === 'accessories').length, icon: '💎' }
  ];

  const features = [
    { value: 'eco-friendly', label: 'Eco Friendly', color: 'emerald' },
    { value: 'new-arrival', label: 'New Arrival', color: 'blue' },
    { value: 'bestseller', label: 'Bestseller', color: 'amber' },
    { value: 'sale', label: 'On Sale', color: 'rose' },
    { value: 'premium', label: 'Premium', color: 'purple' }
  ];

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Most Popular' }
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePriceChange = (values) => {
    setTempPriceRange(values);
  };

  const applyPriceRange = () => {
    setPriceRange(tempPriceRange);
    updateFilters({ 
      priceRange: `${tempPriceRange[0]}-${tempPriceRange[1]}` 
    });
  };

  const clearAllFilters = () => {
    updateFilters({
      category: 'all',
      priceRange: 'all',
      sortBy: 'featured',
      features: [],
      rating: 0
    });
    setPriceRange([0, 1000]);
    setTempPriceRange([0, 1000]);
  };

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onMobileClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileOpen, onMobileClose]);

  const activeFilterCount = Object.keys(filters).filter(key => 
    key !== 'sortBy' && filters[key] !== 'all' && 
    (!Array.isArray(filters[key]) || filters[key].length > 0)
  ).length;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
          bg-white/80 backdrop-blur-xl border-r border-gray-200/60 
          lg:sticky lg:top-4 lg:h-fit
          fixed top-0 left-0 z-50 h-full w-80 lg:w-72
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-xl lg:shadow-2xl lg:rounded-2xl lg:m-4
          overflow-hidden
        `}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AdjustmentsHorizontalIcon className="w-6 h-6" />
              <h2 className="text-xl font-bold">Filters</h2>
            </div>
            <div className="flex items-center space-x-2">
              {activeFilterCount > 0 && (
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                  {activeFilterCount} active
                </span>
              )}
              <button
                onClick={onMobileClose}
                className="lg:hidden p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={clearAllFilters}
              className="text-sm opacity-90 hover:opacity-100 transition-opacity flex items-center space-x-1"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>Clear all</span>
            </button>
            <div className="flex items-center space-x-1 text-sm opacity-90">
              <SparklesIcon className="w-4 h-4" />
              <span>Smart Filters</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] lg:max-h-[70vh] overflow-y-auto">
          {/* Sort Section */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilters({ sortBy: e.target.value })}
              className="w-full p-3 bg-white/60 border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Section */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('category')}
              className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 uppercase tracking-wide"
            >
              <span>Categories</span>
              {expandedSections.category ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
            
            {expandedSections.category && (
              <div className="space-y-2 animate-fadeIn">
                {categories.map(category => (
                  <label
                    key={category.value}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/60 cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                        filters.category === category.value 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300 group-hover:border-gray-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-700">
                        {category.label}
                      </span>
                      <span className="text-lg">{category.icon}</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                    <input
                      type="radio"
                      name="category"
                      value={category.value}
                      checked={filters.category === category.value}
                      onChange={(e) => updateFilters({ category: e.target.value })}
                      className="hidden"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Price Range Section */}
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('price')}
              className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 uppercase tracking-wide"
            >
              <span>Price Range</span>
              {expandedSections.price ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
            
            {expandedSections.price && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-4">
                  <div className="relative pt-1">
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={tempPriceRange[0]}
                      onChange={(e) => handlePriceChange([parseInt(e.target.value), tempPriceRange[1]])}
                      className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={tempPriceRange[1]}
                      onChange={(e) => handlePriceChange([tempPriceRange[0], parseInt(e.target.value)])}
                      className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>${tempPriceRange[0]}</span>
                    <span>${tempPriceRange[1]}</span>
                  </div>
                  
                  <button
                    onClick={applyPriceRange}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    Apply Price Range
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('features')}
              className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 uppercase tracking-wide"
            >
              <span>Features</span>
              {expandedSections.features ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
            
            {expandedSections.features && (
              <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                {features.map(feature => (
                  <label
                    key={feature.value}
                    className={`flex items-center p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      filters.features?.includes(feature.value)
                        ? `border-${feature.color}-500 bg-${feature.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={feature.value}
                      checked={filters.features?.includes(feature.value)}
                      onChange={(e) => {
                        const currentFeatures = filters.features || [];
                        const newFeatures = e.target.checked
                          ? [...currentFeatures, feature.value]
                          : currentFeatures.filter(f => f !== feature.value);
                        updateFilters({ features: newFeatures });
                      }}
                      className="hidden"
                    />
                    <span className={`text-xs font-medium ${
                      filters.features?.includes(feature.value)
                        ? `text-${feature.color}-700`
                        : 'text-gray-600'
                    }`}>
                      {feature.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Rating Filter */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('rating')}
              className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 uppercase tracking-wide"
            >
              <span>Minimum Rating</span>
              {expandedSections.rating ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
            
            {expandedSections.rating && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => updateFilters({ rating: star })}
                      className={`text-2xl transition-transform hover:scale-110 ${
                        star <= (filters.rating || 0) 
                          ? 'text-amber-500' 
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {filters.rating ? `${filters.rating}+ stars` : 'Any rating'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default FilterSidebar;