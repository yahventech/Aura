import React, { createContext, useCallback, useContext, useReducer, useRef } from 'react';
import { useCart } from './CartContext';
import { useWishlist } from './WishlistContext';

const QuickViewContext = createContext(null);

const initialState = {
  isOpen: false,
  product: null,
  selectedImage: 0,
  selectedVariant: null,
  quantity: 1,
  zoom: { enabled: false, x: 0, y: 0 },
  activeTab: 'details' // details | specs | reviews
};

function reducer(state, action) {
  switch (action.type) {
    case 'OPEN': {
      const product = action.payload;
      return {
        ...state,
        isOpen: true,
        product,
        selectedImage: 0,
        selectedVariant: product?.variants?.[0] ?? null,
        quantity: 1,
        zoom: { enabled: false, x: 0, y: 0 },
        activeTab: 'details'
      };
    }

    case 'CLOSE':
      return { ...initialState };

    case 'SET_IMAGE':
      return { ...state, selectedImage: action.payload };

    case 'NEXT_IMAGE':
      if (!state.product?.images?.length) return state;
      return { ...state, selectedImage: (state.selectedImage + 1) % state.product.images.length };

    case 'PREV_IMAGE':
      if (!state.product?.images?.length) return state;
      return { ...state, selectedImage: (state.selectedImage - 1 + state.product.images.length) % state.product.images.length };

    case 'SET_VARIANT':
      return { ...state, selectedVariant: action.payload };

    case 'SET_QUANTITY':
      return { ...state, quantity: Math.max(1, Math.floor(action.payload)) };

    case 'TOGGLE_ZOOM':
      return { ...state, zoom: { ...state.zoom, enabled: !state.zoom.enabled } };

    case 'SET_ZOOM_POSITION':
      return { ...state, zoom: { ...state.zoom, x: action.payload.x, y: action.payload.y } };

    case 'SET_TAB':
      return { ...state, activeTab: action.payload };

    default:
      return state;
  }
}

export const QuickViewProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const modalRef = useRef(null);

  const open = useCallback((product) => {
    dispatch({ type: 'OPEN', payload: product });

    try {
      if (window?.gtag && product) {
        window.gtag('event', 'view_item', {
          currency: product.currency ?? 'USD',
          value: product.price ?? 0,
          items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: 1 }]
        });
      }
    } catch {
      /* ignore analytics errors */
    }
  }, []);

  const close = useCallback(() => dispatch({ type: 'CLOSE' }), []);
  const setImage = useCallback((index) => dispatch({ type: 'SET_IMAGE', payload: index }), []);
  const nextImage = useCallback(() => dispatch({ type: 'NEXT_IMAGE' }), []);
  const prevImage = useCallback(() => dispatch({ type: 'PREV_IMAGE' }), []);
  const setVariant = useCallback((v) => dispatch({ type: 'SET_VARIANT', payload: v }), []);
  const setQuantity = useCallback((q) => dispatch({ type: 'SET_QUANTITY', payload: q }), []);
  const toggleZoom = useCallback(() => dispatch({ type: 'TOGGLE_ZOOM' }), []);
  const setZoomPosition = useCallback((pos) => dispatch({ type: 'SET_ZOOM_POSITION', payload: pos }), []);
  const setTab = useCallback((tab) => dispatch({ type: 'SET_TAB', payload: tab }), []);

  const getCurrentPrice = useCallback(() => {
    const p = state.product;
    if (!p) return 0;
    return state.selectedVariant?.price ?? p.price ?? 0;
  }, [state.product, state.selectedVariant]);

  const getCurrentImage = useCallback(() => {
    const p = state.product;
    if (!p) return '';
    return p.images?.[state.selectedImage] ?? p.image ?? '';
  }, [state.product, state.selectedImage]);

  const getStockStatus = useCallback(() => {
    const p = state.product;
    if (!p) return { label: 'Unknown', level: 'unknown' };
    if (!p.inStock) return { label: 'Out of stock', level: 'out' };
    if (typeof p.stockQuantity === 'number' && p.stockQuantity < 5) return { label: 'Low stock', level: 'low' };
    return { label: 'In stock', level: 'in' };
  }, [state.product]);

  const calculateDiscountPercent = useCallback(() => {
    const p = state.product;
    if (!p?.originalPrice) return 0;
    const current = getCurrentPrice();
    if (!current) return 0;
    return Math.round(((p.originalPrice - current) / p.originalPrice) * 100);
  }, [state.product, getCurrentPrice]);

  const value = {
    quickView: state,
    modalRef,

    // actions
    open,
    close,
    setImage,
    nextImage,
    prevImage,
    setVariant,
    setQuantity,
    toggleZoom,
    setZoomPosition,
    setTab,

    // computed
    getCurrentPrice,
    getCurrentImage,
    getStockStatus,
    calculateDiscountPercent,

    // flags
    hasMultipleImages: Boolean(state.product?.images?.length > 1),
    hasVariants: Boolean(state.product?.variants?.length),
    isOnSale: Boolean(state.product?.originalPrice && state.product?.originalPrice > getCurrentPrice()),
    canAddToCart: Boolean(state.product?.inStock)
  };

  return <QuickViewContext.Provider value={value}>{children}</QuickViewContext.Provider>;
};

export const useQuickView = () => {
  const ctx = useContext(QuickViewContext);
  if (!ctx) throw new Error('useQuickView must be used inside QuickViewProvider');
  return ctx;
};

// Integration helper: connect QuickView UI to cart and wishlist actions
export const useQuickViewIntegration = () => {
  const { quickView, open, close } = useQuickView();
  const cart = useCart?.();
  const wishlist = useWishlist?.();

  const openWithAnimation = useCallback((product) => {
    open(product);
    // UI may add animation classes; keep integration minimal
  }, [open]);

  const closeWithAnimation = useCallback(() => {
    close();
  }, [close]);

  const addToCartFromQuickView = useCallback(() => {
    if (!quickView.product || !cart?.addToCart) return;
    const item = { ...quickView.product, selectedVariant: quickView.selectedVariant };
    cart.addToCart(item, { quantity: quickView.quantity, showToast: true });
    closeWithAnimation();
  }, [quickView, cart, closeWithAnimation]);

  const toggleWishlistFromQuickView = useCallback(() => {
    if (!quickView.product || !wishlist?.toggleWishlist) return;
    wishlist.toggleWishlist(quickView.product, { selectedVariant: quickView.selectedVariant });
  }, [quickView, wishlist]);

  return {
    openWithAnimation,
    closeWithAnimation,
    addToCartFromQuickView,
    toggleWishlistFromQuickView
  };
};

// QuickView modal component (composable, accessible)
export const QuickViewModal = ({ onAddToCart, onToggleWishlist } = {}) => {
  const {
    quickView,
    modalRef,
    close,
    nextImage,
    prevImage,
    setImage,
    setVariant,
    setQuantity,
    toggleZoom,
    getCurrentImage,
    getCurrentPrice,
    getStockStatus,
    calculateDiscountPercent,
    hasMultipleImages,
    hasVariants,
    isOnSale
  } = useQuickView();

  const cart = useCart?.();
  const wishlist = useWishlist?.();

  if (!quickView.isOpen || !quickView.product) return null;

  const p = quickView.product;
  const image = getCurrentImage();
  const price = getCurrentPrice();
  const stock = getStockStatus();
  const discount = calculateDiscountPercent();

  const handleAddToCart = () => {
    if (typeof onAddToCart === 'function') {
      onAddToCart({ product: p, variant: quickView.selectedVariant, quantity: quickView.quantity });
    } else if (cart?.addToCart) {
      cart.addToCart({ ...p, selectedVariant: quickView.selectedVariant }, { quantity: quickView.quantity, showToast: true });
      close();
    }
  };

  const handleToggleWishlist = () => {
    if (typeof onToggleWishlist === 'function') {
      onToggleWishlist({ product: p, variant: quickView.selectedVariant });
    } else if (wishlist?.toggleWishlist) {
      wishlist.toggleWishlist(p, { selectedVariant: quickView.selectedVariant });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view for ${p.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={close}
    >
      <div
        ref={modalRef}
        className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-6 p-6">
          <div className="w-1/2">
            <div className="relative rounded-lg overflow-hidden bg-gray-100">
              <img src={image} alt={p.name} className="w-full h-72 object-cover" />
              {hasMultipleImages && (
                <>
                  <button aria-label="Previous image" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2">
                    ‹
                  </button>
                  <button aria-label="Next image" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2">
                    ›
                  </button>
                </>
              )}
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto">
              {(p.images ?? [p.image]).map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImage(i)}
                  className={`w-16 h-16 rounded-md overflow-hidden border ${i === quickView.selectedImage ? 'ring-2 ring-offset-1 ring-gray-900' : 'border-gray-200'}`}
                >
                  <img src={src} alt={`${p.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="w-1/2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                <div className="text-sm text-gray-500 mt-1">{p.brand}</div>
              </div>
              <button aria-label="Close quick view" onClick={close} className="text-gray-500 hover:text-gray-900">×</button>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-3">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">${price}</div>
                {isOnSale && <div className="text-sm text-rose-500 line-through">${p.originalPrice}</div>}
                {discount > 0 && <div className="text-sm text-emerald-600">-{discount}%</div>}
              </div>
              <div className="mt-2 text-sm">
                <span className={`font-medium ${stock.level === 'in' ? 'text-emerald-600' : stock.level === 'low' ? 'text-amber-500' : 'text-rose-500'}`}>
                  {stock.label}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {hasVariants && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Options</label>
                  <div className="flex gap-2">
                    {p.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setVariant(v)}
                        className={`px-3 py-2 rounded-md border ${quickView.selectedVariant?.id === v.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Quantity</label>
                <input
                  type="number"
                  value={quickView.quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min={1}
                  className="w-20 px-3 py-2 border rounded-md text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handleAddToCart} className="px-4 py-2 bg-gray-900 text-white rounded-md">
                  Add to cart
                </button>

                <button onClick={handleToggleWishlist} className="px-3 py-2 border rounded-md">
                  Wishlist
                </button>
              </div>

              <div className="mt-3 text-sm text-gray-600">
                <strong>Highlights:</strong> {p.features?.slice(0, 3).join(', ')}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-transparent">
          <div className="flex gap-4 text-sm">
            <button onClick={() => {}} className={`px-3 py-2 ${quickView.activeTab === 'details' ? 'font-semibold' : 'text-gray-500'}`}>Details</button>
            <button onClick={() => {}} className={`px-3 py-2 ${quickView.activeTab === 'specs' ? 'font-semibold' : 'text-gray-500'}`}>Specs</button>
            <button onClick={() => {}} className={`px-3 py-2 ${quickView.activeTab === 'reviews' ? 'font-semibold' : 'text-gray-500'}`}>Reviews</button>
          </div>
        </div>
      </div>
    </div>
  );
};
