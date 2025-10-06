import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Cart Context
const CartContext = createContext();
const UserContext = createContext();

// Cart Actions
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART'
};

// User Actions
const USER_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  ADD_ADDRESS: 'ADD_ADDRESS',
  REMOVE_ADDRESS: 'REMOVE_ADDRESS',
  ADD_TO_WISHLIST: 'ADD_TO_WISHLIST',
  REMOVE_FROM_WISHLIST: 'REMOVE_FROM_WISHLIST'
};

// Cart Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.LOAD_CART:
      return action.payload;
      
    case CART_ACTIONS.ADD_ITEM:
      const existingItem = state.items.find(
        item => item.id === action.payload.id && 
        JSON.stringify(item.variations) === JSON.stringify(action.payload.variations)
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id && 
            JSON.stringify(item.variations) === JSON.stringify(action.payload.variations)
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      }

      return {
        ...state,
        items: [...state.items, action.payload]
      };

    case CART_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => 
          !(item.id === action.payload.id && 
          JSON.stringify(item.variations) === JSON.stringify(action.payload.variations))
        )
      };

    case CART_ACTIONS.UPDATE_QUANTITY:
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id && 
          JSON.stringify(item.variations) === JSON.stringify(action.payload.variations)
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };

    case CART_ACTIONS.CLEAR_CART:
      return { items: [], total: 0 };

    default:
      return state;
  }
};

// User Reducer
const userReducer = (state, action) => {
  switch (action.type) {
    case USER_ACTIONS.LOGIN:
      return { ...action.payload, isAuthenticated: true };
      
    case USER_ACTIONS.LOGOUT:
      return { isAuthenticated: false };
      
    case USER_ACTIONS.UPDATE_PROFILE:
      return { ...state, ...action.payload };
      
    case USER_ACTIONS.ADD_ADDRESS:
      return {
        ...state,
        addresses: [...state.addresses, action.payload]
      };
      
    case USER_ACTIONS.REMOVE_ADDRESS:
      return {
        ...state,
        addresses: state.addresses.filter(addr => addr.id !== action.payload)
      };
      
    case USER_ACTIONS.ADD_TO_WISHLIST:
      return {
        ...state,
        wishlist: [...state.wishlist, action.payload]
      };
      
    case USER_ACTIONS.REMOVE_FROM_WISHLIST:
      return {
        ...state,
        wishlist: state.wishlist.filter(item => item.id !== action.payload)
      };

    default:
      return state;
  }
};

// Initial States
const initialCartState = {
  items: [],
  total: 0
};

const initialUserState = {
  isAuthenticated: false,
  user: null,
  addresses: [],
  wishlist: [],
  orders: []
};

// Combined Provider
export const AppProvider = ({ children }) => {
  const [cartState, cartDispatch] = useReducer(cartReducer, initialCartState);
  const [userState, userDispatch] = useReducer(userReducer, initialUserState);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('shopping_cart');
    if (savedCart) {
      cartDispatch({ type: CART_ACTIONS.LOAD_CART, payload: JSON.parse(savedCart) });
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('shopping_cart', JSON.stringify(cartState));
  }, [cartState]);

  // Load user from localStorage if token exists
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user_data');
    if (token && savedUser) {
      userDispatch({ type: USER_ACTIONS.LOGIN, payload: JSON.parse(savedUser) });
      // Fetch cart from API if logged in
      fetchUserCart(JSON.parse(savedUser).id);
    }
  }, []);

  // Fetch user's cart from API
  const fetchUserCart = async (userId) => {
    try {
      const response = await fetch(`https://fakestoreapi.com/carts/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch cart');
      const data = await response.json();
      // Transform API cart data to match our structure
      const transformedItems = data.flatMap(cart => 
        cart.products.map(prod => ({
          id: prod.productId.toString(),
          quantity: prod.quantity,
          // Need to fetch product details for full info
          // For now, assume we fetch separately or use context products
        }))
      );
      // To get full product info, we'd need to fetch each product
      // Skipping for simplicity, or integrate with products context
      cartDispatch({ type: CART_ACTIONS.LOAD_CART, payload: { items: transformedItems } });
    } catch (err) {
      console.error('Error fetching cart:', err);
      toast.error('Failed to load cart from server');
    }
  };

  // Sync cart to server if logged in
  const syncCartToServer = async (cart) => {
    if (!userState.isAuthenticated) return;
    
    try {
      const response = await fetch('https://fakestoreapi.com/carts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userState.user.id,
          date: new Date().toISOString(),
          products: cart.items.map(item => ({
            productId: item.id,
            quantity: item.quantity
          }))
        })
      });
      if (!response.ok) throw new Error('Failed to sync cart');
      // Optionally handle response
    } catch (err) {
      console.error('Error syncing cart:', err);
      toast.error('Failed to sync cart to server');
    }
  };

  // Sync cart when changed and logged in
  useEffect(() => {
    if (userState.isAuthenticated) {
      syncCartToServer(cartState);
    }
  }, [cartState, userState.isAuthenticated]);

  // Calculate cart total
  useEffect(() => {
    const total = cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartState.total !== total) {
      cartDispatch({ type: 'UPDATE_TOTAL', payload: total });
    }
  }, [cartState.items]);

  // Cart actions
  const cartActions = {
    addItem: (product, variations = {}, quantity = 1) => {
      const item = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        variations,
        quantity
      };
      cartDispatch({ type: CART_ACTIONS.ADD_ITEM, payload: item });
    },
    
    removeItem: (productId, variations = {}) => {
      cartDispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { id: productId, variations } });
    },
    
    updateQuantity: (productId, variations = {}, quantity) => {
      if (quantity <= 0) {
        cartActions.removeItem(productId, variations);
      } else {
        cartDispatch({ 
          type: CART_ACTIONS.UPDATE_QUANTITY, 
          payload: { id: productId, variations, quantity } 
        });
      }
    },
    
    clearCart: () => {
      cartDispatch({ type: CART_ACTIONS.CLEAR_CART });
    }
  };

  // User actions with API
  const userActions = {
    login: async (credentials) => {
      try {
        const response = await fetch('https://fakestoreapi.com/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });
        
        if (!response.ok) throw new Error('Login failed');
        
        const { token } = await response.json();
        
        // Fetch user details - fakestore doesn't have user details endpoint after login,
        // so assume we fetch /users or use username as id
        // For simplicity, mock user data
        const userData = {
          id: credentials.username, // Use username as id
          username: credentials.username,
          email: `${credentials.username}@example.com`,
          addresses: [],
          wishlist: [],
          orders: []
        };
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        userDispatch({ type: USER_ACTIONS.LOGIN, payload: userData });
        toast.success('Logged in successfully');
        
        // Fetch cart after login
        fetchUserCart(userData.id);
      } catch (err) {
        toast.error('Login failed: Invalid credentials');
        throw err;
      }
    },
    
    logout: () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      userDispatch({ type: USER_ACTIONS.LOGOUT });
      cartActions.clearCart(); // Optional: clear local cart on logout
      toast.success('Logged out successfully');
    },
    
    updateProfile: (profileData) => {
      const updatedUser = { ...userState.user, ...profileData };
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      userDispatch({ type: USER_ACTIONS.UPDATE_PROFILE, payload: updatedUser });
      toast.success('Profile updated');
    },
    
    addAddress: (address) => {
      userDispatch({ type: USER_ACTIONS.ADD_ADDRESS, payload: { ...address, id: Date.now() } });
      toast.success('Address added');
    },
    
    removeAddress: (addressId) => {
      userDispatch({ type: USER_ACTIONS.REMOVE_ADDRESS, payload: addressId });
      toast.success('Address removed');
    },
    
    addToWishlist: (product) => {
      userDispatch({ type: USER_ACTIONS.ADD_TO_WISHLIST, payload: product });
      toast.success('Added to wishlist');
    },
    
    removeFromWishlist: (productId) => {
      userDispatch({ type: USER_ACTIONS.REMOVE_FROM_WISHLIST, payload: productId });
      toast.success('Removed from wishlist');
    }
  };

  return (
    <UserContext.Provider value={{ userState, userActions }}>
      <CartContext.Provider value={{ cartState, cartActions }}>
        {children}
      </CartContext.Provider>
    </UserContext.Provider>
  );
};

// Custom hooks
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within AppProvider');
  }
  return context;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within AppProvider');
  }
  return context;
};