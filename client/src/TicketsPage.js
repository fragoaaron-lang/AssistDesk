import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import LogoutButton from './LogoutButton';
import HeaderProfile from './HeaderProfile';
import SidebarProfile from './SidebarProfile';
import TicketProgressBar from './TicketProgressBar';
import { validateFaceInImage } from './faceVerification';

function TicketsPage() {
  const { token, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ subject: '', description: '', category: 'Other', priority: 'medium', department_id: '' });
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
  const [faceVerificationOpen, setFaceVerificationOpen] = useState(false);
  const [faceVerificationError, setFaceVerificationError] = useState('');
  const [faceVerificationErrorDismissed, setFaceVerificationErrorDismissed] = useState(false);
  const [faceVerificationErrorOffset, setFaceVerificationErrorOffset] = useState(0);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [faceVerified, setFaceVerified] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const uploadErrorTimeoutRef = useRef(null);
  const faceVerificationErrorDragRef = useRef(null);

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
  const getDepartmentFolder = (department) => {
    const name = department?.name || 'Unassigned Department';
    const key = name.toLowerCase().replace(/\bdepartment\b/g, '').replace(/\s+/g, ' ').trim();
    return { key: key || 'unassigned', name: name.toLowerCase().includes('maintenance') ? 'Maintenance Department' : name };
  };

  const groupedTickets = Object.values(tickets.reduce((groups, ticket) => {
    const requesterDepartment = ticket.User?.Department;
    const department = user?.role === 'admin' ? requesterDepartment : ticket.Department;
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

  const getProfileFaceReference = () => {
    if (user?.profile_picture) return user.profile_picture;
    const identifier = user?.id ?? user?.email ?? 'guest';
    const key = `assistdesk_profile_photo_${identifier}`;
    return localStorage.getItem(key) || '';
  };

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
    setCameraReady(false);
  };

  const showUploadError = (message) => {
    setSubmissionState({ status: 'error', message, ticketCode: '' });
    if (uploadErrorTimeoutRef.current) window.clearTimeout(uploadErrorTimeoutRef.current);
    uploadErrorTimeoutRef.current = window.setTimeout(() => {
      setSubmissionState({ status: 'idle', message: '', ticketCode: '' });
      uploadErrorTimeoutRef.current = null;
    }, 1000);
  };

  const setFaceVerificationFailure = (message) => {
    setFaceVerificationError(message);
    setFaceVerificationErrorDismissed(false);
    setFaceVerificationErrorOffset(0);
  };

  const openFaceVerificationCamera = () => {
    setPendingAttachment(null);
    setFaceVerificationError('');
    setFaceVerificationErrorDismissed(false);
    setFaceVerificationErrorOffset(0);
    setFaceVerificationOpen(true);
  };

  const handleFaceVerificationErrorPointerDown = (event) => {
    faceVerificationErrorDragRef.current = { startX: event.clientX, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleFaceVerificationErrorPointerMove = (event) => {
    const drag = faceVerificationErrorDragRef.current;
    if (!drag) return;
    setFaceVerificationErrorOffset(event.clientX - drag.startX);
  };

  const handleFaceVerificationErrorPointerUp = (event) => {
    const drag = faceVerificationErrorDragRef.current;
    if (!drag) return;
    const offset = event.clientX - drag.startX;
    faceVerificationErrorDragRef.current = null;
    if (Math.abs(offset) >= 80) {
      setFaceVerificationErrorDismissed(true);
      setFaceVerificationErrorOffset(offset > 0 ? 420 : -420);
      return;
    }
    setFaceVerificationErrorOffset(0);
  };

  const startCameraVerification = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setFaceVerificationFailure('Camera access is not available in this browser.');
      return;
    }

    try {
      stopCameraStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
      setCameraReady(true);
      setFaceVerificationError('');
    } catch (error) {
      setCameraReady(false);
      setFaceVerificationFailure('Unable to access the camera. Please allow camera access and try again.');
    }
  };

  const acceptAttachment = async (file) => {
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

    if (!faceVerified) {
      const profileFace = getProfileFaceReference();
      const result = await validateFaceInImage(file, profileFace || undefined);
      if (!result.isFaceLike) {
        showUploadError(result.reason || 'Face verification failed. Please upload a clear photo showing your face before submitting maintenance proof.');
        clearAttachment();
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = () => setAttachment({ data: reader.result, name: file.name, type: file.type });
    reader.readAsDataURL(file);
  };

  const captureFaceVerification = async () => {
    const video = cameraVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setFaceVerificationFailure('The camera is still starting. Please wait a moment and try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const capturedImage = canvas.toDataURL('image/jpeg');
    const dataBlob = await fetch(capturedImage).then((response) => response.blob());
    const file = new File([dataBlob], pendingAttachment?.name || 'maintenance-face-verification.jpg', { type: 'image/jpeg' });

    const result = await validateFaceInImage(file, getProfileFaceReference() || undefined);
    if (!result.isFaceLike) {
      setFaceVerificationFailure(result.reason || 'Face recognition did not match your profile photo. Please try again.');
      return;
    }

    setFaceVerified(true);
    setFaceVerificationOpen(false);
    setPendingAttachment(null);
    stopCameraStream();
    setSubmissionState({ status: 'success', message: 'Face verification passed. You may now upload the issue photo.', ticketCode: '' });
    window.setTimeout(() => setSubmissionState({ status: 'idle', message: '', ticketCode: '' }), 2200);
  };

  const autoVerifyFace = async () => {
    const video = cameraVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight || !cameraReady) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const capturedImage = canvas.toDataURL('image/jpeg');
    const dataBlob = await fetch(capturedImage).then((response) => response.blob());
    const file = new File([dataBlob], 'maintenance-face-verification.jpg', { type: 'image/jpeg' });
    const result = await validateFaceInImage(file, getProfileFaceReference() || undefined);

    if (result.isFaceLike) {
      setFaceVerified(true);
      setFaceVerificationOpen(false);
      setPendingAttachment(null);
      stopCameraStream();
      setSubmissionState({ status: 'success', message: 'Verification complete. You may now upload the issue photo.', ticketCode: '' });
      window.setTimeout(() => setSubmissionState({ status: 'idle', message: '', ticketCode: '' }), 2200);
      return;
    }

    setFaceVerificationFailure(result.reason || 'Unable to verify your face. Please align your face in the camera frame and try again.');
  };

  const handleAttachmentChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (faceVerified) {
      await acceptAttachment(file);
      event.target.value = '';
      return;
    }

    const profileFace = getProfileFaceReference();
    if (!profileFace) {
      showUploadError('Please upload or save a profile photo before submitting maintenance proof.');
      event.target.value = '';
      return;
    }

    setPendingAttachment(file);
    setFaceVerificationError('');
    setFaceVerificationOpen(true);
    event.target.value = '';
  };

  useEffect(() => {
    if (!faceVerificationOpen) {
      stopCameraStream();
      return undefined;
    }

    startCameraVerification();
    return () => stopCameraStream();
  }, [faceVerificationOpen]);

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
    setFaceVerified(false);
    const input = document.getElementById('maintenance-photo');
    if (input) input.value = '';
  };

  const updateStatus = async (id, status) => {
    if (updatingStatus) return;

    setUpdatingStatus(status);
    try {
      const response = await axios.put(`${API_BASE_URL}/api/tickets/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedTicket((current) => (current?.id === id ? { ...current, status: response.data.status || status } : current));
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
                <a href="/admin/reports">Reports</a>
                <a href="/admin/catalog">Catalog</a>
              </>
            )}
          </div>
          <div className="header-actions">
            <HeaderProfile user={user} />
            <LogoutButton />
          </div>
        </header>

        {submissionState.status !== 'idle' && (
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

        {previewImage && (
          <div className="ticket-image-lightbox" role="presentation" onClick={() => setPreviewImage(null)}>
            <div className="ticket-image-lightbox-content" role="dialog" aria-modal="true" aria-label="Maintenance photo preview" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="ticket-image-lightbox-close" onClick={() => setPreviewImage(null)} aria-label="Close photo preview">×</button>
              <img src={previewImage} alt="Maintenance issue preview" />
            </div>
          </div>
        )}

        {faceVerificationOpen && (
          <div className="ticket-image-lightbox" role="presentation" onClick={() => { setFaceVerificationOpen(false); setPendingAttachment(null); stopCameraStream(); }}>
            <div className="ticket-image-lightbox-content face-verification-modal" role="dialog" aria-modal="true" aria-label="Face verification" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="ticket-image-lightbox-close" onClick={() => { setFaceVerificationOpen(false); setPendingAttachment(null); stopCameraStream(); }} aria-label="Close face verification">×</button>
              <div className="face-verification-header">
                <h3>Face verification</h3>
                <p>Please look at the camera and match your profile face before continuing.</p>
              </div>
              <div className="face-verification-video-wrap">
                <div className="face-verification-frame" aria-hidden="true">
                  <span className="face-verification-outline" />
                </div>
                <video ref={cameraVideoRef} autoPlay muted playsInline className="face-verification-video" onLoadedData={autoVerifyFace} />
              </div>
              {faceVerificationError && !faceVerificationErrorDismissed && (
                <div
                  className="ticket-notice error face-verification-error-notice"
                  role="alert"
                  aria-live="polite"
                  style={{ transform: `translateX(${faceVerificationErrorOffset}px)` }}
                  onPointerDown={handleFaceVerificationErrorPointerDown}
                  onPointerMove={handleFaceVerificationErrorPointerMove}
                  onPointerUp={handleFaceVerificationErrorPointerUp}
                  onPointerCancel={handleFaceVerificationErrorPointerUp}
                >
                  {faceVerificationError}
                </div>
              )}
              <div className="face-verification-actions">
                <button type="button" className="institutional-btn ticket-submit-button" onClick={autoVerifyFace} disabled={!cameraReady}>
                  {cameraReady ? 'Verify' : 'Starting camera...'}
                </button>
                <button type="button" className="ticket-image-remove" onClick={() => { setFaceVerificationOpen(false); setPendingAttachment(null); stopCameraStream(); }}>
                  Cancel
                </button>
              </div>
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
                <div className={`ticket-image-upload ${attachment ? 'has-file' : ''} ${faceVerified ? 'is-verified' : ''}`} onPaste={handleAttachmentPaste} tabIndex="0">
                  <div className="ticket-image-upload-heading">
                    <span className="ticket-image-upload-icon" aria-hidden="true">+</span>
                    <div>
                      <strong>Attach a photo of the issue</strong>
                      <small>Required for maintenance requests. Face recognition verification is required before the photo can be uploaded. JPG, PNG, or WEBP up to 3 MB.</small>
                    </div>
                  </div>
                  {attachment ? (
                    <div className="ticket-image-preview">
                      <button type="button" className="ticket-image-preview-button" onClick={() => setPreviewImage(attachment.data)} aria-label="Open photo preview">
                        <img src={attachment.data} alt="Selected maintenance issue" />
                      </button>
                      <button type="button" className="ticket-image-remove" onClick={clearAttachment}>Remove</button>
                    </div>
                  ) : faceVerified ? (
                    <>
                      <label className="ticket-image-select ticket-image-select--full" htmlFor="maintenance-photo">
                        <span>Upload proof photo</span>
                      </label>
                      <input id="maintenance-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAttachmentChange} required={!attachment} />
                    </>
                  ) : (
                    <button type="button" className="ticket-image-select ticket-image-select--verification" onClick={openFaceVerificationCamera}>
                      <span>Use camera verification</span>
                    </button>
                  )}
                </div>
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
          {user?.role === 'admin' ? (
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
                canUpdate={user?.role === 'admin'}
                onStatusChange={(status) => updateStatus(selectedTicket.id, status)}
                updatingStatus={updatingStatus}
              />
              <p>{selectedTicket.description}</p>
              <div className="ticket-detail-meta">
                <div><strong>Requester:</strong> {selectedTicket.User?.name || selectedTicket.User?.email || 'Unknown'}</div>
                <div><strong>Requester department:</strong> {selectedTicket.User?.Department?.name || 'Unassigned'}</div>
                <div><strong>Routed department:</strong> {selectedTicket.Department?.name || 'Unassigned'}</div>
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
                        <div className="ticket-update-item-meta">{formatDateTime(update.created_at)}</div>
                        <p>{update.message}</p>
                      </article>
                    ))}
                  </div>
                ) : <p className="small-muted">No updates have been posted yet.</p>}
              </section>
              {user?.role === 'admin' && (
                <div className="ticket-admin-controls">
                  <form className="ticket-eta-form" onSubmit={updateEta}>
                    <label htmlFor="ticket-eta"><strong>Set ETA</strong><span>Only admins can change this.</span></label>
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
                {user?.role !== 'admin' && <button type="button" className="institutional-btn small danger" onClick={() => { deleteTicket(selectedTicket); setSelectedTicket(null); }}>Delete ticket</button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketsPage;
