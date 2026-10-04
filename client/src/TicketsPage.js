import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import HeaderProfile from './HeaderProfile';
import LogoutButton from './LogoutButton';
import SidebarProfile from './SidebarProfile';
import TicketProgressBar from './TicketProgressBar';
import { getSocket } from './socket';

const generalIssueOptions = {
  'IT and Technology': [
    'Wi-Fi or internet access',
    'Computer or laptop problem',
    'Printer or scanner problem',
    'Software or system access',
    'Password or account access',
  ],
  'Facilities and Maintenance': [
    'Electrical or lighting problem',
    'Plumbing or water problem',
    'Air conditioning or ventilation',
    'Furniture or fixture damage',
    'Building or room damage',
  ],
  'Classroom Concerns': [
    'Classroom equipment',
    'Classroom cleanliness',
    'Missing classroom supplies',
    'Room temperature or comfort',
  ],
  'Academic Support': [
    'Class schedule concern',
    'Learning materials request',
    'Assignment or course concern',
    'Tutoring or academic assistance',
  ],
  'Student Services': [
    'Enrollment or registration',
    'Student records request',
    'Student ID concern',
    'Transportation concern',
    'Uniform or school requirement',
  ],
  'Safety and Security': [
    'Safety hazard',
    'Security equipment problem',
    'Unsafe area or incident',
    'Lost and found item',
  ],
  'Health and Wellness': [
    'Nurse or medical assistance',
    'Counseling referral',
    'Accessibility concern',
    'Wellness concern',
  ],
  'Library and Resources': [
    'Book or resource request',
    'Library student ID',
    'Previous research access',
  ],
  'Clubs, Sports, and Events': [
    'Club or organization concern',
    'Sports equipment or facility',
    'Event setup request',
    'Room reservation request',
  ],
  'Administrative Requests': [
    'Form or document request',
    'Permit or approval request',
    'School announcement request',
    'Current general issue',
  ],
  'Cleaning and Sanitation': [
    'Restroom concern',
    'Trash or waste collection',
    'Pest concern',
    'Sanitation supplies',
  ],
  'Food Services': [
    'Cafeteria concern',
    'Meal quality or availability',
    'Food safety concern',
    'Vending machine problem',
  ],
};

const collegeDepartmentNames = [
  'basic education department',
  'college of nursing',
  'cs',
  'cba',
  'charm',
  'college of criminology',
  'college of physical therapy',
  'education department',
  'college of education',
];

const normalizeDepartmentName = (department) => String(department?.name || department || '').toLowerCase().trim();

const getCollegeDepartmentKey = (department) => {
  const name = normalizeDepartmentName(department);
  if (name === 'basic education department') return 'basic-education';
  if (['cs', 'computer science department', 'college of computer studies'].includes(name)) return 'cs';
  if (['cba', 'college of business administration', 'college of business and accountancy'].includes(name)) return 'cba';
  if (['charm', 'college of hospitality and restaurant management', 'college of hospitality management'].includes(name)) return 'charm';
  if (['education department', 'college of education'].includes(name)) return 'education';
  if (collegeDepartmentNames.includes(name)) return name;
  return null;
};

const isCollegeStudent = (currentUser) => currentUser?.role === 'student'
  && Boolean(getCollegeDepartmentKey(currentUser.department_name));

const getDepartmentDisplayName = (department) => {
  const normalizedName = String(department?.name || '').toLowerCase();
  if (['cs', 'computer science department', 'college of computer studies'].includes(normalizedName)) {
    return 'College of Computer Studies';
  }
  if (['charm', 'college of hospitality and restaurant management', 'college of hospitality management'].includes(normalizedName)) {
    return 'College of Hospitality Management';
  }
  if (['cba', 'college of business administration', 'college of business and accountancy'].includes(normalizedName)) {
    return 'College of Business and Accountancy';
  }
  if (['education department', 'college of education'].includes(normalizedName)) {
    return 'College of Education';
  }
  return department?.display_name || department?.name;
};

function TicketsPage() {
  const { token, user } = useAuth();
  const isTicketManager = ['admin', 'staff'].includes(user?.role);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ subject: '', description: '', category: '', priority: 'medium', department_id: '' });
  const [attachment, setAttachment] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [submissionState, setSubmissionState] = useState({ status: 'idle', message: '', ticketCode: '' });
  const [expandedDepartments, setExpandedDepartments] = useState({});
  const [expandedRoles, setExpandedRoles] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState('');
  const [etaDraft, setEtaDraft] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [ticketActionState, setTicketActionState] = useState('idle');
  const [staffOptions, setStaffOptions] = useState([]);
  const [assignmentSelection, setAssignmentSelection] = useState('');
  const [routingSelection, setRoutingSelection] = useState('');
  const [routingReason, setRoutingReason] = useState('');
  const uploadErrorTimeoutRef = useRef(null);

  const toDateTimeLocal = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
  };

  const formatDateTime = (value) => {
    if (!value) return 'Not available';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
  };

  const loadTickets = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/tickets`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTickets(res.data);
  };

  const reloadSelectedTicket = async (ticketId) => {
    const response = await axios.get(`${API_BASE_URL}/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSelectedTicket(response.data);
  };

  const loadDepartments = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/catalog/departments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const options = (res.data.departments || []).sort((first, second) => (
      getDepartmentDisplayName(first).localeCompare(getDepartmentDisplayName(second))
    ));
    setDepartments(options);
  };

  useEffect(() => {
    if (token) {
      loadTickets();
      loadDepartments();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;
    const refreshQueue = () => loadTickets();
    const events = ['ticketCreated', 'ticketStatusUpdated', 'ticketEtaUpdated', 'ticketEtaExpired', 'ticketAssignmentUpdated', 'ticketDepartmentUpdated', 'ticketPriorityUpdated', 'ticketUpdateAdded'];
    events.forEach((eventName) => socket.on(eventName, refreshQueue));
    return () => events.forEach((eventName) => socket.off(eventName, refreshQueue));
  }, [token]);

  const specificIssueOptions = generalIssueOptions[form.category] || [];
  const studentCollegeKey = getCollegeDepartmentKey(user?.department_name);
  const availableDepartments = isCollegeStudent(user)
    ? departments.filter((department) => {
      const collegeKey = getCollegeDepartmentKey(department);
      return !collegeKey || collegeKey === studentCollegeKey;
    })
    : departments;

  const selectedDepartment = departments.find((department) => String(department.id) === String(form.department_id));
  const isMaintenanceDepartment = selectedDepartment?.name?.toLowerCase().includes('maintenance');
  const getDepartmentFolder = (department) => {
    const name = getDepartmentDisplayName(department) || 'Unassigned Department';
    const key = name.toLowerCase().replace(/\bdepartment\b/g, '').replace(/\s+/g, ' ').trim();
    return { key: key || 'unassigned', name: name.toLowerCase().includes('maintenance') ? 'Maintenance Department' : name };
  };

  const groupedTickets = Object.values(tickets.reduce((groups, ticket) => {
    const requesterDepartment = ticket.User?.Department;
    const department = isTicketManager
      ? requesterDepartment
      : ticket.Department;
    if (user?.role === 'student' && studentCollegeKey) {
      const ticketCollegeKey = getCollegeDepartmentKey(department);
      if (ticketCollegeKey && ticketCollegeKey !== studentCollegeKey) return groups;
    }
    const { key: departmentId, name: departmentName } = getDepartmentFolder(department);
    if (!groups[departmentId]) {
      groups[departmentId] = { name: departmentName, tickets: [] };
    }
    groups[departmentId].tickets.push(ticket);
    return groups;
  }, {})).sort((first, second) => first.name.localeCompare(second.name));

  const adminRoleGroups = ['student', 'faculty', 'staff', 'unassigned'].map((role) => {
    const roleTickets = tickets.filter((ticket) => ticket.User?.role === role || (!ticket.User?.role && role === 'unassigned'));
    if (role !== 'student') return { key: role, name: role[0].toUpperCase() + role.slice(1), tickets: roleTickets, departments: [] };
    const departmentsByKey = roleTickets.reduce((groups, ticket) => {
      const { key, name } = getDepartmentFolder(ticket.User?.Department);
      if (!groups[key]) groups[key] = { key, name, tickets: [] };
      groups[key].tickets.push(ticket);
      return groups;
    }, {});
    return { key: role, name: 'Student', tickets: roleTickets, departments: Object.values(departmentsByKey).sort((a, b) => a.name.localeCompare(b.name)) };
  });

  const toggleDepartment = (departmentName) => {
    setExpandedDepartments((current) => ({
      ...current,
      [departmentName]: current[departmentName] !== true,
    }));
  };

  const toggleRole = (roleName) => {
    setExpandedRoles((current) => ({ ...current, [roleName]: current[roleName] !== true }));
  };

  const renderAdminTicketButton = (ticket) => (
    <button type="button" className="admin-ticket-id-button" onClick={() => {
      setSelectedTicket(ticket);
      setEtaDraft(toDateTimeLocal(ticket.estimated_completion_at));
      setUpdateMessage('');
      setRoutingSelection(String(ticket.department_id));
      setRoutingReason('');
      setAssignmentSelection(ticket.assigned_user_id ? String(ticket.assigned_user_id) : '');
      axios.get(`${API_BASE_URL}/api/tickets/${ticket.id}/assignees`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => setStaffOptions(response.data.assignees || []))
        .catch(() => setStaffOptions([]));
      setTicketActionState('idle');
    }}>
      {ticket.ticket_code || `#${ticket.id}`}
    </button>
  );

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
      setForm({ subject: '', description: '', category: '', priority: 'medium', department_id: '' });
      setAttachment(null);
      await loadTickets();
      const ticketCode = response.data.ticket_code || response.data.id;
      setSubmissionState({ status: 'success', message: 'Ticket created successfully.', ticketCode });
      window.setTimeout(() => setSubmissionState({ status: 'idle', message: '', ticketCode: '' }), 2200);
    } catch (error) {
      const routeSuggestions = error.response?.data?.routing_candidates?.map((candidate) => candidate.name).filter(Boolean);
      const baseMessage = error.response?.data?.message || 'Unable to create ticket. Please try again.';
      setSubmissionState({ status: 'error', message: routeSuggestions?.length ? `${baseMessage} Suggested departments: ${routeSuggestions.join(', ')}.` : baseMessage, ticketCode: '' });
    }
  };

  const handleDepartmentChange = (departmentId) => {
    setForm((current) => ({ ...current, department_id: departmentId, category: '', subject: '' }));
    setAttachment(null);
  };

  const handleGeneralIssueChange = (category) => {
    setForm((current) => ({ ...current, category, subject: '' }));
  };

  const showUploadError = (message) => {
    setSubmissionState({ status: 'error', message, ticketCode: '' });
    if (uploadErrorTimeoutRef.current) window.clearTimeout(uploadErrorTimeoutRef.current);
    uploadErrorTimeoutRef.current = window.setTimeout(() => {
      setSubmissionState({ status: 'idle', message: '', ticketCode: '' });
      uploadErrorTimeoutRef.current = null;
    }, 1000);
  };

  const acceptAttachment = (file) => {
    if (!file) {
      setAttachment(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      showUploadError('Please select an image file.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showUploadError('Please select an image smaller than 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAttachment({ data: reader.result, name: file.name, type: file.type });
    reader.readAsDataURL(file);
  };
  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    acceptAttachment(file);
    event.target.value = '';
  };

  const handleAttachmentPaste = (event) => {
    const pastedImage = Array.from(event.clipboardData?.items || [])
      .find((item) => item.type.startsWith('image/'));
    if (!pastedImage) return;

    event.preventDefault();
    const file = pastedImage.getAsFile();
    if (file) acceptAttachment(new File([file], `pasted-maintenance-photo.${file.type.split('/')[1] || 'png'}`, { type: file.type }));
  };

  const clearAttachment = () => {
    setAttachment(null);
    setPreviewImage(null);
    const input = document.getElementById('maintenance-photo');
    if (input) input.value = '';
  };

  const updateStatus = async (id, status) => {
    if (updatingStatus) return;

    setUpdatingStatus(status);
    try {
      await axios.put(`${API_BASE_URL}/api/tickets/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await reloadSelectedTicket(id);
      await loadTickets();
    } catch (error) {
      setSubmissionState({ status: 'error', message: error.response?.data?.message || 'Unable to update ticket status.', ticketCode: '' });
    } finally {
      setUpdatingStatus('');
    }
  };

  const updateEta = async (event) => {
    event.preventDefault();
    if (!selectedTicket || !etaDraft) return;

    setTicketActionState('eta');
    try {
      const response = await axios.put(`${API_BASE_URL}/api/tickets/${selectedTicket.id}/eta`, {
        estimated_completion_at: new Date(etaDraft).toISOString(),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedTicket((current) => ({
        ...current,
        estimated_completion_at: response.data.ticket.estimated_completion_at,
        TicketUpdates: [...(current.TicketUpdates || []), response.data.update],
      }));
      await loadTickets();
    } catch (error) {
      setSubmissionState({ status: 'error', message: error.response?.data?.message || 'Unable to update the ticket ETA.', ticketCode: '' });
    } finally {
      setTicketActionState('idle');
    }
  };

  const addUpdate = async (event) => {
    event.preventDefault();
    if (!selectedTicket || !updateMessage.trim()) return;

    setTicketActionState('update');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/tickets/${selectedTicket.id}/updates`, {
        message: updateMessage.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedTicket((current) => ({
        ...current,
        TicketUpdates: [...(current.TicketUpdates || []), response.data],
      }));
      setUpdateMessage('');
      await loadTickets();
    } catch (error) {
      setSubmissionState({ status: 'error', message: error.response?.data?.message || 'Unable to add ticket update.', ticketCode: '' });
    } finally {
      setTicketActionState('idle');
    }
  };

  const updateAssignment = async (assigneeId = assignmentSelection) => {
    if (!selectedTicket) return;
    setTicketActionState('assignment');
    try {
      const response = await axios.put(`${API_BASE_URL}/api/tickets/${selectedTicket.id}/assignment`, {
        assigned_user_id: assigneeId ? Number(assigneeId) : null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      await reloadSelectedTicket(selectedTicket.id);
      setAssignmentSelection(response.data.assigned_user_id ? String(response.data.assigned_user_id) : '');
      await loadTickets();
    } catch (error) {
      setSubmissionState({ status: 'error', message: error.response?.data?.message || 'Unable to update ticket assignment.', ticketCode: '' });
    } finally {
      setTicketActionState('idle');
    }
  };

  const updateDepartment = async (event) => {
    event.preventDefault();
    if (!selectedTicket || !routingSelection) return;
    setTicketActionState('department');
    try {
      const response = await axios.put(`${API_BASE_URL}/api/tickets/${selectedTicket.id}/department`, {
        department_id: Number(routingSelection),
        reason: routingReason,
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (user.role === 'staff' || (user.role === 'admin' && user.department_id)) {
        setSelectedTicket(null);
        setStaffOptions([]);
        await loadTickets();
        return;
      }
      await reloadSelectedTicket(selectedTicket.id);
      setRoutingSelection(String(response.data.department_id));
      setAssignmentSelection('');
      setStaffOptions([]);
      await loadTickets();
      const assigneeResponse = await axios.get(`${API_BASE_URL}/api/tickets/${selectedTicket.id}/assignees`, { headers: { Authorization: `Bearer ${token}` } });
      setStaffOptions(assigneeResponse.data.assignees || []);
    } catch (error) {
      setSubmissionState({ status: 'error', message: error.response?.data?.message || 'Unable to correct ticket routing.', ticketCode: '' });
    } finally {
      setTicketActionState('idle');
    }
  };

  const escalatePriority = async () => {
    if (!selectedTicket || selectedTicket.priority === 'urgent') return;
    setTicketActionState('priority');
    try {
      await axios.put(`${API_BASE_URL}/api/tickets/${selectedTicket.id}/priority`, {
        priority: 'urgent',
        reason: 'Escalated by department staff.',
      }, { headers: { Authorization: `Bearer ${token}` } });
      await reloadSelectedTicket(selectedTicket.id);
      await loadTickets();
    } catch (error) {
      setSubmissionState({ status: 'error', message: error.response?.data?.message || 'Unable to escalate ticket priority.', ticketCode: '' });
    } finally {
      setTicketActionState('idle');
    }
  };

  const deleteTicket = async (ticket) => {
    const ticketCode = ticket.ticket_code || `#${ticket.id}`;
    if (!window.confirm(`Delete ticket ${ticketCode}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/tickets/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadTickets();
    } catch (error) {
      setSubmissionState({ status: 'error', message: error.response?.data?.message || 'Unable to delete ticket.', ticketCode: '' });
    }
  };

  return (
    <div className="app-shell">
      <div className="page-shell">
        <div className={`mobile-menu-backdrop ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)} />
        <header className="page-header">
          <button
            type="button"
            className="mobile-menu-toggle"
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
                <a href="/admin/catalog">Catalog</a>
                <a href="/admin/reports">Data Analytics</a>
                <a href="/admin/reports?view=users" className="header-nav-button">Users</a>
              </>
            )}
          </div>
          <div className="header-actions">
            <HeaderProfile user={user} />
            <LogoutButton />
          </div>
        </header>

        {(submissionState.status === 'loading' || submissionState.status === 'success') && (
          <div className="ticket-modal-backdrop">
            <div className={`ticket-notice ${submissionState.status}`} role={submissionState.status === 'loading' ? 'status' : 'alert'} aria-live="polite">
              {submissionState.status === 'loading' && <span className="ticket-notice-spinner" aria-hidden="true" />}
              {submissionState.status === 'success' && <span className="ticket-success-icon" aria-hidden="true">✓</span>}
              <span>{submissionState.message}</span>
              {submissionState.status === 'success' && (
                <strong className="ticket-notice-id">{submissionState.ticketCode}</strong>
              )}
            </div>
          </div>
        )}

        {submissionState.status === 'error' && (
          <div className="ticket-form-error" role="alert">
            <span>{submissionState.message}</span>
            <button type="button" onClick={() => setSubmissionState({ status: 'idle', message: '', ticketCode: '' })} aria-label="Dismiss error">×</button>
          </div>
        )}

        {previewImage && (
          <div className="ticket-image-lightbox" role="presentation" onClick={() => setPreviewImage(null)}>
            <div className="ticket-image-lightbox-content" role="dialog" aria-modal="true" aria-label="Maintenance photo preview" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="ticket-image-lightbox-close" onClick={() => setPreviewImage(null)} aria-label="Close photo preview">×</button>
              <img src={previewImage} alt="Maintenance issue preview" />
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
                <a href="/admin/catalog" onClick={() => setMobileMenuOpen(false)}>Catalog</a>
                <a href="/admin/reports" onClick={() => setMobileMenuOpen(false)}>Data Analytics</a>
                <a href="/admin/reports?view=users" className="header-nav-button" onClick={() => setMobileMenuOpen(false)}>Users</a>
              </>
            )}
          </div>
          <div className="mobile-menu-actions">
            <LogoutButton onBeforeLogout={() => setMobileMenuOpen(false)} />
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
              <select className="institutional-select" value={form.department_id} onChange={(e) => handleDepartmentChange(e.target.value)}>
                <option value="">Auto-route when confident, or select a department</option>
                {availableDepartments.map((department) => (
                  <option key={department.id} value={department.id}>{getDepartmentDisplayName(department)}</option>
                ))}
              </select>
              <p className="helper-text">Automatic routing only submits when the concern matches a department confidently. Otherwise, select the department yourself.</p>
              <select className="institutional-select" value={form.category} onChange={(e) => handleGeneralIssueChange(e.target.value)} required>
                <option value="">Select a general issue</option>
                {Object.keys(generalIssueOptions).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select className="institutional-select" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required disabled={!form.category}>
                <option value="">Select a specific issue</option>
                {specificIssueOptions.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <textarea className="institutional-textarea" placeholder="Current general issue" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              {isMaintenanceDepartment && (
                <div className={`ticket-image-upload ${attachment ? 'has-file' : ''}`} onPaste={handleAttachmentPaste} tabIndex="0">
                  <div className="ticket-image-upload-heading">
                    <span className="ticket-image-upload-icon" aria-hidden="true">+</span>
                    <div>
                      <strong>Attach a photo of the issue</strong>
                      <small>Required for maintenance requests. JPG, PNG, or WEBP up to 3 MB.</small>
                    </div>
                  </div>
                  {attachment ? (
                    <div className="ticket-image-preview">
                      <button type="button" className="ticket-image-preview-button" onClick={() => setPreviewImage(attachment.data)} aria-label="Open photo preview">
                        <img src={attachment.data} alt="Selected maintenance issue" />
                      </button>
                      <button type="button" className="ticket-image-remove" onClick={clearAttachment}>Remove</button>
                    </div>
                  ) : (
                    <>
                      <label className="ticket-image-select ticket-image-select--full" htmlFor="maintenance-photo">
                        <span>Choose a photo</span>
                      </label>
                      <input id="maintenance-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAttachmentChange} required={!attachment} />
                    </>
                  )}
                </div>
              )}
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
          {isTicketManager ? (
            <div className="list-stack admin-ticket-folders">
              {adminRoleGroups.map((roleGroup) => (
                <section key={roleGroup.key} className="ticket-department-group">
                  <button type="button" className="ticket-department-heading admin-role-folder" onClick={() => toggleRole(roleGroup.key)} aria-expanded={expandedRoles[roleGroup.key] === true}>
                    <span className="ticket-folder-icon" aria-hidden="true" />
                    <span>{roleGroup.name}</span>
                    <span className="ticket-department-count">{roleGroup.tickets.length}</span>
                  </button>
                  {expandedRoles[roleGroup.key] === true && (
                    <div className="ticket-department-contents">
                      {roleGroup.key === 'student' ? roleGroup.departments.map((departmentGroup) => (
                        <section key={departmentGroup.key} className="ticket-department-group admin-nested-folder">
                          <button type="button" className="ticket-department-heading" onClick={() => toggleDepartment(`admin-${departmentGroup.key}`)} aria-expanded={expandedDepartments[`admin-${departmentGroup.key}`] === true}>
                            <span className="ticket-folder-icon" aria-hidden="true" />
                            <span>{departmentGroup.name}</span>
                            <span className="ticket-department-count">{departmentGroup.tickets.length}</span>
                          </button>
                          {expandedDepartments[`admin-${departmentGroup.key}`] === true && <div className="admin-ticket-id-list">{departmentGroup.tickets.map(renderAdminTicketButton)}</div>}
                        </section>
                      )) : <div className="admin-ticket-id-list">{roleGroup.tickets.map(renderAdminTicketButton)}</div>}
                    </div>
                  )}
                </section>
              ))}
            </div>
          ) : (
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
                    <div className="admin-ticket-id-list">
                      {departmentGroup.tickets.map(renderAdminTicketButton)}
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>
          )}
        </div>
        {selectedTicket && (
          <div className="ticket-detail-modal-backdrop" role="presentation" onMouseDown={() => setSelectedTicket(null)}>
            <div className="ticket-detail-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-detail-title" onMouseDown={(event) => event.stopPropagation()}>
              <div className="ticket-detail-modal-header">
                <div>
                  <p className="small-muted">Ticket ID</p>
                  <h3 id="ticket-detail-title">{selectedTicket.ticket_code || `#${selectedTicket.id}`}</h3>
                </div>
                <button type="button" className="ticket-detail-close" onClick={() => setSelectedTicket(null)} aria-label="Close ticket details">×</button>
              </div>
              <h4>{selectedTicket.subject}</h4>
              <TicketProgressBar
                status={selectedTicket.status}
                canUpdate={isTicketManager}
                onStatusChange={(status) => updateStatus(selectedTicket.id, status)}
                updatingStatus={updatingStatus}
              />
              <p>{selectedTicket.description}</p>
              <div className="ticket-detail-meta">
                <div><strong>Requester:</strong> {selectedTicket.User?.name || selectedTicket.User?.email || 'Unknown'}</div>
                <div><strong>Requester department:</strong> {selectedTicket.User?.Department?.name || 'Unassigned'}</div>
                <div><strong>Routed department:</strong> {selectedTicket.Department?.name || 'Unassigned'}</div>
                <div><strong>Assigned staff:</strong> {selectedTicket.Assignee?.name || 'Unassigned'}</div>
                <div><strong>Routing mode:</strong> {selectedTicket.routing_method || 'manual'}</div>
                <div><strong>Routing confidence:</strong> {selectedTicket.routing_confidence == null ? 'Not recorded' : `${Math.round(selectedTicket.routing_confidence * 100)}% (heuristic)`}</div>
                <div><strong>Original suggestion:</strong> {departments.find((department) => Number(department.id) === Number(selectedTicket.suggested_department_id))?.name || 'Not available'}</div>
                <div><strong>Category:</strong> {selectedTicket.category || 'Other'}</div>
                <div><strong>Priority:</strong> {selectedTicket.priority}</div>
                <div><strong>Estimated completion:</strong> {formatDateTime(selectedTicket.estimated_completion_at)}</div>
              </div>
              <section className="ticket-update-section" aria-labelledby="ticket-updates-title">
                <div className="ticket-update-heading">
                  <h5 id="ticket-updates-title">Ticket updates</h5>
                  <span>{(selectedTicket.TicketUpdates || []).length} updates</span>
                </div>
                {(selectedTicket.TicketUpdates || []).length > 0 ? (
                  <div className="ticket-update-list">
                    {[...(selectedTicket.TicketUpdates || [])].sort((first, second) => new Date(first.created_at) - new Date(second.created_at)).map((update) => (
                      <article key={update.id} className="ticket-update-item">
                        <div className="ticket-update-item-meta">
                          {formatDateTime(update.created_at)}{update.action ? ` · ${update.action.replace(/_/g, ' ')}` : ''}{update.Updater?.name ? ` · ${update.Updater.name}` : update.action?.startsWith('system_') ? ' · System' : update.updated_by ? ` · User #${update.updated_by}` : ''}{update.department_id ? ` · Department #${update.department_id}` : ''}
                        </div>
                        <p>{update.message}</p>
                      </article>
                    ))}
                  </div>
                ) : <p className="small-muted">No updates have been posted yet.</p>}
              </section>
              {isTicketManager && (
                <div className="ticket-admin-controls">
                  <section className="ticket-update-form">
                    <label><strong>Assignment</strong><span>{selectedTicket.Assignee?.name ? `Assigned to ${selectedTicket.Assignee.name}` : 'Unassigned ticket'}</span></label>
                    <>
                        <select className="institutional-select" required={user.role === 'staff'} value={assignmentSelection} onChange={(event) => setAssignmentSelection(event.target.value)}>
                          {user.role === 'admin' && <option value="">Unassigned</option>}
                          {staffOptions.map((staffMember) => <option key={staffMember.id} value={staffMember.id}>{staffMember.name} — {staffMember.email}</option>)}
                        </select>
                        <button className="institutional-btn small" type="button" onClick={() => updateAssignment()} disabled={ticketActionState !== 'idle' || (user.role === 'staff' && !assignmentSelection) || String(selectedTicket.assigned_user_id || '') === assignmentSelection}>{ticketActionState === 'assignment' ? 'Saving...' : 'Assign / Reassign'}</button>
                        {user.role === 'staff' && !selectedTicket.assigned_user_id && <button className="institutional-btn small secondary" type="button" onClick={() => updateAssignment(String(user.id))} disabled={ticketActionState !== 'idle'}>Accept for me</button>}
                    </>
                  </section>
                  <form className="ticket-update-form" onSubmit={updateDepartment}>
                    <label htmlFor="ticket-routing-department"><strong>Correct routing</strong><span>Choose the department that should handle this ticket; the correction is logged.</span></label>
                    <select id="ticket-routing-department" className="institutional-select" value={routingSelection} onChange={(event) => setRoutingSelection(event.target.value)} required>
                      {departments.map((department) => <option key={department.id} value={department.id}>{getDepartmentDisplayName(department)}</option>)}
                    </select>
                    <input className="institutional-input" value={routingReason} onChange={(event) => setRoutingReason(event.target.value)} placeholder="Reason for routing correction (optional)" />
                    <button className="institutional-btn small" type="submit" disabled={ticketActionState !== 'idle' || Number(routingSelection) === Number(selectedTicket.department_id)}>{ticketActionState === 'department' ? 'Correcting...' : 'Update department'}</button>
                  </form>
                  {selectedTicket.priority !== 'urgent' && <button className="institutional-btn small danger" type="button" onClick={escalatePriority} disabled={ticketActionState !== 'idle'}>{ticketActionState === 'priority' ? 'Escalating...' : 'Escalate to urgent'}</button>}
                  <form className="ticket-eta-form" onSubmit={updateEta}>
                    <label htmlFor="ticket-eta"><strong>Set ETA</strong><span>Authorized department staff can change this.</span></label>
                    <input id="ticket-eta" className="institutional-input" type="datetime-local" value={etaDraft} onChange={(event) => setEtaDraft(event.target.value)} required />
                    <button className="institutional-btn small" type="submit" disabled={ticketActionState !== 'idle'}>{ticketActionState === 'eta' ? 'Saving...' : 'Save ETA'}</button>
                  </form>
                  <form className="ticket-update-form" onSubmit={addUpdate}>
                    <label htmlFor="ticket-update-message"><strong>Post an update</strong><span>This message will be visible to the requester.</span></label>
                    <textarea id="ticket-update-message" className="institutional-textarea" rows="3" value={updateMessage} onChange={(event) => setUpdateMessage(event.target.value)} placeholder="Share progress or next steps" required />
                    <button className="institutional-btn small" type="submit" disabled={ticketActionState !== 'idle'}>{ticketActionState === 'update' ? 'Posting...' : 'Post update'}</button>
                  </form>
                </div>
              )}
              {selectedTicket.attachment_data && <img className="ticket-attachment-image" src={selectedTicket.attachment_data} alt={selectedTicket.attachment_name || 'Ticket attachment'} />}
              <div className="inline-actions">
                {!isTicketManager && <button type="button" className="institutional-btn small danger" onClick={() => { deleteTicket(selectedTicket); setSelectedTicket(null); }}>Delete ticket</button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketsPage;
