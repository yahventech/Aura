import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewedProducts, setViewedProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Enhanced filters with more options
  const [filters, setFilters] = useState({
    category: 'all',
    subcategory: 'all',
    priceRange: 'all',
    sortBy: 'featured',
    rating: 0,
    inStock: false,
    features: [],
    brands: [],
    tags: [],
    priceMin: 0,
    priceMax: 1000
  });

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://fakestoreapi.com/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        
        // Transform API data to match expected structure
        const transformed = data.map(product => ({
          id: product.id.toString(),
          name: product.title,
          price: product.price,
          originalPrice: Math.round(product.price * 1.2), // Simulated original price
          category: product.category,
          subcategory: product.category.split(' ')[0], // Simulated subcategory
          brand: 'Various', // API doesn't have brand
          images: [product.image],
          thumbnail: product.image,
          description: product.description,
          features: [], // API doesn't have features
          specifications: {}, // API doesn't have specs
          inStock: true, // Assume all in stock
          stockQuantity: Math.floor(Math.random() * 100) + 1, // Simulated stock
          rating: product.rating.rate,
          reviewCount: product.rating.count,
          tags: [], // API doesn't have tags
          variants: [], // API doesn't have variants
          addedDate: new Date().toISOString(), // Simulated add date
          isFeatured: Math.random() > 0.5, // Random featured
          isBestseller: Math.random() > 0.5, // Random bestseller
          freeShipping: Math.random() > 0.5,
          fastDelivery: Math.random() > 0.5,
          warranty: '1 year' // Default
        }));
        
        setProducts(transformed);
        
        // Initialize recently viewed from localStorage
        const savedViewed = localStorage.getItem('recentlyViewed');
        if (savedViewed) {
          setRecentlyViewed(JSON.parse(savedViewed));
        }

        // Initialize wishlist from localStorage
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
          setWishlist(JSON.parse(savedWishlist));
        }

      } catch (err) {
        setError(err.message);
        toast.error('Failed to load products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Save recently viewed to localStorage
  useEffect(() => {
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // Save wishlist to localStorage
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Enhanced product tracking
  const trackProductView = useCallback((product) => {
    setViewedProducts(prev => {
      const updated = prev.filter(p => p.id !== product.id);
      return [{ ...product, viewedAt: new Date().toISOString() }, ...updated].slice(0, 50);
    });

    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [{ ...product, viewedAt: new Date().toISOString() }, ...filtered].slice(0, 10);
    });
  }, []);

  const toggleWishlist = useCallback((product) => {
    setWishlist(prev => {
      const isInWishlist = prev.some(p => p.id === product.id);
      if (isInWishlist) {
        toast.success('Removed from wishlist');
        return prev.filter(p => p.id !== product.id);
      } else {
        toast.success('Added to wishlist!');
        return [...prev, { ...product, addedAt: new Date().toISOString() }];
      }
    });
  }, []);

  const isInWishlist = useCallback((productId) => {
    return wishlist.some(product => product.id === productId);
  }, [wishlist]);

  // Advanced product search
  const searchProducts = useCallback((query) => {
    if (!query.trim()) return products;
    
    const searchTerms = query.toLowerCase().split(' ');
    return products.filter(product => {
      const searchableText = `
        ${product.name} ${product.description} ${product.brand} 
        ${product.category} ${product.tags.join(' ')} ${product.features.join(' ')}
      `.toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [products]);

  // Enhanced filtering system
  const getFilteredProducts = useCallback(() => {
    let filtered = searchQuery ? searchProducts(searchQuery) : [...products];

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Subcategory filter
    if (filters.subcategory !== 'all') {
      filtered = filtered.filter(product => product.subcategory === filters.subcategory);
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(product => {
        if (max) {
          return product.price >= min && product.price <= max;
        }
        return product.price >= min;
      });
    }

    // Custom price range
    if (filters.priceMin > 0 || filters.priceMax < 1000) {
      filtered = filtered.filter(product => 
        product.price >= filters.priceMin && product.price <= filters.priceMax
      );
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(product => product.rating >= filters.rating);
    }

    // Stock filter
    if (filters.inStock) {
      filtered = filtered.filter(product => product.inStock);
    }

    // Features filter
    if (filters.features.length > 0) {
      filtered = filtered.filter(product =>
        filters.features.every(feature => product.features.includes(feature))
      );
    }

    // Brands filter
    if (filters.brands.length > 0) {
      filtered = filtered.filter(product => filters.brands.includes(product.brand));
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(product =>
        filters.tags.some(tag => product.tags.includes(tag))
      );
    }

    return filtered;
  }, [products, filters, searchQuery, searchProducts]);

  // Advanced sorting
  const getSortedProducts = useCallback((productsToSort) => {
    const sorted = [...productsToSort];

    switch (filters.sortBy) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        sorted.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
        break;
      case 'popular':
        sorted.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'featured':
      default:
        // Featured products first, then by rating
        sorted.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return b.rating - a.rating;
        });
        break;
    }

    return sorted;
  }, [filters.sortBy]);

  // Memoized filtered and sorted products
  const filteredProducts = useMemo(() => {
    const filtered = getFilteredProducts();
    return getSortedProducts(filtered);
  }, [getFilteredProducts, getSortedProducts]);

  // Product analytics
  const getProductAnalytics = useCallback(() => {
    const totalProducts = products.length;
    const inStockProducts = products.filter(p => p.inStock).length;
    const featuredProducts = products.filter(p => p.isFeatured).length;
    const averageRating = products.reduce((sum, p) => sum + p.rating, 0) / totalProducts;
    const totalReviews = products.reduce((sum, p) => sum + p.reviewCount, 0);

    const categories = [...new Set(products.map(p => p.category))];
    const brands = [...new Set(products.map(p => p.brand))];

    return {
      totalProducts,
      inStockProducts,
      outOfStockProducts: totalProducts - inStockProducts,
      featuredProducts,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      categories,
      brands,
      stockRate: (inStockProducts / totalProducts) * 100
    };
  }, [products]);

  // Advanced product recommendations
  const getRecommendedProducts = useCallback((currentProduct, limit = 4) => {
    if (!currentProduct) return [];
    
    return products
      .filter(product => 
        product.id !== currentProduct.id && 
        (product.category === currentProduct.category || 
         product.tags.some(tag => currentProduct.tags.includes(tag)))
      )
      .sort((a, b) => {
        // Sort by relevance (category match, then tag matches, then rating)
        const aCategoryMatch = a.category === currentProduct.category ? 2 : 0;
        const bCategoryMatch = b.category === currentProduct.category ? 2 : 0;
        
        const aTagMatches = a.tags.filter(tag => currentProduct.tags.includes(tag)).length;
        const bTagMatches = b.tags.filter(tag => currentProduct.tags.includes(tag)).length;
        
        const aScore = aCategoryMatch + aTagMatches + (a.rating / 5);
        const bScore = bCategoryMatch + bTagMatches + (b.rating / 5);
        
        return bScore - aScore;
      })
      .slice(0, limit);
  }, [products]);

  const getProductById = useCallback((id) => {
    const product = products.find(product => product.id === id);
    if (product) {
      trackProductView(product);
    }
    return product;
  }, [products, trackProductView]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      category: 'all',
      subcategory: 'all',
      priceRange: 'all',
      sortBy: 'featured',
      rating: 0,
      inStock: false,
      features: [],
      brands: [],
      tags: [],
      priceMin: 0,
      priceMax: 1000
    });
    setSearchQuery('');
  }, []);

  const getCategories = useCallback(() => {
    const categories = [...new Set(products.map(p => p.category))];
    return categories.map(category => ({
      value: category,
      label: category.charAt(0).toUpperCase() + category.slice(1),
      count: products.filter(p => p.category === category).length
    }));
  }, [products]);

  const getBrands = useCallback(() => {
    const brands = [...new Set(products.map(p => p.brand))];
    return brands.map(brand => ({
      value: brand,
      label: brand,
      count: products.filter(p => p.brand === brand).length
    }));
  }, [products]);

  const value = {
    // State
    products: filteredProducts,
    allProducts: products,
    loading,
    error,
    filters,
    searchQuery,
    viewedProducts,
    recentlyViewed,
    wishlist,
    
    // Actions
    updateFilters,
    clearFilters,
    setSearchQuery,
    getProductById,
    toggleWishlist,
    isInWishlist,
    trackProductView,
    
    // Analytics & Utilities
    getProductAnalytics,
    getRecommendedProducts,
    getCategories,
    getBrands,
    
    // Enhanced product data
    featuredProducts: products.filter(p => p.isFeatured),
    bestsellers: products.filter(p => p.isBestseller),
    newArrivals: products
      .filter(p => new Date(p.addedDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate)),
    
    // Search and filter stats
    searchResults: searchProducts(searchQuery),
    totalResults: filteredProducts.length,
    hasActiveFilters: Object.values(filters).some(value => 
      Array.isArray(value) ? value.length > 0 : 
      typeof value === 'boolean' ? value :
      value !== 'all' && value !== 0
    )
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

// Custom hook for product interactions
export const useProductActions = () => {
  const { toggleWishlist, trackProductView, getRecommendedProducts } = useProducts();

  const shareProduct = useCallback((product) => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: `${window.location.origin}/product/${product.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/product/${product.id}`);
      toast.success('Product link copied to clipboard!');
    }
  }, []);

  const compareProducts = useCallback((product1, product2) => {
    return {
      priceDifference: Math.abs(product1.price - product2.price),
      ratingDifference: Math.abs(product1.rating - product2.rating),
      features: {
        common: product1.features.filter(f => product2.features.includes(f)),
        unique1: product1.features.filter(f => !product2.features.includes(f)),
        unique2: product2.features.filter(f => !product1.features.includes(f))
      }
    };
  }, []);

  return {
    toggleWishlist,
    trackProductView,
    getRecommendedProducts,
    shareProduct,
    compareProducts
  };
};