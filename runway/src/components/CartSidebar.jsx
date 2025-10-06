import React from 'react';
import { useCart } from '../context/AppContext';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';

const CartSidebar = ({ isOpen, onClose }) => {
  const { cartState, cartActions } = useCart();

  const updateQuantity = (item, newQuantity) => {
    cartActions.updateQuantity(item.id, item.variations, newQuantity);
  };

  const removeItem = (item) => {
    cartActions.removeItem(item.id, item.variations);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {/* Left: Cart Title */}
            <div className="flex items-center space-x-3">
                <ShoppingBag className="w-6 h-6 text-gray-900" />
                <h2 className="text-lg font-semibold text-gray-900">
                Shopping Cart ({cartState.items.reduce((sum, item) => sum + item.quantity, 0)})
                </h2>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-4">
                {/* Cart Button */}
                <button
                onClick={onOpenCart}
                className="p-2 text-gray-600 hover:text-gray-900 relative"
                aria-label="Open cart"
                >
                <ShoppingBag className="w-6 h-6" />
                {cartState.items.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartState.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                )}
                </button>

                {/* Login Button */}
                <button
                onClick={() => onOpenAuth('login')}
                className="p-2 text-gray-600 hover:text-gray-900"
                aria-label="Login"
                >
                <User className="w-6 h-6" />
                </button>

                {/* Close Button (if applicable) */}
                <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close cart"
                >
                <X className="w-5 h-5" />
                </button>
            </div>
            </div>
                


          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {cartState.items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-500">Start shopping to add items to your cart</p>
              </div>
            ) : (
              <div className="space-y-6">
                {cartState.items.map((item, index) => (
                  <div key={index} className="flex space-x-4 bg-white p-4 rounded-lg border border-gray-200">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      
                      {/* Variations */}
                      {Object.keys(item.variations).length > 0 && (
                        <div className="mt-1 text-sm text-gray-500">
                          {Object.entries(item.variations).map(([key, value]) => (
                            <span key={key} className="capitalize">
                              {key}: {value}{' '}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => updateQuantity(item, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeItem(item)}
                            className="text-sm text-red-600 hover:text-red-700 mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartState.items.length > 0 && (
            <div className="border-t border-gray-200 p-6 space-y-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${cartState.total.toFixed(2)}</span>
              </div>
              <button className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                Proceed to Checkout
              </button>
              <button
                onClick={onClose}
                className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;