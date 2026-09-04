import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from './config';

const fallbackDepartments = [
  { id: 1, name: 'Basic Education Department' },
  { id: 2, name: 'College of Nursing' },
  { id: 3, name: 'CS', display_name: 'Computer Science Department' },
  { id: 4, name: 'CBA', display_name: 'College of Business Administration' },
  { id: 5, name: 'CHARM', display_name: 'College of Hospitality and Restaurant Management' },
  { id: 6, name: 'College of Criminology' },
  { id: 7, name: 'College of Physical Therapy' },
  { id: 8, name: 'Maintenance Department' },
  { id: 9, name: 'Accounting Department' },
  { id: 10, name: 'Library' },
  { id: 11, name: 'Guidance', display_name: 'Guidance Office' },
  { id: 12, name: 'Office of Student Affairs' },
  { id: 13, name: 'IT Department', display_name: 'Information Technology Department' },
];

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
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [message, setMessage] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/catalog/departments`)
      .then((response) => setDepartments(response.data.departments?.length ? response.data.departments : fallbackDepartments))
      .catch(() => setDepartments(fallbackDepartments));
  }, []);

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
      await register(name, email, password, role, role === 'student' ? departmentId : null, studentNumber);
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
            {role === 'student' && (
              <>
                <input className="institutional-input" type="text" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} placeholder="Student number" />
                <select className="institutional-select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required>
                  <option value="">Select your department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>{department.display_name || department.name}</option>
                  ))}
                </select>
              </>
            )}
            <div className="password-field">
              <input className="institutional-input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
              <button type="button" className={`password-visibility ${showPassword ? 'visible' : ''}`} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}><span className="password-eye" aria-hidden="true" /></button>
            </div>
            <div className="password-field">
              <input className="institutional-input" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required />
              <button type="button" className={`password-visibility ${showConfirmPassword ? 'visible' : ''}`} onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}><span className="password-eye" aria-hidden="true" /></button>
            </div>
            <p className="helper-text">Use 8+ characters with uppercase, lowercase, number, and symbol.</p>
            <select className="institutional-select" value={role} onChange={(e) => { setRole(e.target.value); if (e.target.value !== 'student') setDepartmentId(''); }}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="staff">Staff</option>
            </select>
            <button className="institutional-btn" type="submit" style={{ width: '100%' }}>Register</button>
          </form>
          {message && <p style={{ color: 'red', marginTop: '0.8rem' }}>{message}</p>}
          <p className="helper-text">{modal ? <button type="button" className="auth-switch-button" onClick={onSwitch}>Already have an account?</button> : <a href="/">Already have an account?</a>}</p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
