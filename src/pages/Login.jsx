import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      setError('Failed to sign in with Google. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box fade-in">
        <div className="login-header">
          <h1 className="mono">PERSONAL_OS</h1>
          <p className="login-subtitle">Track your life with precision</p>
        </div>
        
        <div className="login-divider"></div>
        
        {error && <div className="error">{error}</div>}
        
        <button 
          onClick={handleGoogleSignIn} 
          disabled={loading}
          className="login-button"
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        
        <p className="login-footer">
          A comprehensive system to track your time, health, and productivity
        </p>
      </div>
    </div>
  );
};

export default Login;
