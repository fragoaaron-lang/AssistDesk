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
  const identityIncomplete = user.account_status === 'pending_verification' || !user.facial_id;
  if (!allowIncompleteVerification && requiresIdentityVerification && identityIncomplete) {
    if (user.verification_token) {
      return <Navigate to={`/verify-registration/${user.verification_token}`} replace state={{ from: location.pathname }} />;
    }

    return <Navigate to="/profile?setup=identity" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
