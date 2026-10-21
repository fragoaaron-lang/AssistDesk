import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import AuthenticatedNavigation from './AuthenticatedNavigation';

function AiChatPage() {
  const { token, user } = useAuth();
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);

  const sendMessage = async (e, selectedQuestion = null) => {
    e?.preventDefault();
    const text = (selectedQuestion || message).trim();
    if (!text) return;

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/ai/ask`,
        { message: text, user_id: user?.id || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHistory((prev) => [
        ...prev,
        { role: 'user', text },
        { role: 'assistant', text: res.data.ai_response, details: res.data.department_details, service: res.data.service_details, source: res.data.source, clarificationRequired: res.data.clarification_required, clarificationOptions: res.data.clarification_options || [], escalationAvailable: res.data.escalation_available, ticket: res.data.ticket, tickets: res.data.tickets },
      ]);
      setMessage('');
    } catch (error) {
      setHistory((prev) => [...prev, { role: 'assistant', text: 'Unable to connect to the assistant.' }]);
    }
  };

  return (
    <div className="app-shell ai-chat-page">
      <div className="page-shell">
        <AuthenticatedNavigation user={user} subtitle="AI institutional assistant" />

        <div className="page-intro">
          <div>
            <h2>Support assistant</h2>
            <p>This assistant uses local knowledge to guide users to the right department and service.</p>
          </div>
        </div>

        <div className="institutional-card">
          <div className="ai-limitations-notice" role="note">
            <strong>About this assistant</strong>
            <p>Answers are based on AssistDesk FAQ and service records and may be incomplete or outdated. The assistant cannot make official decisions or provide medical, legal, or emergency advice. Do not share passwords or sensitive personal information. Verify important details with the relevant office; submit a ticket for staff follow-up.</p>
          </div>
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input className="institutional-input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask about enrollment, transcript, IT support..." style={{ flex: '1 1 280px', marginBottom: 0 }} />
            <button className="institutional-btn" type="submit">Send</button>
          </form>
          <div className="inline-actions" style={{ marginTop: '0.8rem' }}>
            <button className="institutional-btn small secondary" type="button" onClick={() => setMessage('status of my tickets')}>Track my requests</button>
            <button className="institutional-btn small secondary" type="button" onClick={() => setMessage('submit request: ')}>Submit a request</button>
          </div>

          <div className="ai-chat-transcript" style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', minHeight: '300px' }}>
            {history.length === 0 && <p className="helper-text">No conversation yet.</p>}
            {history.map((entry, index) => (
              <div key={index} className={`ai-chat-entry ${entry.role}`} style={{ marginBottom: '1rem' }}>
                <strong>{entry.role === 'user' ? 'You' : 'Assistant'}:</strong> {entry.text}
                {entry.source && <div className="ai-response-source">Source: {entry.source.type} #{entry.source.id} — {entry.source.label}{entry.source.department ? ` (${entry.source.department})` : ''}</div>}
                {entry.clarificationRequired && entry.clarificationOptions.length > 0 && (
                  <div className="ai-clarification-options" aria-label="Clarify your question">
                    {entry.clarificationOptions.map((option) => (
                      <button className="institutional-btn small secondary" type="button" key={option} onClick={() => sendMessage(null, option)}>{option}</button>
                    ))}
                  </div>
                )}
                {entry.escalationAvailable && <p><a href="/tickets">Create a support ticket for staff follow-up</a></p>}
                {entry.details && (
                  <div className="ai-chat-detail" style={{ marginTop: '0.4rem', padding: '0.7rem', borderRadius: '10px' }}>
                    <div><strong>Department:</strong> {entry.details.name}</div>
                    <div><strong>Point Person:</strong> {entry.details.point_person}</div>
                    <div><strong>Location:</strong> {entry.details.location}</div>
                    <div><strong>Office Hours:</strong> {entry.details.office_hours}</div>
                  </div>
                )}
                {entry.service && (
                  <div className="ai-chat-service" style={{ marginTop: '0.4rem', padding: '0.7rem', borderRadius: '10px' }}>
                    <div><strong>Service:</strong> {entry.service.name}</div>
                    <div><strong>Requirements:</strong> {entry.service.requirements}</div>
                    <div><strong>Processing Time:</strong> {entry.service.processing_time}</div>
                  </div>
                )}
                {entry.ticket && (
                  <div className="ai-chat-ticket" style={{ marginTop: '0.4rem', padding: '0.7rem', borderRadius: '10px' }}>
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
                  <div key={ticket.id} className="ai-chat-detail" style={{ marginTop: '0.4rem', padding: '0.7rem', borderRadius: '10px' }}>
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
