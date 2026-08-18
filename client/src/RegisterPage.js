import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [departmentId, setDepartmentId] = useState('');
  const [message, setMessage] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      await register(name, email, password, role, role === 'admin' ? departmentId : null);
      navigate('/dashboard');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-hero">
          <div className="brand-badge" style={{ width: '72px', height: '72px', marginBottom: '14px', background: 'rgba(255,255,255,0.18)' }}>
            <img src="/assistdesk-logo.svg" alt="AssistDesk logo" />
          </div>
          <h2>Create your account</h2>
          <p>Join the institutional support network and request services through one secure channel.</p>
        </div>
        <div className="auth-form">
          <h3>Register</h3>
          <form onSubmit={handleSubmit}>
            <input className="institutional-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            <input className="institutional-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input className="institutional-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <input className="institutional-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
            <p className="helper-text">Use 8+ characters with uppercase, lowercase, number, and symbol.</p>
            <select className="institutional-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            {role === 'admin' && (
              <input
                className="institutional-input"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                placeholder="Department ID"
              />
            )}
            <button className="institutional-btn" type="submit" style={{ width: '100%' }}>Register</button>
          </form>
          {message && <p style={{ color: 'red', marginTop: '0.8rem' }}>{message}</p>}
          <p className="helper-text"><a href="/login">Already have an account?</a></p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
