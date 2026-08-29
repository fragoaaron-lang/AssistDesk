import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import NotificationBell from './NotificationBell';
import LogoutButton from './LogoutButton';

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
        { message, user_id: user?.id || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHistory((prev) => [
        ...prev,
        { role: 'user', text: message },
        { role: 'assistant', text: res.data.ai_response, details: res.data.department_details, service: res.data.service_details },
      ]);
      setMessage('');
    } catch (error) {
      setHistory((prev) => [...prev, { role: 'assistant', text: 'Unable to connect to the assistant.' }]);
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
            {user?.role === 'admin' && (
              <>
                <a href="/admin/reports">Reports</a>
                <a href="/admin/catalog">Catalog</a>
              </>
            )}
          </div>
          <div className="header-actions">
            <LogoutButton />
            <NotificationBell />
          </div>
        </header>

        <aside className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-head">
            <button type="button" className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>×</button>
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
          <div className="nav-links">
            <a href="/tickets" onClick={() => setMobileMenuOpen(false)}>Tickets</a>
            <a href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
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
                    <div><strong>Ticket:</strong> #{entry.ticket.id}</div>
                    <div><strong>Status:</strong> {entry.ticket.status}</div>
                    <div><strong>Estimated completion:</strong> {new Date(entry.ticket.estimated_completion_at).toLocaleString()}</div>
                  </div>
                )}
                {entry.tickets && entry.tickets.map((ticket) => (
                  <div key={ticket.id} style={{ marginTop: '0.4rem', background: '#f7f7f7', padding: '0.7rem', borderRadius: '10px' }}>
                    #{ticket.id} {ticket.subject} | {ticket.status} | ETA: {ticket.estimated_completion_at ? new Date(ticket.estimated_completion_at).toLocaleString() : 'pending'}
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
