import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ProductProvider } from "./context/ProductContext";
import { CartProvider } from "./context/CartContext"; // ✅ ADD THIS LINE

import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import Browse from './pages/Browse';
import CartSidebar from './components/CartSidebar';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

import './App.css';

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [authModal, setAuthModal] = useState(null);

  return (
    <ProductProvider>
      <CartProvider> {/* ✅ WRAP EVERYTHING THAT USES useCart() */}
        <AppProvider>
          <Router>
            <div className="App">
              {/* Global Cart Sidebar */}
              <CartSidebar 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)} 
              />

              {/* Auth Modals */}
              {authModal === 'login' && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                  <div className="flex items-center justify-center min-h-full p-4">
                    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setAuthModal(null)} />
                    <div className="relative bg-white rounded-2xl max-w-md w-full">
                      <LoginForm 
                        onSwitchToRegister={() => setAuthModal('register')}
                        onClose={() => setAuthModal(null)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {authModal === 'register' && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                  <div className="flex items-center justify-center min-h-full p-4">
                    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setAuthModal(null)} />
                    <div className="relative bg-white rounded-2xl max-w-md w-full">
                      <RegisterForm 
                        onSwitchToLogin={() => setAuthModal('login')}
                        onClose={() => setAuthModal(null)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Routes>
                <Route 
                  path="/" 
                  element={
                    <Home 
                      onOpenCart={() => setIsCartOpen(true)}
                      onOpenAuth={(type) => setAuthModal(type)}
                    />
                  } 
                />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/browse" element={<Browse />} />
              </Routes>
            </div>
          </Router>
        </AppProvider>
      </CartProvider>
    </ProductProvider>
  );
}

export default App;
