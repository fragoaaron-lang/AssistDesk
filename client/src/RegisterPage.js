import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function RegisterPage({ modal = false, onSwitch }) {
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [message, setMessage] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^[A-Za-z]$/.test(middleInitial)) {
      setMessage('Middle initial must be one letter.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      const name = `${firstName.trim()} ${middleInitial.toUpperCase()}. ${lastName.trim()}`;
      await register(name, email, password, role, null, studentNumber);
      navigate('/dashboard');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className={modal ? 'auth-modal-content' : 'auth-shell'}>
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
            <div className="form-row">
              <input className="institutional-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required />
              <input className="institutional-input middle-initial-input" value={middleInitial} onChange={(e) => setMiddleInitial(e.target.value.slice(0, 1))} placeholder="M.I." maxLength="1" required />
              <input className="institutional-input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required />
            </div>
            <input className="institutional-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required />
            <input className="institutional-input" type="text" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} placeholder="Student number" />
            <div className="password-field">
              <input className="institutional-input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
              <button type="button" className={`password-visibility ${showPassword ? 'visible' : ''}`} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}><span className="password-eye" aria-hidden="true" /></button>
            </div>
            <div className="password-field">
              <input className="institutional-input" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required />
              <button type="button" className={`password-visibility ${showConfirmPassword ? 'visible' : ''}`} onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}><span className="password-eye" aria-hidden="true" /></button>
            </div>
            <p className="helper-text">Use 8+ characters with uppercase, lowercase, number, and symbol.</p>
            <select className="institutional-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="staff">Staff</option>
            </select>
            <button className="institutional-btn" type="submit" style={{ width: '100%' }}>Register</button>
          </form>
          {message && <p style={{ color: 'red', marginTop: '0.8rem' }}>{message}</p>}
          <p className="helper-text">{modal ? <button type="button" className="auth-switch-button" onClick={onSwitch}>Already have an account?</button> : <a href="/login">Already have an account?</a>}</p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
