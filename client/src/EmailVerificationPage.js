import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';

function EmailVerificationPage() {
  const { verificationToken } = useParams();
  const { completeEmailVerification } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your email address...');
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
          {status === 'error' && <button type="button" className="institutional-btn" onClick={() => navigate('/')}>Return to sign in</button>}
        </div>
      </div>
    </main>
  );
}

export default EmailVerificationPage;
