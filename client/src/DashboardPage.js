import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import { getSocket } from './socket';
import NotificationBell from './NotificationBell';
import LogoutButton from './LogoutButton';

function DashboardPage() {
  const { user, token } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboard, setDashboard] = useState({ departments: [], announcements: [], stats: {} });
  const [notifications, setNotifications] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(() => sessionStorage.getItem('assistdesk_show_welcome_splash') === 'true');

  useEffect(() => {
    if (!showWelcomeSplash) return;

    const splashTimer = window.setTimeout(() => {
      sessionStorage.removeItem('assistdesk_show_welcome_splash');
      sessionStorage.removeItem('assistdesk_welcome_name');
      setShowWelcomeSplash(false);
    }, 1800);

    return () => window.clearTimeout(splashTimer);
  }, [showWelcomeSplash]);

  const welcomeName = (sessionStorage.getItem('assistdesk_welcome_name') || user?.name || 'User').split(' ')[0];

  const visibleDepartments = dashboard.departments || [];

  const mapTickets = useMemo(() => {
    if (dashboard.tickets && dashboard.tickets.length > 0) return dashboard.tickets;

    return visibleDepartments.flatMap((department) => (
      Array.from({ length: Number(department.ticket_count || 0) }, (_, index) => ({
        id: `department-${department.id}-ticket-${index}`,
        department_id: department.id,
        subject: `Ticket ${index + 1} - ${department.name}`,
        priority: 'medium',
        status: 'open',
      }))
    ));
  }, [dashboard.tickets, visibleDepartments]);

  const loadData = async () => {
    try {
      const dashboardRes = await axios.get(`${API_BASE_URL}/api/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
      const notificationsRes = await axios.get(`${API_BASE_URL}/api/dashboard/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      
      setDashboard(dashboardRes.data);
      setNotifications(notificationsRes.data);
      
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

  const getHeatStrength = (count) => Math.min(0.92, 0.2 + (Number(count) * 0.12));

  const getVolumeLabel = (level) => {
    if (level === 'high') return 'High Volume';
    if (level === 'moderate') return 'Moderate Volume';
    return 'Low Volume';
  };

  const getBuildingPosition = (department) => {
    const name = String(department.name || '').toLowerCase();
    if (name.includes('crim')) return { x: 64, y: 13 };
    if (name.includes('nurs')) return { x: 60, y: 75 };
    if (name.includes('clinic')) return { x: 54, y: 35 };
    if (name.includes('maintenance')) return { x: 82, y: 57 };
    if (name.includes('student')) return { x: 18, y: 34 };
    if (name.includes('account')) return { x: 52, y: 45 };
    if (name.includes('education')) return { x: 54, y: 22 };
    if (name.includes('hm') || name.includes('charm')) return { x: 24, y: 9 };
    if (name.includes('cs') || name.includes('technology')) return { x: 42, y: 34 };
    return { x: 50, y: 50 };
  };

  const getTicketPosition = (ticket, departmentTicketIndex) => {
    const department = (dashboard.departments || []).find((item) => Number(item.id) === Number(ticket.department_id));
    const basePosition = getBuildingPosition(department || {});
    const angle = departmentTicketIndex * 2.39996;
    const radius = departmentTicketIndex === 0 ? 0 : Math.min(7, 2.5 + departmentTicketIndex * 0.8);
    return {
      x: basePosition.x + Math.cos(angle) * radius,
      y: basePosition.y + Math.sin(angle) * radius,
    };
  };


  if (showWelcomeSplash) {
    return (
      <main className="splash-screen" aria-label="Loading AssistDesk">
        <div className="splash-mark">
          <div className="splash-logo-wrap">
            <img src="/assistdesk-logo.svg" alt="" />
          </div>
          <span className="splash-pulse" />
        </div>
        <h1>{`Welcome back, ${welcomeName}`}</h1>
        <p>Preparing your support workspace</p>
        <div className="splash-progress" aria-hidden="true"><span /></div>
      </main>
    );
  }

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
              <p>Institutional support portal</p>
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

        <div className="institutional-card" style={{ marginBottom: '20px' }}>
          <div className="map-toolbar">
            <div>
              <h3>Campus request forecast</h3>
              <p className="map-subtitle">Live request intensity by building</p>
            </div>
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
                <div className="heatmap-layer" aria-hidden="true">
                  {visibleDepartments.filter((dept) => Number(dept.ticket_count || 0) > 0).map((dept) => {
                    const pos = getBuildingPosition(dept);
                    const ticketCount = Number(dept.ticket_count || 0);
                    return (
                      <span
                        key={`heat-${dept.id}`}
                        className="heatmap-spot"
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          '--heat-opacity': getHeatStrength(ticketCount),
                          '--heat-size': `${Math.min(34, 16 + ticketCount * 2)}%`,
                        }}
                      />
                    );
                  })}
                </div>
                <div className="ticket-pin-layer">
                  {mapTickets.map((ticket, index) => {
                    const departmentTicketIndex = mapTickets
                      .slice(0, index)
                      .filter((item) => Number(item.department_id) === Number(ticket.department_id))
                      .length;
                    const pos = getTicketPosition(ticket, departmentTicketIndex);
                    return (
                      <span
                        key={`ticket-pin-${ticket.id}`}
                        className={`ticket-pin ${ticket.priority || 'medium'}`}
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        title={`${ticket.subject} (${ticket.status})`}
                        role="img"
                        aria-label={`${ticket.subject}, ${ticket.status}`}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="heatmap-legend" role="region" aria-label="Map legend">
                <strong>Request intensity</strong>
                <span>
                  <span className="legend-swatch low" aria-hidden="true"></span>
                  Low
                </span>
                <span>
                  <span className="legend-swatch moderate" aria-hidden="true"></span>
                  Moderate
                </span>
                <span>
                  <span className="legend-swatch high" aria-hidden="true"></span>
                  High
                </span>
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
