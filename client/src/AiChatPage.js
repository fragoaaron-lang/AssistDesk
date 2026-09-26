import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import LogoutButton from './LogoutButton';
import HeaderProfile from './HeaderProfile';
import SidebarProfile from './SidebarProfile';

function AiChatPage() {
  const { token, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/ai/ask`,
        { message, account_appeal: user?.account_status === 'terminated' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHistory((prev) => [
        ...prev,
        { role: 'user', text: message },
        { role: 'assistant', text: res.data.ai_response, details: res.data.department_details, service: res.data.service_details, ticket: res.data.ticket, tickets: res.data.tickets },
      ]);
      setMessage('');
    } catch (error) {
      setHistory((prev) => [...prev, { role: 'assistant', text: 'Unable to connect to the assistant.' }]);
    }
  };

  if (user?.account_status === 'terminated') {
    const appealSubject = encodeURIComponent('Appeal of AssistDesk account termination');
    const appealBody = encodeURIComponent(`Hello AssistDesk administrator,\n\nI would like to appeal the termination of my account.\n\nName: ${user.name || ''}\nEmail: ${user.email || ''}\n\nMy explanation:\n`);
    const appealMailLink = user.appeal_email
      ? `mailto:${user.appeal_email}?subject=${appealSubject}&body=${appealBody}`
      : null;

    return (
      <div className="app-shell">
        <div className="page-shell">
          <header className="page-header">
            <button type="button" className="header-brand header-brand-button" onClick={() => window.location.reload()} aria-label="Refresh AssistDesk">
              <div className="brand-badge"><img src="/assistdesk-logo.svg" alt="AssistDesk logo" /></div>
              <div><h1>AssistDesk</h1><p>Account appeal</p></div>
            </button>
            <div className="header-actions">
              <a className="header-nav-button" href="/dashboard">Dashboard</a>
              <LogoutButton />
            </div>
          </header>

          <div className="page-intro">
            <div>
              <h2>Appeal your account termination</h2>
              <p>Explain why you believe the decision should be reviewed. Your message will be forwarded to the administrators.</p>
            </div>
          </div>

          <section className="institutional-card" style={{ maxWidth: '820px', margin: '0 auto' }}>
            <div style={{ marginBottom: '18px', padding: '14px 16px', borderRadius: '12px', background: 'var(--surface-soft)', lineHeight: 1.6 }}>
              This account was terminated because it violated AssistDesk policies and regulations. You can submit an appeal here or email the administrator.
            </div>
            <div style={{ minHeight: '180px', maxHeight: '360px', overflowY: 'auto', marginBottom: '16px' }} aria-live="polite">
              {history.length === 0 && <p className="helper-text">Use the form below to send your appeal and any relevant details.</p>}
              {history.map((entry, index) => (
                <div key={index} className={`chat-message ${entry.role}`}>
                  <strong>{entry.role === 'user' ? 'You' : 'AssistDesk'}:</strong>
                  <span>{entry.text}</span>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} style={{ display: 'grid', gap: '12px' }}>
              <textarea
                className="institutional-input"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe why you are appealing and include any relevant details..."
                aria-label="Appeal details"
                rows={5}
                required
              />
              <div className="inline-actions" style={{ gap: '10px' }}>
                <button className="institutional-btn" type="submit" disabled={!message.trim()}>Send appeal to administrators</button>
                {appealMailLink && <a className="institutional-btn small secondary" href={appealMailLink}>Appeal by email</a>}
              </div>
            </form>
            {!appealMailLink && <p className="helper-text" style={{ marginTop: '12px' }}>Email appeals are not configured. Please submit your appeal using this form.</p>}
          </section>
        </div>
      </div>
    );
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
              <p>AI institutional assistant</p>
            </div>
          </button>
          <div className="nav-links">
            <a href="/dashboard">Dashboard</a>
            <a href="/tickets">Tickets</a>
            <a href="/profile">Profile</a>
            {user?.role === 'admin' && (
              <>
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
            <h2>Support assistant</h2>
            <p>This assistant uses local knowledge to guide users to the right department and service.</p>
          </div>
        </div>

        <div className="institutional-card">
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input className="institutional-input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask about enrollment, transcript, IT support..." style={{ flex: '1 1 280px', marginBottom: 0 }} />
            <button className="institutional-btn" type="submit">Send</button>
          </form>
          <div className="inline-actions" style={{ marginTop: '0.8rem' }}>
            <button className="institutional-btn small secondary" type="button" onClick={() => setMessage('status of my tickets')}>Track my requests</button>
            <button className="institutional-btn small secondary" type="button" onClick={() => setMessage('submit request: ')}>Submit a request</button>
          </div>

          <div style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', minHeight: '300px', background: '#fbfdff' }}>
            {history.length === 0 && <p className="helper-text">No conversation yet.</p>}
            {history.map((entry, index) => (
              <div key={index} style={{ marginBottom: '1rem' }}>
                <strong>{entry.role === 'user' ? 'You' : 'Assistant'}:</strong> {entry.text}
                {entry.details && (
                  <div style={{ marginTop: '0.4rem', background: '#f7f7f7', padding: '0.7rem', borderRadius: '10px' }}>
                    <div><strong>Department:</strong> {entry.details.name}</div>
                    <div><strong>Point Person:</strong> {entry.details.point_person}</div>
                    <div><strong>Location:</strong> {entry.details.location}</div>
                    <div><strong>Office Hours:</strong> {entry.details.office_hours}</div>
                  </div>
                )}
                {entry.service && (
                  <div style={{ marginTop: '0.4rem', background: '#eef7ff', padding: '0.7rem', borderRadius: '10px' }}>
                    <div><strong>Service:</strong> {entry.service.name}</div>
                    <div><strong>Requirements:</strong> {entry.service.requirements}</div>
                    <div><strong>Processing Time:</strong> {entry.service.processing_time}</div>
                  </div>
                )}
                {entry.ticket && (
                  <div style={{ marginTop: '0.4rem', background: '#eef7ff', padding: '0.7rem', borderRadius: '10px' }}>
                    <div><strong>Ticket:</strong> {entry.ticket.ticket_code || `#${entry.ticket.id}`}</div>
                    <div><strong>Request:</strong> {entry.ticket.subject}</div>
                    <div><strong>Description:</strong> {entry.ticket.description}</div>
                    <div><strong>Department:</strong> {entry.ticket.Department?.name || 'Unassigned'}</div>
                    <div><strong>Status:</strong> {entry.ticket.status}</div>
                    <div><strong>Priority:</strong> {entry.ticket.priority}</div>
                    <div><strong>Estimated completion:</strong> {new Date(entry.ticket.estimated_completion_at).toLocaleString()}</div>
                  </div>
                )}
                {entry.tickets && entry.tickets.map((ticket) => (
                  <div key={ticket.id} style={{ marginTop: '0.4rem', background: '#f7f7f7', padding: '0.7rem', borderRadius: '10px' }}>
                    {ticket.ticket_code || `#${ticket.id}`} {ticket.subject} | {ticket.status} | ETA: {ticket.estimated_completion_at ? new Date(ticket.estimated_completion_at).toLocaleString() : 'pending'}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiChatPage;
