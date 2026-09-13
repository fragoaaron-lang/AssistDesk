import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from './config';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setMessage('Reset token is missing. Please use the link from your email.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        token,
        newPassword: password,
      });

      setMessage(response.data.message || 'Password reset successful.');
      setTimeout(() => navigate('/'), 1600);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="landing-page" style={{ minHeight: '100vh' }}>
      <section className="landing-hero" style={{ minHeight: '100vh' }}>
        <div className="landing-overlay" />
        <div className="auth-card" style={{ position: 'relative', zIndex: 2, maxWidth: '480px', width: '100%' }}>
          <div className="auth-hero">
            <div className="brand-badge auth-logo-badge" style={{ width: '72px', height: '72px', marginBottom: '14px', background: 'rgba(255,255,255,0.18)' }}>
              <img src="/assistdesk-logo.svg" alt="AssistDesk logo" />
            </div>
            <h2>Reset Password</h2>
            <p>Choose a new password to continue using AssistDesk.</p>
          </div>

          <div className="auth-form">
            <form onSubmit={handleSubmit}>
              <div className="password-field">
                <input
                  className="institutional-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button type="button" className={`password-visibility ${showPassword ? 'visible' : ''}`} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} disabled={isLoading}>
                  <span className="password-eye" aria-hidden="true" />
                </button>
              </div>

              <input
                className="institutional-input"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={isLoading}
                style={{ marginTop: '0.8rem' }}
              />

              <button className={`institutional-btn auth-submit-btn ${isLoading ? 'is-loading' : ''}`} type="submit" style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>
                {isLoading ? <><span className="auth-spinner" aria-hidden="true" />Updating...</> : 'Update password'}
              </button>
            </form>

            {message && <p style={{ color: 'red', marginTop: '0.8rem' }}>{message}</p>}
            <p className="helper-text" style={{ marginTop: '1rem' }}>
              <button type="button" className="auth-switch-button" onClick={() => navigate('/')}>Back to login</button>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ResetPasswordPage;
