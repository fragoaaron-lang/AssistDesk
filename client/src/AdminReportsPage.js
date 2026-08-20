import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import NotificationBell from './NotificationBell';

function AdminReportsPage() {
  const { token, logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reports, setReports] = useState(null);
  const [message, setMessage] = useState('');

  const loadReports = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data);
    } catch (error) {
      setMessage('Unable to load reports.');
    }
  };

  useEffect(() => {
    if (token) loadReports();
  }, [token]);

  const downloadCsv = () => {
    if (!reports) return;
    const rows = [
      ['Subject', 'Status', 'Department', 'User', 'Created At'],
      ...reports.recentTickets.map((ticket) => [
        ticket.subject,
        ticket.status,
        ticket.Department?.name || 'N/A',
        ticket.User?.email || 'N/A',
        new Date(ticket.created_at).toLocaleString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recent-tickets.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!reports) {
    return <div style={{ padding: '2rem', fontFamily: 'Arial' }}>Loading reports...</div>;
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
          <div className="header-brand">
            <div className="brand-badge">
              <img src="/assistdesk-logo.svg" alt="AssistDesk logo" />
            </div>
            <div>
              <h1>AssistDesk</h1>
              <p>Administrative analytics</p>
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
            <h2>Institutional reports</h2>
            <p>Monitor service trends, support demand, and operational activity.</p>
          </div>
          <button className="institutional-btn" onClick={downloadCsv}>Export Recent Tickets</button>
        </div>
        {message && <p>{message}</p>}

        <section className="stat-grid" style={{ marginBottom: '20px' }}>
          <div className="metric-card">
            <h4>Total Departments</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{reports.ticketCountsByDepartment.length}</div>
          </div>
          <div className="metric-card">
            <h4>Ticket Status Breakout</h4>
            {reports.ticketCountsByStatus.map((row) => (
              <div key={row.status}>{row.status}: {row.count}</div>
            ))}
          </div>
          <div className="metric-card">
            <h4>User Roles</h4>
            {reports.usersByRole.map((row) => (
              <div key={row.role}>{row.role}: {row.count}</div>
            ))}
          </div>
          <div className="metric-card">
            <h4>30-day Ticket Trend</h4>
            {reports.monthlyTicketCounts.length === 0 ? (
              <div>No recent activity</div>
            ) : (
              reports.monthlyTicketCounts.slice(-5).map((row) => (
                <div key={row.date}>{row.date}: {row.count}</div>
              ))
            )}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', marginBottom: '1.5rem' }}>
          <div className="institutional-card">
            <h3>Tickets by Department</h3>
            {reports.ticketCountsByDepartment.map((row) => (
              <div key={row.department_id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                <strong>{row.department_name}</strong>
                <div>{row.count} ticket(s)</div>
              </div>
            ))}
          </div>
          <div className="institutional-card">
            <h3>Recent Ticket Activity</h3>
            {reports.recentTickets.map((ticket) => (
              <div key={ticket.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
                <div><strong>{ticket.subject}</strong></div>
                <div>Status: {ticket.status}</div>
                <div>Department: {ticket.Department?.name || 'N/A'}</div>
                <div className="small-muted">Created: {new Date(ticket.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminReportsPage;
