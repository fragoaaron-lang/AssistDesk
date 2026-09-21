import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';

function EmailVerificationPage() {
  const { verificationToken } = useParams();
  const { completeEmailVerification, resendEmailVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your email address...');
  const [email, setEmail] = useState(() => location.state?.email || '');
  const [resendState, setResendState] = useState('idle');
  const startedRef = useRef(false);

  useEffect(() => {
    if (!verificationToken) {
      setStatus('waiting');
      setMessage('Registration saved. Check your email and click the verification link to activate your account.');
      return undefined;
    }

    if (startedRef.current) return undefined;
    startedRef.current = true;
    let active = true;

    completeEmailVerification(verificationToken)
      .then(() => {
        if (!active) return;
        setStatus('success');
        setMessage('Your email has been verified. Your AssistDesk account is active.');
        window.setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
      })
      .catch((error) => {
        if (!active) return;
        setStatus('error');
        setMessage(error.response?.data?.message || 'This email verification link is invalid or expired.');
      });

    return () => { active = false; };
  }, [completeEmailVerification, navigate, verificationToken]);

  const handleResend = async (event) => {
    event.preventDefault();
    setResendState('sending');
    try {
      const response = await resendEmailVerification(email);
      setResendState('sent');
      setMessage(response.message || 'Check your email for a new verification link.');
    } catch (error) {
      setResendState('error');
      const timeoutMessage = error.code === 'ECONNABORTED'
        ? 'The email server took too long to respond. Check the server email settings and try again.'
        : error.response?.data?.message || 'Unable to resend the verification email.';
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
          <h2>{status === 'waiting' ? 'Check your email' : status === 'verifying' ? 'Verifying your email' : status === 'success' ? 'Email verified' : 'Verification failed'}</h2>
          <p>{message}</p>
        </div>
        <div className="auth-form">
          {status === 'waiting' && (
            <form onSubmit={handleResend}>
              <input className="institutional-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required />
              <button type="submit" className="institutional-btn" disabled={resendState === 'sending'}>
                {resendState === 'sending' ? 'Sending...' : resendState === 'sent' ? 'Email sent' : 'Resend verification email'}
              </button>
            </form>
          )}
          {status === 'error' && <button type="button" className="institutional-btn" onClick={() => navigate('/')}>Return to sign in</button>}
        </div>
      </div>
    </main>
  );
}

export default EmailVerificationPage;
