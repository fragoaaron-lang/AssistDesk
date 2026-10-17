import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import AuthenticatedNavigation from './AuthenticatedNavigation';

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

const reportSectionNames = {
  overview: 'Overview',
  performance: 'Performance',
  tickets: 'Ticket records',
  audit: 'Audit and activity',
};

function ReportTableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <div className="report-skeleton-table" aria-hidden="true">
      <div className="report-skeleton-table-row is-heading" style={{ '--skeleton-columns': columns }}>
        {Array.from({ length: columns }, (_, index) => <span className="report-skeleton-block" key={`heading-${index}`} />)}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div className="report-skeleton-table-row" style={{ '--skeleton-columns': columns }} key={`row-${rowIndex}`}>
          {Array.from({ length: columns }, (_, columnIndex) => (
            <span className="report-skeleton-block" key={`cell-${rowIndex}-${columnIndex}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ReportSectionSkeleton({ section }) {
  const sectionName = reportSectionNames[section];
  return (
    <section className={`analytics-section-panel report-skeleton-panel report-skeleton-${section}`} role="status" aria-label={`Loading ${sectionName} report`} aria-busy="true">
      <span className="report-skeleton-announcement">Loading {sectionName} report…</span>
      <div className="report-section-heading" aria-hidden="true">
        <span className="report-skeleton-block report-skeleton-title" />
        <span className="report-skeleton-block report-skeleton-description" />
      </div>
      {section === 'overview' ? (
        <div className="report-skeleton-overview-grid" aria-hidden="true">
          <div className="institutional-card report-plate report-skeleton-plate report-skeleton-department-chart">
            <span className="report-skeleton-block report-skeleton-card-title" />
            <div className="report-skeleton-chart-bars">
              {[48, 76, 58, 92, 67, 83, 42, 72].map((height, index) => <span className="report-skeleton-block" style={{ height: `${height}%` }} key={index} />)}
            </div>
          </div>
          <div className="institutional-card report-plate report-skeleton-plate report-skeleton-priority-chart">
            <span className="report-skeleton-block report-skeleton-card-title" />
            <div className="report-skeleton-donut-wrap"><span className="report-skeleton-block report-skeleton-donut" /></div>
            <div className="report-skeleton-legend"><span className="report-skeleton-block" /><span className="report-skeleton-block" /><span className="report-skeleton-block" /></div>
          </div>
          <div className="institutional-card report-plate report-skeleton-plate report-skeleton-trend-chart">
            <span className="report-skeleton-block report-skeleton-card-title" />
            <div className="report-skeleton-chart-bars is-daily">
              {[38, 56, 44, 78, 51, 91, 65, 43, 72, 56, 84, 49, 68, 94].map((height, index) => <span className="report-skeleton-block" style={{ height: `${height}%` }} key={index} />)}
            </div>
          </div>
          <div className="institutional-card report-plate report-skeleton-plate report-skeleton-secondary-chart">
            <span className="report-skeleton-block report-skeleton-card-title" />
            <span className="report-skeleton-block report-skeleton-line" />
            <span className="report-skeleton-block report-skeleton-line is-short" />
            <span className="report-skeleton-block report-skeleton-line" />
            <span className="report-skeleton-block report-skeleton-line is-medium" />
          </div>
          <div className="institutional-card report-plate report-skeleton-plate report-skeleton-secondary-chart">
            <span className="report-skeleton-block report-skeleton-card-title" />
            <span className="report-skeleton-block report-skeleton-line" />
            <span className="report-skeleton-block report-skeleton-line is-medium" />
            <span className="report-skeleton-block report-skeleton-line is-short" />
            <span className="report-skeleton-block report-skeleton-line" />
          </div>
        </div>
      ) : section === 'audit' ? (
        <div className="report-skeleton-audit-grid" aria-hidden="true">
          <div className="institutional-card report-plate report-skeleton-plate"><span className="report-skeleton-block report-skeleton-card-title" /><ReportTableSkeleton columns={6} /></div>
          <div className="institutional-card report-plate report-skeleton-plate"><span className="report-skeleton-block report-skeleton-card-title" /><ReportTableSkeleton columns={7} /></div>
        </div>
      ) : (
        <div className="institutional-card report-plate report-skeleton-plate" aria-hidden="true">
          <span className="report-skeleton-block report-skeleton-card-title" />
          {section === 'performance' && <span className="report-skeleton-block report-skeleton-description is-table-description" />}
          <ReportTableSkeleton columns={section === 'performance' ? 5 : 6} />
        </div>
      )}
    </section>
  );
}

function AdminReportsPage() {
  const { token, user } = useAuth();
  const location = useLocation();
  const [reports, setReports] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsLoadError, setReportsLoadError] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [reportFilters, setReportFilters] = useState({ start_date: '', end_date: '', department_id: '', category: '', priority: '', status: '' });
  const [activeReportSection, setActiveReportSection] = useState('overview');
  const [sectionLoading, setSectionLoading] = useState(false);
  const sectionLoadingTimer = useRef(null);
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
  const appliedFilterCount = Object.values(reports?.filters || {}).filter(Boolean).length;

  useEffect(() => {
    setShowUserDirectory(new URLSearchParams(location.search).get('view') === 'users');
  }, [location.search]);

  const loadReports = async (filters = reportFilters) => {
    setReportsLoading(true);
    setReportsLoadError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params: getReportParams(filters),
      });
      setReports(res.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Unable to load reports.';
      setReportsLoadError(errorMessage);
      setMessage(errorMessage);
    } finally {
      setReportsLoading(false);
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

  useEffect(() => () => window.clearTimeout(sectionLoadingTimer.current), []);

  const selectReportSection = (section) => {
    if (section === activeReportSection) return;
    window.clearTimeout(sectionLoadingTimer.current);
    setActiveReportSection(section);
    setSectionLoading(true);
    sectionLoadingTimer.current = window.setTimeout(() => setSectionLoading(false), 420);
  };

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
  const activityByDate = new Map((reports?.monthlyTicketCounts || []).map((item) => [item.date, Number(item.count) || 0]));
  const reportAnchorDate = new Date(reports?.generated_at || Date.now());
  const recentDailyActivity = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(reportAnchorDate);
    date.setUTCDate(date.getUTCDate() - (13 - index));
    const dateKey = date.toISOString().slice(0, 10);
    return { date: dateKey, count: activityByDate.get(dateKey) || 0 };
  });
  const recentDailyTotal = recentDailyActivity.reduce((sum, item) => sum + item.count, 0);
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
    return (
      <main className="app-shell analytics-loading-shell">
        <section className="institutional-card analytics-loading" role={reportsLoadError ? 'alert' : 'status'} aria-live="polite" aria-busy={reportsLoading}>
          <div className={`analytics-loading-indicator ${reportsLoadError ? 'has-error' : ''}`} aria-hidden="true">{reportsLoadError ? '!' : ''}</div>
          <h1>{reportsLoadError ? 'Analytics could not load' : 'Loading Data Analytics'}</h1>
          <p>{reportsLoadError || 'Fetching ticket trends and current service activity.'}</p>
          {reportsLoadError && <button type="button" className="institutional-btn" onClick={() => loadReports()}>Try again</button>}
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-shell">
        <AuthenticatedNavigation
          user={user}
          subtitle="Administrative analytics"
          onUsersNavigate={(linkKey) => {
            if (linkKey === 'users') setShowUserDirectory(true);
            if (linkKey === 'reports') setShowUserDirectory(false);
          }}
        />

        <div className={`page-intro${showUserDirectory ? '' : ' analytics-page-intro'}`}>
          <div>
            <h2>{showUserDirectory ? 'Users' : 'Data Analytics'}</h2>
            <p>{showUserDirectory ? 'Manage active and terminated user accounts.' : 'Monitor service trends, support demand, and operational activity.'}</p>
          </div>
        </div>
        {message && <p className="admin-feedback" role="status" aria-live="polite">{message}</p>}

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
                  Archive
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
          <div className="user-directory-archive-backdrop" onMouseDown={() => setShowTerminatedUsers(false)}>
          <section className="institutional-card user-directory-archive-modal" role="dialog" aria-modal="true" aria-labelledby="terminated-accounts-title" onMouseDown={(event) => event.stopPropagation()}>
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
          </div>
        )}

        {!showUserDirectory && (
          <>
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
                  onClick={() => selectReportSection(section)}
                >
                  {label}
                </button>
              ))}
            </nav>
            <section className="institutional-card report-filter-card" aria-label="Report filters">
              <div className="report-toolbar">
                <div className="report-toolbar-copy">
                  <h3>Analytics scope</h3>
                  <span>Filters affect metrics, ticket records, audit events, and CSV export.</span>
                </div>
                <button type="button" className="institutional-btn small secondary" onClick={exportReportCsv}>Export CSV</button>
              </div>
              <details className="report-filter-disclosure">
                <summary>
                  <span className="report-filter-disclosure-label">Filters</span>
                  <span className="report-filter-count">{appliedFilterCount ? `${appliedFilterCount} applied` : 'None applied'}</span>
                  <svg className="report-filter-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
                </summary>
                <form className="report-filter-form" onSubmit={applyReportFilters}>
                  <label>From<input className="institutional-input" type="date" value={reportFilters.start_date} onChange={(event) => setReportFilters((current) => ({ ...current, start_date: event.target.value }))} /></label>
                  <label>To<input className="institutional-input" type="date" value={reportFilters.end_date} onChange={(event) => setReportFilters((current) => ({ ...current, end_date: event.target.value }))} /></label>
                  <label>Department<select className="institutional-select" value={reportFilters.department_id} onChange={(event) => setReportFilters((current) => ({ ...current, department_id: event.target.value }))}><option value="">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.display_name || department.name}</option>)}</select></label>
                  <label>Category<select className="institutional-select" value={reportFilters.category} onChange={(event) => setReportFilters((current) => ({ ...current, category: event.target.value }))}><option value="">All categories</option>{(reports.availableCategories || []).map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                  <label>Priority<select className="institutional-select" value={reportFilters.priority} onChange={(event) => setReportFilters((current) => ({ ...current, priority: event.target.value }))}><option value="">All priorities</option>{['low', 'medium', 'urgent'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                  <label>Status<select className="institutional-select" value={reportFilters.status} onChange={(event) => setReportFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All statuses</option>{['open', 'pending', 'in_progress', 'resolved', 'closed'].map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select></label>
                  <div className="report-filter-actions"><button className="institutional-btn small" type="submit">Apply filters</button><button className="institutional-btn small secondary" type="button" onClick={resetReportFilters}>Reset</button></div>
                </form>
              </details>
            </section>
            {sectionLoading ? <ReportSectionSkeleton section={activeReportSection} /> : null}
            {!sectionLoading && activeReportSection === 'overview' && (
              <section className="analytics-section-panel" role="tabpanel" aria-label="Analytics overview">
                <div className="report-section-heading"><h3>Overview</h3><p className="small-muted">Ticket volume, departments, priority mix, common concerns, and assistant FAQ activity.</p></div>
            <section className="report-visual-grid">
          <div className="institutional-card report-bars-card report-plate">
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
          <div className="institutional-card report-donut-card report-priority-card report-plate">
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
          <div className="institutional-card report-trend-card report-plate">
            <div className="report-card-heading"><div><h3>Ticket activity</h3><span>Daily volume · Last 14 days</span></div></div>
            {recentDailyTotal > 0 ? (
              <div className="report-trend-chart" role="img" aria-label={`Daily ticket activity for the last 14 days: ${recentDailyActivity.map((item) => `${item.date}, ${item.count} tickets`).join('; ')}`}>
                {recentDailyActivity.map((item, index) => (
                  <div key={item.date} className="report-trend-column" title={`${item.date}: ${item.count} tickets`}>
                    <span className="report-trend-bar" style={{ height: getChartHeight(item.count, recentDailyActivity) }} />
                    <small>{index % 3 === 0 || index === recentDailyActivity.length - 1 ? new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : ''}</small>
                  </div>
                ))}
              </div>
            ) : <p className="small-muted">No tickets recorded during the last 14 days for this report scope.</p>}
          </div>
          <div className="institutional-card report-bars-card report-most-faq-card report-plate">
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
          <div className="institutional-card report-bars-card report-status-bars-card report-plate">
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
            {!sectionLoading && activeReportSection === 'performance' && (
              <section className="analytics-section-panel" role="tabpanel" aria-label="Performance reports">
                <div className="report-section-heading"><h3>Performance</h3><p className="small-muted">Average first response and resolution elapsed times, grouped by department.</p></div>
          <section className="institutional-card report-table-card report-plate">
            <h3>Response and resolution time by department</h3>
            <p className="small-muted">Elapsed time from ticket creation to the first staff/admin update, and to the first resolved/closed status update.</p>
            <div className="report-table-scroll"><table className="report-table"><thead><tr><th>Department</th><th>Tickets with response</th><th>Avg first response (hours)</th><th>Tickets resolved/closed</th><th>Avg resolution (hours)</th></tr></thead><tbody>
              {(reports.responseAndResolutionByDepartment || []).length === 0 ? <tr><td colSpan="5" className="small-muted">No response or resolution data for these filters.</td></tr> : reports.responseAndResolutionByDepartment.map((row) => <tr key={row.department_id}><td>{row.department_name}</td><td>{row.responded_ticket_count}</td><td>{row.average_first_response_hours ?? 'N/A'}</td><td>{row.resolved_ticket_count}</td><td>{row.average_resolution_hours ?? 'N/A'}</td></tr>)}
            </tbody></table></div>
          </section>
              </section>
            )}
            {!sectionLoading && activeReportSection === 'audit' && (
              <section className="analytics-section-panel" role="tabpanel" aria-label="Audit and activity reports">
                <div className="report-section-heading"><h3>Audit &amp; activity</h3><p className="small-muted">Ticket workflow actions and persistent account, catalog, and system audit history.</p></div>
          <section className="institutional-card report-table-card report-plate">
            <h3>Ticket audit activity</h3>
            <p className="small-muted">Workflow actions associated with tickets matching the current filters. Showing up to 200 most recent events.</p>
            <div className="report-table-scroll"><table className="report-table"><thead><tr><th>Time</th><th>Ticket</th><th>Action</th><th>Actor role</th><th>Department ID</th><th>Details</th></tr></thead><tbody>
              {(reports.auditRecords || []).length === 0 ? <tr><td colSpan="6" className="small-muted">No audit events for these filters.</td></tr> : reports.auditRecords.map((record, index) => <tr key={`${record.ticket_id}-${record.action}-${record.created_at}-${index}`}><td>{new Date(record.created_at).toLocaleString()}</td><td>{getCompleteTicketCode({ id: record.ticket_id, Department: { name: departments.find((department) => Number(department.id) === Number(record.department_id))?.name } })}</td><td>{record.action}</td><td>{record.actor_role}</td><td>{record.department_id}</td><td>{record.message}</td></tr>)}
            </tbody></table></div>
          </section>
          <section className="institutional-card report-table-card report-plate">
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
            {!sectionLoading && activeReportSection === 'tickets' && (
              <section className="analytics-section-panel" role="tabpanel" aria-label="Ticket records">
                <div className="report-section-heading"><h3>Ticket records</h3><p className="small-muted">Latest ticket records matching the applied filters.</p></div>
          <section className="institutional-card report-table-card report-plate">
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
