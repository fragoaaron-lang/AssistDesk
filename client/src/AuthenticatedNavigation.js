import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import HeaderProfile from './HeaderProfile';
import LogoutButton from './LogoutButton';
import SidebarProfile from './SidebarProfile';

const baseLinks = [
  { label: 'Dashboard', to: '/dashboard', key: 'dashboard' },
  { label: 'Tickets', to: '/tickets', key: 'tickets' },
  { label: 'Assistant', to: '/assistant', key: 'assistant' },
  { label: 'Profile', to: '/profile', key: 'profile' },
];

const adminLinks = [
  { label: 'Catalog', to: '/admin/catalog', key: 'catalog', adminOnly: true },
  { label: 'Data Analytics', to: '/admin/reports', key: 'reports', adminOnly: true },
  { label: 'Users', to: '/admin/reports?view=users', key: 'users', adminOnly: true },
];

function AuthenticatedNavigation({ user, subtitle, onUsersNavigate, mobileProfileContent, minimal = false }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuToggleRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const isUsersView = location.pathname === '/admin/reports'
    && new URLSearchParams(location.search).get('view') === 'users';
  const links = useMemo(() => {
    if (minimal) return [];

    const accountLinks = location.pathname === '/profile'
      ? baseLinks.filter((link) => link.key !== 'assistant')
      : baseLinks;

    return [
      ...accountLinks,
      ...(user?.role === 'admin' ? adminLinks : []),
    ];
  }, [location.pathname, minimal, user?.role]);

  const getActiveLink = (link) => {
    if (link.key === 'users') return isUsersView;
    if (link.key === 'reports') return location.pathname === link.to && !isUsersView;
    return location.pathname === link.to;
  };

  const closeMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const returnFocusTarget = menuToggleRef.current;
    const focusFrame = window.requestAnimationFrame(() => {
      mobileMenuRef.current?.querySelector('.mobile-menu-close')?.focus();
    });
    const handleMenuKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab' || !mobileMenuRef.current) return;

      const focusableItems = [...mobileMenuRef.current.querySelectorAll('a[href], button:not(:disabled)')];
      if (!focusableItems.length) return;
      const firstItem = focusableItems[0];
      const lastItem = focusableItems[focusableItems.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', handleMenuKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleMenuKeyDown);
      if (returnFocusTarget?.isConnected) returnFocusTarget.focus();
    };
  }, [mobileMenuOpen]);

  const renderLinks = (mobile = false) => links.map((link) => {
    const active = getActiveLink(link);
    return (
      <Link
        key={link.key}
        to={link.to}
        className={active ? 'is-current' : ''}
        aria-current={active ? 'page' : undefined}
        onClick={() => {
          onUsersNavigate?.(link.key);
          if (mobile) closeMenu();
        }}
      >
        {link.label}
      </Link>
    );
  });

  return (
    <>
      <header className={`page-header${minimal ? ' page-header-minimal' : ''}`}>
        {!minimal && <button
          ref={menuToggleRef}
          type="button"
          className="mobile-menu-toggle"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="assistdesk-mobile-navigation"
          onClick={() => setMobileMenuOpen((current) => !current)}
        >
          {mobileMenuOpen ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          )}
        </button>}

        <Link className="header-brand header-brand-button" to="/dashboard" aria-label="AssistDesk dashboard">
          <span className="brand-badge"><img src="/assistdesk-logo.svg" alt="" /></span>
          <span className="header-brand-copy">
            <strong>AssistDesk</strong>
            <span>{subtitle}</span>
          </span>
        </Link>

        {!minimal && <nav className="nav-links" aria-label="Primary navigation">{renderLinks()}</nav>}

        <div className="header-actions">
          {!minimal && <HeaderProfile user={user} />}
          <LogoutButton />
        </div>
      </header>

      {!minimal && mobileMenuOpen && (
        <>
          <button className="mobile-menu-backdrop show" type="button" aria-label="Close navigation menu" onClick={closeMenu} />
          <aside
            ref={mobileMenuRef}
            id="assistdesk-mobile-navigation"
            className="mobile-menu-drawer open"
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
          >
            <div className="mobile-menu-head">
              <button type="button" className="mobile-menu-close" onClick={closeMenu} aria-label="Close navigation menu">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <div className="mobile-profile-summary">{mobileProfileContent || <SidebarProfile user={user} />}</div>
            <nav className="nav-links" aria-label="Mobile navigation">{renderLinks(true)}</nav>
            <div className="mobile-menu-actions">
              <LogoutButton onBeforeLogout={closeMenu} />
            </div>
          </aside>
        </>
      )}
    </>
  );
}

export default AuthenticatedNavigation;
