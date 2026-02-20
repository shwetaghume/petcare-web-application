import React, { useEffect, useState } from 'react';
import { FaPaw, FaClipboardList, FaCapsules, FaBoxOpen, FaRupeeSign, FaExclamationTriangle, FaDog, FaUserCheck, FaShoppingBag, FaListAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';
import axios from 'axios';

// Using React proxy configuration instead of explicit baseURL

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPets: 0,
    adoptedPets: 0,
    availablePets: 0,
    pendingAdoptions: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStock: 0
  });
  const [recentAdoptions, setRecentAdoptions] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentAdoptions();
    fetchRecentOrders();
  }, []);

const fetchStats = async () => {
    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Auth headers
      const authHeaders = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // Replace with your actual API endpoints
      const petsRes = await axios.get('/api/pets?includeAdopted=true', authHeaders);
      const adoptionsRes = await axios.get('/api/adoptions', authHeaders);
      const productsRes = await axios.get('/api/products?includeOutOfStock=true&limit=1000', authHeaders);
      const products = productsRes.data.products || productsRes.data || [];
      const totalProducts = products.length;
      const lowStock = products.filter(p => p.stockQuantity <= 5).length;
      const ordersRes = await axios.get('/api/orders', authHeaders);
      
      // Calculate stats
      const pets = petsRes.data;
      const adoptedPets = pets.filter(p => p.isAdopted).length;
      const availablePets = pets.length - adoptedPets;
      const adoptions = adoptionsRes.data;
      const pendingAdoptions = adoptions.filter(a => a.status === 'Pending').length;
      
      const orders = ordersRes.data.orders || ordersRes.data || [];
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      
      setStats({
        totalPets: pets.length,
        adoptedPets,
        availablePets,
        pendingAdoptions,
        totalProducts,
        totalOrders,
        totalRevenue,
        lowStock
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

const fetchRecentAdoptions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const res = await axios.get('/api/adoptions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setRecentAdoptions(res.data.slice(-5).reverse());
    } catch (error) {
      console.error('Error fetching recent adoptions:', error);
    }
  };

const fetchRecentOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const res = await axios.get('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const orders = res.data.orders || res.data;
      setRecentOrders(orders.slice(-5).reverse());
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  return (
    <div className="admin-dashboard-container">
      <h1 className="admin-dashboard-title">Admin Dashboard</h1>
      <p className="admin-dashboard-welcome">Welcome back, Admin User! Here's what's happening with your pet care center.</p>
      {/* Stat Cards */}
      <div className="admin-dashboard-stats">
        <div className="stat-card stat-pets">
          <FaPaw className="stat-icon" />
          <div>
            <div className="stat-value">{stats.totalPets}</div>
            <div className="stat-label">TOTAL PETS</div>
            <div className="stat-sub"><span style={{color:'#28a745'}}>{stats.adoptedPets} adopted</span> <span style={{color:'#007bff'}}> {stats.availablePets} available</span></div>
          </div>
        </div>
        <div className="stat-card stat-adoptions">
          <FaClipboardList className="stat-icon" />
          <div>
            <div className="stat-value">{stats.pendingAdoptions}</div>
            <div className="stat-label">PENDING ADOPTIONS</div>
            <div className="stat-sub">Applications to review</div>
          </div>
        </div>
        <div className="stat-card stat-products">
          <FaCapsules className="stat-icon" />
          <div>
            <div className="stat-value">{stats.totalProducts}</div>
            <div className="stat-label">TOTAL PRODUCTS</div>
            <div className="stat-sub">In pharmacy inventory</div>
          </div>
        </div>
        <div className="stat-card stat-orders">
          <FaBoxOpen className="stat-icon" />
          <div>
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">TOTAL ORDERS</div>
            <div className="stat-sub">Pharmacy orders</div>
          </div>
        </div>
        <div className="stat-card stat-revenue">
          <FaRupeeSign className="stat-icon" />
          <div>
            <div className="stat-value">₹{stats.totalRevenue.toFixed(2)}</div>
            <div className="stat-label">TOTAL REVENUE</div>
            <div className="stat-sub">From pharmacy sales</div>
          </div>
        </div>
        <div className="stat-card stat-lowstock">
          <FaExclamationTriangle className="stat-icon" />
          <div>
            <div className="stat-value">{stats.lowStock}</div>
            <div className="stat-label">LOW STOCK ITEMS</div>
            <div className="stat-sub">Need restocking</div>
          </div>
        </div>
      </div>
      {/* Management Shortcuts */}
      <div className="admin-dashboard-shortcuts">
        <Link to="/admin/pets" className="shortcut-card"><FaDog className="shortcut-icon" /> Manage Pets <span className="shortcut-desc">Add, edit, or remove pets</span></Link>
        <Link to="/admin/adoptions" className="shortcut-card"><FaUserCheck className="shortcut-icon" /> Manage Adoptions <span className="shortcut-desc">Review adoption applications</span></Link>
        <Link to="/admin/products" className="shortcut-card"><FaShoppingBag className="shortcut-icon" /> Manage Products <span className="shortcut-desc">Add, edit pharmacy products</span></Link>
        <Link to="/admin/orders" className="shortcut-card"><FaListAlt className="shortcut-icon" /> View Orders <span className="shortcut-desc">Track pharmacy orders</span></Link>
      </div>
      {/* Recent Adoptions & Orders */}
      <div className="admin-dashboard-recent">
        <div className="recent-card">
          <h3>Recent Adoptions</h3>
          {recentAdoptions.length === 0 ? <div className="recent-empty">No recent adoptions</div> : (
            <ul>
              {recentAdoptions.map(a => (
                <li key={a._id}>{a.applicant?.name || 'User'} adopted {a.pet?.name || 'a pet'}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="recent-card">
          <h3>Recent Orders</h3>
          {recentOrders.length === 0 ? <div className="recent-empty">No recent orders</div> : (
            <ul>
              {recentOrders.map(o => (
                <li key={o._id}>Order #{o._id} - ₹{o.totalAmount?.toFixed(2) || 0}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard; 