import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import { getSocket } from './socket';
import AuthenticatedNavigation from './AuthenticatedNavigation';
import { playLoginBell } from './audioUtils';

function DashboardPage() {
  const { user, token } = useAuth();
  const [dashboard, setDashboard] = useState({ departments: [], services: [], announcements: [], stats: {} });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [campusMapLoaded, setCampusMapLoaded] = useState(false);
  const [selectedMapTicket, setSelectedMapTicket] = useState(null);
  const [hoveredMapTicket, setHoveredMapTicket] = useState(null);
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(() => sessionStorage.getItem('assistdesk_show_welcome_splash') === 'true');
  const campusMapFrame = useRef(null);

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

  const dashboardSummary = useMemo(() => {
    const tickets = dashboard.tickets || [];
    const openTicketCount = tickets.filter((ticket) => String(ticket.status || '').toLowerCase() === 'open').length;
    const activeTickets = tickets.length ? openTicketCount : visibleDepartments.reduce((total, department) => total + Number(department.ticket_count || 0), 0);
    const urgentTickets = tickets.filter((ticket) => String(ticket.priority || '').toLowerCase() === 'urgent').length;
    const liveDepartments = visibleDepartments.filter((department) => Number(department.ticket_count || 0) > 0).length;

    return {
      activeTickets,
      urgentTickets,
      liveDepartments,
      totalDepartments: visibleDepartments.length,
    };
  }, [dashboard.tickets, visibleDepartments]);

  const dashboardHighlights = useMemo(() => {
    const announcementList = (dashboard.announcements || []).slice(0, 3);
    const serviceList = (dashboard.services || []).slice(0, 4);

    return { announcementList, serviceList };
  }, [dashboard.announcements, dashboard.services]);

  const getPriorityByIndex = (index) => ['low', 'medium', 'urgent'][index % 3];

  const mapTickets = useMemo(() => {
    if (dashboard.tickets && dashboard.tickets.length > 0) return dashboard.tickets;

    return visibleDepartments.flatMap((department) => (
      Array.from({ length: Number(department.ticket_count || 0) }, (_, index) => ({
        id: `department-${department.id}-ticket-${index}`,
        department_id: department.id,
        subject: `Ticket ${index + 1} - ${department.name}`,
        priority: getPriorityByIndex(index),
        status: 'open',
      }))
    ));
  }, [dashboard.tickets, visibleDepartments]);

  const loadData = async () => {
    try {
      const dashboardRes = await axios.get(`${API_BASE_URL}/api/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
      setDashboard(dashboardRes.data);

      if (sessionStorage.getItem('assistdesk_play_login_sound') === 'true') {
        window.setTimeout(() => {
          playLoginBell({ duration: 0.9 });
          sessionStorage.removeItem('assistdesk_play_login_sound');
        }, 350);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const syncCampusMap = useCallback(() => {
    const frame = campusMapFrame.current;
    if (!frame?.contentWindow) return;

    frame.contentWindow.postMessage({
      type: 'assistdesk:campus-map-data',
      darkMode: document.body.classList.contains('dark-mode'),
      departments: visibleDepartments.map((department) => ({
        id: Number(department.id),
        name: String(department.name || ''),
        map_x: department.map_x,
        map_y: department.map_y,
      })),
      ticketCounts: (dashboard.mapTicketCounts || []).map((row) => ({
        department_id: Number(row.department_id),
        priority: String(row.priority || 'medium'),
        status: String(row.status || 'open'),
        count: Number(row.ticket_count) || 0,
      })),
    }, window.location.origin);
  }, [dashboard, visibleDepartments]);

  useEffect(() => {
    syncCampusMap();
  }, [syncCampusMap]);

  useEffect(() => {
    const themeObserver = new MutationObserver(() => syncCampusMap());
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => themeObserver.disconnect();
  }, [syncCampusMap]);

  useEffect(() => {
    if (!token || user?.account_status === 'terminated') return;

    loadData();
    const socket = getSocket();
    if (!socket) return;

    socket.on('ticketCreated', loadData);
    socket.on('ticketStatusUpdated', loadData);
    socket.on('ticketEtaUpdated', loadData);
    socket.on('ticketEtaExpired', loadData);
    socket.on('announcementCreated', loadData);

    return () => {
      socket.off('ticketCreated', loadData);
      socket.off('ticketStatusUpdated', loadData);
      socket.off('ticketEtaUpdated', loadData);
      socket.off('ticketEtaExpired', loadData);
      socket.off('announcementCreated', loadData);
    };
  }, [token, user?.account_status]);

  useEffect(() => {
    const refreshDashboard = (event) => {
      if (event.detail?.page !== 'dashboard' || !token || user?.account_status === 'terminated') return;
      setDashboardLoading(true);
      loadData();
    };

    window.addEventListener('assistdesk:page-refresh', refreshDashboard);
    return () => window.removeEventListener('assistdesk:page-refresh', refreshDashboard);
  }, [token, user?.account_status]);

  const getHeatStrength = (count) => Math.min(0.98, 0.38 + (Number(count) * 0.16));

  const getVolumeLabel = (level) => {
    if (level === 'urgent') return 'High Volume';
    if (level === 'medium') return 'Moderate Volume';
    return 'Low Volume';
  };

  const getBuildingPosition = (department) => {
    const x = Number(department?.map_x);
    const y = Number(department?.map_y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) return null;
    return { x, y };
  };

  const getTicketPosition = (ticket, departmentTicketIndex) => {
    const department = visibleDepartments.find((item) => Number(item.id) === Number(ticket.department_id));
    const basePosition = getBuildingPosition(department);
    if (!basePosition) return null;
    const angle = departmentTicketIndex * 2.39996;
    const radius = departmentTicketIndex === 0 ? 0 : Math.min(7, 2.5 + departmentTicketIndex * 0.8);
    return { x: basePosition.x + Math.cos(angle) * radius, y: basePosition.y + Math.sin(angle) * radius };
  };

  const getTicketHoverDescription = (ticket) => {
    const subject = String(ticket.subject || '').replace(/\s+/g, ' ').trim();
    const normalizedSubject = subject.toLowerCase();
    if (normalizedSubject === 'general request' || normalizedSubject.includes('administrative')) return 'Current general issue';
    return subject || 'Current general issue';
  };

  const getTicketMapSubject = (ticket) => {
    const subject = String(ticket.subject || '').trim().toLowerCase();
    return subject === 'general request' || subject.includes('administrative') ? 'Current general issue' : ticket.subject;
  };

  const getTicketCode = (ticket) => ticket.ticket_code || `#${ticket.id}`;

  const renderMapTicketSummary = (ticket, compact = false) => (
    <>
      <div className="map-ticket-summary-topline">
        <strong>{getTicketCode(ticket)}</strong>
        <span className={`map-ticket-status ${ticket.status || 'open'}`}>{ticket.status || 'open'}</span>
      </div>
      <strong className="map-ticket-summary-subject">{getTicketMapSubject(ticket)}</strong>
      <span className="map-ticket-summary-description">{getTicketHoverDescription(ticket)}</span>
      {!compact && ticket.description && <p>{ticket.description}</p>}
    </>
  );


  if (showWelcomeSplash && user?.account_status !== 'terminated') {
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

  if (user?.account_status === 'terminated') {
    const appealSubject = encodeURIComponent('Appeal of AssistDesk account termination');
    const appealBody = encodeURIComponent(`Hello AssistDesk administrator,\n\nI would like to appeal the termination of my account.\n\nName: ${user.name || ''}\nEmail: ${user.email || ''}\n\nPlease review my account.\n`);
    const appealMailLink = user.appeal_email
      ? `mailto:${user.appeal_email}?subject=${appealSubject}&body=${appealBody}`
      : null;

    return (
      <div className="app-shell">
        <div className="page-shell">
          <AuthenticatedNavigation user={user} subtitle="Account status" minimal />

          <main className="institutional-card" role="alert" style={{ maxWidth: '820px', margin: '48px auto', padding: 'clamp(24px, 5vw, 48px)' }}>
            <div style={{ color: '#a12b2b', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Account terminated</div>
            <h2 style={{ margin: '10px 0 12px' }}>Your account has been terminated</h2>
            <p style={{ lineHeight: 1.7 }}>
              This account was terminated because it violated AssistDesk policies and regulations. If you believe this decision was made in error, you may appeal to an administrator by email.
            </p>
            <div className="inline-actions" style={{ marginTop: '24px', gap: '12px' }}>
              {appealMailLink ? (
                <a className="institutional-btn small secondary" href={appealMailLink}>Appeal by email</a>
              ) : (
                <p className="helper-text" style={{ flexBasis: '100%' }}>Email appeals are not configured. Please contact an administrator directly.</p>
              )}
            </div>
            <p className="helper-text" style={{ marginTop: '24px' }}>Other account services are unavailable while the account is terminated. You may sign out below.</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell dashboard-heatmap-shell">
      <div className="dashboard-heatmap-background" aria-hidden="true">
        <iframe
          src="/campus-map-3d-v3.html?background=1"
          title=""
          tabIndex={-1}
          className="dashboard-campus-map-background"
          loading="eager"
        />
      </div>
      <div className="page-shell">
        <AuthenticatedNavigation user={user} subtitle="Institutional support portal" />

        <section className="dashboard-overview" aria-label="Dashboard status overview" aria-busy={dashboardLoading}>
          <div className="overview-intro">
            <p className="eyebrow">Operations overview</p>
            <h2>Campus support at a glance</h2>
          </div>
          {dashboardLoading ? (
            <div className="overview-grid dashboard-summary-skeleton" role="status" aria-label="Loading dashboard ticket summary" aria-busy="true">
              <span className="report-skeleton-announcement">Loading dashboard ticket summary…</span>
              {[0, 1, 2, 3].map((index) => (
                <div className={`overview-stat dashboard-stat-skeleton${index === 0 ? ' primary' : ''}`} key={index} aria-hidden="true">
                  <span className="surface-skeleton-block dashboard-stat-label" />
                  <span className="surface-skeleton-block dashboard-stat-value" />
                  <span className="surface-skeleton-block dashboard-stat-detail" />
                </div>
              ))}
            </div>
          ) : (
          <div className="overview-grid">
            <a className="overview-stat primary" href="/tickets?status=open" aria-label={`View ${dashboardSummary.activeTickets} open tickets`}>
              <span className="overview-label">Open tickets</span>
              <strong>{dashboardSummary.activeTickets}</strong>
              <small>{dashboardSummary.urgentTickets} urgent items</small>
            </a>
            <section className="overview-stat dashboard-activity-overview-stat" aria-label="Your recent activity">
              <div className="dashboard-activity-heading">
                <div>
                  <h3>Your recent activity</h3>
                  <p>Actions recorded for your account.</p>
                </div>
                <a href="/profile#activity-history">View history</a>
              </div>
            </section>
            <a className="overview-stat" href="/tickets?priority=urgent" aria-label={`View ${dashboardSummary.urgentTickets} urgent tickets needing triage`}>
              <span className="overview-label">High priority</span>
              <strong>{dashboardSummary.urgentTickets}</strong>
              <small>need triage today</small>
            </a>
            <a className="overview-stat" href="/dashboard#campus-map" aria-label="View the live campus ticket map">
              <span className="overview-label">Campus pulse</span>
              <strong>{dashboardSummary.activeTickets > 0 ? 'Live' : 'Quiet'}</strong>
              <small>{dashboardSummary.activeTickets > 0 ? 'Tickets are moving' : 'No open requests'}</small>
            </a>
          </div>
          )}
        </section>

        <div id="campus-map" className="institutional-card" style={{ marginBottom: '20px' }}>
          <div className="map-toolbar">
            <div>
              <h3>Campus 3D overview</h3>
              <p className="map-subtitle">Ticket-volume heat clouds and priority pinpoints across departments.</p>
            </div>
            <div className="map-toolbar-pill">Live map</div>
          </div>
          <div className="map-shell dashboard-map-shell" aria-busy={dashboardLoading || !campusMapLoaded}>
            <div className="map-frame campus-3d-frame">
              <iframe
                ref={campusMapFrame}
                src="/campus-map-3d-v3.html"
                title="Campus 3D map"
                className="campus-map-embed"
                loading="lazy"
                onLoad={() => {
                  setCampusMapLoaded(true);
                  syncCampusMap();
                }}
              />
              {(dashboardLoading || !campusMapLoaded) && (
                <div className="dashboard-map-skeleton" role="status" aria-label="Loading campus ticket map" aria-busy="true">
                  <span className="report-skeleton-announcement">Loading campus ticket map…</span>
                  <span className="surface-skeleton-block dashboard-map-skeleton-canvas" aria-hidden="true" />
                  <span className="surface-skeleton-block dashboard-map-skeleton-label" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedMapTicket && (
          <div className="map-ticket-detail-backdrop" role="presentation" onClick={() => setSelectedMapTicket(null)}>
            <div className="map-ticket-detail" role="dialog" aria-modal="true" aria-labelledby="map-ticket-detail-title" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="map-ticket-detail-close" onClick={() => setSelectedMapTicket(null)} aria-label="Close ticket summary">×</button>
              <p className="small-muted">Ticket details</p>
              <h3 id="map-ticket-detail-title">{getTicketMapSubject(selectedMapTicket)}</h3>
              <div className="map-ticket-detail-meta">
                <span>ID: {getTicketCode(selectedMapTicket)}</span>
                <span>Status: {selectedMapTicket.status || 'open'}</span>
              </div>
              <p>{getTicketHoverDescription(selectedMapTicket)}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default DashboardPage;
