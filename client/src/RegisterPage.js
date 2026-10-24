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
  'college of computer studies',
  'college of business and accountancy',
  'college of hospitality management',
  'college of criminology',
  'college of physical therapy',
  'college of education',
];

const normalizeDepartmentLabel = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const canonicalDepartmentLabels = {
  'basic education': 'Basic Education Department',
  'basic education department': 'Basic Education Department',
  'education department': 'College of Education',
  'college of education': 'College of Education',
  'college of nursing': 'College of Nursing',
  'nursing department': 'College of Nursing',
  cs: 'College of Computer Studies',
  'cs department': 'College of Computer Studies',
  'computer science department': 'College of Computer Studies',
  'college of computer studies': 'College of Computer Studies',
  cba: 'College of Business and Accountancy',
  'college of business administration': 'College of Business and Accountancy',
  'college of business and accountancy': 'College of Business and Accountancy',
  charm: 'College of Hospitality Management',
  'college of hospitality and restaurant management': 'College of Hospitality Management',
  'college of hospitality management': 'College of Hospitality Management',
  'college of criminology': 'College of Criminology',
  'criminology department': 'College of Criminology',
  'college of physical therapy': 'College of Physical Therapy',
  'physical therapy department': 'College of Physical Therapy',
  'maintenance department': 'Maintenance Department',
  maintenance: 'Maintenance Department',
  'accounting department': 'Accounting Department',
  accounting: 'Accounting Department',
  'registrar department': 'Registrar Office',
  'registrar office': 'Registrar Office',
  library: 'Library',
  'library department': 'Library',
  guidance: 'Guidance Office',
  'guidance office': 'Guidance Office',
  'office of student affairs': 'Office of Student Affairs',
  'office of the student affairs': 'Office of Student Affairs',
  'student affairs': 'Office of Student Affairs',
  'it department': 'Information Technology Department',
  'information technology department': 'Information Technology Department',
  'clinic department': 'Clinic',
};

const getCanonicalDepartmentName = (department) => {
  const normalizedName = normalizeDepartmentLabel(department?.name);
  const normalizedDisplayName = normalizeDepartmentLabel(department?.display_name);
  return canonicalDepartmentLabels[normalizedName]
    || canonicalDepartmentLabels[normalizedDisplayName]
    || department?.display_name
    || department?.name
    || '';
};

const deduplicateDepartments = (records) => {
  const unique = new Map();
  records.forEach((department) => {
    const displayName = getCanonicalDepartmentName(department);
    const key = normalizeDepartmentLabel(displayName);
    if (!key) return;

    const candidate = { ...department, display_name: displayName };
    const existing = unique.get(key);
    if (!existing || Number(candidate.id) < Number(existing.id)) unique.set(key, candidate);
  });
  return [...unique.values()].sort((first, second) => first.display_name.localeCompare(second.display_name));
};

const getDepartmentDisplayName = (department) => {
  return getCanonicalDepartmentName(department);
};

const getDepartmentsForRole = (allDepartments, selectedRole) => {
  if (selectedRole === 'faculty') {
    return allDepartments.filter((department) => facultyDepartmentNames.includes(normalizeDepartmentLabel(getDepartmentDisplayName(department))));
  }
  return allDepartments;
};

const formatStudentNumber = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 9);
  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
};

const getPasswordRules = (password) => [
  { label: 'One lowercase character', met: /[a-z]/.test(password) },
  { label: 'One uppercase character', met: /[A-Z]/.test(password) },
  { label: 'One number', met: /\d/.test(password) },
  { label: 'One special character', met: /[^A-Za-z\d]/.test(password) },
  { label: '8 characters minimum', met: password.length >= 8 },
  { label: '72 UTF-8 bytes maximum', met: new TextEncoder().encode(password).length <= 72 },
];

const isPasswordValid = (password, rules) => rules.every((rule) => rule.met)
  && new TextEncoder().encode(password).length <= 72;

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

  if (role !== 'staff' && !departmentId) errors.departmentId = 'Select your department.';
  if (getPasswordRules(password).some((rule) => !rule.met)
    || new TextEncoder().encode(password).length > 72) {
    errors.password = 'Use at least 8 characters with uppercase, lowercase, a number, and a special character; maximum 72 UTF-8 bytes.';
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
  const [passwordFieldActivated, setPasswordFieldActivated] = useState(false);
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
  const passwordRules = getPasswordRules(password);
  const passwordIsValid = isPasswordValid(password, passwordRules);
  const metPasswordRules = passwordRules.length - passwordRules.filter((rule) => !rule.met).length;
  const unmetPasswordRules = passwordRules.filter((rule) => !rule.met).length;
  const showPasswordValidity = passwordFieldActivated;

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
        setDepartments(deduplicateDepartments(options));
      })
      .catch(() => setDepartments(deduplicateDepartments(fallbackDepartments)));
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
      const verificationEmail = email.trim().toLowerCase();
      sessionStorage.setItem('assistdesk_pending_verification_email', verificationEmail);
      navigate('/verify-email', { state: { email: verificationEmail } });
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
            <div className="form-row">
              <div className="registration-field">
                <label className="auth-field-label" htmlFor="registration-firstName">First name</label>
                <input className="institutional-input" {...getFieldProps('firstName')} aria-label="First name" value={firstName} onChange={(e) => updateField('firstName', e.target.value, setFirstName)} placeholder="e.g. Jordan" autoComplete="given-name" required />
                {fieldError('firstName') && <span className="registration-field-error" id="registration-firstName-error">{fieldError('firstName')}</span>}
              </div>
              <div className="registration-field">
                <label className="auth-field-label" htmlFor="registration-middleInitial">Middle initial</label>
                <input className="institutional-input middle-initial-input" {...getFieldProps('middleInitial')} aria-label="Middle initial" value={middleInitial} onChange={(e) => updateField('middleInitial', e.target.value.slice(0, 1), setMiddleInitial)} placeholder="A" maxLength="1" autoComplete="additional-name" required />
                {fieldError('middleInitial') && <span className="registration-field-error" id="registration-middleInitial-error">{fieldError('middleInitial')}</span>}
              </div>
              <div className="registration-field">
                <label className="auth-field-label" htmlFor="registration-lastName">Last name</label>
                <input className="institutional-input" {...getFieldProps('lastName')} aria-label="Last name" value={lastName} onChange={(e) => updateField('lastName', e.target.value, setLastName)} placeholder="e.g. Reyes" autoComplete="family-name" required />
                {fieldError('lastName') && <span className="registration-field-error" id="registration-lastName-error">{fieldError('lastName')}</span>}
              </div>
            </div>
            <div className="registration-field registration-email-field">
              <label className="auth-field-label" htmlFor="registration-email">Email address</label>
              <input className="institutional-input" type="email" inputMode="email" {...getFieldProps('email')} aria-label="Email address" value={email} onChange={(e) => updateField('email', e.target.value, setEmail)} placeholder="youremail@gmail.com" autoComplete="email" required />
              {fieldError('email') && <span className="registration-field-error" id="registration-email-error">{fieldError('email')}</span>}
            </div>
            {role !== 'admin' && (
              <>
                {role === 'student' && (
                  <div className="registration-field registration-student-field">
                    <label className="auth-field-label" htmlFor="registration-studentNumber">Student number</label>
                    <input className="institutional-input" type="text" inputMode="numeric" {...getFieldProps('studentNumber')} aria-label="Student number" aria-describedby={fieldError('studentNumber') ? 'registration-studentNumber-error' : 'registration-studentNumber-hint'} value={studentNumber} onChange={(e) => updateField('studentNumber', formatStudentNumber(e.target.value), setStudentNumber)} placeholder="YYYY-XXXXX" pattern="[0-9]{4}-[0-9]{5}" maxLength="10" autoComplete="off" required />
                    <small className="registration-field-hint" id="registration-studentNumber-hint">Enter the 4-digit year followed by your 5-digit number.</small>
                    {fieldError('studentNumber') && <span className="registration-field-error" id="registration-studentNumber-error">{fieldError('studentNumber')}</span>}
                  </div>
                )}
                {role !== 'staff' && (
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
                )}
              </>
            )}
            <div className="registration-field password-field">
              <label className="auth-field-label" htmlFor="registration-password">Password</label>
              <input className={`institutional-input password-policy-input ${showPasswordValidity ? (passwordIsValid ? 'is-valid' : 'is-invalid') : ''}`} type={showPassword ? 'text' : 'password'} {...getFieldProps('password')} onFocus={() => setPasswordFieldActivated(true)} aria-invalid={showPasswordValidity && !passwordIsValid} aria-describedby={passwordFieldActivated ? (fieldError('password') ? 'registration-password-rules registration-password-error' : 'registration-password-rules') : undefined} aria-label="Password" value={password} onChange={(e) => updateField('password', e.target.value, setPassword)} autoComplete="new-password" required />
              <button type="button" className={`password-visibility ${showPassword ? 'visible' : ''}`} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}><span className="password-eye" aria-hidden="true" /></button>
              {fieldError('password') && <span className="registration-field-error" id="registration-password-error">{fieldError('password')}</span>}
              {passwordFieldActivated && (
                <div className={`registration-password-progress ${passwordIsValid ? 'is-complete' : ''}`} id="registration-password-rules">
                  <div className="registration-password-progress-heading">
                    <span>Password requirements</span>
                    <span>{metPasswordRules} of {passwordRules.length}</span>
                  </div>
                  <div
                    className="registration-password-progress-track"
                    role="progressbar"
                    aria-label="Password requirements met"
                    aria-valuemin={0}
                    aria-valuemax={passwordRules.length}
                    aria-valuenow={metPasswordRules}
                    aria-valuetext={`${metPasswordRules} of ${passwordRules.length} requirements met`}
                  >
                    <span className="registration-password-progress-fill" style={{ width: `${(metPasswordRules / passwordRules.length) * 100}%` }} />
                  </div>
                  <p className="registration-password-progress-status" aria-live="polite" aria-atomic="true">
                    {passwordIsValid
                      ? 'All requirements met.'
                      : `Still needed: ${passwordRules.filter((rule) => !rule.met).map((rule) => rule.label).join(', ')}.`}
                  </p>
                  <span className="visually-hidden" aria-live="polite" aria-atomic="true">
                    {passwordIsValid ? 'All password requirements met.' : `${unmetPasswordRules} password requirements remaining.`}
                  </span>
                </div>
              )}
            </div>
            <div className="registration-field password-field">
              <label className="auth-field-label" htmlFor="registration-confirmPassword">Confirm password</label>
              <input className="institutional-input" type={showConfirmPassword ? 'text' : 'password'} {...getFieldProps('confirmPassword')} aria-label="Confirm password" value={confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value, setConfirmPassword)} autoComplete="new-password" required />
              <button type="button" className={`password-visibility ${showConfirmPassword ? 'visible' : ''}`} onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}><span className="password-eye" aria-hidden="true" /></button>
              {fieldError('confirmPassword') && <span className="registration-field-error" id="registration-confirmPassword-error">{fieldError('confirmPassword')}</span>}
            </div>
            {['faculty', 'staff'].includes(role) && (
              <p className="helper-text registration-approval-hint">
                After verifying your email, submit a photo of your faculty/staff ID. You can sign in while an administrator reviews it, but other account features stay locked until confirmation.
              </p>
            )}
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
