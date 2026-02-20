// src/App.js
import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Pets from './components/Pets';
import Pharmacy from './components/Pharmacy';
import Cart from './components/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerification from './pages/EmailVerification';
import AdoptionForm from './components/AdoptionForm';
import PetDetail from './components/PetDetail';
import PharmacyProductDetail from './components/PharmacyProductDetail';
import AddPet from './components/AddPet';
import AdminDashboard from './components/AdminDashboard';
import AdminPets from './components/AdminPets';
import AdminProducts from './components/AdminProducts';
import AdminAdoptions from './components/AdminAdoptions';
import AdminOrders from './components/AdminOrders';
import AdminProfile from './components/AdminProfile';
import UserProfile from './components/UserProfile';
import AdminLayout from './components/AdminLayout';
import Services from './components/Services';
import AdminServices from './components/AdminServices';
import AdminServiceBookings from './components/AdminServiceBookings';
import './App.css';

// Create Authentication Context
const AuthContext = createContext();

// Export AuthContext for use in other components
export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="spinner"></div>
    <span className="ml-2 text-secondary">Loading...</span>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <h2 className="text-xl font-semibold text-error mb-4">Something went wrong</h2>
          <p className="text-secondary mb-4">We apologize for the inconvenience. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Admin Protected Route Component
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user?.isAdmin) {
    // Redirect non-admin users to home page
    navigate('/', { replace: true });
    return (
      <div className="container py-8 text-center">
        <h1 className="text-error">Access Denied</h1>
        <p className="text-secondary mb-6">You don't have admin privileges to access this page.</p>
        <a href="/" className="btn btn-primary">Go Home</a>
      </div>
    );
  }
  
  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Set base URL for API calls
    axios.defaults.baseURL = process.env.REACT_APP_API_URL;
    
    // Add request interceptor for better error handling
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear authentication if token is invalid
          logout();
        }
        return Promise.reject(error);
      }
    );
  }, []);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          // Verify token with backend
          const response = await axios.get('/api/auth/me');
          setUser(response.data);
          setIsAuthenticated(true);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          console.error('Token verification failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart'); // Clear cart on logout
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const authValue = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    updateUser
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthContext.Provider value={authValue}>
      <ErrorBoundary>
        <Router>
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              
              {/* Authentication Routes */}
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              <Route path="/verify-email" element={
                <PublicRoute>
                  <EmailVerification />
                </PublicRoute>
              } />
              
              {/* Protected Routes */}
              <Route path="/pets" element={
                <ProtectedRoute>
                  <Pets />
                </ProtectedRoute>
              } />
              <Route path="/pets/:category" element={
                <ProtectedRoute>
                  <Pets />
                </ProtectedRoute>
              } />
              <Route path="/pet/:id" element={
                <ProtectedRoute>
                  <PetDetail />
                </ProtectedRoute>
              } />
              <Route path="/pharmacy" element={
                <ProtectedRoute>
                  <Pharmacy />
                </ProtectedRoute>
              } />
              <Route path="/pharmacy/product/:id" element={
                <ProtectedRoute>
                  <PharmacyProductDetail />
                </ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } />
              <Route path="/adoption/:petId" element={
                <ProtectedRoute>
                  <AdoptionForm />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />
              <Route path="/services" element={<Services />} />
              
              {/* Admin Routes */}
              <Route path="/admin/*" element={
                <AdminProtectedRoute>
                  <AdminLayout>
                    <Routes>
                      <Route index element={<AdminDashboard />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="pets" element={<AdminPets />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="adoptions" element={<AdminAdoptions />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="profile" element={<AdminProfile />} />
                      <Route path="add-pet" element={<AddPet />} />
                      <Route path="services" element={<AdminServices />} />
                      <Route path="service-bookings" element={<AdminServiceBookings />} />
                    </Routes>
                  </AdminLayout>
                </AdminProtectedRoute>
              } />
              
              {/* 404 Route */}
              <Route path="*" element={
                <div className="container py-8 text-center">
                  <h1 className="text-error">404 - Page Not Found</h1>
                  <p className="text-secondary mb-6">The page you're looking for doesn't exist.</p>
                  <button 
                    onClick={() => window.history.back()} 
                    className="btn btn-primary mr-4"
                  >
                    Go Back
                  </button>
                  <a href="/" className="btn btn-secondary">Go Home</a>
                </div>
              } />
            </Routes>
          </main>
        </Router>
      </ErrorBoundary>
    </AuthContext.Provider>
  );
}

export default App;
