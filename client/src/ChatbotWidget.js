import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';

const FAQ_GROUPS = [
  {
    title: 'About TCC',
    questions: [
      'Who is the president of TCC?',
      'Who is the secretary of TCC?',
      'Where can I get my college school ID?',
      'What is the enrollment process?',
      'Where can I get my TOR?',
      'Where can I get a good moral certificate?',
      'Where can I inquire about tuition or graduation fees?',
      'Where can I ask about my current balance or tuition fee?',
      'Where can I get a college exam permit?',
      'Where can I get a college PE uniform?',
      'Who is the point person for maintenance?',
      'Where is the maintenance department located?',
      'Who is the point person for the clinic?',
      'Where is the clinic located?',
      'Where can I locate the nearest parking?',
      'Where can I get a vehicle sticker pass?',
      'Where is the canteen located?',
      'Where is the Office of Student Affairs located?',
      'Where can I get Form 137?',
      'Where can I get Form 138?',
      'Who is the point person of Guidance?',
      'Who is the point person of the Library?',
      'What is Tomas Claudio Colleges (TCC)?',
      'What does Tomas Claudio Colleges (TCC) offer?',
      'What are the admission requirements or application requirements?',
      'What is the mission and vision of Tomas Claudio Colleges (TCC)?',
    ],
  },
  {
    title: 'Office of Student Affairs',
    questions: [
      'What services does the Office of the Student Affairs provide?',
      'How can I contact the Office of the Student Affairs?',
      'Who is the head or point person of OSA?',
      'Where is the Office of the Student Affairs, and what are its office hours?',
      'How can I request a student ID or a replacement ID?',
      'How can I report a student concern or complaint to OSA?',
      'How do I file a complaint about another student?',
      'Where can I find the school rules and regulations for students?',
      'What are the consequences of violating school policies?',
      'How do I appeal a disciplinary decision?',
      'How can a student organization request event approval?',
      'What are the requirements for student leadership positions?',
      'How can I become a student representative or student leader?',
      'What should I do if I lose an item on campus?',
      'How can I claim a lost-and-found item?',
      'How long does OSA take to process a request or complaint?',
    ],
  },
  {
    title: 'Registrar Office',
    questions: [
      'How can I request my Transcript of Records (TOR)?',
      'What is the enrollment process?',
      'How long does a Transcript of Records request take?',
      'How can I request a Certificate of Enrollment (CoE)?',
      'Where can college students evaluate their grades?',
      'Where can I get Form 137?',
      'Where can I get a vehicle sticker pass?',
      'Who is the head or point person of the Registrar Office?',
      'How does adding a subject work?',
      'How does dropping a subject work?',
      'How can I request a certificate of grades?',
      'How can I request other school documents from the Registrar?',
      'How can I check the status of my document request?',
      'How much are the fees for documents requested from the Registrar?',
      'How can I correct an error in my student records or documents?',
      'How can I request a transfer credential?',
      'How can I get a copy of my academic records?',
      'What are the Registrar Office hours?',
      'How can I fix an incomplete grade?',
      'Where is the Registrar Office located?',
      'How can faculty submit grades to the Registrar?',
      'What is the deadline for submitting grades?',
      'How can I correct or update a grade already submitted to the Registrar?',
      'How can faculty or staff update their information?',
    ],
  },
  {
    title: 'Accounting Department',
    questions: [
      'How can I check my tuition balance?',
      'How can I pay my tuition and other fees?',
      'What payment methods are available?',
      'Can I pay my tuition online?',
      'How can I get an official receipt?',
      'What should I do if my payment is not reflected?',
      'What are the deadlines for payment?',
      'Can I pay my tuition in installments?',
      'How can I check my remaining balance?',
      'What fees do I need to pay for enrollment?',
      'How can I request a refund?',
      'What are the Accounting Office hours?',
      'What scholarships are available?',
      'What other scholarships or discounts are available?',
      'Are academic scholarships currently available?',
    ],
  },
  {
    title: 'Maintenance Department',
    questions: [
      'Who are the contact persons in the Maintenance Department?',
      'Where can I report a broken chair, table, or classroom equipment?',
      'Where can I report a problem with classroom facilities?',
      'Who should I contact if I find damaged school property?',
      'Where can I report cleanliness concerns?',
      'How can I request assistance for a facility problem?',
      'Who should I approach regarding campus maintenance concerns?',
      'How do I follow up on a maintenance report?',
      'Can I report a maintenance problem anonymously?',
      'What information should I provide when reporting a damaged facility?',
      'What should I do if a facility problem is dangerous?',
      'What should I do if classroom equipment suddenly stops working during class?',
      'What should I do if there is no electricity in my classroom?',
      'What should I do if there is no water in the restroom?',
      'What should I do if a restroom needs immediate cleaning?',
      'Can students request repairs for school equipment?',
      'How long does a maintenance request take?',
    ],
  },
  {
    title: 'Clinic Department',
    questions: [
      'What services are available at the school clinic?',
      'What should I bring when visiting the clinic?',
      'Where can I get first-aid assistance?',
      'Can I request a medical certificate from the clinic?',
      'What should I do if I need to rest because I feel unwell?',
      'What are the clinic operating hours?',
      'What should I do if the clinic is closed?',
      'What documents are needed when requesting a medical certificate?',
      'Can the clinic contact my parent or guardian if I become sick?',
      'Can I stay in the clinic until I feel better?',
      'What should I do if I get injured during a school activity?',
      'What should I do if another student needs urgent medical attention?',
      'Does the clinic provide medicine for all types of illnesses?',
    ],
  },
  {
    title: 'Library Department',
    questions: [
      'What are the library operating hours?',
      'What do I need to borrow a book from the library?',
      'How many books can I borrow at a time?',
      'How long can I keep a borrowed library book?',
      'What should I do if I lose a borrowed library book?',
      'Can I use the library for studying?',
      'Where can I return borrowed books?',
      'Can I borrow reference books from the library?',
      'What happens if I return a library book late?',
      'What happens if I damage a library book?',
      'Can I renew a borrowed library book?',
      'Can I reserve a book that is currently unavailable?',
      'Can I search the library collection before visiting?',
      'Are research or thesis materials available in the library?',
      'Can I use a computer in the library?',
      'Can I access online academic resources through the library?',
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
      'Where can I get my Basic Education school ID?',
      'Where is the Basic Education Department located?',
      'Where can I get the Basic Education class schedule?',
      'Where is the Office of Student Affairs located?',
      'Where is the principal\'s office located?',
    ],
  },
  ...[
    ['BSCS Department', 'CS'],
    ['BSA / BSBA Department', 'CBA'],
    ['CRIM Department', 'BSCRIM'],
    ['BSHM Department', 'BSHM'],
    ['BSPT Department', 'BSPT'],
    ['Nursing Department', 'Nursing'],
    ['Education Department', 'Education'],
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

function ChatbotWidget() {
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showFaqs, setShowFaqs] = useState(true);
  const [history, setHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const [gender, setGender] = useState(() => localStorage.getItem('chatbot_gender') || 'neutral');
  const [showGenderSelect, setShowGenderSelect] = useState(() => !localStorage.getItem('chatbot_gender'));
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [history, sending, open]);

  useEffect(() => {
    const handleAnsweredTicketQuestion = (event) => {
      const question = String(event.detail?.question || '').trim();
      const response = event.detail?.response;
      if (!question || !response?.ai_response || !response?.source) return;

      setOpen(true);
      setShowFaqs(false);
      setMessage('');
      setHistory((current) => [
        ...current,
        { role: 'user', text: question },
        {
          role: 'assistant',
          text: response.ai_response,
          details: response.department_details,
          source: response.source,
          ticket: response.ticket,
          ticketProcess: response.ticket_process,
          tickets: response.tickets,
        },
      ]);
    };

    window.addEventListener('assistdesk:ai-question-answered', handleAnsweredTicketQuestion);
    return () => window.removeEventListener('assistdesk:ai-question-answered', handleAnsweredTicketQuestion);
  }, []);

  if (!token || !user || user.account_status === 'terminated') return null;

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
      const [response] = await Promise.all([
        axios.post(`${API_BASE_URL}/api/ai/ask`, {
          message: text,
          user_id: user.id,
          assistant_name: getAssistantName(),
        }, { headers: { Authorization: `Bearer ${token}` } }),
        new Promise((resolve) => window.setTimeout(resolve, 1400)),
      ]);
      setHistory((current) => [...current, {
        role: 'assistant',
        text: response.data.ai_response,
        details: response.data.department_details,
        source: response.data.source,
        clarificationRequired: response.data.clarification_required,
        clarificationOptions: response.data.clarification_options || [],
        escalationAvailable: response.data.escalation_available,
        ticket: response.data.ticket,
        ticketProcess: response.data.ticket_process,
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
                {gender === 'neutral' ? '👤 Choose Assistant' : `Change to ${gender === 'boy' ? 'Maya' : 'Alex'}`}
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
            <p className="chatbot-limitations" role="note">
              AssistDesk answers from its FAQ and service records, which may be incomplete or outdated. It is not a substitute for official decisions, medical advice, or emergency help. Do not share passwords or sensitive personal information. Contact the relevant office to verify important details.
            </p>
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
                {entry.source && <small className="chatbot-source">Source: {entry.source.type} #{entry.source.id} — {entry.source.label}{entry.source.department ? ` (${entry.source.department})` : ''}</small>}
                {entry.clarificationRequired && entry.clarificationOptions.length > 0 && (
                  <div className="chatbot-clarification-options" aria-label="Clarify your question">
                    {entry.clarificationOptions.map((option) => (
                      <button type="button" key={option} disabled={sending} onClick={() => sendMessage(null, option)}>{option}</button>
                    ))}
                  </div>
                )}
                {entry.escalationAvailable && <a className="chatbot-escalation-link" href="/tickets">Create a support ticket for staff follow-up</a>}
                {entry.ticket && (
                  <>
                    <small>
                      Ticket {entry.ticket.ticket_code || `#${entry.ticket.id}`} · {entry.ticket.subject} · Status: {entry.ticket.status} · ETA: {entry.ticket.estimated_completion_at ? new Date(entry.ticket.estimated_completion_at).toLocaleString() : 'pending'}
                    </small>
                    {entry.ticketProcess && entry.ticket && (
                      <div className="chatbot-ticket-process" aria-label="Ticket process">
                        {entry.ticketProcess.map((stage, stageIndex) => {
                          const currentIndex = entry.ticketProcess.findIndex((item) => item.key === entry.ticket.status);
                          return (
                            <span key={stage.key} className={`chatbot-ticket-stage ${stageIndex <= currentIndex ? 'completed' : ''} ${stage.key === entry.ticket.status ? 'active' : ''}`}>
                              {stage.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
                {entry.tickets?.map((ticket) => (
                  <small key={ticket.id}>{ticket.ticket_code || `#${ticket.id}`} · {ticket.subject} · {ticket.status} · ETA: {ticket.estimated_completion_at ? new Date(ticket.estimated_completion_at).toLocaleString() : 'pending'}</small>
                ))}
              </div>
            ))}
            {sending && (
              <div className="chat-message assistant chatbot-typing" aria-live="polite">
                <span>{getAssistantName()} is typing</span>
                <span className="chatbot-typing-dots" aria-hidden="true"><i /><i /><i /></span>
              </div>
            )}
            {showFaqs && (
              <div className="chatbot-faqs">
                <div className="chatbot-faq-title">Popular questions</div>
                <div className="chatbot-faq-list">
                  {FAQ_GROUPS.map((group) => (
                    <details key={group.title} className="chatbot-faq-group">
                      <summary>{group.title}</summary>
                      <div className="chatbot-faq-group-questions">
                        {group.questions.map((question) => <button type="button" key={question} onClick={() => { setShowFaqs(false); sendMessage(null, question); }}>{question}</button>)}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} aria-hidden="true" />
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
