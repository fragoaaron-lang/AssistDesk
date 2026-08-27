import React, { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

function LandingPage() {
  const [authModal, setAuthModal] = useState(null);

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <img className="landing-map" src="/schoolmap.png" alt="Campus map" />
        <div className="landing-overlay" />
        <nav className="landing-nav" aria-label="Main navigation">
          <a className="landing-brand" href="/" aria-label="AssistDesk home">
            <span className="landing-brand-mark"><img src="/assistdesk-logo.svg" alt="" /></span>
            <span>AssistDesk</span>
          </a>
          <div className="landing-nav-actions">
            <button className="landing-text-link landing-action-button" type="button" onClick={() => setAuthModal('login')}>Log in</button>
            <button className="landing-nav-button landing-action-button" type="button" onClick={() => setAuthModal('register')}>Create account</button>
          </div>
        </nav>
        <div className="landing-hero-content">
          <p className="landing-kicker">Institutional support, connected</p>
          <h1>Get the right help, without the runaround.</h1>
          <p className="landing-lede">AssistDesk brings campus services, support requests, and real-time updates into one clear place.</p>
          <div className="landing-actions">
            <button className="landing-primary-button landing-action-button" type="button" onClick={() => setAuthModal('register')}>Start a request <span aria-hidden="true">→</span></button>
            <button className="landing-secondary-button landing-action-button" type="button" onClick={() => setAuthModal('login')}>Log in to AssistDesk</button>
          </div>
        </div>
        <div className="landing-scroll-note" aria-hidden="true">Explore support services <span>↓</span></div>
      </section>

      <section className="landing-services" aria-labelledby="services-title">
        <div className="landing-section-heading">
          <p className="landing-kicker">One support network</p>
          <h2 id="services-title">A clearer path from concern to resolution.</h2>
        </div>
        <div className="landing-feature-grid">
          <article className="landing-feature">
            <span className="landing-feature-number">01</span>
            <h3>Submit with confidence</h3>
            <p>Send a request to the right department with a clear subject, description, and priority.</p>
          </article>
          <article className="landing-feature">
            <span className="landing-feature-number">02</span>
            <h3>Track every update</h3>
            <p>Follow progress from open to resolved and stay informed through timely notifications.</p>
          </article>
          <article className="landing-feature">
            <span className="landing-feature-number">03</span>
            <h3>Find campus support</h3>
            <p>Explore departments and see request activity across the campus support network.</p>
          </article>
        </div>
      </section>

      <footer className="landing-footer">
        <span>AssistDesk</span>
        <span>Support that moves with your campus.</span>
      </footer>

      {authModal && (
        <div className="auth-modal-backdrop" role="presentation" onMouseDown={() => setAuthModal(null)}>
          <div className="auth-modal" role="dialog" aria-modal="true" aria-label={authModal === 'login' ? 'Log in to AssistDesk' : 'Create an AssistDesk account'} onMouseDown={(event) => event.stopPropagation()}>
            <button className="auth-modal-close" type="button" onClick={() => setAuthModal(null)} aria-label="Close authentication window">×</button>
            {authModal === 'login' ? <LoginPage modal onSwitch={() => setAuthModal('register')} /> : <RegisterPage modal onSwitch={() => setAuthModal('login')} />}
          </div>
        </div>
      )}
    </main>
  );
}

export default LandingPage;