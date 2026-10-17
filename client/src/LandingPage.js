import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

gsap.registerPlugin(ScrollTrigger);

function LandingPage() {
  const [authModal, setAuthModal] = useState(null);
  const landingRef = useRef(null);
  const modalRef = useRef(null);
  const authTriggerRef = useRef(null);

  const openAuthModal = (type, event) => {
    authTriggerRef.current = event.currentTarget;
    setAuthModal(type);
  };

  useEffect(() => {
    const landing = landingRef.current;
    if (!landing || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const context = gsap.context(() => {
      const routeList = landing.querySelector('.landing-route-list');
      landing.classList.add('landing-motion-ready');
      gsap.set(routeList, { '--route-progress': 0 });

      const sequence = gsap.timeline({ defaults: { ease: 'expo.out' } });
      sequence
        .fromTo(landing.querySelector('.landing-brand-mark'),
          { y: -8, rotate: -3, scale: 0.96, opacity: 0.75 },
          { y: 0, rotate: 0, scale: 1, opacity: 1, duration: 0.42 })
        .fromTo(landing.querySelectorAll('.landing-nav-links a'),
          { y: -6, opacity: 0.65 },
          { y: 0, opacity: 1, duration: 0.32, stagger: 0.07 }, '-=0.2')
        .fromTo(landing.querySelector('.landing-nav-button'),
          { y: -5, opacity: 0.7 },
          { y: 0, opacity: 1, duration: 0.32 }, '-=0.2')
        .fromTo(landing.querySelector('.landing-hero h1'),
          { y: 14, opacity: 0.82 },
          { y: 0, opacity: 1, duration: 0.46 }, '-=0.08')
        .fromTo(landing.querySelector('.landing-lede'),
          { y: 10, opacity: 0.7 },
          { y: 0, opacity: 1, duration: 0.36 }, '-=0.24')
        .fromTo(landing.querySelector('.landing-actions'),
          { y: 8, opacity: 0.7 },
          { y: 0, opacity: 1, duration: 0.32 }, '-=0.2')
        .fromTo(landing.querySelector('.landing-route-heading'),
          { y: 8, opacity: 0.72 },
          { y: 0, opacity: 1, duration: 0.3 }, '-=0.12')
        .to(routeList, { '--route-progress': 1, duration: 0.54, ease: 'power2.inOut' }, '-=0.06')
        .fromTo(landing.querySelectorAll('.landing-route-marker'),
          { scale: 0.82, opacity: 0.65 },
          { scale: 1, opacity: 1, duration: 0.3, stagger: 0.1, ease: 'back.out(1.5)' }, '-=0.18');

      gsap.fromTo(landing.querySelector('.landing-section-heading'),
        { y: 22, opacity: 0.7 },
        {
          y: 0,
          opacity: 1,
          duration: 0.62,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: landing.querySelector('.landing-departments'),
            start: 'top 78%',
            once: true,
          },
        });

      gsap.fromTo(landing.querySelectorAll('.landing-directory-group'),
        { y: 26, opacity: 0.65 },
        {
          y: 0,
          opacity: 1,
          duration: 0.58,
          stagger: 0.14,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: landing.querySelector('.landing-directory-grid'),
            start: 'top 82%',
            once: true,
          },
        });

      gsap.fromTo(landing.querySelectorAll('.landing-close-route span'),
        { scale: 0.72, opacity: 0.55 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.34,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: landing.querySelector('.landing-close'),
            start: 'top 82%',
            once: true,
          },
        });

      gsap.fromTo(landing.querySelector('.landing-close h2'),
        { y: 16, opacity: 0.72 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: landing.querySelector('.landing-close'),
            start: 'top 78%',
            once: true,
          },
        });
    }, landing);

    return () => {
      landing.classList.remove('landing-motion-ready');
      context.revert();
    };
  }, []);

  useEffect(() => {
    if (!authModal) return undefined;

    const previouslyFocused = authTriggerRef.current;
    const focusFrame = window.requestAnimationFrame(() => {
      modalRef.current?.querySelector('.auth-modal-close')?.focus();
    });
    const handleModalKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAuthModal(null);
        return;
      }
      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusable = [...modalRef.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.getAttribute('aria-hidden') !== 'true');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleModalKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleModalKeyDown);
      previouslyFocused?.focus();
    };
  }, [authModal]);

  return (
    <main ref={landingRef} className="landing-page">
      <header className="landing-header">
        <nav className="landing-nav" aria-label="Main navigation">
          <a className="landing-brand" href="/" aria-label="AssistDesk home">
            <span className="landing-brand-mark"><img src="/assistdesk-logo.svg" alt="" /></span>
            <span>AssistDesk</span>
          </a>
          <div className="landing-nav-links">
            <a href="#journey">How it works</a>
            <a href="#departments">Departments</a>
          </div>
          <button className="landing-nav-button landing-action-button" type="button" onClick={(event) => openAuthModal('login', event)}>
            Sign in
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-5-5 5 5-5 5" /></svg>
          </button>
        </nav>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-map-grid" aria-hidden="true" />
        <div className="landing-hero-content">
          <h1 id="landing-title">Find your way to the right help.</h1>
          <p className="landing-lede">One clear path from your concern to the campus team that can help.</p>
          <div className="landing-actions">
            <a className="landing-secondary-button" href="#departments">Explore departments <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v12m-5-5 5 5 5-5" /></svg></a>
          </div>
        </div>

        <div className="landing-route-board" id="journey" aria-labelledby="landing-route-title">
          <div className="landing-route-heading">
            <h2 id="landing-route-title">A clear route through campus support</h2>
          </div>
          <ol className="landing-route-list">
            <li className="landing-route-stop">
              <span className="landing-route-marker" aria-hidden="true">01</span>
              <div className="landing-route-stop-copy">
                <strong>Describe your concern</strong>
                <p>Share what you need and set a priority.</p>
                <button className="landing-primary-button landing-action-button landing-route-action" type="button" onClick={(event) => openAuthModal('login', event)}>
                  Start a request <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15 15 5M6 5h9v9" /></svg>
                </button>
              </div>
            </li>
            <li className="landing-route-stop">
              <span className="landing-route-marker" aria-hidden="true">02</span>
              <div><strong>Reach a department</strong><p>Your request is routed to campus support.</p></div>
            </li>
            <li className="landing-route-stop">
              <span className="landing-route-marker" aria-hidden="true">03</span>
              <div><strong>Follow each update</strong><p>Check progress as your request moves forward.</p></div>
            </li>
          </ol>
        </div>
      </section>

      <section className="landing-departments" id="departments" aria-labelledby="departments-title">
        <div className="landing-section-heading">
          <div>
            <h2 id="departments-title">Find the team you need.</h2>
          </div>
          <p>Explore support across academic departments and campus services.</p>
        </div>
        <div className="landing-directory-grid">
          <div className="landing-directory-group">
            <h3><span>01</span> Academic departments</h3>
            <ul>
              <li>Basic Education Department</li>
              <li>College of Nursing</li>
              <li>College of Computer Studies</li>
              <li>College of Business and Accountancy</li>
              <li>College of Hospitality Management</li>
              <li>College of Criminology</li>
              <li>College of Physical Therapy</li>
              <li>College of Education</li>
            </ul>
          </div>
          <div className="landing-directory-group">
            <h3><span>02</span> Campus services</h3>
            <ul>
              <li>Registrar Department</li>
              <li>Accounting Department</li>
              <li>Library</li>
              <li>Information Technology Department</li>
              <li>Guidance Office</li>
              <li>Office of Student Affairs</li>
              <li>Maintenance Department</li>
              <li>Clinic</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="landing-close" aria-label="Get started with AssistDesk">
        <div className="landing-close-route" aria-hidden="true"><span /><span /><span /></div>
        <h2>Ready to reach campus support?</h2>
        <button className="landing-primary-button landing-action-button" type="button" onClick={(event) => openAuthModal('login', event)}>
          Start a request <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15 15 5M6 5h9v9" /></svg>
        </button>
      </section>

      <footer className="landing-footer">
        <a className="landing-footer-brand" href="/">AssistDesk</a>
        <span>Tomas Claudio Colleges</span>
        <span>Support that moves with your campus.</span>
      </footer>

      {authModal && (
        <div className="auth-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthModal(null); }}>
          <div ref={modalRef} className="auth-modal" role="dialog" aria-modal="true" aria-label={authModal === 'login' ? 'Log in to AssistDesk' : 'Create an AssistDesk account'}>
            <button className="auth-modal-close" type="button" onClick={() => setAuthModal(null)} aria-label="Close authentication window"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg></button>
            {authModal === 'login' ? <LoginPage modal onSwitch={() => setAuthModal('register')} /> : <RegisterPage modal onSwitch={() => setAuthModal('login')} />}
          </div>
        </div>
      )}
    </main>
  );
}

export default LandingPage;