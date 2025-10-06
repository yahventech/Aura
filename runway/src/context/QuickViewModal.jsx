// src/components/QuickViewModal.jsx
import React, { useEffect } from 'react';
import { useQuickView } from '../context/QuickViewContext';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, HeartIcon } from '@heroicons/react/24/outline';

export default function QuickViewModal() {
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

  useEffect(() => {
    if (!quickView.isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [quickView.isOpen, close, nextImage, prevImage]);

  if (!quickView.isOpen || !quickView.product) return null;

  const p = quickView.product;
  const image = getCurrentImage();
  const price = getCurrentPrice();
  const stock = getStockStatus();
  const discount = calculateDiscountPercent();

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
          {/* Left: image gallery */}
          <div className="w-1/2">
            <div className="relative rounded-lg overflow-hidden bg-gray-100">
              <img src={image} alt={p.name} className="w-full h-72 object-cover" />
              {hasMultipleImages && (
                <>
                  <button aria-label="Previous image" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2">
                    <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
                  </button>
                  <button aria-label="Next image" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2">
                    <ChevronRightIcon className="w-5 h-5 text-gray-700" />
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

          {/* Right: details */}
          <div className="w-1/2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                <div className="text-sm text-gray-500 mt-1">{p.brand}</div>
              </div>
              <button aria-label="Close quick view" onClick={close} className="text-gray-500 hover:text-gray-900">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-3">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">${price}</div>
                {isOnSale && (
                  <div className="text-sm text-rose-500 line-through">${p.originalPrice}</div>
                )}
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
                <button onClick={() => {
                  // prefer integration hook: consumer should call addToCartFromQuickView
                  const evt = new CustomEvent('quickview:add-to-cart');
                  window.dispatchEvent(evt);
                }} className="px-4 py-2 bg-gray-900 text-white rounded-md">
                  Add to cart
                </button>

                <button onClick={() => {
                  const evt = new CustomEvent('quickview:toggle-wishlist');
                  window.dispatchEvent(evt);
                }} className="px-3 py-2 border rounded-md flex items-center gap-2">
                  <HeartIcon className="w-5 h-5" /> Wishlist
                </button>
              </div>

              <div className="mt-3 text-sm text-gray-600">
                <strong>Highlights:</strong> {p.features?.slice(0, 3).join(', ')}
              </div>
            </div>
          </div>
        </div>

        {/* optional bottom tabs (details/specs/reviews) */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-transparent">
          <div className="flex gap-4 text-sm">
            <button className={`px-3 py-2 ${quickView.activeTab === 'details' ? 'font-semibold' : 'text-gray-500'}`} onClick={() => { /* setTab handled via context consumer */ }}>
              Details
            </button>
            <button className={`px-3 py-2 ${quickView.activeTab === 'specs' ? 'font-semibold' : 'text-gray-500'}`} onClick={() => { /* setTab */ }}>
              Specs
            </button>
            <button className={`px-3 py-2 ${quickView.activeTab === 'reviews' ? 'font-semibold' : 'text-gray-500'}`} onClick={() => { /* setTab */ }}>
              Reviews
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
