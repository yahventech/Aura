import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/AppContext';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Truck, 
  ShieldCheck, 
  RotateCcw 
} from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { cartActions } = useCart();
  
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariations, setSelectedVariations] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeProduct = async () => {
      setIsLoading(true);
      setError(null);
      
      // First, check if product data was passed via navigation state
      if (location.state && location.state.product) {
        setProduct(location.state.product);
        initializeVariations(location.state.product);
        setIsLoading(false);
        return;
      }
      
      // Fetch from API
      try {
        const response = await fetch(`https://fakestoreapi.com/products/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        const data = await response.json();
        
        // Transform data to match structure
        const transformed = {
          id: data.id.toString(),
          title: data.title,
          category: data.category,
          price: data.price,
          image: data.image,
          images: [data.image], // API has single image, can extend if needed
          brand: 'Various', // API doesn't have brand
          description: data.description,
          rating: data.rating.rate,
          reviewCount: data.rating.count,
          inStock: true, // Assume in stock
          stockQuantity: Math.floor(Math.random() * 100) + 1, // Mock stock
          variations: {}, // Add if needed
          originalPrice: data.price * 1.2 // Mock original price
        };
        
        setProduct(transformed);
        initializeVariations(transformed);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    const initializeVariations = (prod) => {
      if (prod.variations) {
        const defaultVariations = {};
        Object.keys(prod.variations).forEach(key => {
          const available = prod.variations[key].find(v => v.inStock !== false);
          if (available) {
            defaultVariations[key] = available.value;
          }
        });
        setSelectedVariations(defaultVariations);
      }
    };

    initializeProduct();
  }, [id, location.state]);

  const handleAddToCart = () => {
    if (product) {
      cartActions.addItem(product, selectedVariations, quantity);
      // You can add a toast notification here
      console.log('Product added to cart:', product.title);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You can add a toast notification here
      console.log('Link copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/browse')}
            className="px-6 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const productImages = product.images || [product.image];
  const displayPrice = product.price || product.originalPrice || 0;
  const displayOriginalPrice = product.originalPrice || null;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Navigation */}
      <nav className="bg-white shadow-md border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-green-600 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button 
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="sticky top-24 self-start">
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4 shadow-md">
              <img
                src={productImages[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-green-600 shadow-md' : 'border-transparent hover:border-green-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-6">
              <span className="text-sm text-gray-500 uppercase tracking-wide">
                {product.brand || product.category}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">
                {product.title}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center mt-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating || 0)
                          ? 'text-amber-400 fill-current'
                          : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {product.rating || '0'} ({product.reviewCount || '0'} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-bold text-gray-900">
                  ${displayPrice.toFixed(2)}
                </span>
                {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      ${displayOriginalPrice.toFixed(2)}
                    </span>
                    <span className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded-full font-medium">
                      Save ${((displayOriginalPrice - displayPrice).toFixed(2))}
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {product.inStock !== false ? `In stock: ${product.stockQuantity || 'Available'}` : 'Out of stock'}
              </p>
            </div>

            {/* Variations */}
            {product.variations && Object.entries(product.variations).map(([key, options]) => (
              <div key={key} className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3 capitalize">
                  Select {key}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {options.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedVariations(prev => ({
                        ...prev,
                        [key]: option.value
                      }))}
                      disabled={option.inStock === false}
                      className={`px-4 py-2 border rounded-full text-sm font-medium transition-all ${
                        selectedVariations[key] === option.value
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-700 hover:border-green-200 hover:bg-green-50'
                      } ${
                        option.inStock === false 
                          ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                          : ''
                      }`}
                    >
                      {option.name || option.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity Selector */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition"
                  >
                    -
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center font-medium text-gray-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {product.stockQuantity || 10} left in stock
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={product.inStock === false}
                className="flex items-center justify-center bg-white border-2 border-green-600 text-green-600 py-3 rounded-full font-medium hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.inStock === false}
                className="flex items-center justify-center bg-green-600 text-white py-3 rounded-full font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Buy Now
              </button>
            </div>

            {/* Trust Features */}
            <div className="grid grid-cols-3 gap-6 py-6 border-t border-gray-200">
              <div className="flex flex-col items-center text-center">
                <Truck className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-xs font-medium text-gray-900">Free Delivery</p>
                <p className="text-xs text-gray-500">1-2 days</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <RotateCcw className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-xs font-medium text-gray-900">Easy Returns</p>
                <p className="text-xs text-gray-500">30 days</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <ShieldCheck className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-xs font-medium text-gray-900">Secure</p>
                <p className="text-xs text-gray-500">Payments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-6 overflow-x-auto">
              {[
                { id: 'description', name: 'Description' },
                { id: 'features', name: 'Features' },
                { id: 'specifications', name: 'Specs' },
                { id: 'reviews', name: 'Reviews' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 whitespace-nowrap border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            )}

            {activeTab === 'features' && product.features && (
              <ul className="grid md:grid-cols-2 gap-4">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'specifications' && product.specifications && (
              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">{key}</span>
                    <span className="text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl">
                <Star className="w-12 h-12 text-amber-400 fill-current mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.rating || '0'}
                </h3>
                <p className="text-gray-600">{product.reviewCount || 0} global ratings</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;