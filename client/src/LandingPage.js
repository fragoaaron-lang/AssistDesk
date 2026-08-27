import React from 'react';

function LandingPage() {
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
            <a className="landing-text-link" href="/login">Log in</a>
            <a className="landing-nav-button" href="/register">Create account</a>
          </div>
        </nav>
        <div className="landing-hero-content">
          <p className="landing-kicker">Institutional support, connected</p>
          <h1>Get the right help, without the runaround.</h1>
          <p className="landing-lede">AssistDesk brings campus services, support requests, and real-time updates into one clear place.</p>
          <div className="landing-actions">
            <a className="landing-primary-button" href="/register">Start a request <span aria-hidden="true">→</span></a>
            <a className="landing-secondary-button" href="/login">Log in to AssistDesk</a>
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
    </main>
  );
}

export default LandingPage;