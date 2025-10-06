import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-8">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white dark:text-gray-900 font-bold text-xl">S</span>
          </div>
          
          {/* Subtle Spinning Ring */}
          <div className="absolute -inset-3 border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-lg animate-spin"></div>
        </div>
        
        {/* Brand Name */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          ShopEasy
        </h2>
        
        {/* Loading Text */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          Preparing your shopping experience
        </p>
        
        {/* Progress Indicator */}
        <div className="w-40 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gray-900 dark:bg-white rounded-full animate-pulse"></div>
        </div>

        {/* Optional: Loading Dots */}
        <div className="flex justify-center space-x-1 mt-6">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;