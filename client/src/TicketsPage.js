import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import NotificationBell from './NotificationBell';
import LogoutButton from './LogoutButton';
import HeaderProfile from './HeaderProfile';
import SidebarProfile from './SidebarProfile';
import TicketProgressBar from './TicketProgressBar';

function TicketsPage() {
  const { token, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ subject: '', description: '', category: 'Other', priority: 'medium', department_id: '' });
  const [attachment, setAttachment] = useState(null);
  const [submissionState, setSubmissionState] = useState({ status: 'idle', message: '', ticketCode: '' });
  const [expandedDepartments, setExpandedDepartments] = useState({});

  const loadTickets = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/tickets`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTickets(res.data);
  };

  const loadDepartments = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/catalog/departments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const options = res.data.departments || [];
    setDepartments(options);
    if (!form.department_id && options.length > 0) {
      setForm((current) => ({ ...current, department_id: String(options[0].id), subject: '' }));
    }
  };

  const loadServices = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/catalog/services`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setServices(res.data.services || []);
  };

  useEffect(() => {
    if (token) {
      loadTickets();
      loadDepartments();
      loadServices();
    }
  }, [token]);

  const availableSubjects = services
    .filter((service) => String(service.department_id) === String(form.department_id))
    .map((service) => service.name);

  const subjectOptions = availableSubjects.length > 0
    ? availableSubjects
    : ['General Request', 'Support Request', 'Department Inquiry'];

  const selectedDepartment = departments.find((department) => String(department.id) === String(form.department_id));
  const isMaintenanceDepartment = selectedDepartment?.name?.toLowerCase().includes('maintenance');

  const groupedTickets = Object.values(tickets.reduce((groups, ticket) => {
    const departmentId = ticket.department_id || 'unassigned';
    const departmentName = ticket.Department?.name || 'Unassigned Department';
    if (!groups[departmentId]) {
      groups[departmentId] = { name: departmentName, tickets: [] };
    }
    groups[departmentId].tickets.push(ticket);
    return groups;
  }, {})).sort((first, second) => first.name.localeCompare(second.name));

  const toggleDepartment = (departmentName) => {
    setExpandedDepartments((current) => ({
      ...current,
      [departmentName]: current[departmentName] !== true,
    }));
  };

  const createTicket = async (e) => {
    e.preventDefault();
    setSubmissionState({ status: 'loading', message: 'Creating your ticket...' });

    try {
      if (isMaintenanceDepartment && !attachment) {
        setSubmissionState({ status: 'error', message: 'Please upload an image for a maintenance ticket.', ticketCode: '' });
        return;
      }
      const response = await axios.post(`${API_BASE_URL}/api/tickets`, {
        ...form,
        user_id: user?.id || 0,
        attachment_data: attachment?.data || null,
        attachment_name: attachment?.name || null,
        attachment_type: attachment?.type || null,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nextDepartmentId = departments[0]?.id ? String(departments[0].id) : '';
      setForm({ subject: '', description: '', category: 'Other', priority: 'medium', department_id: nextDepartmentId });
      setAttachment(null);
      await loadTickets();
      const ticketCode = response.data.ticket_code || response.data.id;
      setSubmissionState({ status: 'success', message: 'Ticket created successfully.', ticketCode });
      window.setTimeout(() => setSubmissionState({ status: 'idle', message: '', ticketCode: '' }), 2200);
    } catch (error) {
      setSubmissionState({ status: 'error', message: 'Unable to create ticket. Please try again.', ticketCode: '' });
    }
  };

  const handleDepartmentChange = (departmentId) => {
    setForm((current) => ({ ...current, department_id: departmentId, subject: '' }));
    setAttachment(null);
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setAttachment(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setSubmissionState({ status: 'error', message: 'Please select an image file.' });
      event.target.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setSubmissionState({ status: 'error', message: 'Please select an image smaller than 3 MB.' });
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAttachment({ data: reader.result, name: file.name, type: file.type });
    reader.readAsDataURL(file);
  };

  const updateStatus = async (id, status) => {
    await axios.put(`${API_BASE_URL}/api/tickets/${id}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    loadTickets();
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
          <button type="button" className="header-brand header-brand-button" onClick={() => window.location.reload()} aria-label="Refresh AssistDesk">
            <div className="brand-badge">
              <img src="/assistdesk-logo.svg" alt="AssistDesk logo" />
            </div>
            <div>
              <h1>AssistDesk</h1>
              <p>Service requests and case tracking</p>
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
            <HeaderProfile user={user} />
            <LogoutButton />
            <NotificationBell />
          </div>
        </header>

        {submissionState.status !== 'idle' && (
          <div className="ticket-modal-backdrop">
            <div className={`ticket-notice ${submissionState.status}`} role={submissionState.status === 'loading' ? 'status' : 'alert'} aria-live="polite">
              {submissionState.status === 'loading' && <span className="ticket-notice-spinner" aria-hidden="true" />}
              {submissionState.status === 'success' && <span className="ticket-success-icon" aria-hidden="true">✓</span>}
              <span>{submissionState.message}</span>
              {submissionState.status === 'success' && (
                <strong className="ticket-notice-id">Ticket ID: {submissionState.ticketCode}</strong>
              )}
            </div>
          </div>
        )}

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
                <a href="/admin/catalog" onClick={() => setMobileMenuOpen(false)}>Catalog</a>
              </>
            )}
          </div>
          <div className="mobile-menu-actions">
            <LogoutButton onBeforeLogout={() => setMobileMenuOpen(false)} />
            <div className="mobile-menu-bell"><NotificationBell /></div>
          </div>
        </aside>

        <div className="page-intro">
          <div>
            <h2>Support tickets</h2>
            <p>Submit a request and monitor progress through clearly organized service channels.</p>
          </div>
        </div>

        {user?.role !== 'admin' && (
          <div className={`institutional-card ticket-form-card ${submissionState.status === 'loading' ? 'is-submitting' : ''}`} style={{ marginBottom: '20px' }}>
            <h3>Create a new request</h3>
            <form onSubmit={createTicket} aria-busy={submissionState.status === 'loading'}>
              <select className="institutional-select" value={form.department_id} onChange={(e) => handleDepartmentChange(e.target.value)} required>
                <option value="">Select a department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.display_name || department.name}</option>
                ))}
              </select>
              <select className="institutional-select" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
                <option value="">Select a subject</option>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <textarea className="institutional-textarea" placeholder="Describe your issue" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              {isMaintenanceDepartment && (
                <label className="ticket-image-upload">
                  <span>Upload an image of the maintenance issue</span>
                  <input type="file" accept="image/*" onChange={handleAttachmentChange} required />
                  {attachment && <small>{attachment.name}</small>}
                </label>
              )}
              <select className="institutional-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option>Hardware</option>
                <option>Building Maintenance</option>
                <option>Department Concern</option>
                <option>Account or Records</option>
                <option>Other</option>
              </select>
              <select className="institutional-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="urgent">Urgent</option>
              </select>
              <button className="institutional-btn ticket-submit-button" type="submit" disabled={submissionState.status === 'loading'}>
                {submissionState.status === 'loading' && <span className="ticket-submit-spinner" aria-hidden="true" />}
                {submissionState.status === 'loading' ? 'Creating Ticket...' : 'Create Ticket'}
              </button>
            </form>
          </div>
        )}

        <div className="institutional-card">
          <h3>Recent tickets</h3>
          <div className="list-stack">
            {groupedTickets.map((departmentGroup) => (
              <section key={departmentGroup.name} className="ticket-department-group">
                <button
                  type="button"
                  className="ticket-department-heading"
                  onClick={() => toggleDepartment(departmentGroup.name)}
                  aria-expanded={expandedDepartments[departmentGroup.name] === true}
                >
                  <span className="ticket-folder-icon" aria-hidden="true" />
                  <span>{departmentGroup.name}</span>
                  <span className="ticket-department-count">{departmentGroup.tickets.length}</span>
                </button>
                {expandedDepartments[departmentGroup.name] === true && (
                  <div className="ticket-department-contents">
                    {departmentGroup.tickets.map((ticket) => (
                      <div key={ticket.id}>
                        <h4 style={{ margin: '0 0 6px' }}>{ticket.ticket_code || `#${ticket.id}`} · {ticket.subject}</h4>
                        <TicketProgressBar status={ticket.status} />
                        <div className="small-muted"><strong>Category:</strong> {ticket.category || 'Other'}</div>
                        <div className="small-muted"><strong>Priority:</strong> {ticket.priority}</div>
                        <div className="small-muted"><strong>Estimated completion:</strong> {ticket.estimated_completion_at ? new Date(ticket.estimated_completion_at).toLocaleString() : 'Being estimated'}</div>
                        <p style={{ margin: '8px 0 0' }}>{ticket.description}</p>
                        {ticket.attachment_data && <img className="ticket-attachment-image" src={ticket.attachment_data} alt={ticket.attachment_name || 'Ticket attachment'} />}
                        {user?.role === 'admin' && (
                          <div className="inline-actions">
                            <button className="institutional-btn small secondary" onClick={() => updateStatus(ticket.id, 'open')}>Open</button>
                            <button className="institutional-btn small secondary" onClick={() => updateStatus(ticket.id, 'pending')}>Pending</button>
                            <button className="institutional-btn small secondary" onClick={() => updateStatus(ticket.id, 'in_progress')}>In Progress</button>
                            <button className="institutional-btn small secondary" onClick={() => updateStatus(ticket.id, 'resolved')}>Resolved</button>
                            <button className="institutional-btn small secondary" onClick={() => updateStatus(ticket.id, 'closed')}>Closed</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketsPage;
