import React, { useState } from 'react';
import { useAuth } from './AuthContext';

function LogoutButton({ onBeforeLogout, className = 'institutional-btn secondary small' }) {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    if (loggingOut) return;
    onBeforeLogout?.();
    setLoggingOut(true);
    window.setTimeout(() => logout(), 900);
  };

  return (
    <>
      <button type="button" className={className} onClick={handleLogout} disabled={loggingOut}>
        {loggingOut ? 'Logging out...' : 'Logout'}
      </button>
      {loggingOut && (
        <div className="logout-overlay" role="status" aria-live="polite">
          <div className="splash-mark">
            <div className="splash-logo-wrap"><img src="/assistdesk-logo.svg" alt="" /></div>
            <span className="splash-pulse" />
          </div>
          <h1>Logging out</h1>
          <p>Closing your AssistDesk session</p>
          <div className="splash-progress" aria-hidden="true"><span /></div>
        </div>
      )}
    </>
  );
}

export default LogoutButton;
