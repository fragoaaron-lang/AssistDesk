import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import NotificationBell from './NotificationBell';
import LogoutButton from './LogoutButton';
import { API_BASE_URL } from './config';

const defaultPrefs = {
  compactMode: false,
  emailUpdates: true,
  pushAlerts: true,
  darkMode: false,
  accent: 'teal',
};

const PASSWORD_RULE_MESSAGE = 'Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character.';

const getUserStorageKey = (user, suffix) => {
  const identifier = user?.id ?? user?.email ?? 'guest';
  return `assistdesk_${suffix}_${identifier}`;
};

function ProfilePage() {
  const { user, token } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(() => {
    const key = getUserStorageKey(user, 'profile_photo');
    return localStorage.getItem(key) || '';
  });
  const [prefs, setPrefs] = useState(() => {
    try {
      const key = getUserStorageKey(user, 'profile_prefs');
      const savedPrefs = JSON.parse(localStorage.getItem(key) || '{}');
      return { ...defaultPrefs, ...savedPrefs };
    } catch (error) {
      return defaultPrefs;
    }
  });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordState, setPasswordState] = useState({ status: 'idle', message: '' });
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState({ oldPassword: false, newPassword: false, confirmPassword: false });
  const [photoUploadLoading, setPhotoUploadLoading] = useState(false);
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(() => ({
    prefs: (() => {
      try {
        const key = getUserStorageKey(user, 'profile_prefs');
        return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(key) || '{}') };
      } catch (error) {
        return defaultPrefs;
      }
    })(),
    photo: (() => {
      const key = getUserStorageKey(user, 'profile_photo');
      return localStorage.getItem(key) || '';
    })(),
  }));

  useEffect(() => {
    if (prefs.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [prefs.darkMode]);

  useEffect(() => {
    if (!user) return;

    const keyPhoto = getUserStorageKey(user, 'profile_photo');
    const keyPrefs = getUserStorageKey(user, 'profile_prefs');

    const storedPhoto = localStorage.getItem(keyPhoto) || '';
    let storedPrefs = defaultPrefs;

    try {
      storedPrefs = { ...defaultPrefs, ...JSON.parse(localStorage.getItem(keyPrefs) || '{}') };
    } catch (error) {
      storedPrefs = defaultPrefs;
    }

    setSavedSnapshot({ prefs: storedPrefs, photo: storedPhoto });
    setProfilePhoto(storedPhoto);
    setPrefs(storedPrefs);
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (!user) return;
    const hasChanges = JSON.stringify(prefs) !== JSON.stringify(savedSnapshot.prefs) || profilePhoto !== savedSnapshot.photo;
    if (hasChanges) {
      setShowSaveDialog(true);
    } else {
      setShowSaveDialog(false);
    }
  }, [prefs, profilePhoto, savedSnapshot, user]);

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswordFields((current) => ({
      ...current,
      [fieldName]: !current[fieldName],
    }));
  };

  const updatePreference = (key, value) => {
    setPrefs((current) => ({ ...current, [key]: value }));
  };

  const handleSaveChanges = () => {
    setSaveState({ status: 'saving', message: 'Saving profile...' });

    try {
      if (user) {
        localStorage.setItem(getUserStorageKey(user, 'profile_prefs'), JSON.stringify(prefs));
      }
      if (profilePhoto) {
        if (user) {
          localStorage.setItem(getUserStorageKey(user, 'profile_photo'), profilePhoto);
        }
      } else if (user) {
        localStorage.removeItem(getUserStorageKey(user, 'profile_photo'));
      }

      setSavedSnapshot({ prefs, photo: profilePhoto });
      setShowSaveDialog(false);
      setShowSuccessDialog(true);

      window.setTimeout(() => {
        setSaveState({ status: 'success', message: 'Profile saved successfully.' });
        window.setTimeout(() => {
          setShowSuccessDialog(false);
        }, 1800);
      }, 250);
    } catch (error) {
      setSaveState({ status: 'error', message: 'Unable to save profile changes.' });
      setShowSuccessDialog(true);
    }
  };

  const handleCancelChanges = () => {
    setPrefs(savedSnapshot.prefs);
    setProfilePhoto(savedSnapshot.photo);
    setSaveState({ status: 'idle', message: '' });
    setShowSaveDialog(false);
  };

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoUploadLoading(true);
    event.target.value = '';

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';

      window.setTimeout(() => {
        setProfilePhoto(result);
        setPhotoUploadLoading(false);
      }, 900);
    };

    reader.onerror = () => {
      setPhotoUploadLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordState({ status: 'error', message: 'All password fields are required.' });
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(passwordForm.newPassword)) {
      setPasswordState({ status: 'error', message: 'new password is weak' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordState({ status: 'error', message: 'New passwords do not match.' });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const rawText = await response.text();
      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (parseError) {
        const lowered = rawText.toLowerCase();
        if (lowered.includes('current password is incorrect')) {
          data = { message: 'entered wrong current password' };
        } else {
          data = { message: 'entered wrong current password' };
        }
      }

      if (!response.ok) {
        const normalized = (data.message || '').toLowerCase();
        const mappedMessage = normalized.includes('current password is incorrect') || normalized.includes('wrong current password')
          ? 'entered wrong current password'
          : normalized.includes('weak') || normalized.includes('password must be at least 8')
            ? 'new password is weak'
            : data.message || 'Unable to change password.';

        throw new Error(mappedMessage);
      }

      setPasswordState({ status: 'success', message: data.message || 'Password changed successfully.' });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const fallback = error?.message || 'Unable to change password.';
      const message = fallback.toLowerCase().includes('wrong current password')
        ? 'entered wrong current password'
        : fallback.toLowerCase().includes('weak')
          ? 'new password is weak'
          : fallback;

      setPasswordState({ status: 'error', message });
    }
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
            <div className="mobile-profile-photo">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="profile-avatar-image" />
              ) : (
                <span>+</span>
              )}
              {photoUploadLoading && <div className="profile-avatar-loader" aria-label="Uploading profile photo" />}
              <label className={`profile-avatar-upload-label mobile-upload-label ${photoUploadLoading ? 'loading' : ''}`}>
                <input type="file" accept="image/*" onChange={handleProfilePhotoChange} disabled={photoUploadLoading} />
                <span>{photoUploadLoading ? 'Uploading...' : 'Upload'}</span>
              </label>
            </div>
            <div>
              <div className="mobile-profile-name">{user?.name || 'User'}</div>
              <div className="mobile-profile-role">{user?.role || 'Member'}</div>
            </div>
          </div>
          <div className="nav-links">
            <a href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
            <a href="/tickets" onClick={() => setMobileMenuOpen(false)}>Tickets</a>
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

        <div className="institutional-card profile-card" style={{ marginBottom: '20px' }}>
          <h3>Account profile</h3>
          <div className="profile-summary-row">
            <div className="profile-avatar profile-avatar-upload">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="profile-avatar-image" />
              ) : (
                <span className="profile-avatar-placeholder">+</span>
              )}
              {photoUploadLoading && <div className="profile-avatar-loader" aria-label="Uploading profile photo" />}
            </div>
            <div className="profile-user-meta">
              <div className="profile-name">{user?.name || 'Student User'}</div>
              <div className="profile-meta">{user?.email || 'student@assistdesk.edu'}</div>
              <div className="profile-meta">Role: {user?.role || 'student'}</div>
              <label className={`profile-upload-button ${photoUploadLoading ? 'loading' : ''}`}>
                <input type="file" accept="image/*" onChange={handleProfilePhotoChange} disabled={photoUploadLoading} />
                <span>{photoUploadLoading ? 'Uploading...' : 'Upload photo'}</span>
              </label>
            </div>
          </div>
        </div>

        {showSaveDialog && (
          <div className="profile-save-dialog-backdrop" onClick={() => setShowSaveDialog(false)}>
            <div className="profile-save-dialog" onClick={(event) => event.stopPropagation()}>
              <h4>Save changes?</h4>
              <p>Do you want to apply these profile updates?</p>
              <div className="profile-save-dialog-actions">
                <button type="button" className="secondary-action-button" onClick={handleCancelChanges}>Cancel</button>
                <button type="button" className="institutional-btn small" onClick={handleSaveChanges} disabled={saveState.status === 'saving'}>
                  {saveState.status === 'saving' ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccessDialog && (
          <div className="profile-save-dialog-backdrop" onClick={() => setShowSuccessDialog(false)}>
            <div className="profile-save-dialog success-dialog" onClick={(event) => event.stopPropagation()}>
              <div className="success-dialog-icon" aria-hidden="true">✓</div>
              <h4>{saveState.status === 'success' ? 'Profile saved successfully.' : 'Unable to save profile changes.'}</h4>
              <p>{saveState.status === 'success' ? 'Your updates are now applied.' : 'Please try again.'}</p>
              <div className="profile-save-dialog-actions">
                <button type="button" className="institutional-btn small" onClick={() => setShowSuccessDialog(false)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

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

          <label className="preference-row">
            <span>Dark mode</span>
            <input type="checkbox" checked={prefs.darkMode} onChange={(e) => updatePreference('darkMode', e.target.checked)} />
          </label>

          <label className="preference-row select-row">
            <span>Preferred accent</span>
            <select value={prefs.accent} onChange={(e) => updatePreference('accent', e.target.value)}>
              <option value="teal">Teal</option>
              <option value="navy">Navy</option>
              <option value="gold">Gold</option>
            </select>
          </label>

        </div>

        <div className="institutional-card">
          <div className="profile-section-header">
            <h3>Security</h3>
            <button
              type="button"
              className="institutional-btn secondary small"
              onClick={() => setShowPasswordEditor((prev) => !prev)}
            >
              {showPasswordEditor ? 'Close' : 'Change password'}
            </button>
          </div>

          {showPasswordEditor && (
            <>
              <form onSubmit={handlePasswordChange} className="password-change-form">
                <div className="password-field">
                  <input
                    className="institutional-input"
                    type={showPasswordFields.oldPassword ? 'text' : 'password'}
                    placeholder="Current password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm((current) => ({ ...current, oldPassword: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className={`password-visibility ${showPasswordFields.oldPassword ? 'visible' : ''}`}
                    onClick={() => togglePasswordVisibility('oldPassword')}
                    aria-label={showPasswordFields.oldPassword ? 'Hide current password' : 'Show current password'}
                  >
                    <span className="password-eye" aria-hidden="true" />
                  </button>
                </div>

                <div className="password-field">
                  <input
                    className="institutional-input"
                    type={showPasswordFields.newPassword ? 'text' : 'password'}
                    placeholder="New password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((current) => ({ ...current, newPassword: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className={`password-visibility ${showPasswordFields.newPassword ? 'visible' : ''}`}
                    onClick={() => togglePasswordVisibility('newPassword')}
                    aria-label={showPasswordFields.newPassword ? 'Hide new password' : 'Show new password'}
                  >
                    <span className="password-eye" aria-hidden="true" />
                  </button>
                </div>

                <div className="password-field">
                  <input
                    className="institutional-input"
                    type={showPasswordFields.confirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((current) => ({ ...current, confirmPassword: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className={`password-visibility ${showPasswordFields.confirmPassword ? 'visible' : ''}`}
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    aria-label={showPasswordFields.confirmPassword ? 'Hide confirmed new password' : 'Show confirmed new password'}
                  >
                    <span className="password-eye" aria-hidden="true" />
                  </button>
                </div>
                <p className="helper-text">Use 8+ characters with uppercase, lowercase, number, and symbol.</p>
                <button className="institutional-btn" type="submit">Update password</button>
              </form>
              {passwordState.message && (
                <p className={`profile-password-message ${passwordState.status}`}>
                  {passwordState.message}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
