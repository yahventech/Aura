import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const CartContext = createContext();

// Enhanced cart reducer with more complex state management
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_CART':
      return {
        ...state,
        items: action.payload.items || [],
        cartId: action.payload.cartId || uuidv4(),
        lastUpdated: action.payload.lastUpdated || new Date().toISOString()
      };

    case 'ADD_TO_CART':
      const existingItem = state.items.find(item => 
        item.id === action.payload.id && 
        item.selectedVariant === action.payload.selectedVariant
      );

      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id && item.selectedVariant === action.payload.selectedVariant
            ? { 
                ...item, 
                quantity: Math.min(item.quantity + (action.payload.quantity || 1), item.maxQuantity || 10),
                lastUpdated: new Date().toISOString()
              }
            : item
        );

        return {
          ...state,
          items: updatedItems,
          lastUpdated: new Date().toISOString(),
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0)
        };
      }

      const newItem = {
        ...action.payload,
        cartItemId: uuidv4(),
        quantity: action.payload.quantity || 1,
        addedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      const newItems = [...state.items, newItem];

      return {
        ...state,
        items: newItems,
        lastUpdated: new Date().toISOString(),
        totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0)
      };

    case 'REMOVE_FROM_CART':
      const filteredItems = state.items.filter(item => 
        !(item.id === action.payload.id && 
          item.selectedVariant === action.payload.selectedVariant)
      );

      return {
        ...state,
        items: filteredItems,
        lastUpdated: new Date().toISOString(),
        totalItems: filteredItems.reduce((sum, item) => sum + item.quantity, 0)
      };

    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        return cartReducer(state, {
          type: 'REMOVE_FROM_CART',
          payload: { id: action.payload.id, selectedVariant: action.payload.selectedVariant }
        });
      }

      const quantityUpdatedItems = state.items.map(item =>
        item.id === action.payload.id && item.selectedVariant === action.payload.selectedVariant
          ? { 
              ...item, 
              quantity: Math.min(action.payload.quantity, item.maxQuantity || 10),
              lastUpdated: new Date().toISOString()
            }
          : item
      );

      return {
        ...state,
        items: quantityUpdatedItems,
        lastUpdated: new Date().toISOString(),
        totalItems: quantityUpdatedItems.reduce((sum, item) => sum + item.quantity, 0)
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        lastUpdated: new Date().toISOString(),
        totalItems: 0
      };

    case 'APPLY_COUPON':
      return {
        ...state,
        coupon: {
          code: action.payload.code,
          discount: action.payload.discount,
          type: action.payload.type, // 'percentage' or 'fixed'
          appliedAt: new Date().toISOString()
        }
      };

    case 'REMOVE_COUPON':
      return {
        ...state,
        coupon: null
      };

    case 'UPDATE_SHIPPING':
      return {
        ...state,
        shipping: {
          ...state.shipping,
          ...action.payload,
          updatedAt: new Date().toISOString()
        }
      };

    case 'SAVE_FOR_LATER':
      const itemToSave = state.items.find(item => 
        item.id === action.payload.id && 
        item.selectedVariant === action.payload.selectedVariant
      );

      if (!itemToSave) return state;

      return {
        ...state,
        items: state.items.filter(item => 
          !(item.id === action.payload.id && 
            item.selectedVariant === action.payload.selectedVariant)
        ),
        savedItems: [...state.savedItems, { ...itemToSave, savedAt: new Date().toISOString() }],
        lastUpdated: new Date().toISOString(),
        totalItems: state.items.reduce((sum, item) => sum + item.quantity, 0) - itemToSave.quantity
      };

    case 'MOVE_TO_CART':
      const itemToMove = state.savedItems.find(item => 
        item.id === action.payload.id && 
        item.selectedVariant === action.payload.selectedVariant
      );

      if (!itemToMove) return state;

      return {
        ...state,
        items: [...state.items, { ...itemToMove, addedAt: new Date().toISOString() }],
        savedItems: state.savedItems.filter(item => 
          !(item.id === action.payload.id && 
            item.selectedVariant === action.payload.selectedVariant)
        ),
        lastUpdated: new Date().toISOString(),
        totalItems: state.totalItems + itemToMove.quantity
      };

    case 'REMOVE_SAVED_ITEM':
      return {
        ...state,
        savedItems: state.savedItems.filter(item => 
          !(item.id === action.payload.id && 
            item.selectedVariant === action.payload.selectedVariant)
        )
      };

    case 'TOGGLE_CART_OPEN':
      return {
        ...state,
        isOpen: action.payload
      };

    case 'UPDATE_CART_META':
      return {
        ...state,
        meta: {
          ...state.meta,
          ...action.payload
        }
      };

    default:
      return state;
  }
};

// Enhanced initial state
const initialState = {
  items: [],
  savedItems: [],
  coupon: null,
  shipping: {
    method: 'standard',
    cost: 0,
    address: null,
    estimatedDelivery: null
  },
  cartId: null,
  isOpen: false,
  lastUpdated: null,
  totalItems: 0,
  meta: {
    currency: 'USD',
    taxRate: 0.1, // 10%
    freeShippingThreshold: 50
  }
};

// Local storage keys
const CART_STORAGE_KEY = 'modern_cart_data';

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Initialize cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Check if cart is not too old (e.g., 30 days)
        const cartAge = new Date() - new Date(parsedCart.lastUpdated);
        const maxCartAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        
        if (cartAge < maxCartAge) {
          dispatch({ type: 'INIT_CART', payload: parsedCart });
        } else {
          // Clear expired cart
          localStorage.removeItem(CART_STORAGE_KEY);
          dispatch({ type: 'INIT_CART', payload: { cartId: uuidv4() } });
        }
      } else {
        dispatch({ type: 'INIT_CART', payload: { cartId: uuidv4() } });
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      dispatch({ type: 'INIT_CART', payload: { cartId: uuidv4() } });
    }
  }, []);

  // Save cart to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [state]);

  // Enhanced action creators with toast notifications and analytics
  const addToCart = useCallback((product, options = {}) => {
    const { quantity = 1, selectedVariant = null, showToast = true } = options;
    
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: { 
        ...product, 
        quantity,
        selectedVariant 
      } 
    });

    if (showToast) {
      toast.success(
        (t) => (
          <div className="flex items-center space-x-3">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div>
              <div className="font-medium">Added to cart!</div>
              <div className="text-sm text-gray-600">{product.name}</div>
            </div>
          </div>
        ),
        {
          duration: 3000,
          position: 'bottom-right',
        }
      );
    }

    // Track analytics
    if (window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: product.price * quantity,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: quantity
        }]
      });
    }
  }, []);

  const removeFromCart = useCallback((productId, selectedVariant = null) => {
    dispatch({ 
      type: 'REMOVE_FROM_CART', 
      payload: { id: productId, selectedVariant } 
    });

    toast.success('Item removed from cart');
  }, []);

  const updateQuantity = useCallback((productId, quantity, selectedVariant = null) => {
    dispatch({ 
      type: 'UPDATE_QUANTITY', 
      payload: { id: productId, quantity, selectedVariant } 
    });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
    toast.success('Cart cleared');
  }, []);

  const applyCoupon = useCallback((code, discount, type = 'percentage') => {
    dispatch({ 
      type: 'APPLY_COUPON', 
      payload: { code, discount, type } 
    });
    toast.success(`Coupon ${code} applied!`);
  }, []);

  const removeCoupon = useCallback(() => {
    dispatch({ type: 'REMOVE_COUPON' });
    toast.success('Coupon removed');
  }, []);

  const updateShipping = useCallback((shippingData) => {
    dispatch({ type: 'UPDATE_SHIPPING', payload: shippingData });
  }, []);

  const saveForLater = useCallback((productId, selectedVariant = null) => {
    dispatch({ 
      type: 'SAVE_FOR_LATER', 
      payload: { id: productId, selectedVariant } 
    });
    toast.success('Item saved for later');
  }, []);

  const moveToCart = useCallback((productId, selectedVariant = null) => {
    dispatch({ 
      type: 'MOVE_TO_CART', 
      payload: { id: productId, selectedVariant } 
    });
    toast.success('Item moved to cart');
  }, []);

  const removeSavedItem = useCallback((productId, selectedVariant = null) => {
    dispatch({ 
      type: 'REMOVE_SAVED_ITEM', 
      payload: { id: productId, selectedVariant } 
    });
    toast.success('Saved item removed');
  }, []);

  const toggleCartOpen = useCallback((isOpen) => {
    dispatch({ type: 'TOGGLE_CART_OPEN', payload: isOpen });
  }, []);

  const updateCartMeta = useCallback((metaData) => {
    dispatch({ type: 'UPDATE_CART_META', payload: metaData });
  }, []);

  // Enhanced calculations
  const getCartSubtotal = useCallback(() => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [state.items]);

  const getDiscountAmount = useCallback(() => {
    if (!state.coupon) return 0;
    
    const subtotal = getCartSubtotal();
    if (state.coupon.type === 'percentage') {
      return (subtotal * state.coupon.discount) / 100;
    } else {
      return Math.min(state.coupon.discount, subtotal);
    }
  }, [state.coupon, getCartSubtotal]);

  const getShippingCost = useCallback(() => {
    const subtotal = getCartSubtotal();
    if (subtotal >= state.meta.freeShippingThreshold) {
      return 0;
    }
    return state.shipping.cost || 5.99; // Default shipping cost
  }, [getCartSubtotal, state.shipping.cost, state.meta.freeShippingThreshold]);

  const getTaxAmount = useCallback(() => {
    const subtotal = getCartSubtotal();
    const discount = getDiscountAmount();
    const shipping = getShippingCost();
    return (subtotal - discount + shipping) * state.meta.taxRate;
  }, [getCartSubtotal, getDiscountAmount, getShippingCost, state.meta.taxRate]);

  const getCartTotal = useCallback(() => {
    const subtotal = getCartSubtotal();
    const discount = getDiscountAmount();
    const shipping = getShippingCost();
    const tax = getTaxAmount();
    return subtotal - discount + shipping + tax;
  }, [getCartSubtotal, getDiscountAmount, getShippingCost, getTaxAmount]);

  const getCartItemsCount = useCallback(() => {
    return state.totalItems;
  }, [state.totalItems]);

  const isItemInCart = useCallback((productId, selectedVariant = null) => {
    return state.items.some(item => 
      item.id === productId && item.selectedVariant === selectedVariant
    );
  }, [state.items]);

  const getItemQuantity = useCallback((productId, selectedVariant = null) => {
    const item = state.items.find(item => 
      item.id === productId && item.selectedVariant === selectedVariant
    );
    return item ? item.quantity : 0;
  }, [state.items]);

  // Advanced cart analytics
  const getCartAnalytics = useCallback(() => {
    const subtotal = getCartSubtotal();
    const itemCount = getCartItemsCount();
    const uniqueProducts = state.items.length;
    
    return {
      subtotal,
      itemCount,
      uniqueProducts,
      averageItemPrice: itemCount > 0 ? subtotal / itemCount : 0,
      cartValueScore: subtotal > 100 ? 'high' : subtotal > 50 ? 'medium' : 'low',
      estimatedShippingDays: state.shipping.method === 'express' ? 2 : 5
    };
  }, [getCartSubtotal, getCartItemsCount, state.items, state.shipping.method]);

  const value = {
    // State
    cart: state,
    
    // Basic Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    
    // Enhanced Actions
    applyCoupon,
    removeCoupon,
    updateShipping,
    saveForLater,
    moveToCart,
    removeSavedItem,
    toggleCartOpen,
    updateCartMeta,
    
    // Calculations
    getCartSubtotal,
    getDiscountAmount,
    getShippingCost,
    getTaxAmount,
    getCartTotal,
    getCartItemsCount,
    
    // Enhanced Queries
    isItemInCart,
    getItemQuantity,
    getCartAnalytics,
    
    // Utility Functions
    hasFreeShipping: getCartSubtotal() >= state.meta.freeShippingThreshold,
    isCartEmpty: state.items.length === 0,
    cartSummary: {
      items: state.items.length,
      totalQuantity: state.totalItems,
      subtotal: getCartSubtotal(),
      discount: getDiscountAmount(),
      shipping: getShippingCost(),
      tax: getTaxAmount(),
      total: getCartTotal()
    }
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Custom hook for cart animations and interactions
export const useCartAnimations = () => {
  const { addToCart } = useCart();

  const addToCartWithAnimation = useCallback((product, options = {}) => {
    const { animationTarget = null } = options;
    
    // Create flying animation if target element is provided
    if (animationTarget && typeof document !== 'undefined') {
      const targetRect = animationTarget.getBoundingClientRect();
      const cartButton = document.querySelector('[data-cart-button]');
      
      if (cartButton) {
        const cartRect = cartButton.getBoundingClientRect();
        
        // Create flying element
        const flyingElement = document.createElement('div');
        flyingElement.className = 'fixed w-8 h-8 bg-blue-500 rounded-full z-50 pointer-events-none';
        flyingElement.style.left = `${targetRect.left}px`;
        flyingElement.style.top = `${targetRect.top}px`;
        document.body.appendChild(flyingElement);

        // Animate to cart
        flyingElement.animate([
          { 
            transform: 'scale(1)',
            left: `${targetRect.left}px`,
            top: `${targetRect.top}px`,
            opacity: 1
          },
          { 
            transform: 'scale(0.5)',
            left: `${cartRect.left}px`,
            top: `${cartRect.top}px`,
            opacity: 0
          }
        ], {
          duration: 600,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }).onfinish = () => {
          document.body.removeChild(flyingElement);
        };
      }
    }

    addToCart(product, options);
  }, [addToCart]);

  return { addToCartWithAnimation };
};