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

  const getTotalCount = (rows) => rows.reduce((total, row) => total + (Number(row.count) || 0), 0);

  const getDonutStyle = (rows) => {
    const total = getTotalCount(rows) || 1;
    let offset = 0;
    const colors = ['#1687c9', '#55b9e8', '#f0b44d', '#e47b54', '#7a91a8'];
    const stops = rows.map((row, index) => {
      const start = offset;
      offset += ((Number(row.count) || 0) / total) * 360;
      return `${colors[index % colors.length]} ${start}deg ${offset}deg`;
    });
    return { background: `conic-gradient(${stops.join(', ') || '#d9e6ef 0deg 360deg'})` };
  };

  if (!reports) {
    return <div style={{ padding: '2rem', fontFamily: 'Arial' }}>Loading Data Analytics...</div>;
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
                <a href="/admin/reports">Data Analytics</a>
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
                <a href="/admin/reports" onClick={() => setMobileMenuOpen(false)}>Data Analytics</a>
              </>
            )}
          </div>
          <div className="mobile-menu-actions">
            <LogoutButton onBeforeLogout={() => setMobileMenuOpen(false)} />
          </div>
        </aside>

        <div className="page-intro">
          <div>
            <h2>Data Analytics</h2>
            <p>Monitor service trends, support demand, and operational activity.</p>
          </div>
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

        <section className="report-visual-grid">
          <div className="institutional-card report-trend-card">
            <div className="report-card-heading"><div><h3>Income</h3><span>Ticket volume by date</span></div><strong>{getTotalCount(reports.monthlyTicketCounts)} tickets</strong></div>
            {reports.monthlyTicketCounts.length === 0 ? <p className="small-muted">No recent activity</p> : (
              <div className="report-area-chart" aria-label="Tickets created over the last 30 days">
                {reports.monthlyTicketCounts.map((row) => (
                  <div key={row.date} className="report-trend-column" title={`${row.date}: ${row.count} ticket(s)`}>
                    <span className="report-trend-bar" style={{ height: getChartWidth(row.count, reports.monthlyTicketCounts) }} />
                    <small>{String(row.date).slice(5)}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="institutional-card report-donut-card">
            <div className="report-card-heading"><div><h3>Status</h3><span>Ticket distribution</span></div><strong>{getTotalCount(reports.ticketCountsByStatus)}</strong></div>
            <div className="report-donut" style={getDonutStyle(reports.ticketCountsByStatus)}><span>{getTotalCount(reports.ticketCountsByStatus)}</span></div>
            <div className="report-legend">{reports.ticketCountsByStatus.map((row, index) => <span key={row.status}><i className={`legend-dot legend-dot-${index % 5}`} />{row.status} <strong>{row.count}</strong></span>)}</div>
          </div>
          <div className="institutional-card report-donut-card">
            <div className="report-card-heading"><div><h3>Concerns</h3><span>Categories</span></div><strong>{getTotalCount(reports.ticketCountsByConcern || [])}</strong></div>
            <div className="report-donut" style={getDonutStyle(reports.ticketCountsByConcern || [])}><span>{getTotalCount(reports.ticketCountsByConcern || [])}</span></div>
            <div className="report-legend">{(reports.ticketCountsByConcern || []).slice(0, 5).map((row, index) => <span key={row.concern}><i className={`legend-dot legend-dot-${index % 5}`} />{row.concern} <strong>{row.count}</strong></span>)}</div>
          </div>
          <div className="institutional-card report-bars-card">
            <h3>Department growth</h3>
            <div className="report-chart" aria-label="Tickets by department">
              {reports.ticketCountsByDepartment.length === 0 ? <p className="small-muted">No department activity</p> : reports.ticketCountsByDepartment.map((row) => (
                <div key={row.department_id} className="report-chart-row"><div className="report-chart-label"><span>{row.department_name}</span><strong>{row.count}</strong></div><div className="report-chart-track"><span className="report-chart-bar department" style={{ width: getChartWidth(row.count, reports.ticketCountsByDepartment) }} /></div></div>
              ))}
            </div>
          </div>
          <div className="institutional-card report-bars-card">
            <h3>Requester activity</h3>
            <div className="report-chart" aria-label="Tickets by requester">
              {(reports.ticketCountsByRequester || []).length === 0 ? <p className="small-muted">No requester activity</p> : reports.ticketCountsByRequester.slice(0, 8).map((row) => (
                <div key={row.requester_id} className="report-chart-row"><div className="report-chart-label"><span>{row.requester_name}</span><strong>{row.count}</strong></div><div className="report-chart-track"><span className="report-chart-bar requester" style={{ width: getChartWidth(row.count, reports.ticketCountsByRequester) }} /></div></div>
              ))}
            </div>
          </div>
          <div className="institutional-card report-bars-card">
            <h3>Status bars</h3>
            <div className="report-chart" aria-label="Tickets by status">
              {reports.ticketCountsByStatus.map((row) => <div key={row.status} className="report-chart-row"><div className="report-chart-label"><span>{row.status}</span><strong>{row.count}</strong></div><div className="report-chart-track"><span className="report-chart-bar status" style={{ width: getChartWidth(row.count, reports.ticketCountsByStatus) }} /></div></div>)}
            </div>
          </div>
          <div className="institutional-card report-activity-card">
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
                  <th>Ticket ID</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Department</th>
                  <th>Requester</th>
                  <th>Issue</th>
                </tr>
              </thead>
              <tbody>
                {reports.recentTickets.length === 0 ? (
                  <tr><td colSpan="6" className="small-muted">No ticket activity</td></tr>
                ) : reports.recentTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>{ticket.ticket_code || `#${ticket.id}`}</td>
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
