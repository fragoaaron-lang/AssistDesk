import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed.');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-hero">
          <div className="brand-badge" style={{ width: '72px', height: '72px', marginBottom: '14px', background: 'rgba(255,255,255,0.18)' }}>
            <img src="/assistdesk-logo.svg" alt="AssistDesk logo" />
          </div>
          <h2>AssistDesk</h2>
          <p>Institutional support for students, faculty, and staff through a secure helpdesk and service portal.</p>
        </div>
        <div className="auth-form">
          <h3>Welcome back</h3>
          <p className="helper-text">Sign in to manage requests, track services, and access the campus support network.</p>
          <form onSubmit={handleSubmit}>
            <input className="institutional-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input className="institutional-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <button className="institutional-btn" type="submit" style={{ width: '100%' }}>Login</button>
          </form>
          {message && <p style={{ color: 'red', marginTop: '0.8rem' }}>{message}</p>}
          <p className="helper-text"><a href="/register">Create an account</a></p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
