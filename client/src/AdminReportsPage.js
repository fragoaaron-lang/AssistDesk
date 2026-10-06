import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import HeaderProfile from './HeaderProfile';
import LogoutButton from './LogoutButton';
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
  const [auditLogs, setAuditLogs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [reportFilters, setReportFilters] = useState({ start_date: '', end_date: '', department_id: '', category: '', priority: '', status: '' });
  const [activeReportSection, setActiveReportSection] = useState('overview');
  const [message, setMessage] = useState('');
  const [showUserDirectory, setShowUserDirectory] = useState(() => new URLSearchParams(window.location.search).get('view') === 'users');
  const [showTerminatedUsers, setShowTerminatedUsers] = useState(false);
  const [expandedUserRoles, setExpandedUserRoles] = useState({});
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [activePriority, setActivePriority] = useState(null);
  const [hoveredPriority, setHoveredPriority] = useState(null);

  const getReportParams = (filters = reportFilters) => Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '')
  );

  const loadReports = async (filters = reportFilters) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params: getReportParams(filters),
      });
      setReports(res.data);
    } catch (error) {
      setMessage('Unable to load reports.');
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 200 },
      });
      setAuditLogs(response.data.auditLogs || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load audit history.');
    }
  };

  const applyReportFilters = async (event) => {
    event.preventDefault();
    if (reportFilters.start_date && reportFilters.end_date && reportFilters.start_date > reportFilters.end_date) {
      setMessage('Start date must be on or before end date.');
      return;
    }
    setMessage('');
    await loadReports(reportFilters);
  };

  const resetReportFilters = async () => {
    const emptyFilters = { start_date: '', end_date: '', department_id: '', category: '', priority: '', status: '' };
    setReportFilters(emptyFilters);
    setMessage('');
    await loadReports(emptyFilters);
  };

  const exportReportCsv = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/reports/export`, {
        headers: { Authorization: `Bearer ${token}` },
        params: getReportParams(),
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `assistdesk-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to export report.');
    }
  };

  useEffect(() => {
    if (token) {
      loadReports();
      loadAuditLogs();
      axios.get(`${API_BASE_URL}/api/catalog/departments`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => setDepartments(response.data.departments || []))
        .catch(() => setMessage('Unable to load departments for personnel management.'));
    }
  }, [token]);

  const toggleUserRole = (roleName) => {
    setExpandedUserRoles((current) => ({
      ...current,
      [roleName]: current[roleName] !== true,
    }));
  };

  const terminateUser = async (directoryUser) => {
    if (!window.confirm(`Terminate ${directoryUser.name || directoryUser.email}'s account? Access will be disabled, chat history removed, and ticket/audit records retained for operational traceability.`)) return;
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

  const updateUserDepartment = async (directoryUser, departmentId) => {
    setUpdatingUserId(directoryUser.id);
    try {
      await axios.put(`${API_BASE_URL}/api/admin/users/${directoryUser.id}/department`, { department_id: Number(departmentId) }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(`${directoryUser.name || directoryUser.email}'s department was updated.`);
      await loadReports();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update user department.');
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

  const getChartHeight = (value, rows) => {
    const maximum = Math.max(...rows.map((row) => Number(row.count) || 0), 1);
    const count = Number(value) || 0;
    return count > 0 ? `${Math.max(8, (count / maximum) * 100)}%` : '0%';
  };

  const getFaqChartWidth = (value, rows) => {
    const maximum = Math.max(...rows.map((row) => Number(row.count) || 0), 1);
    return `${Math.max(5, ((Number(value) || 0) / maximum) * 100)}%`;
  };

  const getDepartmentStatusHeight = (value, rows) => {
    const maximum = Math.max(...rows.map((row) => (Number(row.resolved) || 0) + (Number(row.unresolved) || 0)), 1);
    const count = Number(value) || 0;
    return count > 0 ? `${Math.max(8, (count / maximum) * 100)}%` : '0%';
  };

  const priorityColors = { low: '#37c94f', medium: '#1f9dd9', urgent: '#ed1725' };
  const priorityData = ['low', 'medium', 'urgent'].map((priority) => ({
    name: priority,
    count: Number(reports?.ticketCountsByPriority?.find((row) => row.priority === priority)?.count) || 0,
    color: priorityColors[priority],
  }));
  const priorityTotal = priorityData.reduce((total, item) => total + item.count, 0);
  const priorityCircumference = 2 * Math.PI * 58;
  const selectedPriority = priorityData.find((item) => item.name === (hoveredPriority || activePriority));
  let priorityOffset = 0;
  const prioritySlices = priorityData.map((item) => {
    const length = priorityTotal > 0 ? (item.count / priorityTotal) * priorityCircumference : 0;
    const slice = { ...item, length, offset: priorityOffset };
    priorityOffset += length;
    return slice;
  });

  const toggleActivePriority = (priority) => {
    setActivePriority((current) => current === priority ? null : priority);
  };

  const handlePriorityKeyDown = (event, priority) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleActivePriority(priority);
    }
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
                <a href="/admin/catalog">Catalog</a>
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
                <a href="/admin/catalog" onClick={() => setMobileMenuOpen(false)}>Catalog</a>
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
                              <td>
                                <select className="institutional-select" value={directoryUser.department_id || ''} onChange={(event) => updateUserDepartment(directoryUser, event.target.value)} disabled={updatingUserId === directoryUser.id} aria-label={`Department for ${directoryUser.name || directoryUser.email}`}>
                                  <option value="" disabled>Select department</option>
                                  {departments.map((department) => <option key={department.id} value={department.id}>{department.display_name || department.name}</option>)}
                                </select>
                              </td>
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
            <section className="institutional-card report-filter-card" aria-label="Report filters">
              <div className="report-card-heading">
                <div><h3>Report filters</h3><span>Filters apply to ticket metrics, timing summaries, audit events, and CSV export.</span></div>
                <button type="button" className="institutional-btn small secondary" onClick={exportReportCsv}>Export CSV</button>
              </div>
              <form className="report-filter-form" onSubmit={applyReportFilters}>
                <label>From<input className="institutional-input" type="date" value={reportFilters.start_date} onChange={(event) => setReportFilters((current) => ({ ...current, start_date: event.target.value }))} /></label>
                <label>To<input className="institutional-input" type="date" value={reportFilters.end_date} onChange={(event) => setReportFilters((current) => ({ ...current, end_date: event.target.value }))} /></label>
                <label>Department<select className="institutional-select" value={reportFilters.department_id} onChange={(event) => setReportFilters((current) => ({ ...current, department_id: event.target.value }))}><option value="">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.display_name || department.name}</option>)}</select></label>
                <label>Category<select className="institutional-select" value={reportFilters.category} onChange={(event) => setReportFilters((current) => ({ ...current, category: event.target.value }))}><option value="">All categories</option>{(reports.availableCategories || []).map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                <label>Priority<select className="institutional-select" value={reportFilters.priority} onChange={(event) => setReportFilters((current) => ({ ...current, priority: event.target.value }))}><option value="">All priorities</option>{['low', 'medium', 'urgent'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                <label>Status<select className="institutional-select" value={reportFilters.status} onChange={(event) => setReportFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All statuses</option>{['open', 'pending', 'in_progress', 'resolved', 'closed'].map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select></label>
                <div className="report-filter-actions"><button className="institutional-btn small" type="submit">Apply filters</button><button className="institutional-btn small secondary" type="button" onClick={resetReportFilters}>Reset</button></div>
              </form>
              <div className="report-filter-summary" aria-label="Filtered ticket totals">
                <span>Total tickets <strong>{Object.values(reports.ticketCountsByStatus || []).reduce((sum, row) => sum + Number(row.count || 0), 0)}</strong></span>
                <span>Assigned <strong>{reports.assignmentCounts?.assigned ?? 0}</strong></span>
                <span>Unassigned <strong>{reports.assignmentCounts?.unassigned ?? 0}</strong></span>
              </div>
              <p className="small-muted report-generated-meta">Generated {new Date(reports.generated_at).toLocaleString()} · Prepared by {reports.prepared_by} · Coverage: {reports.filters?.start_date || 'all available dates'} to {reports.filters?.end_date || 'present'}</p>
            </section>
            <nav className="analytics-section-tabs" aria-label="Analytics report sections" role="tablist">
              {[
                ['overview', 'Overview'],
                ['performance', 'Performance'],
                ['tickets', 'Ticket records'],
                ['audit', 'Audit & activity'],
              ].map(([section, label]) => (
                <button
                  key={section}
                  type="button"
                  role="tab"
                  aria-selected={activeReportSection === section}
                  className={`analytics-section-tab${activeReportSection === section ? ' is-active' : ''}`}
                  onClick={() => setActiveReportSection(section)}
                >
                  {label}
                </button>
              ))}
            </nav>
            {activeReportSection === 'overview' && (
              <section className="analytics-section-panel" role="tabpanel" aria-label="Analytics overview">
                <div className="report-section-heading"><h3>Overview</h3><p className="small-muted">Ticket volume, departments, priority mix, common concerns, and assistant FAQ activity.</p></div>
            <section className="report-visual-grid">
          <div className="institutional-card report-bars-card">
            <h3>Tickets per department</h3>
            {reports.ticketCountsByDepartment.length > 0 ? (
              <div
                className="report-department-bar-chart"
                role="img"
                aria-label={`Tickets per department: ${reports.ticketCountsByDepartment.map((row) => `${row.department_name}, ${row.count}`).join('; ')}`}
              >
                {reports.ticketCountsByDepartment.map((row) => (
                  <div key={row.department_id || row.department_name} className="report-department-bar-item" title={`${row.department_name}: ${row.count} tickets`}>
                    <strong className="report-department-bar-value">{row.count}</strong>
                    <div className="report-department-bar-plot">
                      <span className="report-department-bar" style={{ height: getChartHeight(row.count, reports.ticketCountsByDepartment) }} />
                    </div>
                    <span className="report-department-bar-label">{row.department_name}</span>
                  </div>
                ))}
              </div>
            ) : <p className="small-muted">No department ticket data yet.</p>}
          </div>
          <div className="institutional-card report-donut-card report-priority-card">
            <div className="report-card-heading"><div><h3>Ticket priorities</h3><span>Low, medium, and urgent</span></div></div>
            <div className="report-priority-chart-layout">
              <div className="report-priority-chart-wrap">
                <svg
                  className="report-priority-pie"
                  viewBox="0 0 160 160"
                  role="group"
                  aria-label={`Ticket priorities, ${priorityTotal} total tickets. Select a slice for details.`}
                >
                  <circle className="report-priority-pie-track" cx="80" cy="80" r="58" />
                  {prioritySlices.filter((item) => item.count > 0).map((item) => (
                    <circle
                      key={item.name}
                      className={`report-priority-slice${(hoveredPriority || activePriority) === item.name ? ' is-active' : ''}${(hoveredPriority || activePriority) && (hoveredPriority || activePriority) !== item.name ? ' is-muted' : ''}`}
                      cx="80"
                      cy="80"
                      r="58"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="34"
                      strokeDasharray={`${item.length} ${priorityCircumference - item.length}`}
                      strokeDashoffset={-item.offset}
                      transform="rotate(-90 80 80)"
                      role="button"
                      tabIndex="0"
                      aria-label={`${item.name}: ${item.count} tickets, ${Math.round((item.count / priorityTotal) * 100)} percent`}
                      aria-pressed={activePriority === item.name}
                      onPointerEnter={() => setHoveredPriority(item.name)}
                      onPointerLeave={() => setHoveredPriority(null)}
                      onFocus={() => setHoveredPriority(item.name)}
                      onBlur={() => setHoveredPriority(null)}
                      onClick={() => toggleActivePriority(item.name)}
                      onKeyDown={(event) => handlePriorityKeyDown(event, item.name)}
                    />
                  ))}
                </svg>
                <div className="report-priority-pie-center" aria-live="polite">
                  <strong>{selectedPriority ? selectedPriority.count : priorityTotal}</strong>
                  <small>{selectedPriority ? selectedPriority.name : 'Total'}</small>
                  {selectedPriority && priorityTotal > 0 && <small>{Math.round((selectedPriority.count / priorityTotal) * 100)}% of tickets</small>}
                </div>
              </div>
              <div className="report-legend report-priority-list" aria-label="Ticket priority counts">
                {priorityData.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    className={`report-priority-legend-button${activePriority === item.name ? ' is-selected' : ''}`}
                    aria-pressed={activePriority === item.name}
                    onPointerEnter={() => setHoveredPriority(item.name)}
                    onPointerLeave={() => setHoveredPriority(null)}
                    onFocus={() => setHoveredPriority(item.name)}
                    onBlur={() => setHoveredPriority(null)}
                    onClick={() => toggleActivePriority(item.name)}
                  >
                    <i className="legend-dot" style={{ backgroundColor: item.color }} aria-hidden="true" />
                    <span>{item.name}</span>
                    <strong>{item.count}</strong>
                  </button>
                ))}
              </div>
            </div>
            <p className="report-priority-chart-hint">Hover or select a slice to inspect its share. Select it again to reset.</p>
          </div>
          <div className="institutional-card report-bars-card report-most-faq-card">
            <div className="report-card-heading"><div><h3>Top FAQs</h3><span>Top questions matched in assistant conversations</span></div></div>
            {reports.mostAskedFaqs?.length > 0 ? (
              <div className="report-faq-bar-chart" aria-label="Top FAQs">
                {reports.mostAskedFaqs.map((faq) => (
                  <div key={faq.id} className="report-faq-bar-row" title={`${faq.question}: ${faq.count} matching question(s)`}>
                    <div className="report-faq-bar-label"><span>{faq.question}</span><strong>{faq.count}</strong></div>
                    <div className="report-chart-track"><span className="report-chart-bar faq" style={{ width: getFaqChartWidth(faq.count, reports.mostAskedFaqs) }} /></div>
                  </div>
                ))}
              </div>
            ) : <p className="small-muted">No FAQ activity yet.</p>}
          </div>
          <div className="institutional-card report-bars-card report-status-bars-card">
            <h3>Resolved vs unresolved by department</h3>
            {reports.ticketsByDepartmentStatus.length > 0 ? (
              <>
                <div className="report-status-legend" aria-label="Graph legend">
                  <span><i className="report-status-swatch resolved" aria-hidden="true" />Resolved</span>
                  <span><i className="report-status-swatch unresolved" aria-hidden="true" />Unresolved</span>
                </div>
                <div
                  className="report-status-bar-chart"
                  role="img"
                  aria-label={`Resolved and unresolved tickets by department: ${reports.ticketsByDepartmentStatus.map((row) => `${row.department_name}: ${row.resolved} resolved, ${row.unresolved} unresolved`).join('; ')}`}
                >
                  {reports.ticketsByDepartmentStatus.map((row) => (
                    <div key={row.department_id || 'unassigned'} className="report-status-bar-group" title={`${row.department_name}: ${row.resolved} resolved, ${row.unresolved} unresolved`}>
                      <div className="report-status-bar-pair">
                        <div className="report-status-bar-column">
                          <strong>{row.resolved}</strong>
                          <div className="report-status-bar-plot"><span className="report-status-bar resolved" style={{ height: getDepartmentStatusHeight(row.resolved, reports.ticketsByDepartmentStatus) }} /></div>
                        </div>
                        <div className="report-status-bar-column">
                          <strong>{row.unresolved}</strong>
                          <div className="report-status-bar-plot"><span className="report-status-bar unresolved" style={{ height: getDepartmentStatusHeight(row.unresolved, reports.ticketsByDepartmentStatus) }} /></div>
                        </div>
                      </div>
                      <span className="report-status-bar-label">{row.department_name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="small-muted">No department ticket data yet.</p>}
          </div>
          </section>
              </section>
            )}
            {activeReportSection === 'performance' && (
              <section className="analytics-section-panel" role="tabpanel" aria-label="Performance reports">
                <div className="report-section-heading"><h3>Performance</h3><p className="small-muted">Average first response and resolution elapsed times, grouped by department.</p></div>
          <section className="institutional-card report-table-card">
            <h3>Response and resolution time by department</h3>
            <p className="small-muted">Elapsed time from ticket creation to the first staff/admin update, and to the first resolved/closed status update.</p>
            <div className="report-table-scroll"><table className="report-table"><thead><tr><th>Department</th><th>Tickets with response</th><th>Avg first response (hours)</th><th>Tickets resolved/closed</th><th>Avg resolution (hours)</th></tr></thead><tbody>
              {(reports.responseAndResolutionByDepartment || []).length === 0 ? <tr><td colSpan="5" className="small-muted">No response or resolution data for these filters.</td></tr> : reports.responseAndResolutionByDepartment.map((row) => <tr key={row.department_id}><td>{row.department_name}</td><td>{row.responded_ticket_count}</td><td>{row.average_first_response_hours ?? 'N/A'}</td><td>{row.resolved_ticket_count}</td><td>{row.average_resolution_hours ?? 'N/A'}</td></tr>)}
            </tbody></table></div>
          </section>
              </section>
            )}
            {activeReportSection === 'audit' && (
              <section className="analytics-section-panel" role="tabpanel" aria-label="Audit and activity reports">
                <div className="report-section-heading"><h3>Audit &amp; activity</h3><p className="small-muted">Ticket workflow actions and persistent account, catalog, and system audit history.</p></div>
          <section className="institutional-card report-table-card">
            <h3>Ticket audit activity</h3>
            <p className="small-muted">Workflow actions associated with tickets matching the current filters. Showing up to 200 most recent events.</p>
            <div className="report-table-scroll"><table className="report-table"><thead><tr><th>Time</th><th>Ticket</th><th>Action</th><th>Actor role</th><th>Department ID</th><th>Details</th></tr></thead><tbody>
              {(reports.auditRecords || []).length === 0 ? <tr><td colSpan="6" className="small-muted">No audit events for these filters.</td></tr> : reports.auditRecords.map((record, index) => <tr key={`${record.ticket_id}-${record.action}-${record.created_at}-${index}`}><td>{new Date(record.created_at).toLocaleString()}</td><td>{getCompleteTicketCode({ id: record.ticket_id, Department: { name: departments.find((department) => Number(department.id) === Number(record.department_id))?.name } })}</td><td>{record.action}</td><td>{record.actor_role}</td><td>{record.department_id}</td><td>{record.message}</td></tr>)}
            </tbody></table></div>
          </section>
          <section className="institutional-card report-table-card">
            <h3>Persistent audit trail</h3>
            <p className="small-muted">Latest 200 recorded events. Actor role and name are snapshots from the time of the action. Audit history is read-only in this interface.</p>
            <div className="report-table-scroll"><table className="report-table"><thead><tr><th>Timestamp</th><th>Actor</th><th>Role</th><th>Action</th><th>Affected record</th><th>Previous values</th><th>New values</th></tr></thead><tbody>
              {auditLogs.length === 0 ? <tr><td colSpan="7" className="small-muted">No audit events recorded yet.</td></tr> : auditLogs.map((entry) => <tr key={entry.id}>
                <td>{new Date(entry.created_at).toLocaleString()}</td>
                <td>{entry.actor_name || (entry.actor_user_id ? `User ${entry.actor_user_id}` : 'System/unknown')}</td>
                <td>{entry.actor_role || 'unknown'}</td>
                <td>{entry.action}</td>
                <td>{entry.entity_type}{entry.entity_id ? ` #${entry.entity_id}` : ''}</td>
                <td><pre className="audit-values-cell">{entry.before_values ? JSON.stringify(entry.before_values, null, 2) : '—'}</pre></td>
                <td><pre className="audit-values-cell">{entry.after_values ? JSON.stringify(entry.after_values, null, 2) : '—'}</pre></td>
              </tr>)}
            </tbody></table></div>
          </section>
              </section>
            )}
            {activeReportSection === 'tickets' && (
              <section className="analytics-section-panel" role="tabpanel" aria-label="Ticket records">
                <div className="report-section-heading"><h3>Ticket records</h3><p className="small-muted">Latest ticket records matching the applied filters.</p></div>
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
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminReportsPage;
