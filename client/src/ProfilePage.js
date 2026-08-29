import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import NotificationBell from './NotificationBell';
import LogoutButton from './LogoutButton';

const defaultPrefs = {
  compactMode: false,
  emailUpdates: true,
  pushAlerts: true,
  accent: 'teal',
  favoriteDepartment: 'All departments',
};

function ProfilePage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prefs, setPrefs] = useState(() => {
    try {
      const savedPrefs = JSON.parse(localStorage.getItem('assistdesk_profile_prefs') || '{}');
      return { ...defaultPrefs, ...savedPrefs };
    } catch (error) {
      return defaultPrefs;
    }
  });

  useEffect(() => {
    localStorage.setItem('assistdesk_profile_prefs', JSON.stringify(prefs));
  }, [prefs]);

  const updatePreference = (key, value) => {
    setPrefs((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="app-shell">
      <div className="page-shell">
        <div className={`mobile-menu-backdrop ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)} />

        <header className="page-header">
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            ☰
          </button>
          <button type="button" className="header-brand header-brand-button" onClick={() => window.location.reload()} aria-label="Refresh AssistDesk">
            <div className="brand-badge">
              <img src="/assistdesk-logo.svg" alt="AssistDesk logo" />
            </div>
            <div>
              <h1>AssistDesk</h1>
              <p>Personalized support profile</p>
            </div>
          </button>

          <div className="nav-links">
            <a href="/dashboard">Dashboard</a>
            <a href="/tickets">Tickets</a>
            <a href="/profile">Profile</a>
            {user?.role === 'admin' && (
              <>
                <a href="/admin/reports">Reports</a>
                <a href="/admin/catalog">Catalog</a>
              </>
            )}
          </div>

          <div className="header-actions">
            <LogoutButton />
            <NotificationBell />
          </div>
        </header>

        <aside className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-head">
            <button type="button" className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>×</button>
          </div>
          <div className="mobile-profile-summary">
            <div className="brand-badge small-badge">
              <img src="/assistdesk-logo.svg" alt="AssistDesk logo" />
            </div>
            <div>
              <div className="mobile-profile-name">{user?.name || 'User'}</div>
              <div className="mobile-profile-role">{user?.role || 'Member'}</div>
            </div>
          </div>
          <div className="nav-links">
            <a href="/tickets" onClick={() => setMobileMenuOpen(false)}>Tickets</a>
            <a href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
            <a href="/profile" onClick={() => setMobileMenuOpen(false)}>Profile</a>
            {user?.role === 'admin' && (
              <>
                <a href="/admin/reports" onClick={() => setMobileMenuOpen(false)}>Reports</a>
                <a href="/admin/catalog" onClick={() => setMobileMenuOpen(false)}>Catalog</a>
              </>
            )}
          </div>
          <div className="mobile-menu-actions">
            <LogoutButton onBeforeLogout={() => setMobileMenuOpen(false)} />
            <div className="mobile-menu-bell"><NotificationBell /></div>
          </div>
        </aside>

        <div className="page-intro">
          <div>
            <h2>Profile & personalization</h2>
            <p>Customize how your AssistDesk workspace feels and behaves.</p>
          </div>
        </div>

        <div className="institutional-card" style={{ marginBottom: '20px' }}>
          <h3>Account profile</h3>
          <div className="profile-summary-row">
            <div className="profile-avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
            <div>
              <div className="profile-name">{user?.name || 'Student User'}</div>
              <div className="profile-meta">{user?.email || 'student@assistdesk.edu'}</div>
              <div className="profile-meta">Role: {user?.role || 'student'}</div>
            </div>
          </div>
        </div>

        <div className="institutional-card" style={{ marginBottom: '20px' }}>
          <h3>Personalization</h3>

          <label className="preference-row">
            <span>Compact dashboard view</span>
            <input type="checkbox" checked={prefs.compactMode} onChange={(e) => updatePreference('compactMode', e.target.checked)} />
          </label>

          <label className="preference-row">
            <span>Email updates</span>
            <input type="checkbox" checked={prefs.emailUpdates} onChange={(e) => updatePreference('emailUpdates', e.target.checked)} />
          </label>

          <label className="preference-row">
            <span>Push alerts</span>
            <input type="checkbox" checked={prefs.pushAlerts} onChange={(e) => updatePreference('pushAlerts', e.target.checked)} />
          </label>

          <label className="preference-row select-row">
            <span>Preferred accent</span>
            <select value={prefs.accent} onChange={(e) => updatePreference('accent', e.target.value)}>
              <option value="teal">Teal</option>
              <option value="navy">Navy</option>
              <option value="gold">Gold</option>
            </select>
          </label>

          <label className="preference-row select-row">
            <span>Favorite department</span>
            <select value={prefs.favoriteDepartment} onChange={(e) => updatePreference('favoriteDepartment', e.target.value)}>
              <option value="All departments">All departments</option>
              <option value="Student Services">Student Services</option>
              <option value="IT Support">IT Support</option>
              <option value="Registrar">Registrar</option>
              <option value="Campus Maintenance">Campus Maintenance</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
