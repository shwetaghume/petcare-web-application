import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import './Home.css';

// React Icons for better visual appeal
import { 
  FaHeart, 
  FaUserMd, 
  FaPaw, 
  FaShoppingCart, 
  FaCheckCircle,
  FaArrowRight,
  FaMapMarkerAlt,
  FaCalendarAlt
} from 'react-icons/fa';

import { 
  MdPets, 
  MdVerified
} from 'react-icons/md';

import { 
  BsShieldCheck
} from 'react-icons/bs';

const Home = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content fade-in">
          <div className="hero-text">
            <h1>Find Your Perfect Companion</h1>
            <p className="hero-subtitle">
              Discover loving pets waiting for their forever homes. Our comprehensive 
              platform connects you with adorable animals and provides all the care 
              they need for a happy, healthy life.
            </p>
            
            {user ? (
              <div className="welcome-back">
                <MdVerified className="icon" />
                Welcome back, <span className="user-name">{user.name}</span>! 
                Ready to continue your pet journey?
              </div>
            ) : (
              <div className="hero-buttons">
                <Link to="/register" className="btn btn-primary">
                  <FaHeart />
                  Start Adoption
                </Link>
                <Link to="/pets" className="btn btn-secondary">
                  <FaPaw />
                  Browse Pets
                </Link>
              </div>
            )}
          </div>
          
          <div className="hero-image slide-up">
            <img 
              src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Happy pets waiting for adoption"
            />
            <div className="hero-image-overlay">
              <div className="floating-card">
                <FaCheckCircle className="icon" style={{ color: '#10b981' }} />
                <span className="text">Verified Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section fade-in">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">1,200+</div>
            <div className="stat-label">Successful Adoptions</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">98%</div>
            <div className="stat-label">Happy Families</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Veterinary Support</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">500+</div>
            <div className="stat-label">Pets Available</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header fade-in">
          <h2>Everything Your Pet Needs</h2>
          <p>
            From adoption to ongoing care, we provide everything 
            to ensure your furry friend lives their best life.
          </p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card feature-primary slide-up">
            <FaPaw className="feature-icon" style={{ color: '#2563eb' }} />
            <h3>Pet Adoption</h3>
            <p>
              Find your perfect companion from our extensive collection of loving 
              animals waiting for their forever homes. Each pet is health-checked 
              and ready for adoption.
            </p>
            <Link to="/pets" className="feature-link">
              Browse Available Pets <FaArrowRight />
            </Link>
          </div>
          <div className="feature-card feature-success slide-up">
            <FaShoppingCart className="feature-icon" style={{ color: '#0ea5e9' }} />
            <h3>Pet Pharmacy</h3>
            <p>
              Shop for premium pet medications, supplements, and health products. 
              All items are vet-approved and delivered right to your doorstep for 
              convenience.
            </p>
            <Link to="/pharmacy" className="feature-link">
              Shop Products <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-card fade-in">
          <div className="cta-content">
            <h2>Ready to Change a Life?</h2>
            <p>
              Every pet deserves a loving home. Start your adoption journey today 
              and discover the unconditional love and joy a rescued pet can bring 
              to your family.
            </p>
            
            <div className="cta-buttons">
              {user ? (
                <Link to="/pets" className="btn btn-primary">
                  <FaPaw />
                  Find Your Pet
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary">
                    <FaHeart />
                    Start Adoption
                  </Link>
                  <Link to="/login" className="btn btn-ghost">
                    <FaUserMd />
                    Vet Login
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="cta-image slide-up">
            <img 
              src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
              alt="Happy family with adopted pet"
            />
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="quick-links-section">
        <h3 className="fade-in">Quick Access</h3>
        <div className="quick-links-grid">
          <Link to="/pets" className="quick-link slide-up">
            <MdPets className="quick-link-icon" style={{ color: '#2563eb' }} />
            <div className="quick-link-content">
              <h4>Browse Pets</h4>
              <p>Discover amazing animals ready for adoption in your area</p>
            </div>
          </Link>
          <Link to="/pharmacy" className="quick-link slide-up">
            <BsShieldCheck className="quick-link-icon" style={{ color: '#0ea5e9' }} />
            <div className="quick-link-content">
              <h4>Pet Pharmacy</h4>
              <p>Premium medications and health products for your pets</p>
            </div>
          </Link>
          <div className="quick-link slide-up">
            <FaMapMarkerAlt className="quick-link-icon" style={{ color: '#f59e0b' }} />
            <div className="quick-link-content">
              <h4>Find Location</h4>
              <p>Visit our centers located conveniently near you</p>
            </div>
          </div>
          <div className="quick-link slide-up">
            <FaCalendarAlt className="quick-link-icon" style={{ color: '#8b5cf6' }} />
            <div className="quick-link-content">
              <h4>Book Appointment</h4>
              <p>Schedule visits, consultations, and adoption meetings</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 