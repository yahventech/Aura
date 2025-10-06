import React from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product, index, compact = false }) {
  if (!product) return null;

  if (compact) {
    return (
      <Link
        to={`/product/${product.id}`}
        className="flex items-center gap-3 p-2 rounded-lg hover:shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
          <img src={product.image} alt={product.title || product.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {product.title || product.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {product.brand || product.category}
          </div>
          <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
            {product.price ? `$${product.price}` : '—'}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
          <img src={product.image} alt={product.title || product.name} className="w-full h-full object-cover" />
        </div>
        <div className="p-4">
          <div className="text-sm font-medium text-gray-900 dark:text-white">{product.title || product.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{product.brand || product.category}</div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{product.price ? `$${product.price}` : '—'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{product.rating ? `${product.rating} ★` : ''}</div>
          </div>
        </div>
      </Link>
    </div>
  );
}
