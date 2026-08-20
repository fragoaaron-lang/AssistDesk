import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import { getSocket } from './socket';
import NotificationBell from './NotificationBell';

function DashboardPage() {
  const { user, logout, token } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboard, setDashboard] = useState({ departments: [], announcements: [], stats: {} });
  const [notifications, setNotifications] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [markerPositions, setMarkerPositions] = useState(() => {
    try {
      const saved = window.localStorage.getItem('campus-map-marker-positions');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      return {};
    }
  });

  const visibleDepartments = useMemo(
    () => (dashboard.departments || []).filter((dept) => !['Registrar', 'IT Helpdesk'].includes(dept.name)),
    [dashboard.departments]
  );

  const loadData = async () => {
    try {
      const dashboardRes = await axios.get(`${API_BASE_URL}/api/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
      const notificationsRes = await axios.get(`${API_BASE_URL}/api/dashboard/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      
      setDashboard(dashboardRes.data);
      setNotifications(notificationsRes.data);
      
      // Try to load saved marker positions, but don't fail if endpoint errors
      try {
        const positionsRes = await axios.get(`${API_BASE_URL}/api/dashboard/marker-positions`, { headers: { Authorization: `Bearer ${token}` } });
        if (positionsRes.data?.positions) {
          setMarkerPositions(positionsRes.data.positions);
        }
      } catch (err) {
        console.warn('Could not load saved marker positions:', err.message);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  useEffect(() => {
    if (!token) return;

    loadData();
    const socket = getSocket();
    if (!socket) return;

    socket.on('ticketCreated', loadData);
    socket.on('ticketStatusUpdated', loadData);
    socket.on('announcementCreated', loadData);

    return () => {
      socket.off('ticketCreated', loadData);
      socket.off('ticketStatusUpdated', loadData);
      socket.off('announcementCreated', loadData);
    };
  }, [token]);

  useEffect(() => {
    if (!visibleDepartments.length || typeof window === 'undefined') return;

    const nextPositions = {};
    let changed = false;

    visibleDepartments.forEach((dept, index) => {
      const existing = markerPositions[dept.id];
      const position = existing || getDefaultMarkerPosition(index, visibleDepartments.length || 1);
      nextPositions[dept.id] = position;
      if (!existing) changed = true;
    });

    if (changed) {
      setMarkerPositions(nextPositions);
    }
  }, [visibleDepartments]);

  const getHeatColor = (count) => {
    if (count >= 6) return '#d32f2f';
    if (count >= 3) return '#fbc02d';
    if (count > 0) return '#1f6f78';
    return '#2e7d32';
  };

  const getVolumeLabel = (level) => {
    if (level === 'high') return 'High Volume';
    if (level === 'moderate') return 'Moderate Volume';
    return 'Low Volume';
  };

  const getDefaultMarkerPosition = (index, total) => {
    const columns = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(total || 1))));
    const rows = Math.ceil((total || 1) / columns);
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      x: (column + 1) * (100 / (columns + 1)),
      y: (row + 1) * (100 / (rows + 1)),
    };
  };

  const getDepartmentMarkerPosition = (dept, index) => {
    if (markerPositions[dept.id]) {
      return markerPositions[dept.id];
    }

    return getDefaultMarkerPosition(index, visibleDepartments.length || 1);
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
          <div className="header-brand">
            <div className="brand-badge">
              <img src="/assistdesk-logo.svg" alt="AssistDesk logo" />
            </div>
            <div>
              <h1>AssistDesk</h1>
              <p>Institutional support portal</p>
            </div>
          </div>
          <div className="nav-links">
            <a href="/dashboard">Dashboard</a>
            <a href="/tickets">Tickets</a>
            <a href="/assistant">Assistant</a>
            {user?.role === 'admin' && (
              <>
                <a href="/admin/reports">Reports</a>
                <a href="/admin/catalog">Catalog</a>
              </>
            )}
          </div>
          <div className="header-actions">
            <button className="institutional-btn secondary small" onClick={logout}>Logout</button>
            <NotificationBell />
          </div>
        </header>

        <aside className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-head">
            <strong>Menu</strong>
            <button type="button" className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>×</button>
          </div>
          <div className="nav-links">
            <a href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
            <a href="/tickets" onClick={() => setMobileMenuOpen(false)}>Tickets</a>
            <a href="/assistant" onClick={() => setMobileMenuOpen(false)}>Assistant</a>
            {user?.role === 'admin' && (
              <>
                <a href="/admin/reports" onClick={() => setMobileMenuOpen(false)}>Reports</a>
                <a href="/admin/catalog" onClick={() => setMobileMenuOpen(false)}>Catalog</a>
              </>
            )}
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
          <div className="mobile-menu-actions">
            <button className="institutional-btn secondary small" onClick={() => { setMobileMenuOpen(false); logout(); }}>Logout</button>
            <div className="mobile-menu-bell"><NotificationBell /></div>
          </div>
        </aside>

        <div className="page-intro">
          <div>
            <h2>Welcome, {user?.name || 'user'}</h2>
            <p>Manage student and campus support requests from one institutional dashboard.</p>
          </div>
        </div>

        <div className="stat-grid">
          <div className="metric-card"><strong>{dashboard.stats.departments || 0}</strong><div>Departments</div></div>
          <div className="metric-card"><strong>{dashboard.stats.tickets || 0}</strong><div>Total Tickets</div></div>
          <div className="metric-card"><strong>{dashboard.stats.openTickets || 0}</strong><div>Pending Tickets</div></div>
          <div className="metric-card"><strong>{dashboard.announcements?.length || 0}</strong><div>Announcements</div></div>
        </div>

        <div className="institutional-card" style={{ marginBottom: '20px' }}>
          <div className="map-toolbar">
            <h3>Campus support map</h3>
            <div className="actions">
              <button className="institutional-btn small secondary" onClick={() => setZoomLevel((value) => Math.max(0.8, value - 0.2))}>−</button>
              <button className="institutional-btn small secondary" onClick={() => setZoomLevel(1)}>Reset</button>
              <button className="institutional-btn small secondary" onClick={() => setZoomLevel((value) => Math.min(2.2, value + 0.2))}>+</button>
            </div>
          </div>
          <div className="map-shell">
            <div
              className="map-frame"
            >
              <div
                className="map-image"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img src="/schoolmap.png" alt="Campus map" />
                {visibleDepartments.map((dept, index) => {
                    const pos = getDepartmentMarkerPosition(dept, index);
                    const ticketCount = Number(dept.ticket_count || 0);
                    const markerColor = getHeatColor(ticketCount);
                    const isActive = ticketCount > 0;
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        className={`department-pill${isActive ? ' active' : ''}`}
                        onClick={() => setSelectedDepartment(dept)}
                        style={{ left: `${pos.x}%`, top: `${pos.y}%`, background: markerColor }}
                        title={`${dept.name} (${ticketCount} ticket${ticketCount === 1 ? '' : 's'})`}
                      >
                        {dept.name.slice(0, 2).toUpperCase()}
                      </button>
                    );
                  })}
                {selectedDepartment && (
                  <div className="department-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <strong>{selectedDepartment.name}</strong>
                      <button type="button" onClick={() => setSelectedDepartment(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                    </div>
                    <div className="small-muted" style={{ marginBottom: '0.4rem' }}>{selectedDepartment.description}</div>
                    <div><strong>Point Person:</strong> {selectedDepartment.point_person || 'TBC'}</div>
                    <div><strong>Contact:</strong> {selectedDepartment.contact_number}</div>
                    <div><strong>Office Hours:</strong> {selectedDepartment.office_hours}</div>
                    <div style={{ marginTop: '0.45rem' }}><strong>Volume:</strong> {getVolumeLabel(selectedDepartment.volume_level || 'low')}</div>
                    {selectedDepartment.location && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDepartment.location)}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '0.6rem' }}>
                        Navigate to this department
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="institutional-card">
          <h3>Notifications</h3>
          <div className="notification-list">
            {notifications.map((note) => (
              <div key={note.id}>{note.message}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
