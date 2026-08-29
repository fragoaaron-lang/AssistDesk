import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function LoginPage({ modal = false, onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setWelcomeName(firstName);
      navigate('/dashboard');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed.');
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
          <div className="login-status-badge">{isLoading ? 'Signing in…' : 'Welcome back'}</div>
          <p className="helper-text">{isLoading ? 'Preparing your dashboard and campus services for your account…' : 'Sign in to manage requests, track services, and access the campus support network.'}</p>
          <form onSubmit={handleSubmit}>
            <input className="institutional-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" disabled={isLoading} />
            <input className="institutional-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" disabled={isLoading} />
            <button className={`institutional-btn auth-submit-btn ${isLoading ? 'is-loading' : ''}`} type="submit" style={{ width: '100%' }} disabled={isLoading}>
              {isLoading ? <><span className="auth-spinner" aria-hidden="true" />Signing in...</> : 'Login'}
            </button>
          </form>
          {message && <p style={{ color: 'red', marginTop: '0.8rem' }}>{message}</p>}
          <p className="helper-text">{modal ? <button type="button" className="auth-switch-button" onClick={onSwitch}>Create an account</button> : <a href="/register">Create an account</a>}</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
