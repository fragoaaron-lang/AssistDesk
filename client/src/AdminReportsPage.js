import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import LogoutButton from './LogoutButton';
import HeaderProfile from './HeaderProfile';
import SidebarProfile from './SidebarProfile';

const getTicketPrefix = (departmentName) => {
  const normalizedName = String(departmentName || '').toLowerCase();
  const prefixes = [
    ['computer science', 'CS'],
    ['cs department', 'CS'],
    ['college of nursing', 'NU'],
    ['nursing', 'NU'],
    ['college of criminology', 'CR'],
    ['criminology', 'CR'],
    ['basic education', 'BE'],
    ['business administration', 'CBA'],
    ['accountancy', 'CBA'],
    ['hospitality management', 'HM'],
    ['physical therapy', 'PT'],
    ['education', 'ED'],
    ['maintenance', 'MT'],
    ['clinic', 'CL'],
    ['accounting', 'AC'],
    ['guidance', 'GU'],
    ['library', 'LI'],
    ['student affairs', 'OSA'],
    ['information technology', 'IT'],
  ];
  return prefixes.find(([name]) => normalizedName.includes(name))?.[1]
    || normalizedName.replace(/[^a-z]/g, '').slice(0, 3).toUpperCase()
    || 'GEN';
};

const getCompleteTicketCode = (ticket) => {
  if (/^[A-Z]+-\d{4}$/.test(ticket.ticket_code || '')) return ticket.ticket_code;
  return `${getTicketPrefix(ticket.Department?.name)}-${String(ticket.id).padStart(4, '0')}`;
};

function AdminReportsPage() {
  const { token, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reports, setReports] = useState(null);
  const [message, setMessage] = useState('');
  const [showUserDirectory, setShowUserDirectory] = useState(() => new URLSearchParams(window.location.search).get('view') === 'users');
  const [showTerminatedUsers, setShowTerminatedUsers] = useState(false);
  const [expandedUserRoles, setExpandedUserRoles] = useState({});
  const [updatingUserId, setUpdatingUserId] = useState(null);

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

  const toggleUserRole = (roleName) => {
    setExpandedUserRoles((current) => ({
      ...current,
      [roleName]: current[roleName] !== true,
    }));
  };

  const terminateUser = async (directoryUser) => {
    if (!window.confirm(`Terminate ${directoryUser.name || directoryUser.email}'s account? Related tickets and chat history will be removed.`)) return;
    setUpdatingUserId(directoryUser.id);
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/users/${directoryUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('User account terminated successfully.');
      await loadReports();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to terminate user account.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const reactivateUser = async (directoryUser) => {
    if (!window.confirm(`Reactivate ${directoryUser.name || directoryUser.email}'s account? They will be able to sign in again. Previously removed data will not be restored.`)) return;
    setUpdatingUserId(directoryUser.id);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/users/${directoryUser.id}/reactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('User account reactivated successfully.');
      await loadReports();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to reactivate user account.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const userRoleGroups = ['student', 'faculty', 'staff'].map((roleName) => ({
    name: roleName,
    label: roleName.charAt(0).toUpperCase() + roleName.slice(1),
    users: (reports?.users || []).filter((directoryUser) => directoryUser.role === roleName && directoryUser.account_status !== 'terminated'),
  }));

  const terminatedRoleGroups = ['student', 'faculty', 'staff'].map((roleName) => ({
    name: roleName,
    label: roleName.charAt(0).toUpperCase() + roleName.slice(1),
    users: (reports?.users || []).filter((directoryUser) => directoryUser.role === roleName && directoryUser.account_status === 'terminated'),
  }));

  const getChartWidth = (value, rows) => {
    const maximum = Math.max(...rows.map((row) => Number(row.count) || 0), 1);
    return `${Math.max(4, ((Number(value) || 0) / maximum) * 100)}%`;
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
                <button type="button" className="header-nav-button" onClick={() => setShowUserDirectory((current) => !current)} aria-expanded={showUserDirectory}>
                  Users
                </button>
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
                <button type="button" className="header-nav-button" onClick={() => { setShowUserDirectory((current) => !current); setMobileMenuOpen(false); }} aria-expanded={showUserDirectory}>
                  Users
                </button>
              </>
            )}
          </div>
          <div className="mobile-menu-actions">
            <LogoutButton onBeforeLogout={() => setMobileMenuOpen(false)} />
          </div>
        </aside>

        <div className="page-intro">
          <div>
            <h2>{showUserDirectory ? 'Users' : 'Data Analytics'}</h2>
            <p>{showUserDirectory ? 'Manage active and terminated user accounts.' : 'Monitor service trends, support demand, and operational activity.'}</p>
          </div>
        </div>
        {message && <p>{message}</p>}

        {showUserDirectory && (
          <section className="institutional-card user-directory-card">
            <div className="report-card-heading">
              <div>
                <h3>User directory</h3>
                <span>Open a role folder to view its active users.</span>
              </div>
              <div className="user-directory-header-actions">
                <button
                  type="button"
                  className={`user-directory-archive-button ${showTerminatedUsers ? 'is-active' : ''}`}
                  onClick={() => setShowTerminatedUsers((current) => !current)}
                  aria-label="Open terminated accounts archive"
                  title="Open terminated accounts archive"
                >
                  🗑
                </button>
              </div>
            </div>
            <div className="list-stack">
              {userRoleGroups.map((roleGroup) => (
                <section key={roleGroup.name} className="ticket-department-group">
                  <button type="button" className="ticket-department-heading" onClick={() => toggleUserRole(roleGroup.name)} aria-expanded={expandedUserRoles[roleGroup.name] === true}>
                    <span className="ticket-folder-icon" aria-hidden="true" />
                    <span>{roleGroup.label}</span>
                    <span className="ticket-department-count">{roleGroup.users.length}</span>
                  </button>
                  {expandedUserRoles[roleGroup.name] === true && (
                    <div className="report-table-scroll">
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            {roleGroup.name === 'student' && <th>Student Number</th>}
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roleGroup.users.length === 0 ? (
                            <tr><td colSpan={roleGroup.name === 'student' ? 6 : 5} className="small-muted">No users in this group</td></tr>
                          ) : roleGroup.users.map((directoryUser) => (
                            <tr key={directoryUser.id}>
                              <td>{directoryUser.name || 'Unknown'}</td>
                              <td>{directoryUser.email}</td>
                              <td>{directoryUser.Department?.name || 'Unassigned'}</td>
                              {roleGroup.name === 'student' && <td>{directoryUser.student_number || 'N/A'}</td>}
                              <td>{directoryUser.account_status || 'active'}</td>
                              <td><button type="button" className="user-terminate-button" onClick={() => terminateUser(directoryUser)} disabled={updatingUserId === directoryUser.id}>
                                {updatingUserId === directoryUser.id ? 'Updating...' : 'Terminate'}
                              </button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </section>
        )}

        {showUserDirectory && showTerminatedUsers && (
          <section className="institutional-card user-directory-archive-modal" role="dialog" aria-modal="true" aria-labelledby="terminated-accounts-title">
            <div className="report-card-heading">
              <div>
                <h3 id="terminated-accounts-title">Terminated accounts</h3>
                <span>Archived accounts organized by role.</span>
              </div>
              <button type="button" className="user-directory-close-button" onClick={() => setShowTerminatedUsers(false)} aria-label="Close terminated accounts">×</button>
            </div>
            <div className="list-stack">
              {terminatedRoleGroups.map((roleGroup) => (
                <section key={roleGroup.name} className="ticket-department-group">
                  <button type="button" className="ticket-department-heading" onClick={() => toggleUserRole(`terminated-${roleGroup.name}`)} aria-expanded={expandedUserRoles[`terminated-${roleGroup.name}`] === true}>
                    <span className="ticket-folder-icon" aria-hidden="true" />
                    <span>{roleGroup.label}</span>
                    <span className="ticket-department-count">{roleGroup.users.length}</span>
                  </button>
                  {expandedUserRoles[`terminated-${roleGroup.name}`] === true && (
                    <div className="report-table-scroll">
                      <table className="report-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Department</th>{roleGroup.name === 'student' && <th>Student Number</th>}<th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                          {roleGroup.users.length === 0 ? (
                            <tr><td colSpan={roleGroup.name === 'student' ? 6 : 5} className="small-muted">No terminated users in this group</td></tr>
                          ) : roleGroup.users.map((directoryUser) => (
                            <tr key={directoryUser.id}>
                              <td>{directoryUser.name || 'Unknown'}</td>
                              <td>{directoryUser.email}</td>
                              <td>{directoryUser.Department?.name || 'Unassigned'}</td>
                              {roleGroup.name === 'student' && <td>{directoryUser.student_number || 'N/A'}</td>}
                              <td>Terminated</td>
                              <td><button
                                type="button"
                                className="user-reactivate-button"
                                onClick={() => reactivateUser(directoryUser)}
                                disabled={updatingUserId === directoryUser.id}
                              >
                                {updatingUserId === directoryUser.id ? 'Updating...' : 'Reactivate'}
                              </button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </section>
        )}

        {!showUserDirectory && (
          <>
            <section className="report-visual-grid">
          <div className="institutional-card report-bars-card">
            <h3>Tickets per department</h3>
            <div className="report-chart" aria-label="Tickets per department">
              {reports.ticketCountsByDepartment.map((row) => (
                <div key={row.department_id} className="report-chart-row"><div className="report-chart-label"><span>{row.department_name}</span><strong>{row.count}</strong></div><div className="report-chart-track"><span className="report-chart-bar department" style={{ width: getChartWidth(row.count, reports.ticketCountsByDepartment) }} /></div></div>
              ))}
            </div>
          </div>
          <div className="institutional-card report-donut-card">
            <div className="report-card-heading"><div><h3>Ticket priorities</h3><span>Low, medium, and urgent</span></div></div>
            <div className="report-legend report-priority-list">{['low', 'medium', 'urgent'].map((priority) => {
              const row = reports.ticketCountsByPriority.find((item) => item.priority === priority);
              return <span key={priority}><i className="legend-dot legend-dot-0" />{priority} <strong>{row?.count || 0}</strong></span>;
            })}</div>
          </div>
          <div className="institutional-card report-donut-card">
            <div className="report-card-heading"><div><h3>Most asked FAQ</h3><span>Based on assistant questions</span></div></div>
            {reports.mostAskedFaq ? <div className="report-faq-highlight"><strong>{reports.mostAskedFaq.question}</strong><span>{reports.mostAskedFaq.count} matching question(s)</span></div> : <p className="small-muted">No FAQ activity yet</p>}
          </div>
          <div className="institutional-card report-bars-card">
            <h3>Resolved vs unresolved by department</h3>
            <div className="report-chart" aria-label="Tickets by department">
              {reports.ticketsByDepartmentStatus.map((row) => (
                <div key={row.department_id || 'unassigned'} className="report-department-status-row"><div className="report-chart-label"><span>{row.department_name}</span><strong>{row.resolved} resolved / {row.unresolved} unresolved</strong></div><small>Closed or resolved: {row.resolved} · Open or pending: {row.unresolved}</small></div>
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
                    <td>{getCompleteTicketCode(ticket)}</td>
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
          </>
        )}
      </div>
    </div>
  );
}

export default AdminReportsPage;
