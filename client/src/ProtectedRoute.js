import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], allowIncompleteVerification = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  const requiresIdentityVerification = ['student', 'faculty', 'staff'].includes(user.role);
  if (!allowIncompleteVerification && requiresIdentityVerification && !user.facial_id) {
    return <Navigate to="/profile?setup=identity" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
