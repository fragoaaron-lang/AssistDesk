import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function EmailVerificationPage() {
  const { completeEmailVerification, resendEmailVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('waiting');
  const [message, setMessage] = useState('We sent an 8-digit verification code to your email. Enter it below to activate your account.');
  const [email, setEmail] = useState(() => location.state?.email || '');
  const [code, setCode] = useState('');
  const [resendState, setResendState] = useState('idle');
  const REDIRECT_DELAY_MS = 1200;

  const handleVerify = async (event) => {
    event.preventDefault();
    setStatus('verifying');
    setMessage('Verifying your code...');

    try {
      await completeEmailVerification(email, code);
      setStatus('success');
      setMessage('Your email has been verified. You are now signed in. Redirecting to your dashboard...');
      window.setTimeout(() => navigate('/dashboard', { replace: true }), REDIRECT_DELAY_MS);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'This verification code is invalid or expired.');
    }
  };

  const handleResend = async (event) => {
    event.preventDefault();
    setResendState('sending');
    try {
      const response = await resendEmailVerification(email);
      setResendState('sent');
      setMessage(response.message || 'A new 8-digit verification code has been sent to your email.');
    } catch (error) {
      setResendState('error');
      const timeoutMessage = error.code === 'ECONNABORTED'
        ? 'The email server took too long to respond. Check the server email settings and try again.'
        : error.response?.data?.message || 'Unable to resend the verification code.';
      setMessage(timeoutMessage);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-card verification-card">
        <div className="auth-hero">
          <div className="brand-badge" style={{ width: '72px', height: '72px', marginBottom: '14px', background: 'rgba(255,255,255,0.18)' }}>
            <img src="/assistdesk-logo.svg" alt="AssistDesk logo" />
          </div>
          <p className="auth-kicker">Email confirmation</p>
          <h2>{status === 'error' ? 'Verification failed' : status === 'success' ? 'Account verified' : 'Verify your email'}</h2>
          <p>{message}</p>
        </div>
        <div className="auth-form">
          {status !== 'success' && (
            <form onSubmit={handleVerify}>
              <input className="institutional-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required />
              <input className="institutional-input" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={8} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Enter 8-digit code" required />
              <button type="submit" className="institutional-btn" disabled={status === 'verifying' || resendState === 'sending'}>
                {status === 'verifying' ? 'Verifying...' : 'Verify account'}
              </button>
            </form>
          )}
          {status !== 'success' && (
            <form onSubmit={handleResend} style={{ marginTop: '12px' }}>
              <button type="submit" className="institutional-btn secondary" disabled={resendState === 'sending'}>
                {resendState === 'sending' ? 'Sending...' : resendState === 'sent' ? 'Code sent' : 'Resend verification code'}
              </button>
            </form>
          )}
          {status === 'error' && (
            <button type="button" className="institutional-btn" onClick={() => navigate('/')}>
              Return to sign in
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default EmailVerificationPage;
