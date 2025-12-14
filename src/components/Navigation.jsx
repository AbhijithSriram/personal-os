import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const { signOut, userProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    closeMobileMenu();
    await signOut();
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand" onClick={closeMobileMenu}>
          <span className="mono">PERSONAL_OS</span>
        </Link>
        
        <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Dashboard
          </Link>
          <Link 
            to="/tracker" 
            className={`nav-link ${isActive('/tracker') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Daily Tracker
          </Link>
          <Link 
            to="/attendance" 
            className={`nav-link ${isActive('/attendance') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Attendance
          </Link>
          {userProfile?.enableHealthMetrics && (
            <Link 
              to="/health" 
              className={`nav-link ${isActive('/health') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Health
            </Link>
          )}
          <Link 
            to="/reminders" 
            className={`nav-link ${isActive('/reminders') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Reminders
          </Link>
          <Link 
            to="/profile" 
            className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Profile
          </Link>
          
          {/* Mobile-only sign out button */}
          <button onClick={handleSignOut} className="nav-logout secondary">
            Sign Out
          </button>
        </div>

        {/* Mobile controls */}
        <div className="nav-mobile-actions">
          <button 
            className={`nav-toggle ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        
        {/* Desktop sign out button */}
        <button onClick={signOut} className="nav-logout secondary" style={{ display: 'none' }}>
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
