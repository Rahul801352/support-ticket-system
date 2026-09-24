import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If customer tries to access agent page, redirect to customer dashboard
    if (user?.role === 'customer') {
      return <Navigate to="/customer/dashboard" replace />;
    }
    // If agent tries to access customer create page, redirect to agent dashboard
    return <Navigate to="/agent/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
