import React, { useState, useEffect } from 'react';
import './AdminOrders.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Initialize orders data
  useEffect(() => {
    initializeOrdersData();
  }, []);

  const initializeOrdersData = async () => {
    setLoading(true);
    
    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }

      // Fetch real orders from API
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const ordersData = data.orders || data || [];
      
      // Transform API data to match expected format
      const transformedOrders = ordersData.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        customer: {
          name: order.shippingAddress.fullName,
          email: order.shippingAddress.email,
          phone: order.shippingAddress.phone,
          address: order.shippingAddress.address
        },
        items: order.items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        })),
        subtotal: order.totalAmount || 0,
        tax: 0, // You may want to add tax calculation
        shipping: 0, // You may want to add shipping calculation
        totalAmount: order.totalAmount || 0,
        status: order.status || 'pending',
        paymentStatus: order.paymentMethod === 'cod' ? (order.status === 'delivered' ? 'paid' : 'pending') : (order.status === 'paid' ? 'paid' : 'pending'),
        shippingMethod: order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
        trackingNumber: order.trackingNumber || '',
        orderDate: order.createdAt,
        estimatedDelivery: order.estimatedDelivery || '',
        lastUpdated: order.updatedAt || order.createdAt,
        notes: order.notes || ''
      }));
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Set empty orders on error
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate status counts
  const statusCounts = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    returned: orders.filter(o => o.status === 'returned').length
  };

  // Filter orders based on search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId, newStatus, trackingNumber = '', notes = '') => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Update status via API
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      const updatedOrders = orders.map(order => {
        if (order._id === orderId) {
          return {
            ...order,
            status: newStatus,
            trackingNumber: trackingNumber || order.trackingNumber,
            lastUpdated: new Date().toISOString(),
            notes: notes || order.notes
          };
        }
        return order;
      });
      
      setOrders(updatedOrders);
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const viewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'returned': return 'status-returned';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotalRevenue = () => {
    return orders
      .filter(order => order.paymentStatus === 'paid')
      .reduce((total, order) => total + order.totalAmount, 0);
  };

  if (loading) {
    return (
      <div className="admin-orders">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <div className="orders-header">
        <div className="header-content">
          <h1>View Orders</h1>
          <p>Track and manage pharmacy orders</p>
        </div>
        <div className="revenue-display">
          <span className="revenue-label">Total Revenue:</span>
          <span className="revenue-amount">₹{calculateTotalRevenue().toFixed(2)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="orders-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by order number, customer name, email, or tracking..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="orders-stats">
        <div className="stat-item">
          <span className="stat-number">{statusCounts.total}</span>
          <span className="stat-label">Total Orders</span>
        </div>
        <div className="stat-item pending">
          <span className="stat-number">{statusCounts.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-item shipped">
          <span className="stat-number">{statusCounts.shipped}</span>
          <span className="stat-label">Shipped</span>
        </div>
        <div className="stat-item delivered">
          <span className="stat-number">{statusCounts.delivered}</span>
          <span className="stat-label">Delivered</span>
        </div>
        <div className="stat-item returned">
          <span className="stat-number">{statusCounts.returned}</span>
          <span className="stat-label">Returned</span>
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.orderNumber}</h3>
                  <p className="customer-name">{order.customer.name}</p>
                </div>
                <div className="order-amount">
                  <span className="amount">₹{order.totalAmount.toFixed(2)}</span>
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="order-content">
                <div className="order-details">
                  <div className="detail-group">
                    <p><strong>Customer:</strong> {order.customer.email}</p>
                    <p><strong>Phone:</strong> {order.customer.phone}</p>
                    <p><strong>Items:</strong> {order.items.length} product(s)</p>
                  </div>
                  <div className="detail-group">
                    <p><strong>Order Date:</strong> {formatDate(order.orderDate)}</p>
                    <p><strong>Payment:</strong> {order.paymentStatus}</p>
                    {order.trackingNumber && (
                      <p><strong>Tracking:</strong> {order.trackingNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="order-actions">
                <button 
                  className="btn btn-info"
                  onClick={() => viewDetails(order)}
                >
                  View Details
                </button>
                
                {order.status === 'pending' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      const trackingNumber = prompt('Enter tracking number:');
                      if (trackingNumber) {
                        handleStatusChange(order._id, 'shipped', trackingNumber);
                      }
                    }}
                  >
                    Mark as Shipped
                  </button>
                )}
                
                {order.status === 'shipped' && (
                  <button 
                    className="btn btn-success"
                    onClick={() => {
                      handleStatusChange(order._id, 'delivered');
                    }}
                  >
                    Mark as Delivered
                  </button>
                )}
                
                {(order.status === 'delivered' || order.status === 'shipped') && (
                  <button 
                    className="btn btn-warning"
                    onClick={() => {
                      const reason = prompt('Enter return reason:');
                      if (reason) {
                        handleStatusChange(order._id, 'returned', '', reason);
                      }
                    }}
                  >
                    Mark as Returned
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-orders">
            <p>No orders found.</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content order-details-modal">
            <div className="modal-header">
              <h2>Order Details - #{selectedOrder.orderNumber}</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              {/* Order Status */}
              <div className="details-section">
                <h3>Order Status</h3>
                <div className="status-info">
                  <span className={`status-badge large ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {selectedOrder.status.toUpperCase()}
                  </span>
                  <div className="status-details">
                    <p><strong>Order Date:</strong> {formatDate(selectedOrder.orderDate)}</p>
                    <p><strong>Last Updated:</strong> {formatDate(selectedOrder.lastUpdated)}</p>
                    {selectedOrder.trackingNumber && (
                      <p><strong>Tracking Number:</strong> {selectedOrder.trackingNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="details-section">
                <h3>Customer Information</h3>
                <div className="info-grid">
                  <div><strong>Name:</strong> {selectedOrder.customer.name}</div>
                  <div><strong>Email:</strong> {selectedOrder.customer.email}</div>
                  <div><strong>Phone:</strong> {selectedOrder.customer.phone}</div>
                  <div><strong>Address:</strong> {selectedOrder.customer.address}</div>
                </div>
              </div>

              {/* Order Items */}
              <div className="details-section">
                <h3>Order Items</h3>
                <div className="items-list">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        <span className="item-details">Qty: {item.quantity} × ₹{item.price.toFixed(2)}</span>
                      </div>
                      <span className="item-total">₹{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="details-section">
                <h3>Order Summary</h3>
                <div className="order-summary">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Tax:</span>
                    <span>₹{selectedOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping:</span>
                    <span>₹{selectedOrder.shipping.toFixed(2)}</span>
                  </div>
                  <div className="summary-row total">
                    <span><strong>Total:</strong></span>
                    <span><strong>₹{selectedOrder.totalAmount.toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="details-section">
                  <h3>Notes</h3>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}

              {/* Status Actions */}
              <div className="details-section">
                <h3>Actions</h3>
                <div className="modal-actions">
                  {selectedOrder.status === 'pending' && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        const trackingNumber = prompt('Enter tracking number:');
                        if (trackingNumber) {
                          handleStatusChange(selectedOrder._id, 'shipped', trackingNumber);
                          closeModal();
                        }
                      }}
                    >
                      Mark as Shipped
                    </button>
                  )}
                  
                  {selectedOrder.status === 'shipped' && (
                    <button 
                      className="btn btn-success"
                      onClick={() => {
                        handleStatusChange(selectedOrder._id, 'delivered');
                        closeModal();
                      }}
                    >
                      Mark as Delivered
                    </button>
                  )}
                  
                  {(selectedOrder.status === 'delivered' || selectedOrder.status === 'shipped') && (
                    <button 
                      className="btn btn-warning"
                      onClick={() => {
                        const reason = prompt('Enter return reason:');
                        if (reason) {
                          handleStatusChange(selectedOrder._id, 'returned', '', reason);
                          closeModal();
                        }
                      }}
                    >
                      Process Return
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders; 