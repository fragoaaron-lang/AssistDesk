import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import LogoutButton from './LogoutButton';
import HeaderProfile from './HeaderProfile';
import SidebarProfile from './SidebarProfile';

function AdminReportsPage() {
  const { token, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reports, setReports] = useState(null);
  const [message, setMessage] = useState('');
  const [expandedRequesterDepartments, setExpandedRequesterDepartments] = useState({});

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

  const groupedRecentTickets = Object.values((reports?.recentTickets || []).reduce((groups, ticket) => {
    const requesterDepartment = ticket.User?.Department;
    const departmentName = requesterDepartment?.name || 'Unassigned Department';
    const departmentId = departmentName.toLowerCase().replace(/\bdepartment\b/g, '').replace(/\s+/g, ' ').trim() || 'unassigned';
    const displayName = departmentName.toLowerCase().includes('maintenance') ? 'Maintenance Department' : departmentName;
    if (!groups[departmentId]) groups[departmentId] = { name: displayName, tickets: [] };
    groups[departmentId].tickets.push(ticket);
    return groups;
  }, {})).sort((first, second) => first.name.localeCompare(second.name));

  const toggleRequesterDepartment = (departmentName) => {
    setExpandedRequesterDepartments((current) => ({
      ...current,
      [departmentName]: current[departmentName] !== true,
    }));
  };

  const getChartWidth = (value, rows) => {
    const maximum = Math.max(...rows.map((row) => Number(row.count) || 0), 1);
    return `${Math.max(4, ((Number(value) || 0) / maximum) * 100)}%`;
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
          <button type="button" className="header-brand header-brand-button" onClick={() => window.location.reload()} aria-label="Refresh AssistDesk">
            <div className="brand-badge">
              <img src="/assistdesk-logo.svg" alt="AssistDesk logo" />
            </div>
            <div>
              <h1>AssistDesk</h1>
              <p>Administrative analytics</p>
            </div>
          </button>
          <div className="nav-links">
            <a href="/dashboard">Dashboard</a>
            <a href="/tickets">Tickets</a>
            <a href="/profile">Profile</a>
            {user?.role === 'admin' && (
              <>
                <a href="/admin/reports">Reports</a>
              </>
            )}
          </div>
          <div className="header-actions">
            <HeaderProfile user={user} />
            <LogoutButton />
          </div>
        </header>

        <aside className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-head">
            <button type="button" className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>×</button>
          </div>
          <div className="mobile-profile-summary">
            <SidebarProfile user={user} />
          </div>
          <div className="nav-links">
            <a href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
            <a href="/tickets" onClick={() => setMobileMenuOpen(false)}>Tickets</a>
            <a href="/profile" onClick={() => setMobileMenuOpen(false)}>Profile</a>
            {user?.role === 'admin' && (
              <>
                <a href="/admin/reports" onClick={() => setMobileMenuOpen(false)}>Reports</a>
              </>
            )}
          </div>
          <div className="mobile-menu-actions">
            <LogoutButton onBeforeLogout={() => setMobileMenuOpen(false)} />
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
            <h3>Ticket analytics</h3>
            <div className="report-chart" aria-label="Tickets by department">
              <strong className="report-chart-title">Tickets by department</strong>
              {reports.ticketCountsByDepartment.length === 0 ? <p className="small-muted">No department activity</p> : reports.ticketCountsByDepartment.map((row) => (
                <div key={row.department_id} className="report-chart-row">
                  <div className="report-chart-label"><span>{row.department_name}</span><strong>{row.count}</strong></div>
                  <div className="report-chart-track"><span className="report-chart-bar department" style={{ width: getChartWidth(row.count, reports.ticketCountsByDepartment) }} /></div>
                </div>
              ))}
            </div>
            <div className="report-chart" aria-label="Tickets by status">
              <strong className="report-chart-title">Tickets by status</strong>
              {reports.ticketCountsByStatus.map((row) => (
                <div key={row.status} className="report-chart-row">
                  <div className="report-chart-label"><span>{row.status}</span><strong>{row.count}</strong></div>
                  <div className="report-chart-track"><span className="report-chart-bar status" style={{ width: getChartWidth(row.count, reports.ticketCountsByStatus) }} /></div>
                </div>
              ))}
            </div>
            <div className="report-chart" aria-label="Tickets by requester">
              <strong className="report-chart-title">Tickets by requester</strong>
              {(reports.ticketCountsByRequester || []).length === 0 ? <p className="small-muted">No requester activity</p> : reports.ticketCountsByRequester.slice(0, 8).map((row) => (
                <div key={row.requester_id} className="report-chart-row">
                  <div className="report-chart-label"><span>{row.requester_name}</span><strong>{row.count}</strong></div>
                  <div className="report-chart-track"><span className="report-chart-bar requester" style={{ width: getChartWidth(row.count, reports.ticketCountsByRequester) }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="institutional-card">
            <h3>Trend analytics</h3>
            <div className="report-chart" aria-label="Tickets created over the last 30 days">
              <strong className="report-chart-title">30-day ticket trend</strong>
              {reports.monthlyTicketCounts.length === 0 ? <p className="small-muted">No recent activity</p> : (
                <div className="report-trend-chart">
                  {reports.monthlyTicketCounts.map((row) => (
                    <div key={row.date} className="report-trend-column" title={`${row.date}: ${row.count} ticket(s)`}>
                      <span className="report-trend-bar" style={{ height: getChartWidth(row.count, reports.monthlyTicketCounts) }} />
                      <small>{String(row.date).slice(5)}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <h3>Recent Ticket Activity by Requester Department</h3>
            <div className="list-stack">
              {groupedRecentTickets.map((departmentGroup) => (
                <section key={departmentGroup.name} className="ticket-department-group">
                  <button type="button" className="ticket-department-heading" onClick={() => toggleRequesterDepartment(departmentGroup.name)} aria-expanded={expandedRequesterDepartments[departmentGroup.name] === true}>
                    <span className="ticket-folder-icon" aria-hidden="true" />
                    <span>{departmentGroup.name}</span>
                    <span className="ticket-department-count">{departmentGroup.tickets.length}</span>
                  </button>
                  {expandedRequesterDepartments[departmentGroup.name] === true && (
                    <div className="ticket-department-contents">
                      {departmentGroup.tickets.map((ticket) => (
                        <div key={ticket.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
                          <div><strong>{ticket.ticket_code || `#${ticket.id}`} · {ticket.subject}</strong></div>
                          <div>Status: {ticket.status}</div>
                          <div>Routed department: {ticket.Department?.name || 'N/A'}</div>
                          <div>Requester: {ticket.User?.name || ticket.User?.email || 'N/A'}</div>
                          <div className="small-muted">Created: {new Date(ticket.created_at).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        </section>
        <section className="institutional-card report-table-card">
          <h3>Ticket detail table</h3>
          <div className="report-table-scroll">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Department</th>
                  <th>Requester</th>
                  <th>Issue</th>
                </tr>
              </thead>
              <tbody>
                {reports.recentTickets.length === 0 ? (
                  <tr><td colSpan="5" className="small-muted">No ticket activity</td></tr>
                ) : reports.recentTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                    <td><span className={`report-status ${ticket.status}`}>{ticket.status}</span></td>
                    <td>{ticket.Department?.name || 'Unassigned'}</td>
                    <td>{ticket.User?.name || ticket.User?.email || 'Unknown'}</td>
                    <td>{ticket.subject}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminReportsPage;
