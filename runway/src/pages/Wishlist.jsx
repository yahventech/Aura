import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HeartIcon, 
  TrashIcon, 
  ShoppingCartIcon,
  ShareIcon,
  SparklesIcon,
  ArrowLeftIcon,
  FunnelIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/solid';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { toast } from 'react-hot-toast';

const Wishlist = () => {
  const { 
    wishlist, 
    removeFromWishlist, 
    clearWishlist, 
    moveAllToCart,
    shareWishlist,
    exportWishlist,
    getWishlistAnalytics,
    getItemsByPriority,
    updateWishlistItem,
    setItemPriority
  } = useWishlist();
  
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [sortBy, setSortBy] = useState('date-added');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');

  const analytics = getWishlistAnalytics();

  const priorities = [
    { value: 'high', label: 'High Priority', color: 'rose', count: analytics.priorityCount.high },
    { value: 'medium', label: 'Medium Priority', color: 'amber', count: analytics.priorityCount.medium },
    { value: 'low', label: 'Low Priority', color: 'emerald', count: analytics.priorityCount.low }
  ];

  const categories = [...new Set(wishlist.items.map(item => item.category))].map(category => ({
    value: category,
    label: category.charAt(0).toUpperCase() + category.slice(1),
    count: wishlist.items.filter(item => item.category === category).length
  }));

  // Filter and sort items
  const getFilteredAndSortedItems = () => {
    let filtered = [...wishlist.items];

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(item => item.priority === filterPriority);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    // Sort items
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'date-added':
      default:
        filtered.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
        break;
    }

    return filtered;
  };

  const filteredItems = getFilteredAndSortedItems();

  const handleMoveToCart = (item) => {
    addToCart(item, { selectedVariant: item.selectedVariant });
    removeFromWishlist(item.id, item.selectedVariant);
    toast.success('Moved to cart!');
  };

  const handleMoveAllToCart = () => {
    moveAllToCart({ addToCart });
  };

  const handleAddNote = (item) => {
    setEditingNote(item.wishlistItemId);
    setNoteText(item.notes || '');
  };

  const handleSaveNote = (wishlistItemId) => {
    updateWishlistItem(wishlistItemId, { notes: noteText });
    setEditingNote(null);
    setNoteText('');
  };

  const handleSetPriority = (wishlistItemId, priority) => {
    setItemPriority(wishlistItemId, priority);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700/50',
      medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50',
      low: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50'
    };
    return colors[priority] || colors.medium;
  };

  if (wishlist.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/30 dark:from-gray-900 dark:to-pink-900/20 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <HeartSolidIcon className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl">💔</span>
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Your Wishlist is Empty
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Start building your dream collection! Save items you love to your wishlist for later.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold rounded-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Start Shopping
              </Link>
              
              <Link
                to="/deals"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                🔥 Hot Deals
              </Link>
            </div>

            {/* Tips Section */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Wishlist Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">💖</span>
                  </div>
                  <p>Click the heart icon on any product to save it here</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">📦</span>
                  </div>
                  <p>Move items to cart when you're ready to buy</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">🎯</span>
                  </div>
                  <p>Set priorities to organize your wishlist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/30 dark:from-gray-900 dark:to-pink-900/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <Link
              to="/"
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium group"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Continue Shopping
            </Link>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white flex items-center">
                <HeartSolidIcon className="w-8 h-8 text-pink-600 mr-3" />
                My Wishlist
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {wishlist.items.length} items • Total value: ${analytics.totalValue.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={shareWishlist}
              className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-200"
            >
              <ShareIcon className="w-5 h-5 mr-2" />
              Share
            </button>
            <button
              onClick={clearWishlist}
              className="flex items-center px-4 py-2 text-rose-600 hover:text-rose-700 font-medium bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors duration-200"
            >
              <TrashIcon className="w-5 h-5 mr-2" />
              Clear All
            </button>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalItems}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center">
                <HeartSolidIcon className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${analytics.totalValue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.categories.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <span className="text-xl">🏷️</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Price</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${analytics.averagePrice.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-wrap items-center gap-4">
              {/* Sort By */}
              <div className="flex items-center space-x-2">
                <ArrowsUpDownIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600"
                >
                  <option value="date-added">Date Added</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="priority">Priority</option>
                  <option value="name">Name</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center space-x-2">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600"
                >
                  <option value="all">All Priorities</option>
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label} ({priority.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label} ({category.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={exportWishlist}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-colors duration-200"
              >
                Export
              </button>
              <button
                onClick={handleMoveAllToCart}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <ShoppingCartIcon className="w-5 h-5 mr-2" />
                Move All to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Wishlist Items */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item, index) => (
                <div key={item.wishlistItemId} className="group relative">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105">
                    {/* Product Image */}
                    <div className="relative">
                      <Link to={`/product/${item.id}`}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-48 object-cover"
                        />
                      </Link>
                      
                      {/* Priority Badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-2xl border ${getPriorityColor(item.priority)}`}>
                          {item.priority.toUpperCase()}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => handleMoveToCart(item)}
                          className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200"
                          title="Move to Cart"
                        >
                          <ShoppingCartIcon className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-green-600" />
                        </button>
                        <button
                          onClick={() => removeFromWishlist(item.id, item.selectedVariant)}
                          className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors duration-200"
                          title="Remove from Wishlist"
                        >
                          <TrashIcon className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-rose-600" />
                        </button>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <Link to={`/product/${item.id}`}>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {item.name}
                        </h3>
                      </Link>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          ${item.price}
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="text-sm text-gray-500 line-through">
                            ${item.originalPrice}
                          </span>
                        )}
                      </div>

                      {/* Notes Section */}
                      {editingNote === item.wishlistItemId ? (
                        <div className="mb-3">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add a note..."
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border-0 rounded-2xl text-sm resize-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                          />
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => handleSaveNote(item.wishlistItemId)}
                              className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingNote(null)}
                              className="flex-1 px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mb-3">
                          {item.notes ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 mr-2 line-clamp-2">
                              {item.notes}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500 flex-1 mr-2">
                              No notes
                            </p>
                          )}
                          <button
                            onClick={() => handleAddNote(item)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {item.notes ? 'Edit' : 'Add Note'}
                          </button>
                        </div>
                      )}

                      {/* Priority Selector */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Priority:</span>
                        <div className="flex space-x-1">
                          {priorities.map(priority => (
                            <button
                              key={priority.value}
                              onClick={() => handleSetPriority(item.wishlistItemId, priority.value)}
                              className={`w-6 h-6 rounded-full text-xs font-medium transition-all duration-200 ${
                                item.priority === priority.value
                                  ? 'bg-pink-500 text-white scale-110'
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                              }`}
                              title={priority.label}
                            >
                              {priority.value[0].toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty Filter State */}
            {filteredItems.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No items match your filters
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Try adjusting your filters to see more items
                </p>
                <button
                  onClick={() => {
                    setFilterPriority('all');
                    setFilterCategory('all');
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Priority Summary */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2 text-pink-600" />
                Priority Summary
              </h3>
              <div className="space-y-3">
                {priorities.map(priority => (
                  <div key={priority.value} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{priority.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {priority.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Summary */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CheckBadgeIcon className="w-5 h-5 mr-2 text-blue-600" />
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category.value}
                    onClick={() => setFilterCategory(category.value)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors duration-200 ${
                      filterCategory === category.value
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{category.label}</span>
                      <span className="text-sm opacity-75">{category.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;