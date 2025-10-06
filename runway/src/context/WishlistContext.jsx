// src/context/WishlistContext.jsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';

const WishlistContext = createContext(null);

const STORAGE_KEY = 'app:wishlist:v1';

const initialState = {
  items: [],
  loading: false
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ITEMS':
      return { ...state, items: action.payload, loading: false };
    case 'ADD_ITEM':
      return { ...state, items: [action.payload, ...state.items] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case 'CLEAR':
      return { ...state, items: [] };
    default:
      return state;
  }
}

export function WishlistProvider({ children, initial = [] }) {
  const [state, dispatch] = useReducer(reducer, { ...initialState, items: initial });

  // Persist -> localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: 'SET_ITEMS', payload: JSON.parse(raw) });
      else if (initial && initial.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        dispatch({ type: 'SET_ITEMS', payload: initial });
      }
    } catch {
      dispatch({ type: 'SET_ITEMS', payload: [] });
    }
  }, []); // run once

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignore storage errors
    }
  }, [state.items]);

  // API-like operations with optimistic updates
  const addToWishlist = useCallback((product) => {
    if (!product || !product.id) return;
    const exists = state.items.find(i => i.id === product.id);
    if (exists) return;
    dispatch({ type: 'ADD_ITEM', payload: product });
  }, [state.items]);

  const removeFromWishlist = useCallback((productId) => {
    if (!productId) return;
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  }, []);

  const toggleWishlist = useCallback((product) => {
    if (!product || !product.id) return;
    const exists = state.items.find(i => i.id === product.id);
    if (exists) {
      removeFromWishlist(product.id);
      return false;
    } else {
      addToWishlist(product);
      return true;
    }
  }, [state.items, addToWishlist, removeFromWishlist]);

  const isInWishlist = useCallback((productId) => {
    return state.items.some(i => i.id === productId);
  }, [state.items]);

  const clearWishlist = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const value = useMemo(() => ({
    items: state.items,
    loading: state.loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    count: state.items.length
  }), [state.items, state.loading, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, clearWishlist]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
}
