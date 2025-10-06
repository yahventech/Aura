import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import {
  Search,
  ArrowRight,
  Leaf,
  User,
  ShoppingCart,
  Star,
  ChevronLeft
} from 'lucide-react';

// Simple debounce utility
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

const Browse = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchInput, setSearchInput] = useState(searchQuery || '');
  
  const debouncedSearch = useDebounce(searchInput, 350);

  // Category by query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');

    if (categoryParam) {
      const matchedCategory = categoryParam.toLowerCase();
      setSelectedCategory(matchedCategory);
    } else {
      setSelectedCategory('all');
    }
  }, [location.search]);

  // Sync search
  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch]);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://fakestoreapi.com/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        // Transform data to match expected structure
        const transformed = data.map(product => ({
          id: product.id.toString(),
          name: product.title,
          category: product.category,
          price: product.price,
          image: product.image,
          brand: 'Various', // API doesn't have brand
          description: product.description,
          rating: product.rating.rate,
          reviewCount: product.rating.count
        }));
        setProducts(transformed);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Product categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    return [
      { id: 'all', name: 'All Products', icon: '🛍️', count: products.length },
      ...uniqueCategories.map(cat => ({
        id: cat,
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        icon: '📱', // Placeholder, can map icons based on category
        count: products.filter(p => p.category === cat).length
      }))
    ];
  }, [products]);

  // Filter products based on category and search
  const filteredProducts = useMemo(() => {
    let result = selectedCategory === 'all' 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase().trim();
      result = result.filter(product => 
        product.name?.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.brand?.toLowerCase().includes(searchTerm)
      );
    }
    
    return result;
  }, [products, selectedCategory, searchQuery]);

  // Handle product click - navigate with product data
  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchInput('');
    setSearchQuery('');
  };

  // Loading skeleton component
  const ProductSkeleton = () => (
    <div className="animate-pulse bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <div className="aspect-square bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-8 bg-gray-100 rounded w-28 mt-2" />
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Error loading products</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button and Title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-green-50">
                  <Search className="w-6 h-6 text-green-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Browse Products</h1>
              </div>
            </div>
            <Link
              to="/account"
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <User className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <aside className="lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Categories</h2>
            <nav className="space-y-3">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-green-50 border border-green-200 text-green-700 shadow-md'
                      : 'bg-white border border-gray-100 text-gray-700 hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            {/* Search and Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedCategory === 'all' 
                    ? 'All Products' 
                    : categories.find(c => c.id === selectedCategory)?.name
                  }
                </h1>
                <p className="text-gray-500 mt-1">
                  {filteredProducts.length} results
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
                />
              </div>
            </div>

            {/* Product Grid */}
            <section>
              {filteredProducts.length === 0 && !loading ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-100">
                  <div className="w-20 h-20 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Try different search terms or categories
                  </p>
                  <button
                    onClick={resetFilters}
                    className="px-6 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                      Array.from({ length: 12 }).map((_, index) => (
                        <ProductSkeleton key={index} />
                      ))
                    ) : (
                      filteredProducts.map(product => (
                        <div 
                          key={product.id} 
                          className="cursor-pointer transform hover:scale-105 transition-transform duration-200"
                          onClick={() => handleProductClick(product)}
                        >
                          <ProductCard product={product} />
                        </div>
                      ))
                    )}
                  </div>

                  {/* Load More Button */}
                  {filteredProducts.length > 0 && (
                    <div className="text-center mt-12">
                      <button className="px-8 py-3 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors font-medium shadow-sm bg-white">
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </main>
        </div>
      </div>

      {/* Footer Navigation */}
      <footer className="bg-white border-t border-gray-100 fixed bottom-0 w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex justify-around py-3">
            {[
              { icon: Leaf, label: 'Home', path: '/' },
              { icon: Search, label: 'Browse', path: '/browse' },
              { icon: ShoppingCart, label: 'Cart', path: '/cart' },
              { icon: Star, label: 'Favorites', path: '/favorites' },
              { icon: User, label: 'Account', path: '/account' },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`flex flex-col items-center p-2 transition-colors rounded-lg ${
                  location.pathname === item.path 
                    ? 'text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium mt-1">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Browse;