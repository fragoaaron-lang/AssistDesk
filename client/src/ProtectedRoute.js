import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="route-loading" role="status" aria-live="polite" aria-busy="true">
        <span className="route-loading-indicator" aria-hidden="true" />
        <span>Restoring your secure session…</span>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const accountNoticeStatuses = ['terminated', 'pending_id', 'pending_approval', 'id_rejected'];
  if (accountNoticeStatuses.includes(user.account_status) && location.pathname !== '/dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (user.account_status === 'pending_verification') {
    return <Navigate to="/verify-email" replace state={{ from: location.pathname, email: user.email }} />;
  }

  return children;
};

export default ProtectedRoute;
