import React, { useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAuth } from './AuthContext';

function EmailVerificationPage() {
  const { completeEmailVerification, resendEmailVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pageRef = useRef(null);
  const redirectTimerRef = useRef(null);
  const codeInputRefs = useRef([]);
  const previousStatusRef = useRef('waiting');
  const [status, setStatus] = useState('waiting');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(() => location.state?.email || '');
  const [codeDigits, setCodeDigits] = useState(() => Array(8).fill(''));
  const code = codeDigits.join('');
  const [resendState, setResendState] = useState('idle');

  const updateCodeDigit = (index, rawValue) => {
    const digits = String(rawValue || '').replace(/\D/g, '').slice(0, 8 - index);
    if (!digits) {
      setCodeDigits((current) => current.map((digit, digitIndex) => (digitIndex === index ? '' : digit)));
      return;
    }

    setCodeDigits((current) => {
      const next = [...current];
      digits.split('').forEach((digit, offset) => { next[index + offset] = digit; });
      return next;
    });
    if (digits.length > 1) {
      codeInputRefs.current[Math.min(index + digits.length, 7)]?.focus();
    } else if (index < 7) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !codeDigits[index] && index > 0) {
      event.preventDefault();
      setCodeDigits((current) => current.map((digit, digitIndex) => (digitIndex === index - 1 ? '' : digit)));
      codeInputRefs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      codeInputRefs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && index < 7) {
      event.preventDefault();
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodePaste = (event, index) => {
    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!pastedDigits) return;
    event.preventDefault();
    updateCodeDigit(index, pastedDigits);
  };

  useLayoutEffect(() => {
    const root = pageRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const context = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .fromTo('.verification-story-copy',
          { y: 18, opacity: 0, clipPath: 'inset(0 0 12% 0)' },
          { y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: 0.52 })
        .fromTo('.verification-route-line-fill',
          { scaleY: 0 },
          { scaleY: 0.66, duration: 0.7, ease: 'power2.inOut' }, '-=0.18')
        .fromTo('.verification-route-step',
          { x: -10, opacity: 0.55 },
          { x: 0, opacity: 1, duration: 0.36, stagger: 0.08 }, '-=0.48')
        .fromTo('.verification-panel',
          { y: 18, opacity: 0.7 },
          { y: 0, opacity: 1, duration: 0.52 }, '-=0.34');
    }, root);

    return () => context.revert();
  }, []);

  useLayoutEffect(() => {
    if (previousStatusRef.current === status) return undefined;
    previousStatusRef.current = status;
    const root = pageRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const context = gsap.context(() => {
      gsap.fromTo('.verification-panel-heading h2',
        { y: 7, opacity: 0.72 },
        { y: 0, opacity: 1, duration: 0.28, ease: 'power2.out' });
      if (status === 'success') {
        gsap.to('.verification-route-line-fill', { scaleY: 1, duration: 0.5, ease: 'power2.inOut' });
        gsap.fromTo('.verification-success-mark',
          { scale: 0.78, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.42, ease: 'back.out(1.7)' });
      } else if (status === 'error') {
        gsap.fromTo('.verification-code-field',
          { x: 0 },
          { x: -5, duration: 0.06, repeat: 3, yoyo: true, clearProps: 'x' });
      }
    }, root);

    return () => context.revert();
  }, [status]);

  useLayoutEffect(() => () => {
    if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
  }, []);

  const handleVerify = async (event) => {
    event.preventDefault();
    if (status === 'verifying' || code.length !== 8) return;
    setStatus('verifying');
    setMessage('Checking the code you entered…');

    try {
      await completeEmailVerification(email, code);
      setStatus('success');
      setMessage('Your email is confirmed. Taking you to your support workspace…');
      redirectTimerRef.current = window.setTimeout(() => navigate('/dashboard', { replace: true }), 1400);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'This verification code is invalid or expired.');
    }
  };

  const handleResend = async (event) => {
    event.preventDefault();
    if (!email.trim() || resendState === 'sending') return;
    setStatus('waiting');
    setResendState('sending');
    setMessage('Sending a fresh code…');
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

  const isErrorFeedback = status === 'error' || resendState === 'error';
  const isSuccessFeedback = resendState === 'sent';

  return (
    <main className="auth-shell verification-shell" ref={pageRef}>
      <div className="verification-layout">
        <section className="verification-story" aria-labelledby="verification-story-title">
          <a className="verification-brand" href="/" aria-label="AssistDesk home">
            <span className="verification-brand-mark"><img src="/assistdesk-logo.svg" alt="" /></span>
            <span><strong>AssistDesk</strong><small>Campus support, connected</small></span>
          </a>

          <div className="verification-story-copy">
            <h1 id="verification-story-title">One quick check, then you’re in.</h1>
            <p>Confirm the address you registered with to activate your account and reach campus support.</p>
          </div>

          <div className={`verification-route-wrap${status === 'success' ? ' is-complete' : ''}`}>
            <span className="verification-route-line" aria-hidden="true"><span className="verification-route-line-fill" /></span>
            <ol className="verification-route" aria-label="Account setup progress">
            <li className="verification-route-step is-complete">
              <span className="verification-route-node" aria-hidden="true">
                <svg viewBox="0 0 20 20"><path d="m5 10 3.2 3.2L15.5 6" /></svg>
              </span>
              <span><strong>Account details</strong><small>Registration complete</small></span>
            </li>
            <li className={`verification-route-step${status === 'success' ? ' is-complete' : ' is-active'}`} aria-current={status === 'success' ? undefined : 'step'}>
              <span className="verification-route-node" aria-hidden="true">{status === 'success' ? <svg viewBox="0 0 20 20"><path d="m5 10 3.2 3.2L15.5 6" /></svg> : '02'}</span>
              <span><strong>Email confirmation</strong><small>{status === 'success' ? 'Address confirmed' : 'You are here'}</small></span>
            </li>
            <li className={`verification-route-step${status === 'success' ? ' is-active' : ''}`}>
              <span className="verification-route-node" aria-hidden="true">03</span>
              <span><strong>Support workspace</strong><small>{status === 'success' ? 'Opening dashboard' : 'Next stop'}</small></span>
            </li>
            </ol>
          </div>

          <p className="verification-story-note">Keep this page open while you check your inbox.</p>
        </section>

        <section className={`verification-panel${status === 'error' ? ' has-error' : ''}${status === 'success' ? ' has-success' : ''}`} aria-labelledby="verification-title" aria-busy={status === 'verifying'}>
          <div className="verification-panel-heading">
            <span className="verification-step-label">EMAIL · STEP 2 OF 3</span>
            <h2 id="verification-title">{status === 'success' ? 'You’re verified' : status === 'error' ? 'Let’s try that again' : 'Enter your verification code'}</h2>
            <p>{status === 'success'
              ? 'Your account is ready. We’re taking you to your support workspace.'
              : 'We sent an 8-digit code to your email. Enter it below to activate your account.'}</p>
          </div>

          {status === 'success' ? (
            <div className="verification-success-state" role="status" aria-live="polite">
              <span className="verification-success-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="m6 12.5 4 4L18.5 8" /></svg>
              </span>
              <strong>Account activated</strong>
              <span>{message}</span>
            </div>
          ) : (
            <>
              <form className="verification-form" onSubmit={handleVerify}>
                <label className="verification-field" htmlFor="verification-email">
                  <span>Email address</span>
                  <input id="verification-email" className="institutional-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </label>
                <fieldset className="verification-field verification-code-field" aria-describedby="verification-code-hint">
                  <legend>8-digit code</legend>
                  <div className="verification-code-grid" role="group" aria-label="8-digit verification code">
                    {codeDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => { codeInputRefs.current[index] = element; }}
                        className="institutional-input verification-code-input"
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? 'one-time-code' : 'off'}
                        pattern="[0-9]*"
                        maxLength={8}
                        value={digit}
                        onChange={(event) => updateCodeDigit(index, event.target.value)}
                        onKeyDown={(event) => handleCodeKeyDown(event, index)}
                        onPaste={(event) => handleCodePaste(event, index)}
                        aria-label={`Digit ${index + 1} of 8`}
                        aria-invalid={status === 'error'}
                        required
                      />
                    ))}
                  </div>
                  <small id="verification-code-hint">Enter all 8 numbers from the email.</small>
                </fieldset>

                {message && <p className={`verification-feedback${isErrorFeedback ? ' is-error' : isSuccessFeedback ? ' is-success' : ''}`} role={isErrorFeedback ? 'alert' : 'status'} aria-live={isErrorFeedback ? 'assertive' : 'polite'}>{message}</p>}

                <button type="submit" className="institutional-btn verification-submit" disabled={status === 'verifying' || resendState === 'sending' || code.length !== 8 || !email.trim()}>
                  {status === 'verifying' && <span className="verification-button-spinner" aria-hidden="true" />}
                  {status === 'verifying' ? 'Checking code…' : 'Verify email'}
                  {status !== 'verifying' && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>}
                </button>
              </form>

              <p className="verification-spam-note">Before requesting another code, check your spam or junk folder.</p>
              <div className="verification-resend-row">
                <span>Didn’t receive it?</span>
                <form onSubmit={handleResend}>
                  <button type="submit" className="verification-text-button" disabled={resendState === 'sending' || status === 'verifying' || !email.trim()}>
                    {resendState === 'sending' ? 'Sending…' : resendState === 'sent' ? 'Send another code' : 'Resend code'}
                  </button>
                </form>
              </div>
              <button type="button" className="verification-back-link" onClick={() => navigate('/')}>Back to sign in</button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default EmailVerificationPage;
