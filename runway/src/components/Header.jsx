import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShoppingCartIcon, 
  Bars3Icon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  UserIcon,
  HeartIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const { getCartItemsCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  const categories = [
    { 
      name: 'Electronics', 
      path: '/category/electronics', 
      subcategories: ['Smartphones', 'Laptops', 'Audio', 'Wearables'] 
    },
    { 
      name: 'Fashion', 
      path: '/category/fashion', 
      subcategories: ['Men', 'Women', 'Accessories', 'Footwear'] 
    },
    { 
      name: 'Home & Living', 
      path: '/category/home', 
      subcategories: ['Furniture', 'Decor', 'Kitchen', 'Lighting'] 
    },
    { 
      name: 'Sports', 
      path: '/category/sports', 
      subcategories: ['Fitness', 'Outdoor', 'Team Sports', 'Yoga'] 
    },
  ];

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setIsUserMenuOpen(false);
  };

  return (
    <header className={`
      sticky top-0 z-50 transition-all duration-300 backdrop-blur-md
      ${isScrolled 
        ? 'bg-white/95 dark:bg-gray-900/95 shadow-md border-b border-gray-100 dark:border-gray-800' 
        : 'bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800'
      }
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    

        {/* Quick Actions Bar - Removed for cleaner look */}
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 animate-slideDown">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            <Link 
              to="/" 
              className="block py-3 px-4 rounded-lg font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              onClick={closeAllMenus}
            >
              Home
            </Link>
            
            <div className="space-y-1">
              <div className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Shop by Category
              </div>
              {categories.map((category) => (
                <Link
                  key={category.name}
                  to={category.path}
                  className="block py-2 px-6 rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  onClick={closeAllMenus}
                >
                  {category.name}
                </Link>
              ))}
            </div>

            <Link 
              to="/deals"
              className="block py-3 px-4 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
              onClick={closeAllMenus}
            >
              Hot Deals
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;