import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import DashboardPage from './DashboardPage';
import AdminCatalogPage from './AdminCatalogPage';
import AdminReportsPage from './AdminReportsPage';
import AiChatPage from './AiChatPage';
import TicketsPage from './TicketsPage';
import ProfilePage from './ProfilePage';
import ChatbotWidget from './ChatbotWidget';
import LandingPage from './LandingPage';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setShowSplash(false), 1800);
    return () => window.clearTimeout(splashTimer);
  }, []);

  if (showSplash) {
    return (
      <main className="splash-screen" aria-label="Loading AssistDesk">
        <div className="splash-mark">
          <div className="splash-logo-wrap">
            <img src="/assistdesk-logo.svg" alt="" />
          </div>
          <span className="splash-pulse" />
        </div>
        <h1>AssistDesk</h1>
        <p>Institutional support portal</p>
        <div className="splash-progress" aria-hidden="true"><span /></div>
      </main>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/catalog"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCatalogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assistant"
            element={
              <ProtectedRoute>
                <AiChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <TicketsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<LandingPage />} />
        </Routes>
        <ChatbotWidget />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
