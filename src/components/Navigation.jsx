import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const { signOut, userProfile } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="mono">PERSONAL_OS</span>
        </Link>
        
        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/tracker" 
            className={`nav-link ${isActive('/tracker') ? 'active' : ''}`}
          >
            Daily Tracker
          </Link>
          <Link 
            to="/attendance" 
            className={`nav-link ${isActive('/attendance') ? 'active' : ''}`}
          >
            Attendance
          </Link>
          {userProfile?.enableHealthMetrics && (
            <Link 
              to="/health" 
              className={`nav-link ${isActive('/health') ? 'active' : ''}`}
            >
              Health
            </Link>
          )}
          <Link 
            to="/reminders" 
            className={`nav-link ${isActive('/reminders') ? 'active' : ''}`}
          >
            Reminders
          </Link>
          <Link 
            to="/profile" 
            className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
          >
            Profile
          </Link>
        </div>

        <button onClick={signOut} className="nav-logout secondary">
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
