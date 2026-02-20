// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import AdminLogin from './AdminLogin';
import './Navbar.css';
import { FaPaw, FaShoppingCart, FaBars, FaTimes, FaSearch, FaPrescriptionBottle, FaUser, FaShieldAlt } from 'react-icons/fa';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  
  // Enhanced debug authentication state 
  console.log('=== NAVBAR DEBUG START ===');
  console.log('Navbar - Authentication state:', { 
    isAuthenticated: isAuthenticated, 
    user: user?.name || 'No user',
    userObject: user,
    timestamp: new Date().toLocaleTimeString()
  });
  console.log('Navbar - Logout button should be visible:', isAuthenticated ? 'YES' : 'NO');
  console.log('=== NAVBAR DEBUG END ===');
  
  // Check if current page is an admin page
  const isAdminPage = location.pathname.startsWith('/admin');

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update cart count
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      setCartCount(cart.reduce((total, item) => total + (item.quantity || 1), 0));
    };

    updateCartCount();
    
    // Listen for cart changes
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);
    
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // const togglePetCategories = () => {
  //   setShowPetCategories(!showPetCategories);
  // };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (isAuthenticated) {
        navigate(`/pets?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate('/login');
      }
      setSearchQuery('');
    }
  };

  const handleAdminClick = () => {
    setShowAdminLogin(true);
    setIsOpen(false); // Close mobile menu when admin button is clicked
  };

  const isActive = (path) => {
    if (path === '/pets' && location.pathname.startsWith('/pets')) {
      return true;
    }
    return location.pathname === path;
  };



  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className={`navbar-container ${!isAuthenticated ? 'no-user' : ''}`}>
          {/* Left Section: Logo */}
          <Link to="/" className="navbar-logo">
            <FaPaw className="navbar-icon" />
            <span className="logo-text">PetCare</span>
          </Link>

          {/* Middle Section: Search + Navigation */}
          <div className="navbar-middle-section">
            {!isAdminPage && (
              <form onSubmit={handleSearch} className="search-bar">
                <input 
                  type="text" 
                  placeholder="Search pets, products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="search-icon" aria-label="Search">
                  <FaSearch />
                </button>
              </form>
            )}

            <button 
              className="menu-icon" 
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>

            <div className={`nav-menu-container ${isOpen ? 'active' : ''}`}>
              <ul className="nav-menu">
              {!isAdminPage && (
                <li className="nav-item">
                  <Link 
                    to="/" 
                    className={`nav-link ${isActive('/') ? 'active' : ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    Home
                  </Link>
                </li>
              )}
              
              {/* Admin Button - Only visible when user is NOT authenticated (main dashboard) */}
              {!isAdminPage && !isAuthenticated && (
                <li className="nav-item">
                  <button 
                    onClick={handleAdminClick}
                    className="nav-link admin-button"
                  >
                    <FaShieldAlt className="nav-icon" />
                    Admin
                  </button>
                </li>
              )}
              
              {isAuthenticated ? (
                <>
                  {!isAdminPage && (
                    <>
                      <li className="nav-item">
                        <Link 
                          to="/services" 
                          className={`nav-link ${isActive('/services') ? 'active' : ''}`}
                          onClick={() => setIsOpen(false)}
                        >
                          Services
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link 
                          to="/pets" 
                          className={`nav-link ${isActive('/pets') ? 'active' : ''}`}
                          onClick={() => setIsOpen(false)}
                        >
                          Pets
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link 
                          to="/pharmacy" 
                          className={`nav-link ${isActive('/pharmacy') ? 'active' : ''}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <FaPrescriptionBottle className="nav-icon" />
                          Pharmacy
                        </Link>
                      </li>
                    </>
                  )}
                  
                  {isAdminPage && user?.isAdmin && (
                    <>
                      <li className="nav-item">
                        <Link 
                          to="/admin" 
                          className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                          onClick={() => setIsOpen(false)}
                        >
                          Dashboard
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link 
                          to="/admin/pets" 
                          className={`nav-link ${isActive('/admin/pets') ? 'active' : ''}`}
                          onClick={() => setIsOpen(false)}
                        >
                          Manage Pets
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link 
                          to="/admin/adoptions" 
                          className={`nav-link ${isActive('/admin/adoptions') ? 'active' : ''}`}
                          onClick={() => setIsOpen(false)}
                        >
                          Adoptions
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link 
                          to="/admin/products" 
                          className={`nav-link ${isActive('/admin/products') ? 'active' : ''}`}
                          onClick={() => setIsOpen(false)}
                        >
                          Products
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link 
                          to="/admin/profile" 
                          className={`nav-link ${isActive('/admin/profile') ? 'active' : ''}`}
                          onClick={() => setIsOpen(false)}
                        >
                          Admin Profile
                        </Link>
                      </li>
                    </>
                  )}
                  
                  {/* User Profile Link for Mobile - Only show in mobile menu */}
                  <li className="nav-item mobile-only">
                    <Link 
                      to="/profile" 
                      className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                      onClick={() => setIsOpen(false)}
                    >
                      <FaUser className="nav-icon" />
                      Profile ({user?.name || 'User'})
                    </Link>
                  </li>
                  
                  {/* Logout Button for Mobile - Only show in mobile menu */}
                  <li className="nav-item mobile-only">
                    <button 
                      onClick={handleLogout} 
                      className="nav-link logout-button mobile-logout"
                    >
                      Logout
                    </button>
                  </li>
                  
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link 
                      to="/login" 
                      className={`nav-link ${isActive('/login') ? 'active' : ''}`}
                      onClick={() => setIsOpen(false)}
                    >
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      to="/register" 
                      className={`nav-link ${isActive('/register') ? 'active' : ''}`}
                      onClick={() => setIsOpen(false)}
                    >
                      Register
                    </Link>
                  </li>
                </>
              )}
              </ul>
            </div>
          </div>

          {/* Right Section: DEDICATED USER & LOGOUT AREA */}
          <div className="navbar-right-section">
            {isAuthenticated && (
              <>
                {!isAdminPage && (
                  <Link 
                    to="/profile" 
                    className={`nav-link user-profile-link ${isActive('/profile') ? 'active' : ''}`}
                    title={`Profile: ${user?.name || 'User'}`}
                  >
                    <FaUser className="nav-icon" />
                    <span className="username-display">{user?.name || 'User'}</span>
                  </Link>
                )}
                <button 
                  onClick={handleLogout} 
                  className="nav-link logout-button"
                  title="Logout"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
      
      {/* Admin Login Modal */}
      <AdminLogin 
        isOpen={showAdminLogin} 
        onClose={() => setShowAdminLogin(false)} 
      />
    </>
  );
};

export default Navbar;
