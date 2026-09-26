import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';

function LoginPage({ modal = false, onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [welcomeName, setWelcomeName] = useState(() => localStorage.getItem('assistdesk_last_user_name') || '');
  const { login } = useAuth();
  const navigate = useNavigate();
  const shouldShowWelcome = isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    setMessage('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      const userName = result?.user?.name || email.split('@')[0];
      const firstName = userName.split(' ')[0];
      if (result?.user?.account_status === 'terminated') {
        navigate('/dashboard');
        return;
      }
      setWelcomeName(firstName);
      sessionStorage.setItem('assistdesk_show_welcome_splash', 'true');
      sessionStorage.setItem('assistdesk_welcome_name', firstName);
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.message === 'Please verify your email address before signing in.') {
        navigate('/verify-email', { state: { email: email.trim() } });
        return;
      }
      setMessage(error.response?.data?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotEmail.trim()) {
      setMessage('Please enter your email address.');
      return;
    }

    setMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
        email: forgotEmail.trim(),
      });

      setMessage(response.data.message || 'Password reset instructions sent.');
      setForgotEmail('');
      setShowForgotPassword(false);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={modal ? 'auth-modal-content' : 'auth-shell'}>
      <div className="auth-card">
        <div className="auth-hero">
          <div className={`brand-badge auth-logo-badge ${isLoading ? 'is-animating' : ''}`} style={{ width: '72px', height: '72px', marginBottom: '14px', background: 'rgba(255,255,255,0.18)' }}>
            <img src="/assistdesk-logo.svg" alt="AssistDesk logo" />
          </div>
          <h2>AssistDesk</h2>
          <p>{isLoading ? 'Preparing your personalized support workspace…' : 'Institutional support for students, faculty, and staff through a secure helpdesk and service portal.'}</p>
        </div>
        <div className="auth-form">
          <div className="login-status-badge">Welcome back</div>
          <p className="helper-text">{isLoading ? 'Preparing your dashboard and campus services for your account…' : 'Sign in to manage requests, track services, and access the campus support network.'}</p>
          {!showForgotPassword ? (
            <form onSubmit={handleSubmit}>
              <input className="institutional-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" disabled={isLoading} />
              <div className="password-field">
                <input className="institutional-input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" disabled={isLoading} />
                <button type="button" className={`password-visibility ${showPassword ? 'visible' : ''}`} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} disabled={isLoading}><span className="password-eye" aria-hidden="true" /></button>
              </div>
              <button className={`institutional-btn auth-submit-btn ${isLoading ? 'is-loading' : ''}`} type="submit" style={{ width: '100%' }} disabled={isLoading}>
                {isLoading ? <><span className="auth-spinner" aria-hidden="true" />Signing in...</> : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <input className="institutional-input" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="Enter your email" autoComplete="email" disabled={isLoading} />
              <button className={`institutional-btn auth-submit-btn ${isLoading ? 'is-loading' : ''}`} type="submit" style={{ width: '100%' }} disabled={isLoading}>
                {isLoading ? <><span className="auth-spinner" aria-hidden="true" />Sending...</> : 'Send reset link'}
              </button>
              <button type="button" className="auth-switch-button" style={{ marginTop: '0.8rem' }} onClick={() => setShowForgotPassword(false)} disabled={isLoading}>Back to login</button>
            </form>
          )}
          {message && <p style={{ color: 'red', marginTop: '0.8rem' }}>{message}</p>}
          {!showForgotPassword && (
            <p className="helper-text">
              <button type="button" className="auth-switch-button" onClick={() => setShowForgotPassword(true)} disabled={isLoading}>Forgot password?</button>
            </p>
          )}
          <p className="helper-text">{modal ? <button type="button" className="auth-switch-button" onClick={onSwitch}>Create an account</button> : <button type="button" className="auth-switch-button" onClick={() => window.location.href = '/'}>Create an account</button>}</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
