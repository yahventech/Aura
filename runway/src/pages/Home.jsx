import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Truck,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowRight,
  Heart,
  User,
  Menu,
  X,
  Filter,
  Grid,
  List,
  Package,
  Plus,
  Minus
} from 'lucide-react';

// Cart context would typically be in a separate file, but including here for completeness
const CartContext = React.createContext();

// Custom hook for cart functionality
const useCart = () => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('aura_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const addToCart = useCallback((product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      let newCart;
      
      if (existingItem) {
        newCart = prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [...prevCart, { ...product, quantity }];
      }
      
      localStorage.setItem('aura_cart', JSON.stringify(newCart));
      return newCart;
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item.id !== productId);
      localStorage.setItem('aura_cart', JSON.stringify(newCart));
      return newCart;
    });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => {
      const newCart = prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
      localStorage.setItem('aura_cart', JSON.stringify(newCart));
      return newCart;
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    localStorage.removeItem('aura_cart');
    setCart([]);
  }, []);

  const getCartCount = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartCount,
    getCartTotal
  };
};

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

const API_BASE = 'http://localhost:5000/api';

const Home = () => {
  const navigate = useNavigate();
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    getCartCount,
    getCartTotal
  } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // State management
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [searchInput, setSearchInput] = useState(searchQuery || '');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [sortBy, setSortBy] = useState('featured');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productsPerPage] = useState(12);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  
  const debouncedSearch = useDebounce(searchInput, 350);

  // Fetch products from API with pagination
  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page,
        per_page: productsPerPage
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      params.append('min_price', priceRange[0]);
      params.append('max_price', priceRange[1]);

      const response = await fetch(`${API_BASE}/products?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data.products || []);
      setTotalProducts(data.total_count || data.products.length);
      setTotalPages(Math.ceil((data.total_count || data.products.length) / productsPerPage));
      setCurrentPage(page);
      
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, debouncedSearch, priceRange, productsPerPage]);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/categories`);
        if (response.ok) {
          const categoriesData = await response.json();
          setCategories(categoriesData);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Sync search
  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch]);

  // Handle search submission
  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      fetchProducts(1);
      setIsSearchActive(true);
    }
  };

  // Handle Enter key in search
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // REVISED: Featured products are now the newest arrivals
  const featuredProducts = useMemo(() => 
    [...products].sort((a, b) => b.id - a.id).slice(0, 8),
    [products]
  );
  
  // Professional hero slides - UPDATED: Now they filter current page instead of navigation
  const heroSlides = [
    {
      id: 1,
      title: "Elevate Your Style",
      description: "Premium fashion collections crafted for the modern lifestyle",
      buttonText: "Explore Fashion",
      category: "fashion", // This will filter for fashion category
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80",
      theme: "dark"
    },
    {
      id: 2,
      title: "Innovation Meets Design",
      description: "Cutting-edge technology for your connected life",
      buttonText: "Shop Electronics",
      category: "electronics", // This will filter for electronics category
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80",
      theme: "light"
    },
    {
      id: 3,
      title: "Transform Your Space",
      description: "Curated home essentials for modern living",
      buttonText: "Discover Home",
      category: "home", // This will filter for home category
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80",
      theme: "dark"
    }
  ];

  // Handle slide button click - UPDATED: Filter instead of navigate
  const handleSlideButtonClick = (category) => {
    // Find the category ID that matches the category name
    const categoryObj = categories.find(cat => 
      cat.name.toLowerCase().includes(category.toLowerCase()) || 
      cat.id === category
    );
    
    if (categoryObj) {
      setSelectedCategory(categoryObj.id);
      fetchProducts(1);
    } else {
      // Fallback: try to find by name
      setSelectedCategory(category);
      fetchProducts(1);
    }
    
    // Scroll to products section
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-play slider
  const sliderRef = useRef(null);
  
  useEffect(() => {
    if (!isAutoPlay) return;
    
    sliderRef.current = setInterval(() => {
      setCurrentSlide(current => (current + 1) % heroSlides.length);
    }, 5000);
    
    return () => {
      if (sliderRef.current) {
        clearInterval(sliderRef.current);
      }
    };
  }, [isAutoPlay, heroSlides.length]);

  // Slide navigation
  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
    if (sliderRef.current) {
      clearInterval(sliderRef.current);
      sliderRef.current = setInterval(() => {
        setCurrentSlide(current => (current + 1) % heroSlides.length);
      }, 5000);
    }
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length);
  };

  // Filter products based on sort
  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Sort products
    switch(sortBy) {
      case 'price-low':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // 'featured' will keep the original (latest first) order from the API
        break;
    }
    
    return result;
  }, [products, sortBy]);

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchInput('');
    setSearchQuery('');
    setPriceRange([0, 5000]);
    setSortBy('featured');
    setIsSearchActive(false);
    fetchProducts(1);
  };

  // Pagination functions - FIXED: Proper pagination logic
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchProducts(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle add to cart with feedback
  const handleAddToCart = (product) => {
    addToCart(product);
    // You could add a toast notification here for better UX
  };

  // Loading skeleton component
  const ProductSkeleton = () => (
    <div className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="aspect-square bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-8 bg-gray-100 rounded w-28 mt-2" />
      </div>
    </div>
  );

  // Pagination component - FIXED: Next button now shows properly
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-2 rounded-lg ${
            currentPage === i
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          } border border-gray-200 transition-colors`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-12">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
        >
          Previous
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => goToPage(1)}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
          </>
        )}
        
        {pages}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
            <button
              onClick={() => goToPage(totalPages)}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
        >
          Next
        </button>
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Error loading products</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-gray-900 tracking-tight">
                AURA
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  fetchProducts(1);
                }}
                className={`text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Products
              </button>
              {categories.slice(0, 6).map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    fetchProducts(1);
                  }}
                  className={`text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:flex items-center relative">
                <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"

                />
                <button
                  onClick={handleSearchSubmit}
                  className="ml-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Search
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <User className="w-5 h-5" />
                </button>
                <button 
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors relative"
                  onClick={() => navigate('/cart')}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {getCartCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {getCartCount()}
                    </span>
                  )}
                </button>
              </div>

              {/* Mobile menu button */}
              <button 
                className="lg:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-4 space-y-4">
              <div className="relative flex">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-l-lg"
                />
                <button
                  onClick={handleSearchSubmit}
                  className="px-4 bg-gray-900 text-white rounded-r-lg hover:bg-gray-800 transition-colors"
                >
                  Search
                </button>
              </div>
              <nav className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setMobileMenuOpen(false);
                    fetchProducts(1);
                  }}
                  className={`block w-full text-left px-2 py-2 text-sm font-medium ${
                    selectedCategory === 'all'
                      ? 'text-gray-900 bg-gray-50'
                      : 'text-gray-600'
                  }`}
                >
                  All Products
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setMobileMenuOpen(false);
                      fetchProducts(1);
                    }}
                    className={`block w-full text-left px-2 py-2 text-sm font-medium ${
                      selectedCategory === category.id
                        ? 'text-gray-900 bg-gray-50'
                        : 'text-gray-600'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Premium Hero Slider */}
      <section className="relative h-[70vh] min-h-[600px] overflow-hidden bg-gray-900">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img 
              src={slide.image} 
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white max-w-4xl px-4">
                <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                  {slide.title}
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto">
                  {slide.description}
                </p>
                <button
                  onClick={() => handleSlideButtonClick(slide.category)}
                  className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                >
                  {slide.buttonText}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Slider Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-6">
          {/* Slide Indicators */}
          <div className="flex space-x-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex space-x-2">
            <button
              onClick={prevSlide}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center space-x-3">
              <ShieldCheck className="w-6 h-6 text-gray-600" />
              <div>
                <div className="font-medium">Secure Shopping</div>
                <div className="text-sm text-gray-500">Your data is protected</div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Truck className="w-6 h-6 text-gray-600" />
              <div>
                <div className="font-medium">Fast Delivery</div>
                <div className="text-sm text-gray-500">Global shipping available</div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Sparkles className="w-6 h-6 text-gray-600" />
              <div>
                <div className="font-medium">Quality Guarantee</div>
                <div className="text-sm text-gray-500">30-day return policy</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Featured Products Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">New Arrivals</h2>
            <button 
              onClick={() => {
                setSelectedCategory('all');
                fetchProducts(1);
              }}
              className="text-gray-600 hover:text-gray-900 font-medium flex items-center"
            >
              View All
              <ArrowRight className="ml-1 w-4 h-4" />
            </button>
          </div>
          
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden group">
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 h-12">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900">KSh {product.price.toLocaleString()}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="w-full mt-3 bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {Array.from({ length: 8 }).map((_, index) => <ProductSkeleton key={index} />)}
             </div>
          )}
        </section>

        {/* Products Section */}
        <section id="products-section">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedCategory === 'all' 
                  ? 'All Products' 
                  : categories.find(c => c.id === selectedCategory)?.name || 'Products'
                }
              </h2>
              <p className="text-gray-600">
                Showing {filteredProducts.length} of {totalProducts} products
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              {/* Sort */}
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              >
                <option value="featured">Featured</option>
                <option value="name">Name A-Z</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </h3>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="15000"
                      step="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>KSh {priceRange[0]}</span>
                      <span>KSh {priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categories
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        fetchProducts(1);
                      }}
                      className={`block w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      All Products
                    </button>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          fetchProducts(1);
                        }}
                        className={`block w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset Filters */}
                <button
                  onClick={resetFilters}
                  className="w-full mt-4 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </aside>

            {/* Product Grid */}
            <main className="flex-1">
              {filteredProducts.length === 0 && !loading ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search or filter criteria
                  </p>
                  <button
                    onClick={resetFilters}
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className={`grid gap-6 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                      : 'grid-cols-1'
                  }`}>
                    {loading ? (
                      Array.from({ length: 12 }).map((_, index) => (
                        <ProductSkeleton key={index} />
                      ))
                    ) : (
                      filteredProducts.map(product => (
                        <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden group">
                          <div className="aspect-square bg-gray-100 overflow-hidden relative">
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x400/f3f4f6/9ca3af?text=Image+Not+Found'; }}
                            />
                            {!product.inStock && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="bg-white px-3 py-1 rounded-full text-sm font-medium">Out of Stock</span>
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex flex-col h-48">
                            <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 flex-grow">{product.name}</h3>
                            <div className="mt-auto">
                                <span className="text-lg font-bold text-gray-900">KSh {product.price.toLocaleString()}</span>
                                <button 
                                  onClick={() => handleAddToCart(product)}
                                  className="w-full mt-3 bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                                >
                                  Add to Cart
                                </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination - FIXED: Now properly shows Next button */}
                  <Pagination />
                </>
              )}
            </main>
          </div>
        </section>
      </div>

      {/* Premium Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <h3 className="text-2xl font-bold mb-4">AURA</h3>
              <p className="text-gray-400 mb-4">
                A curated selection of fine products from around the world, delivered to your door.
              </p>
            </div>

            {/* Shop */}
            <div>
              <h4 className="font-bold mb-4">Shop</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button 
                    onClick={() => {
                      setSelectedCategory('all');
                      fetchProducts(1);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    All Products
                  </button>
                </li>
                {categories.slice(0, 6).map(category => (
                  <li key={category.id}>
                    <button 
                      onClick={() => {
                        setSelectedCategory(category.id);
                        fetchProducts(1);
                      }}
                      className="hover:text-white transition-colors"
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-bold mb-4">Stay Connected</h4>
              <p className="text-gray-400 mb-4">Subscribe for updates and exclusive offers</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:border-white text-white"
                />
                <button className="px-4 py-2 bg-white text-gray-900 rounded-r-lg font-medium hover:bg-gray-100 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} AURA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;