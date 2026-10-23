import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import { getSocket } from './socket';
import AuthenticatedNavigation from './AuthenticatedNavigation';
import { playLoginBell } from './audioUtils';

function DashboardPage() {
  const { user, token, updateAccountUser } = useAuth();
  const [dashboard, setDashboard] = useState({ departments: [], services: [], announcements: [], stats: {} });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [campusMapLoaded, setCampusMapLoaded] = useState(false);
  const [campusMapData, setCampusMapData] = useState({ departments: [], ticketCounts: [], tickets: [] });
  const [campusMapError, setCampusMapError] = useState('');
  const [expandedCampusMap, setExpandedCampusMap] = useState(false);
  const [selectedMapTicket, setSelectedMapTicket] = useState(null);
  const [hoveredMapTicket, setHoveredMapTicket] = useState(null);
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(() => sessionStorage.getItem('assistdesk_show_welcome_splash') === 'true');
  const [staffIdFile, setStaffIdFile] = useState(null);
  const [staffIdSubmitting, setStaffIdSubmitting] = useState(false);
  const [staffIdMessage, setStaffIdMessage] = useState('');
  const [appealMessage, setAppealMessage] = useState('');
  const campusMapFrame = useRef(null);
  const expandedCampusMapFrame = useRef(null);
  const expandMapButton = useRef(null);
  const closeExpandedMapButton = useRef(null);

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
  const isApprovalPending = ['pending_id', 'pending_approval', 'id_rejected'].includes(user?.account_status);
  const isRestrictedAccount = user?.account_status === 'terminated' || isApprovalPending;

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

  const handleStaffIdSelection = (event) => {
    const file = event.target.files?.[0];
    setStaffIdMessage('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setStaffIdFile(null);
      event.target.value = '';
      setStaffIdMessage('Choose a JPG, PNG, or WEBP image of your faculty/staff ID.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setStaffIdFile(null);
      event.target.value = '';
      setStaffIdMessage('The ID image must be 3 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setStaffIdFile({ data: reader.result, name: file.name, type: file.type });
    reader.onerror = () => {
      setStaffIdFile(null);
      event.target.value = '';
      setStaffIdMessage('Unable to read that image. Please select it again.');
    };
    reader.readAsDataURL(file);
  };

  const submitStaffId = async (event) => {
    event.preventDefault();
    if (!staffIdFile || !token || staffIdSubmitting) return;
    setStaffIdSubmitting(true);
    setStaffIdMessage('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/staff-id`, {
        id_document: staffIdFile.data,
        file_name: staffIdFile.name,
        mime_type: staffIdFile.type,
      }, { headers: { Authorization: `Bearer ${token}` } });
      updateAccountUser(response.data.user || { account_status: 'pending_approval', staff_id_submitted: true, staff_id_review_reason: null });
      setStaffIdFile(null);
      const fileInput = document.getElementById('staff-id-document');
      if (fileInput) fileInput.value = '';
      setStaffIdMessage(response.data.message || 'Your ID was submitted for administrator review.');
    } catch (error) {
      setStaffIdMessage(error.response?.data?.message || 'Unable to submit your ID. Please try again.');
    } finally {
      setStaffIdSubmitting(false);
    }
  };

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

  const loadCampusMapData = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/campus-map`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      let mapDepartments = response.data.departments || [];
      let ticketCounts = response.data.ticketCounts || [];
      if (!ticketCounts.length) {
        const dashboardResponse = await axios.get(`${API_BASE_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        mapDepartments = dashboardResponse.data.departments || mapDepartments;
        ticketCounts = dashboardResponse.data.mapTicketCounts || ticketCounts;
      }
      setCampusMapData({
        departments: mapDepartments,
        ticketCounts,
        tickets: response.data.tickets || [],
      });
      setCampusMapError('');
    } catch (error) {
      try {
        const fallback = await axios.get(`${API_BASE_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCampusMapData({
          departments: fallback.data.departments || [],
          ticketCounts: fallback.data.mapTicketCounts || [],
          tickets: fallback.data.tickets || [],
        });
        setCampusMapError('');
      } catch (fallbackError) {
        setCampusMapError(fallbackError.response?.data?.message || error.response?.data?.message || 'Unable to load ticket pinpoints.');
      }
    }
  }, [token]);

  const syncCampusMap = useCallback(() => {
    const frames = [campusMapFrame.current, expandedCampusMapFrame.current]
      .filter((frame) => frame?.contentWindow);
    if (!frames.length) return;

    const mapMessage = {
      type: 'assistdesk:campus-map-data',
      darkMode: document.body.classList.contains('dark-mode'),
      departments: campusMapData.departments.map((department) => ({
        id: Number(department.id),
        name: String(department.name || ''),
        map_x: department.map_x,
        map_y: department.map_y,
      })),
      ticketCounts: campusMapData.ticketCounts.map((row) => ({
        department_id: Number(row.department_id),
        priority: String(row.priority || 'medium'),
        status: String(row.status || 'open'),
        count: Number(row.ticket_count) || 0,
      })),
      tickets: campusMapData.tickets.map((ticket) => ({
        id: ticket.id,
        ticket_code: ticket.ticket_code,
        department_id: Number(ticket.department_id),
        priority: String(ticket.priority || 'medium').toLowerCase(),
        status: String(ticket.status || 'open').toLowerCase(),
        subject: String(ticket.subject || ''),
        description: String(ticket.description || '').replace(/\s+/g, ' ').trim().slice(0, 220),
      })),
    };
    frames.forEach((frame) => frame.contentWindow.postMessage(mapMessage, window.location.origin));
  }, [campusMapData]);

  useEffect(() => {
    syncCampusMap();
  }, [syncCampusMap]);

  useEffect(() => {
    const handleCampusMapReady = (event) => {
      const sourceFrame = [campusMapFrame.current, expandedCampusMapFrame.current]
        .find((frame) => frame?.contentWindow === event.source);
      if (event.origin === window.location.origin && sourceFrame
        && event.data?.type === 'assistdesk:campus-map-ticket-selected') {
        setSelectedMapTicket(event.data.ticket || null);
        return;
      }

      if (event.source === campusMapFrame.current?.contentWindow
        && event.origin === window.location.origin
        && event.data?.type === 'assistdesk:campus-map-expand') {
        setExpandedCampusMap(true);
        return;
      }

      if (!sourceFrame || event.origin !== window.location.origin || event.data?.type !== 'assistdesk:campus-map-ready') return;
      syncCampusMap();
    };

    window.addEventListener('message', handleCampusMapReady);
    return () => window.removeEventListener('message', handleCampusMapReady);
  }, [syncCampusMap]);

  useEffect(() => {
    if (!expandedCampusMap) return undefined;

    closeExpandedMapButton.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setExpandedCampusMap(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      expandMapButton.current?.focus();
    };
  }, [expandedCampusMap]);

  useEffect(() => {
    const themeObserver = new MutationObserver(() => syncCampusMap());
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => themeObserver.disconnect();
  }, [syncCampusMap]);

  useEffect(() => {
    if (!token || isRestrictedAccount) return;

    loadData();
    loadCampusMapData();
    const socket = getSocket();
    if (!socket) return;

    socket.on('ticketCreated', loadData);
    socket.on('ticketCreated', loadCampusMapData);
    socket.on('campusMapUpdated', loadCampusMapData);
    socket.on('ticketStatusUpdated', loadData);
    socket.on('ticketStatusUpdated', loadCampusMapData);
    socket.on('ticketEtaUpdated', loadData);
    socket.on('ticketEtaUpdated', loadCampusMapData);
    socket.on('ticketEtaExpired', loadData);
    socket.on('ticketEtaExpired', loadCampusMapData);
    socket.on('announcementCreated', loadData);

    return () => {
      socket.off('ticketCreated', loadData);
      socket.off('ticketCreated', loadCampusMapData);
      socket.off('campusMapUpdated', loadCampusMapData);
      socket.off('ticketStatusUpdated', loadData);
      socket.off('ticketStatusUpdated', loadCampusMapData);
      socket.off('ticketEtaUpdated', loadData);
      socket.off('ticketEtaUpdated', loadCampusMapData);
      socket.off('ticketEtaExpired', loadData);
      socket.off('ticketEtaExpired', loadCampusMapData);
      socket.off('announcementCreated', loadData);
    };
  }, [token, user?.account_status, loadCampusMapData]);

  useEffect(() => {
    const refreshDashboard = (event) => {
      if (event.detail?.page !== 'dashboard' || !token || isRestrictedAccount) return;
      setDashboardLoading(true);
      loadData();
      loadCampusMapData();
    };

    window.addEventListener('assistdesk:page-refresh', refreshDashboard);
    return () => window.removeEventListener('assistdesk:page-refresh', refreshDashboard);
  }, [token, user?.account_status, loadCampusMapData]);

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
    if (ticket.unavailable) return `${ticket.department_name || 'Campus'} ticket`;
    const subject = String(ticket.subject || '').trim().toLowerCase();
    return subject === 'general request' || subject.includes('administrative') ? 'Current general issue' : ticket.subject;
  };

  const getTicketCode = (ticket) => ticket.unavailable ? 'Details unavailable' : (ticket.ticket_code || `#${ticket.id}`);

  const getShortTicketDescription = (ticket) => {
    if (ticket.unavailable) {
      const department = ticket.department_name || 'this department';
      const status = String(ticket.status || 'open').replace(/_/g, ' ');
      const priority = String(ticket.priority || 'medium').toLowerCase();
      return `This pin marks a ${status}, ${priority}-priority ticket for ${department}. Subject and description are limited to the requester and authorized department staff.`;
    }
    const description = String(ticket.description || '').replace(/\s+/g, ' ').trim();
    if (!description) return 'The requester did not add a description to this ticket.';
    return description.length > 220 ? `${description.slice(0, 217).trimEnd()}…` : description;
  };

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


  if (showWelcomeSplash && !isRestrictedAccount) {
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
    const appealEmail = user.appeal_email || 'fragoaaron@gmail.com';
    const appealSubject = encodeURIComponent('AssistDesk account termination appeal');
    const appealBody = encodeURIComponent([
      'Hello AssistDesk administrator,',
      '',
      appealMessage.trim(),
      '',
      `Name: ${user.name || ''}`,
      `Email: ${user.email || ''}`,
      `Role: ${user.role || ''}`,
      `Department: ${user.department_name || 'Not assigned'}`,
      '',
      'Termination reason:',
      user.termination_reason || 'No reason was recorded.',
    ].join('\n'));
    const appealMailto = `mailto:${appealEmail}?subject=${appealSubject}&body=${appealBody}`;

    return (
      <div className="app-shell">
        <div className="page-shell">
          <AuthenticatedNavigation user={user} subtitle="Account status" minimal />

          <main className="institutional-card" role="alert" style={{ maxWidth: '820px', margin: '48px auto', padding: 'clamp(24px, 5vw, 48px)' }}>
            <div style={{ color: '#a12b2b', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Account terminated</div>
            <h2 style={{ margin: '10px 0 12px' }}>Your account has been terminated</h2>
            <p style={{ lineHeight: 1.7 }}>
              Your account is terminated and access to support services is disabled. If you believe this decision was made in error, contact the administrator or submit an appeal below.
            </p>
            <div className="account-termination-reason">
              <strong>Reason provided by the administrator</strong>
              <p>{user.termination_reason || 'No reason was recorded. Please contact an administrator for details.'}</p>
              {user.terminated_at && <small>Decision date: {new Date(user.terminated_at).toLocaleDateString()}</small>}
            </div>
            <p className="helper-text">Administrator contact: <a href={`mailto:${appealEmail}`}>{appealEmail}</a></p>
            <div className="account-appeal-form">
              <label htmlFor="termination-appeal-message"><strong>Appeal to the administrator</strong></label>
              <p className="helper-text">Explain why you are appealing. The button opens a draft addressed to the administrator for you to review and send.</p>
              <textarea
                id="termination-appeal-message"
                className="institutional-textarea"
                value={appealMessage}
                onChange={(event) => setAppealMessage(event.target.value)}
                placeholder="Write your appeal (20–3000 characters)"
                minLength={20}
                maxLength={3000}
                rows={5}
                aria-describedby="termination-appeal-hint"
              />
              <small id="termination-appeal-hint" className="helper-text">20–3000 characters</small>
              <div className="inline-actions">
                {appealMessage.trim().length >= 20 && appealMessage.trim().length <= 3000
                  ? <a className="institutional-btn" href={appealMailto}>Email appeal to administrator</a>
                  : <button className="institutional-btn" type="button" disabled>Email appeal to administrator</button>}
              </div>
            </div>
            <p className="helper-text" style={{ marginTop: '24px' }}>Other account services are unavailable while the account is terminated. You may sign out below.</p>
          </main>
        </div>
      </div>
    );
  }

  if (isApprovalPending) {
    const canSubmitId = ['pending_id', 'id_rejected'].includes(user.account_status);
    return (
      <div className="app-shell">
        <div className="page-shell">
          <AuthenticatedNavigation user={user} subtitle="Faculty/staff account confirmation" minimal />
          <main className="institutional-card staff-approval-card" role="status" aria-live="polite">
            <p className="eyebrow">Account verification</p>
            <h2>{user.account_status === 'pending_approval' ? 'Waiting for administrator confirmation' : 'Submit your faculty/staff ID'}</h2>
            {user.account_status === 'pending_approval' ? (
              <p>Your email is verified and your ID is in the administrator’s review queue. You can sign in, but account features will unlock after approval.</p>
            ) : (
              <>
                <p>Your email is verified. Upload a clear photo of your faculty/staff ID so an administrator can confirm your account. Access remains limited until the review is complete.</p>
                {user.staff_id_review_reason && <p className="staff-id-review-note"><strong>Administrator note:</strong> {user.staff_id_review_reason}</p>}
                <form className="staff-id-upload-form" onSubmit={submitStaffId}>
                  <label htmlFor="staff-id-document"><strong>Faculty/staff ID image</strong><small>JPG, PNG, or WEBP · up to 3 MB</small></label>
                  <input id="staff-id-document" className="institutional-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleStaffIdSelection} disabled={staffIdSubmitting} required />
                  {staffIdFile && <div className="staff-id-preview"><img src={staffIdFile.data} alt="Selected faculty or staff ID preview" /><span>{staffIdFile.name}</span></div>}
                  {staffIdFile && <button type="button" className="institutional-btn small secondary" onClick={() => {
                    setStaffIdFile(null);
                    const fileInput = document.getElementById('staff-id-document');
                    if (fileInput) fileInput.value = '';
                  }} disabled={staffIdSubmitting}>Choose a different image</button>}
                  <button className="institutional-btn" type="submit" disabled={!staffIdFile || staffIdSubmitting}>
                    {staffIdSubmitting ? 'Submitting ID…' : 'Submit ID for confirmation'}
                  </button>
                  {staffIdMessage && <p className="helper-text" role="status">{staffIdMessage}</p>}
                </form>
              </>
            )}
            <p className="helper-text staff-approval-signout">You can sign out at any time. No other account features are available until confirmation.</p>
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
              <p className="map-subtitle">Ticket-volume heat clouds and priority pinpoints across departments. Double-click the map to expand.</p>
              {campusMapError && <p className="map-subtitle" role="alert">{campusMapError}</p>}
            </div>
            <div className="map-toolbar-actions">
              <div className="map-toolbar-pill">Live map</div>
              <button ref={expandMapButton} type="button" className="institutional-btn secondary small map-expand-button" onClick={() => setExpandedCampusMap(true)}>
                Expand map
              </button>
            </div>
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

        {expandedCampusMap && (
          <div className="campus-map-expanded-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setExpandedCampusMap(false);
          }}>
            <section className="campus-map-expanded-dialog" role="dialog" aria-modal="true" aria-labelledby="expanded-campus-map-title">
              <header className="campus-map-expanded-header">
                <div>
                  <h2 id="expanded-campus-map-title">Campus 3D map</h2>
                  <p>Drag to rotate, scroll or pinch to zoom.</p>
                </div>
                <button ref={closeExpandedMapButton} type="button" className="map-ticket-detail-close campus-map-expanded-close" onClick={() => setExpandedCampusMap(false)} aria-label="Close expanded campus map">×</button>
              </header>
              <iframe
                ref={expandedCampusMapFrame}
                src="/campus-map-3d-v3.html"
                title="Expanded campus 3D map"
                className="campus-map-expanded-frame"
                onLoad={syncCampusMap}
              />
            </section>
          </div>
        )}

        {selectedMapTicket && (
          <div className="map-ticket-detail-backdrop" role="presentation" onClick={() => setSelectedMapTicket(null)}>
            <div className="map-ticket-detail" role="dialog" aria-modal="true" aria-labelledby="map-ticket-detail-title" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="map-ticket-detail-close" onClick={() => setSelectedMapTicket(null)} aria-label="Close ticket summary">×</button>
              <p className="small-muted">Ticket details</p>
              <h3 id="map-ticket-detail-title">{getTicketMapSubject(selectedMapTicket)}</h3>
              <div className="map-ticket-detail-meta">
                {!selectedMapTicket.unavailable && <span>ID: {getTicketCode(selectedMapTicket)}</span>}
                <span>Status: {selectedMapTicket.status || 'open'}</span>
                {selectedMapTicket.priority && <span>Priority: {selectedMapTicket.priority}</span>}
              </div>
              <p>{getTicketMapSubject(selectedMapTicket)}</p>
              <span className="map-ticket-description-label">Short description</span>
              <p className="map-ticket-detail-description">{getShortTicketDescription(selectedMapTicket)}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default DashboardPage;
