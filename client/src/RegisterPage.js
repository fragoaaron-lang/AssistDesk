import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from './config';

const fallbackDepartments = [
  { id: 1, name: 'Basic Education Department' },
  { id: 2, name: 'College of Nursing' },
  { id: 3, name: 'CS', display_name: 'College of Computer Studies' },
  { id: 4, name: 'CBA', display_name: 'College of Business and Accountancy' },
  { id: 5, name: 'CHARM', display_name: 'College of Hospitality Management' },
  { id: 6, name: 'College of Criminology' },
  { id: 7, name: 'College of Physical Therapy' },
  { id: 8, name: 'Maintenance Department' },
  { id: 9, name: 'Accounting Department' },
  { id: 15, name: 'Registrar Department' },
  { id: 10, name: 'Library' },
  { id: 11, name: 'Guidance', display_name: 'Guidance Office' },
  { id: 12, name: 'Office of Student Affairs' },
  { id: 13, name: 'IT Department', display_name: 'Information Technology Department' },
  { id: 14, name: 'Education Department', display_name: 'College of Education' },
];

const facultyDepartmentNames = [
  'basic education department',
  'college of nursing',
  'cs',
  'cba',
  'charm',
  'college of criminology',
  'college of physical therapy',
  'education department',
];

const staffDepartmentNames = [
  'maintenance department',
  'accounting department',
  'registrar department',
  'library',
  'guidance',
  'office of student affairs',
  'clinic',
  'it department',
];

const getDepartmentDisplayName = (department) => {
  const normalizedName = String(department?.name || '').toLowerCase();
  if (['cs', 'computer science department', 'college of computer studies'].includes(normalizedName)) {
    return 'College of Computer Studies';
  }
  if (['charm', 'college of hospitality and restaurant management', 'college of hospitality management'].includes(normalizedName)) {
    return 'College of Hospitality Management';
  }
  if (['cba', 'college of business administration', 'college of business and accountancy'].includes(normalizedName)) {
    return 'College of Business and Accountancy';
  }
  if (['education department', 'college of education'].includes(normalizedName)) {
    return 'College of Education';
  }
  return department?.display_name || department?.name;
};

const getDepartmentsForRole = (allDepartments, selectedRole) => {
  if (selectedRole === 'faculty') {
    return allDepartments.filter((department) => facultyDepartmentNames.includes(String(department.name || '').toLowerCase()));
  }
  if (selectedRole === 'staff') {
    return allDepartments.filter((department) => staffDepartmentNames.includes(String(department.name || '').toLowerCase()));
  }
  return allDepartments;
};

const getRegistrationErrors = ({ firstName, middleInitial, lastName, email, studentNumber, departmentId, password, confirmPassword, role }) => {
  const errors = {};
  if (!firstName.trim()) errors.firstName = 'Enter your first name.';
  if (!/^[A-Za-z]$/.test(middleInitial)) errors.middleInitial = 'Enter one letter for your middle initial.';
  if (!lastName.trim()) errors.lastName = 'Enter your last name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errors.email = 'Enter a valid email address.';

  if (role === 'student') {
    const studentNumberMatch = studentNumber.trim().match(/^(\d{4})-\d{5}$/);
    if (!studentNumberMatch) {
      errors.studentNumber = 'Use the format YYYY-XXXXX.';
    } else if (Number(studentNumberMatch[1]) > new Date().getFullYear()) {
      errors.studentNumber = 'The academic year cannot be in the future.';
    }
  }

  if (!departmentId) errors.departmentId = 'Select your department.';
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,128}$/.test(password) || new TextEncoder().encode(password).length > 72) {
    errors.password = 'Use 12–72 characters with uppercase, lowercase, a number, and a symbol.';
  }
  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
};

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
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();
  const availableDepartments = getDepartmentsForRole(departments, role);
  const formValues = { firstName, middleInitial, lastName, email, studentNumber, departmentId, password, confirmPassword, role };
  const validationErrors = getRegistrationErrors(formValues);
  const fieldErrors = { ...validationErrors, ...serverFieldErrors };

  const updateField = (field, value, setter) => {
    setter(value);
    setTouched((current) => ({ ...current, [field]: true }));
    setServerFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setMessage('');
  };

  const fieldError = (field) => ((touched[field] || submitted || serverFieldErrors[field]) ? fieldErrors[field] : '');

  const getFieldProps = (field) => {
    const error = fieldError(field);
    return {
      id: `registration-${field}`,
      'aria-invalid': Boolean(error),
      'aria-describedby': error ? `registration-${field}-error` : undefined,
      onBlur: () => setTouched((current) => ({ ...current, [field]: true })),
    };
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/catalog/departments`)
      .then((response) => {
        const options = response.data.departments?.length ? response.data.departments : fallbackDepartments;
        setDepartments([...options].sort((first, second) => (
          getDepartmentDisplayName(first).localeCompare(getDepartmentDisplayName(second))
        )));
      })
      .catch(() => setDepartments([...fallbackDepartments].sort((first, second) => (
        getDepartmentDisplayName(first).localeCompare(getDepartmentDisplayName(second))
      ))));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const errors = getRegistrationErrors(formValues);
    const firstInvalidField = Object.keys(errors)[0];
    if (firstInvalidField) {
      document.getElementById(`registration-${firstInvalidField}`)?.focus();
      return;
    }

    try {
      const name = `${firstName.trim()} ${middleInitial.toUpperCase()}. ${lastName.trim()}`;
      await register(name, email, password, role, departmentId, studentNumber);
      navigate('/verify-email');
    } catch (error) {
      const timeoutMessage = error.code === 'ECONNABORTED'
        ? 'Registration email delivery timed out. Please try again or contact support.'
        : error.response?.data?.message || 'Registration failed.';
      const normalizedMessage = timeoutMessage.toLowerCase();
      const field = normalizedMessage.includes('email') ? 'email'
        : normalizedMessage.includes('password') ? 'password'
          : normalizedMessage.includes('student number') ? 'studentNumber'
            : normalizedMessage.includes('department') ? 'departmentId' : null;
      if (field) {
        setServerFieldErrors({ [field]: timeoutMessage });
        document.getElementById(`registration-${field}`)?.focus();
      } else {
        setMessage(timeoutMessage);
      }
    }
  };

  return (
    <div className={modal ? 'auth-modal-content' : 'auth-shell'}>
      <div className="auth-card">
        <div className="auth-hero">
          <div className="brand-badge auth-logo-badge">
            <img src="/assistdesk-logo.svg" alt="AssistDesk logo" />
          </div>
          <h2>Create your account</h2>
          <p>Join the institutional support network and request services through one secure channel.</p>
        </div>
        <div className="auth-form">
          <h3>Register</h3>
          <form className="registration-form" onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="registration-field">
                <label className="auth-field-label" htmlFor="registration-firstName">First name</label>
                <input className="institutional-input" {...getFieldProps('firstName')} aria-label="First name" value={firstName} onChange={(e) => updateField('firstName', e.target.value, setFirstName)} placeholder="First name" autoComplete="given-name" required />
                {fieldError('firstName') && <span className="registration-field-error" id="registration-firstName-error">{fieldError('firstName')}</span>}
              </div>
              <div className="registration-field">
                <label className="auth-field-label" htmlFor="registration-middleInitial">Middle initial</label>
                <input className="institutional-input middle-initial-input" {...getFieldProps('middleInitial')} aria-label="Middle initial" value={middleInitial} onChange={(e) => updateField('middleInitial', e.target.value.slice(0, 1), setMiddleInitial)} placeholder="M.I." maxLength="1" autoComplete="additional-name" required />
                {fieldError('middleInitial') && <span className="registration-field-error" id="registration-middleInitial-error">{fieldError('middleInitial')}</span>}
              </div>
              <div className="registration-field">
                <label className="auth-field-label" htmlFor="registration-lastName">Last name</label>
                <input className="institutional-input" {...getFieldProps('lastName')} aria-label="Last name" value={lastName} onChange={(e) => updateField('lastName', e.target.value, setLastName)} placeholder="Last name" autoComplete="family-name" required />
                {fieldError('lastName') && <span className="registration-field-error" id="registration-lastName-error">{fieldError('lastName')}</span>}
              </div>
            </div>
            <div className="registration-field registration-email-field">
              <label className="auth-field-label" htmlFor="registration-email">Email address</label>
              <input className="institutional-input" type="email" {...getFieldProps('email')} aria-label="Email address" value={email} onChange={(e) => updateField('email', e.target.value, setEmail)} placeholder="Email address" autoComplete="email" required />
              {fieldError('email') && <span className="registration-field-error" id="registration-email-error">{fieldError('email')}</span>}
            </div>
            {role !== 'admin' && (
              <>
                {role === 'student' && (
                  <div className="registration-field registration-student-field">
                    <label className="auth-field-label" htmlFor="registration-studentNumber">Student number</label>
                    <input className="institutional-input" type="text" {...getFieldProps('studentNumber')} aria-label="Student number" value={studentNumber} onChange={(e) => updateField('studentNumber', e.target.value, setStudentNumber)} placeholder="Student number (YYYY-XXXXX)" pattern="[0-9]{4}-[0-9]{5}" maxLength="10" autoComplete="off" required />
                    {fieldError('studentNumber') && <span className="registration-field-error" id="registration-studentNumber-error">{fieldError('studentNumber')}</span>}
                  </div>
                )}
                <div className={`registration-field registration-department-field ${role === 'student' ? '' : 'registration-wide-field'}`}>
                  <label className="auth-field-label" htmlFor="registration-departmentId">Department</label>
                  <select className="institutional-select" {...getFieldProps('departmentId')} aria-label="Department" value={departmentId} onChange={(e) => updateField('departmentId', e.target.value, setDepartmentId)} required>
                    <option value="">Select a department</option>
                    {availableDepartments.map((department) => (
                      <option key={department.id} value={department.id}>{getDepartmentDisplayName(department)}</option>
                    ))}
                  </select>
                  {fieldError('departmentId') && <span className="registration-field-error" id="registration-departmentId-error">{fieldError('departmentId')}</span>}
                </div>
              </>
            )}
            <div className="registration-field password-field">
              <label className="auth-field-label" htmlFor="registration-password">Password</label>
              <input className="institutional-input" type={showPassword ? 'text' : 'password'} {...getFieldProps('password')} aria-label="Password" value={password} onChange={(e) => updateField('password', e.target.value, setPassword)} placeholder="Password" autoComplete="new-password" required />
              <button type="button" className={`password-visibility ${showPassword ? 'visible' : ''}`} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}><span className="password-eye" aria-hidden="true" /></button>
              {fieldError('password') && <span className="registration-field-error" id="registration-password-error">{fieldError('password')}</span>}
            </div>
            <div className="registration-field password-field">
              <label className="auth-field-label" htmlFor="registration-confirmPassword">Confirm password</label>
              <input className="institutional-input" type={showConfirmPassword ? 'text' : 'password'} {...getFieldProps('confirmPassword')} aria-label="Confirm password" value={confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value, setConfirmPassword)} placeholder="Confirm password" autoComplete="new-password" required />
              <button type="button" className={`password-visibility ${showConfirmPassword ? 'visible' : ''}`} onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}><span className="password-eye" aria-hidden="true" /></button>
              {fieldError('confirmPassword') && <span className="registration-field-error" id="registration-confirmPassword-error">{fieldError('confirmPassword')}</span>}
            </div>
            <p className="helper-text registration-password-hint">Use 12–72 characters with uppercase, lowercase, a number, and a symbol.</p>
            <fieldset className="registration-role-picker">
              <legend>Account type</legend>
              <div className="registration-role-options">
                {['student', 'faculty', 'staff'].map((accountType) => (
                  <label className={`registration-role-option ${role === accountType ? 'is-selected' : ''}`} key={accountType}>
                    <input type="radio" name="registration-role" value={accountType} checked={role === accountType} onChange={() => { setRole(accountType); setDepartmentId(''); setServerFieldErrors({}); }} />
                    <span>{accountType[0].toUpperCase() + accountType.slice(1)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button className="institutional-btn auth-submit-btn" type="submit">Register</button>
          </form>
          {message && <p className="registration-form-error" role="alert">{message}</p>}
          <p className="helper-text auth-footer-switch">{modal ? <button type="button" className="auth-switch-button" onClick={onSwitch}>Already have an account?</button> : <a href="/">Already have an account?</a>}</p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
