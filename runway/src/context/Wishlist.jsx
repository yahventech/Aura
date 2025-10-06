// src/pages/Wishlist.jsx
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { HeartIcon, ShoppingCartIcon, ArrowRightIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function Wishlist() {
  const { items: wishlistItems = [], loading: wishlistLoading, removeFromWishlist, toggleWishlist } = useWishlist();
  const { addToCart, isAdding } = useCart();

  const grouped = useMemo(() => {
    // simple grouping example by category for better scanning
    return wishlistItems.reduce((acc, item) => {
      const key = item.category || 'Other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [wishlistItems]);

  const handleMoveToCart = async (product) => {
    if (!addToCart) return;
    await addToCart(product, { quantity: 1, showToast: true });
    removeFromWishlist(product.id);
  };

  if (wishlistLoading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="h-44 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="mt-3 h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="mt-2 h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!wishlistItems.length) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-6">
            <HeartIcon className="w-8 h-8 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Save items you love and find them here later.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-md">
            Continue shopping <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wishlist</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{wishlistItems.length} saved item{wishlistItems.length > 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900">
              <ShoppingCartIcon className="w-5 h-5" /> Go to cart
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {Object.keys(grouped).map((category) => (
              <div key={category} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{category}</h2>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{grouped[category].length} item{grouped[category].length > 1 ? 's' : ''}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {grouped[category].map((product) => (
                    <div key={product.id} className="flex gap-4 p-3 rounded-md border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
                      <div className="w-28 h-20 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                        <img src={product.image} alt={product.title || product.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.title || product.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{product.brand || product.category}</div>
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">${product.price?.toFixed(2) ?? '—'}</div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => handleMoveToCart(product)}
                            disabled={isAdding}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm hover:opacity-95"
                          >
                            <ShoppingCartIcon className="w-4 h-4" />
                            Move to cart
                          </button>

                          <button
                            onClick={() => removeFromWishlist(product.id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <TrashIcon className="w-4 h-4" /> Remove
                          </button>

                          <button
                            onClick={() => toggleWishlist(product)}
                            className="ml-auto text-sm text-rose-500 hover:underline"
                            aria-pressed="true"
                          >
                            Saved
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <aside className="space-y-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Wishlist summary</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Total items</span>
                  <span>{wishlistItems.length}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span>Estimated value</span>
                  <span className="font-semibold">${wishlistItems.reduce((s, it) => s + (it.price || 0), 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4">
                <Link to="/sale" className="inline-flex items-center justify-center w-full gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:opacity-95">
                  Shop deals
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tips</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>Move items to cart to reserve stock.</li>
                <li>Share your wishlist with friends and family.</li>
                <li>We’ll notify you if an item on your wishlist goes on sale.</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
