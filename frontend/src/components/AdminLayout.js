import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Add admin-page class to body when component mounts
  useEffect(() => {
    document.body.classList.add('admin-page');
    
    // Cleanup: remove class when component unmounts
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="admin-profile">
          <div className="admin-avatar">
            <span>👤</span>
          </div>
          <div className="admin-info">
            <h3>{user?.name || 'Admin'}</h3>
            <p>Administrator</p>
          </div>
        </div>

        <nav className="admin-nav">
          <Link 
            to="/admin" 
            className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
          >
            <span className="icon">📊</span>
            Dashboard
          </Link>

          <Link 
            to="/admin/pets" 
            className={`nav-item ${isActive('/admin/pets') ? 'active' : ''}`}
          >
            <span className="icon">🐾</span>
            Manage Pets
          </Link>

          <Link 
            to="/admin/adoptions" 
            className={`nav-item ${isActive('/admin/adoptions') ? 'active' : ''}`}
          >
            <span className="icon">📋</span>
            Adoptions
          </Link>

          <Link 
            to="/admin/products" 
            className={`nav-item ${isActive('/admin/products') ? 'active' : ''}`}
          >
            <span className="icon">💊</span>
            Products
          </Link>

          <Link 
            to="/admin/orders" 
            className={`nav-item ${isActive('/admin/orders') ? 'active' : ''}`}
          >
            <span className="icon">📦</span>
            Orders
          </Link>

          <Link 
            to="/admin/services" 
            className={`nav-item ${isActive('/admin/services') ? 'active' : ''}`}
          >
            <span className="icon">🛠️</span>
            Manage Services
          </Link>

          <Link 
            to="/admin/service-bookings" 
            className={`nav-item ${isActive('/admin/service-bookings') ? 'active' : ''}`}
          >
            <span className="icon">📅</span>
            Service Bookings
          </Link>

          <Link 
            to="/admin/profile" 
            className={`nav-item ${isActive('/admin/profile') ? 'active' : ''}`}
          >
            <span className="icon">⚙️</span>
            Settings
          </Link>
        </nav>
      </div>

      <div className="admin-content">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout; 