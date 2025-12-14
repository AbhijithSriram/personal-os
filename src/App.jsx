import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import DailyTracker from './pages/DailyTracker';
import HealthMetrics from './pages/HealthMetrics';
import Reminders from './pages/Reminders';
import Attendance from './pages/Attendance';
import Profile from './pages/Profile';
import Navigation from './components/Navigation';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

const OnboardingCheck = ({ children }) => {
  const { user, userProfile, loading } = useAuth();
  
  // Wait for auth to finish loading
  if (loading) {
    console.log('OnboardingCheck: Still loading auth...');
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }
  
  // Wait for user to be authenticated
  if (!user) {
    console.log('OnboardingCheck: No user, redirecting to login');
    return <Navigate to="/login" />;
  }
  
  // CRITICAL: Wait for userProfile to actually load from Firestore
  if (!userProfile) {
    console.log('OnboardingCheck: User exists but profile still loading...');
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }
  
  // Now we have userProfile, check onboarding status
  const isOnboardingComplete = userProfile.onboardingComplete === true;
  
  console.log('OnboardingCheck:', { 
    hasProfile: !!userProfile, 
    onboardingComplete: userProfile.onboardingComplete,
    isComplete: isOnboardingComplete 
  });
  
  if (!isOnboardingComplete) {
    console.log('OnboardingCheck: Onboarding not complete, redirecting...');
    return <Navigate to="/onboarding" />;
  }
  
  console.log('OnboardingCheck: All good, rendering children');
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Router>
      {user && <Navigation />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/onboarding"
          element={
            <PrivateRoute>
              <Onboarding />
            </PrivateRoute>
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <OnboardingCheck>
                <Dashboard />
              </OnboardingCheck>
            </PrivateRoute>
          }
        />
        <Route
          path="/tracker"
          element={
            <PrivateRoute>
              <OnboardingCheck>
                <DailyTracker />
              </OnboardingCheck>
            </PrivateRoute>
          }
        />
        <Route
          path="/health"
          element={
            <PrivateRoute>
              <OnboardingCheck>
                <HealthMetrics />
              </OnboardingCheck>
            </PrivateRoute>
          }
        />
        <Route
          path="/reminders"
          element={
            <PrivateRoute>
              <OnboardingCheck>
                <Reminders />
              </OnboardingCheck>
            </PrivateRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <PrivateRoute>
              <OnboardingCheck>
                <Attendance />
              </OnboardingCheck>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <OnboardingCheck>
                <Profile />
              </OnboardingCheck>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
