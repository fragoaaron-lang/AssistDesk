import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';

const FAQ_GROUPS = [
  {
    title: 'General student services',
    questions: [
      'Where can I get my ID?',
      'What is the enrollment process?',
      'Where can I get my TOR?',
      'Where can I get a good moral certificate?',
      'Where can I inquire about tuition or graduate fees?',
      'Where can I ask about my current balance or tuition fee?',
      'Where can I get a college exam permit?',
      'Where can I get a college PE uniform?',
      'Who is the point person for maintenance?',
    ],
  },
  {
    title: 'Basic Education Department',
    questions: [
      'Who is the principal of Basic Education?',
      'Who is the assistant principal?',
      'Who is the head of OSA?',
      'Where can I get a uniform or PE uniform?',
      'Where can I get books?',
      'Where can I get my ID?',
    ],
  },
  ...[
    ['BSCS Department', 'CS'],
    ['BSA / BSBA Department', 'CBA'],
    ['CRIM Department', 'BSCRIM'],
    ['BSHM Department', 'HM'],
    ['BSPT Department', 'PT'],
    ['Nursing Department', 'Nursing'],
  ].map(([title, label]) => ({
    title,
    questions: [
      `Who is the dean, secretary, or point person of the ${label} Department?`,
      `Where can I get the modules or books in the ${label} Department?`,
      `Where can I get ${label} uniforms?`,
      `Where can I get the ${label} class schedule?`,
      `Where is the ${label} Department building?`,
    ],
  })),
];

const flattenFaqs = () => FAQ_GROUPS.flatMap((group) => group.questions);

function ChatbotWidget() {
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showFaqs, setShowFaqs] = useState(true);
  const [history, setHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const [gender, setGender] = useState(() => localStorage.getItem('chatbot_gender') || 'neutral');
  const [showGenderSelect, setShowGenderSelect] = useState(() => !localStorage.getItem('chatbot_gender'));

  if (!token || !user) return null;

  const getAssistantName = () => {
    if (gender === 'boy') return 'Alex';
    if (gender === 'girl') return 'Maya';
    return 'Assistant';
  };

  const saveGender = (selectedGender) => {
    setGender(selectedGender);
    localStorage.setItem('chatbot_gender', selectedGender);
    setShowGenderSelect(false);
    setHistory([{ 
      role: 'assistant', 
      text: `Hi! I'm ${selectedGender === 'boy' ? 'Alex' : 'Maya'}, your AssistDesk help center assistant. I'm here to help you find answers to your questions. Choose from our FAQs or ask me anything!` 
    }]);
  };

  const sendMessage = async (event, selectedQuestion = null) => {
    event?.preventDefault();
    const text = (selectedQuestion || message).trim();
    if (!text || sending) return;

    setHistory((current) => [...current, { role: 'user', text }]);
    setMessage('');
    setSending(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/ask`, { message: text, user_id: user.id }, { headers: { Authorization: `Bearer ${token}` } });
      setHistory((current) => [...current, {
        role: 'assistant',
        text: response.data.ai_response,
        details: response.data.department_details,
        ticket: response.data.ticket,
        tickets: response.data.tickets,
      }]);
    } catch (error) {
      setHistory((current) => [...current, { role: 'assistant', text: 'I could not connect to the helpdesk assistant. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`chatbot-widget${open ? ' is-open' : ''}`}>
      {open && (
        <section className="chatbot-panel" aria-label="AssistDesk help chatbot">
          <div className="chatbot-header">
            <div>
              <strong>{getAssistantName()} - Help Center</strong>
              <span>Instant answers & support</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                type="button" 
                className="institutional-btn small" 
                onClick={() => setShowGenderSelect(!showGenderSelect)}
                title="Change or select a different assistant"
                style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#e8f1f5', border: '1px solid #b0d4e3', color: '#333' }}
              >
                {gender === 'neutral' ? '👤 Choose Gender' : `Change Gender (${gender === 'boy' ? 'Alex' : 'Maya'})`}
              </button>
              <button type="button" className="chatbot-close" aria-label="Close chatbot" onClick={() => setOpen(false)}>×</button>
            </div>
          </div>

          {showGenderSelect && (
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', background: '#f0f7ff' }}>
              <p style={{ fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>Choose your assistant:</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="institutional-btn small" 
                  onClick={() => saveGender('boy')}
                  style={{ flex: 1, background: gender === 'boy' ? 'var(--teal)' : '#e0e0e0', color: gender === 'boy' ? 'white' : 'black' }}
                >
                  👦 Alex
                </button>
                <button 
                  className="institutional-btn small" 
                  onClick={() => saveGender('girl')}
                  style={{ flex: 1, background: gender === 'girl' ? 'var(--teal)' : '#e0e0e0', color: gender === 'girl' ? 'white' : 'black' }}
                >
                  👧 Maya
                </button>
              </div>
            </div>
          )}

          <div className="chatbot-body">
            {history.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 12px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{gender === 'boy' ? '👦' : '👧'}</div>
                <p className="chatbot-welcome">Welcome! I'm here to answer your questions about departments, services, and FAQs. Select from below or type your question.</p>
              </div>
            )}
            {history.map((entry, index) => (
              <div key={`${entry.role}-${index}`} className={`chat-message ${entry.role}`}>
                {entry.role === 'assistant' && <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>{gender === 'boy' ? '👦' : '👧'}</span>}
                <span>{entry.text}</span>
                {entry.details && <small>{entry.details.name} · {entry.details.office_hours || 'Contact the department for office hours.'}</small>}
                {entry.ticket && <small>Ticket #{entry.ticket.id} · Status: {entry.ticket.status}</small>}
                {entry.tickets?.map((ticket) => <small key={ticket.id}>#{ticket.id} · {ticket.subject} · {ticket.status}</small>)}
              </div>
            ))}
            {sending && <div className="chat-message assistant"><span>🤔 Searching knowledge base...</span></div>}
            {showFaqs && (
              <div className="chatbot-faqs">
                <div className="chatbot-faq-title">Popular questions</div>
                <div className="chatbot-faq-list">
                  {flattenFaqs().map((question) => <button type="button" key={question} onClick={() => sendMessage(null, question)}>{question}</button>)}
                </div>
              </div>
            )}
          </div>
          <form className="chatbot-input" onSubmit={sendMessage}>
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask a question..." aria-label="Ask AssistDesk" />
            <button type="submit" aria-label="Send message" disabled={sending}>Send</button>
          </form>
          <button type="button" className="chatbot-faq-toggle" onClick={() => setShowFaqs((value) => !value)}>{showFaqs ? 'Hide FAQs' : 'Show FAQs'}</button>
        </section>
      )}
      <button type="button" className="chatbot-launcher" aria-label={open ? 'Close AssistDesk chatbot' : 'Open AssistDesk chatbot'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">{gender === 'boy' ? '👦' : '👧'}</span>
        <b>Help</b>
      </button>
    </div>
  );
}

export default ChatbotWidget;
