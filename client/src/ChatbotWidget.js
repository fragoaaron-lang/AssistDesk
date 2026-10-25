import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { gsap } from 'gsap';
import { useLocation } from 'react-router-dom';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';
import { mapChatLogsToEntries } from './aiChatHistory';
import ticketIssueOptions from './ticketIssueOptions.json';

const { defaultGeneralIssueOptions, departmentGeneralIssueOptions } = ticketIssueOptions;
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

const getDepartmentDisplayName = (department) => {
  const name = normalizeDepartmentName(department);
  if (['cs', 'cs department', 'computer science department', 'college of computer studies'].includes(name)) return 'College of Computer Studies';
  if (['charm', 'hm department', 'college of hospitality and restaurant management', 'college of hospitality management'].includes(name)) return 'College of Hospitality Management';
  if (['cba', 'accountancy', 'college of business administration', 'college of business and accountancy'].includes(name)) return 'College of Business and Accountancy';
  if (['education department', 'college of education'].includes(name)) return 'College of Education';
  if (['college of nursing', 'nursing department'].includes(name)) return 'College of Nursing';
  if (['college of criminology', 'crim department', 'criminology department'].includes(name)) return 'College of Criminology';
  if (['college of physical therapy', 'physical therapy department'].includes(name)) return 'College of Physical Therapy';
  if (['accounting', 'accounting department'].includes(name)) return 'Accounting Department';
  if (['maintenance', 'maintenance department'].includes(name)) return 'Maintenance Department';
  if (['registrar department', 'registrar office'].includes(name)) return 'Registrar Office';
  if (['student affairs', 'office of student affairs', 'office of the student affairs'].includes(name)) return 'Office of Student Affairs';
  if (['library', 'library department'].includes(name)) return 'Library Department';
  return department?.display_name || department?.name;
};

const getDepartmentOptionPriority = (department) => {
  const preferredNames = [
    'basic education department', 'education department', 'college of nursing', 'cs', 'cba', 'charm',
    'college of criminology', 'college of physical therapy', 'maintenance department', 'accounting department',
    'registrar office', 'library', 'guidance', 'office of student affairs', 'clinic', 'it department',
  ];
  const preferredIndex = preferredNames.indexOf(normalizeDepartmentName(department));
  return preferredIndex === -1 ? preferredNames.length : preferredIndex;
};

const deduplicateDepartments = (records) => {
  const unique = new Map();
  [...records]
    .sort((first, second) => getDepartmentOptionPriority(first) - getDepartmentOptionPriority(second)
      || Number(first.id) - Number(second.id))
    .forEach((department) => {
      const displayName = getDepartmentDisplayName(department);
      const key = String(displayName || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (!unique.has(key)) unique.set(key, { ...department, display_name: displayName });
    });
  return [...unique.values()].sort((first, second) => first.display_name.localeCompare(second.display_name));
};

const isCollegeStudent = (currentUser) => currentUser?.role === 'student'
  && Boolean(getCollegeDepartmentKey(currentUser.department_name));

const getDepartmentIssueOptions = (department) => {
  const name = String(department?.name || '').toLowerCase();
  if (name.includes('maintenance')) return departmentGeneralIssueOptions.maintenance;
  if (name.includes('clinic')) return departmentGeneralIssueOptions.clinic;
  if (name.includes('library')) return departmentGeneralIssueOptions.library;
  if (name.includes('accounting')) return departmentGeneralIssueOptions.accounting;
  if (name.includes('registrar')) return departmentGeneralIssueOptions.registrar;
  if (name.includes('student affairs') || name === 'osa') return departmentGeneralIssueOptions.osa;
  if (name.includes('guidance')) return departmentGeneralIssueOptions.guidance;
  if (name.includes('information technology') || name.includes('it department')) return departmentGeneralIssueOptions.it;
  if (name.includes('basic education')) return departmentGeneralIssueOptions.basic;
  if (name.includes('computer science') || name.includes('computer studies') || name === 'cs' || name.includes('bscs')) return departmentGeneralIssueOptions.cs;
  if (name.includes('business administration') || name.includes('business and accountancy') || name === 'cba' || name.includes('accountancy') || name.includes('bsa') || name.includes('bsba')) return departmentGeneralIssueOptions.cba;
  if (name.includes('criminology') || name.includes('crim') || name.includes('bscrim')) return departmentGeneralIssueOptions.crim;
  if (name.includes('hospitality') || name.includes('charm') || name.includes('bshm') || name === 'hm') return departmentGeneralIssueOptions.hm;
  if (name.includes('physical therapy') || name.includes('bspt')) return departmentGeneralIssueOptions.pt;
  if (name.includes('nursing') || name === 'bsn') return departmentGeneralIssueOptions.nursing;
  if (['education department', 'college of education'].includes(name)) return departmentGeneralIssueOptions.education;
  if (getCollegeDepartmentKey(department)) return departmentGeneralIssueOptions.college;
  return defaultGeneralIssueOptions;
};

const emptyTicketForm = { subject: '', description: '', category: '', priority: 'medium', department_id: '' };

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
    title: 'IT Department',
    questions: [
      'What IT services are available to students?',
      'Where can students get IT-related technical support?',
      'Who are the IT department contact persons?',
      'Who should I contact about internet-related issues?',
      'How does the IT department handle concerns?',
      'What are the IT department office hours?',
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
    ['BSED Department', 'BSED'],
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

function AssistantAvatar({ small = false }) {
  return (
    <span className={`chatbot-avatar${small ? ' is-small' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" focusable="false">
        <path d="M8 12.5A8 8 0 0 1 16 5a8 8 0 0 1 8 7.5v4a8 8 0 0 1-16 0z" />
        <path d="M5 26c1.8-3.7 5.5-5.5 11-5.5s9.2 1.8 11 5.5" />
        <path d="M12.5 14.5h.01M19.5 14.5h.01M13 18c1.8 1.2 4.2 1.2 6 0" />
      </svg>
    </span>
  );
}

function ChatbotWidget() {
  const { token, user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showFaqs, setShowFaqs] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [sending, setSending] = useState(false);
  const [ticketComposerOpen, setTicketComposerOpen] = useState(false);
  const [ticketCatalogLoading, setTicketCatalogLoading] = useState(false);
  const [ticketCatalogError, setTicketCatalogError] = useState('');
  const [ticketDepartments, setTicketDepartments] = useState([]);
  const [ticketIssueGroups, setTicketIssueGroups] = useState([]);
  const [ticketForm, setTicketForm] = useState(emptyTicketForm);
  const [ticketAttachment, setTicketAttachment] = useState(null);
  const [ticketSubmitState, setTicketSubmitState] = useState({ status: 'idle', message: '' });
  const [faqSearch, setFaqSearch] = useState('');
  const [gender, setGender] = useState(() => localStorage.getItem('chatbot_gender') || 'neutral');
  const [showGenderSelect, setShowGenderSelect] = useState(() => !localStorage.getItem('chatbot_gender'));
  const chatEndRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const launcherButtonRef = useRef(null);
  const launcherMarkRef = useRef(null);
  const messageNodesRef = useRef([]);
  const previousMessageCountRef = useRef(0);
  const historyLoadedForRef = useRef(null);
  const filteredFaqGroups = useMemo(() => {
    const query = faqSearch.trim().toLowerCase();
    if (!query) return FAQ_GROUPS;
    return FAQ_GROUPS.map((group) => ({
      ...group,
      questions: group.questions.filter((question) => {
        const questionText = typeof question === 'string' ? question : question.text;
        return `${group.title} ${questionText}`.toLowerCase().includes(query);
      }),
    })).filter((group) => group.questions.length > 0);
  }, [faqSearch]);
  const closeChat = () => {
    setOpen(false);
    window.requestAnimationFrame(() => launcherButtonRef.current?.focus({ preventScroll: true }));
  };

  useLayoutEffect(() => {
    if (!open || !panelRef.current) return undefined;
    const panel = panelRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const context = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(panel, { autoAlpha: 1, y: 0, scale: 1 });
        gsap.set(panel.querySelectorAll('.chatbot-header, .chatbot-safety-note, .chatbot-gender-picker, .chatbot-body, .chatbot-footer'), { autoAlpha: 1, y: 0 });
        return;
      }
      const reveal = gsap.timeline({ defaults: { ease: 'expo.out' } });
      reveal.fromTo(panel,
        { autoAlpha: 0, y: 16, scale: 0.975, transformOrigin: '100% 100%' },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.34, clearProps: 'transform,opacity,visibility' }
      );
      reveal.fromTo(
        panel.querySelectorAll('.chatbot-header, .chatbot-safety-note, .chatbot-gender-picker, .chatbot-body, .chatbot-footer'),
        { autoAlpha: 0, y: 7 },
        { autoAlpha: 1, y: 0, duration: 0.25, stagger: 0.035, clearProps: 'transform,opacity,visibility' },
        '-=0.19'
      );
    }, panel);
    return () => context.revert();
  }, [open]);

  useLayoutEffect(() => {
    if (!launcherMarkRef.current) return undefined;
    const mark = launcherMarkRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      gsap.set(mark, { rotation: 0, scale: 1 });
      return undefined;
    }
    const context = gsap.context(() => {
      gsap.fromTo(mark,
        { rotation: open ? -34 : 34, scale: 0.78 },
        { rotation: 0, scale: 1, duration: 0.26, ease: 'back.out(2.1)', clearProps: 'transform' }
      );
    }, mark);
    return () => context.revert();
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    if (historyLoading) {
      previousMessageCountRef.current = history.length;
      return undefined;
    }
    const previousCount = previousMessageCountRef.current;
    const addedMessages = messageNodesRef.current.slice(previousCount, history.length).filter(Boolean);
    previousMessageCountRef.current = history.length;
    if (previousCount === 0 || addedMessages.length === 0
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const context = gsap.context(() => {
      gsap.fromTo(addedMessages,
        { autoAlpha: 0, y: 8, scale: 0.99 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.24, stagger: 0.035, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }
      );
    }, panelRef.current);
    return () => context.revert();
  }, [history.length, historyLoading, open]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closeChat();
    };
    const focusFrame = window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!token || !user?.id) {
      historyLoadedForRef.current = null;
      setHistory([]);
      return undefined;
    }
    if (!open || historyLoadedForRef.current === user.id) return undefined;
    let active = true;
    setHistory([]);
    setHistoryLoading(true);
    setHistoryError('');
    axios.get(`${API_BASE_URL}/api/ai/history`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 50, offset: 0 },
    }).then((response) => {
      if (!active) return;
      setHistory(mapChatLogsToEntries(response.data.history || []));
      historyLoadedForRef.current = user.id;
    }).catch((error) => {
      if (active) setHistoryError(error.response?.data?.message || 'Unable to load saved conversations.');
    }).finally(() => {
      if (active) setHistoryLoading(false);
    });
    return () => { active = false; };
  }, [open, token, user?.id]);

  useEffect(() => {
    if (!open) return;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [history, sending, open, ticketComposerOpen]);

  useEffect(() => {
    if (pathname === '/') setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleAnsweredTicketQuestion = (event) => {
      if (pathname === '/') return;
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
  }, [pathname]);

  if (pathname === '/' || !token || !user
    || ['terminated', 'pending_id', 'pending_approval', 'id_rejected'].includes(user.account_status)) return null;

  const isAdminUser = user.role === 'admin';

  const getAssistantName = () => {
    if (gender === 'boy') return 'Alex';
    if (gender === 'girl') return 'Maya';
    return 'Assistant';
  };

  const studentCollegeKey = getCollegeDepartmentKey(user?.department_name);
  const availableTicketDepartments = isCollegeStudent(user)
    ? deduplicateDepartments(ticketDepartments).filter((department) => {
      const departmentCollegeKey = getCollegeDepartmentKey(department);
      return !departmentCollegeKey || departmentCollegeKey === studentCollegeKey;
    })
    : deduplicateDepartments(ticketDepartments);
  const selectedTicketDepartment = ticketDepartments.find((department) => String(department.id) === String(ticketForm.department_id));
  const selectedTicketIssueGroups = ticketIssueGroups.filter((group) => Number(group.department_id) === Number(ticketForm.department_id));
  const ticketIssueOptionsByCategory = ticketForm.department_id
    ? (selectedTicketIssueGroups.length
      ? selectedTicketIssueGroups.reduce((options, group) => {
        options[group.name] = (group.specificIssues || []).map((issue) => issue.name);
        return options;
      }, {})
      : getDepartmentIssueOptions(selectedTicketDepartment))
    : defaultGeneralIssueOptions;
  const ticketSpecificIssues = ticketIssueOptionsByCategory[ticketForm.category] || [];
  const isMaintenanceTicket = selectedTicketDepartment?.name?.toLowerCase().includes('maintenance');

  const openTicketComposer = async () => {
    if (isAdminUser) return;
    setShowFaqs(false);
    setTicketComposerOpen(true);
    setTicketSubmitState({ status: 'idle', message: '' });
    if (ticketDepartments.length && ticketIssueGroups.length) return;

    setTicketCatalogLoading(true);
    setTicketCatalogError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [departmentResponse, issueResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/catalog/departments`, { headers }),
        axios.get(`${API_BASE_URL}/api/catalog/issues`, { headers }),
      ]);
      setTicketDepartments(departmentResponse.data.departments || []);
      setTicketIssueGroups(issueResponse.data.generalIssues || []);
    } catch (error) {
      setTicketCatalogError(error.response?.data?.message || 'Could not load ticket options. Try again.');
    } finally {
      setTicketCatalogLoading(false);
    }
  };

  const handleTicketDepartmentChange = (departmentId) => {
    const department = ticketDepartments.find((item) => String(item.id) === String(departmentId));
    const groups = ticketIssueGroups.filter((item) => Number(item.department_id) === Number(departmentId));
    setTicketForm((current) => ({
      ...current,
      department_id: departmentId,
      category: '',
      subject: '',
    }));
    setTicketAttachment(null);
  };

  const handleTicketAttachment = (file) => {
    if (!file) {
      setTicketAttachment(null);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setTicketSubmitState({ status: 'error', message: 'Choose a JPG, PNG, or WEBP image.' });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setTicketSubmitState({ status: 'error', message: 'Choose an image smaller than 3 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setTicketAttachment({ data: reader.result, name: file.name, type: file.type });
    reader.onerror = () => setTicketSubmitState({ status: 'error', message: 'Could not read that image. Please choose it again.' });
    reader.readAsDataURL(file);
  };

  const submitChatTicket = async (event) => {
    event.preventDefault();
    if (ticketSubmitState.status === 'loading') return;
    if (isMaintenanceTicket && !ticketAttachment) {
      setTicketSubmitState({ status: 'error', message: 'Attach a photo for a Maintenance ticket.' });
      return;
    }

    setTicketSubmitState({ status: 'loading', message: '' });
    try {
      const response = await axios.post(`${API_BASE_URL}/api/tickets`, {
        ...ticketForm,
        user_id: user.id,
        attachment_data: ticketAttachment?.data || null,
        attachment_name: ticketAttachment?.name || null,
        attachment_type: ticketAttachment?.type || null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      const ticket = response.data;
      const ticketCode = ticket.ticket_code || `#${ticket.id}`;
      const departmentName = ticket.Department?.name || selectedTicketDepartment?.name;
      const savedAt = ticket.created_at;
      setHistory((current) => [
        ...current,
        { role: 'user', text: `Create ticket: ${ticket.subject}`, timestamp: savedAt },
        {
          role: 'assistant',
          text: `Your ticket was created successfully${departmentName ? ` for ${departmentName}` : ''}. Ticket ID: ${ticketCode}. You can ask me to check its status anytime.`,
          timestamp: savedAt,
          ticket,
        },
      ]);
      setTicketForm(emptyTicketForm);
      setTicketAttachment(null);
      setTicketComposerOpen(false);
      setTicketSubmitState({ status: 'idle', message: '' });
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to create your ticket. Please try again.';
      const suggestions = error.response?.data?.routing_candidates?.map((candidate) => candidate.name).filter(Boolean);
      setTicketSubmitState({
        status: 'error',
        message: suggestions?.length ? `${message} Possible departments: ${suggestions.join(', ')}.` : message,
      });
    }
  };

  const saveGender = (selectedGender) => {
    setGender(selectedGender);
    localStorage.setItem('chatbot_gender', selectedGender);
    setShowGenderSelect(false);
    setHistory((current) => current.length ? current : [{
      role: 'assistant',
      text: `Hi! I'm ${selectedGender === 'boy' ? 'Alex' : 'Maya'}, your AssistDesk help center assistant. I'm here to help you find answers to your questions. Choose from our FAQs or ask me anything!`,
    }]);
  };

  const sendMessage = async (event, selectedQuestion = null) => {
    event?.preventDefault();
    const selectedText = selectedQuestion && typeof selectedQuestion === 'object'
      ? selectedQuestion.text
      : selectedQuestion;
    const text = String(selectedText || message).trim();
    const suggestedQuestionKeywords = selectedQuestion && typeof selectedQuestion === 'object'
      ? selectedQuestion.keywords
      : undefined;
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
          suggested_question_keywords: suggestedQuestionKeywords,
          conversation_context: history.slice(-4).map(({ role, text: entryText }) => ({ role, text: entryText })),
        }, { headers: { Authorization: `Bearer ${token}` } }),
        new Promise((resolve) => window.setTimeout(resolve, 1400)),
      ]);
      const savedAt = response.data.chatLog?.created_at;
      setHistory((current) => current.map((entry, index) => (
        index === current.length - 1 && entry.role === 'user' && entry.text === text
          ? { ...entry, timestamp: savedAt }
          : entry
      )));
      setHistory((current) => [...current, {
        role: 'assistant',
        text: response.data.ai_response,
        timestamp: savedAt,
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
        <section ref={panelRef} className="chatbot-panel" aria-label="AssistDesk help chatbot">
          <div className="chatbot-header">
            <div className="chatbot-header-brand">
              <div className="chatbot-brand-avatar"><AssistantAvatar /></div>
              <div className="chatbot-header-copy">
                <strong>{gender === 'neutral' ? 'AssistDesk' : getAssistantName()}</strong>
                <span>Campus help center</span>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                type="button"
                className="chatbot-assistant-switch"
                onClick={() => setShowGenderSelect(!showGenderSelect)}
                aria-label={gender === 'neutral' ? 'Choose an assistant voice' : `Change assistant from ${getAssistantName()}`}
                aria-expanded={showGenderSelect}
                title="Choose assistant"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.2 6.1h8.1l-2-2M13.8 13.9H5.7l2 2" /><path d="M14.3 6.1a5.7 5.7 0 0 1 1.5 3.9M5.7 13.9A5.7 5.7 0 0 1 4.2 10" /></svg>
              </button>
              <button type="button" className="chatbot-close" aria-label="Close help chatbot" onClick={closeChat}>
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
              </button>
            </div>
          </div>

          <details className="chatbot-safety-note">
            <summary>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.8 16 5v4.7c0 3.4-2.5 5.9-6 7.5-3.5-1.6-6-4.1-6-7.5V5z" /><path d="m7.5 9.8 1.7 1.7 3.4-3.6" /></svg>
              Answers from TCC’s help knowledge base
              <span className="chatbot-safety-chevron" aria-hidden="true">⌄</span>
            </summary>
            <p>Information may be incomplete or outdated. This assistant cannot make official decisions or provide medical, legal, or emergency advice. Don’t share passwords or sensitive personal information; verify important details with the relevant office.</p>
          </details>

          {showGenderSelect && (
            <div className="chatbot-gender-picker">
              <div className="chatbot-gender-heading">
                <strong>Choose your assistant</strong>
                <span>Select the voice used in replies.</span>
              </div>
              <div className="chatbot-gender-options">
                <button
                  type="button" className={`chatbot-gender-choice${gender === 'boy' ? ' is-selected' : ''}`}
                  onClick={() => saveGender('boy')}
                  aria-pressed={gender === 'boy'}
                >
                  <AssistantAvatar small />
                  <span>Alex</span>
                  {gender === 'boy' && <span className="chatbot-choice-check" aria-hidden="true">✓</span>}
                </button>
                <button
                  type="button" className={`chatbot-gender-choice${gender === 'girl' ? ' is-selected' : ''}`}
                  onClick={() => saveGender('girl')}
                  aria-pressed={gender === 'girl'}
                >
                  <AssistantAvatar small />
                  <span>Maya</span>
                  {gender === 'girl' && <span className="chatbot-choice-check" aria-hidden="true">✓</span>}
                </button>
              </div>
            </div>
          )}

          <div className="chatbot-body" aria-busy={historyLoading || sending}>
            {!historyLoading && history.length === 0 && (
              <div className="chatbot-welcome-panel">
                <div className="chatbot-welcome-icon"><AssistantAvatar /></div>
                <div>
                  <strong>What can I help you find?</strong>
                  <p>Ask about campus services, offices, policies, or your support requests.</p>
                </div>
              </div>
            )}
            {historyLoading && <p className="chatbot-history-status" role="status">Loading your saved conversations…</p>}
            {historyError && <p className="chatbot-history-status is-error" role="alert">{historyError}</p>}
            {history.map((entry, index) => (
              <div
                key={`${entry.role}-${index}`}
                ref={(node) => { messageNodesRef.current[index] = node; }}
                className={`chat-message ${entry.role}`}
                aria-label={entry.role === 'user' ? 'Your message' : `${getAssistantName()} reply`}
              >
                {entry.role === 'assistant' && <AssistantAvatar small />}
                <div className="chatbot-message-content">
                  <span>{entry.text}</span>
                  {entry.timestamp && <small className="chatbot-history-timestamp">{new Date(entry.timestamp).toLocaleString()}</small>}
                  {entry.details && <small>{entry.details.name} · {entry.details.office_hours || 'Contact the department for office hours.'}</small>}
                  {entry.source && <small className="chatbot-source">Source: {entry.source.type} #{entry.source.id} — {entry.source.label}{entry.source.department ? ` (${entry.source.department})` : ''}</small>}
                {entry.clarificationRequired && entry.clarificationOptions.length > 0 && (
                  <div className="chatbot-clarification-options" aria-label="Clarify your question">
                    {entry.clarificationOptions.map((option) => (
                      <button type="button" key={option} disabled={sending} onClick={() => sendMessage(null, option)}>{option}</button>
                    ))}
                  </div>
                )}
                {entry.escalationAvailable && !isAdminUser && <a className="chatbot-escalation-link" href="/tickets">Create a support ticket for staff follow-up</a>}
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
              </div>
            ))}
            {ticketComposerOpen && !isAdminUser && (
              <section className="chatbot-ticket-composer" aria-labelledby="chatbot-ticket-title">
                <div className="chatbot-ticket-composer-heading">
                  <div>
                    <strong id="chatbot-ticket-title">Create a support ticket</strong>
                    <span>Share the issue and choose where it should go.</span>
                  </div>
                  <button type="button" onClick={() => setTicketComposerOpen(false)} aria-label="Close ticket form">×</button>
                </div>
                {ticketCatalogLoading ? (
                  <p className="chatbot-ticket-status" role="status">Loading ticket options…</p>
                ) : ticketCatalogError ? (
                  <div className="chatbot-ticket-status is-error" role="alert">
                    <span>{ticketCatalogError}</span>
                    <button type="button" onClick={openTicketComposer}>Retry</button>
                  </div>
                ) : (
                  <form className="chatbot-ticket-form" onSubmit={submitChatTicket} aria-busy={ticketSubmitState.status === 'loading'}>
                    <label>
                      <span>Department <small>Optional</small></span>
                      <select value={ticketForm.department_id} onChange={(event) => handleTicketDepartmentChange(event.target.value)}>
                        <option value="">Let AssistDesk route it</option>
                        {availableTicketDepartments.map((department) => (
                          <option key={department.id} value={department.id}>{department.display_name || department.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>General issue</span>
                      <select
                        value={ticketForm.category}
                        onChange={(event) => setTicketForm((current) => ({ ...current, category: event.target.value, subject: '' }))}
                        required
                      >
                        <option value="">Choose a category</option>
                        {Object.keys(ticketIssueOptionsByCategory).map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>Specific issue</span>
                      <select
                        value={ticketForm.subject}
                        onChange={(event) => setTicketForm((current) => ({ ...current, subject: event.target.value }))}
                        required
                        disabled={!ticketForm.category}
                      >
                        <option value="">Choose an issue</option>
                        {ticketSpecificIssues.map((issue) => <option key={issue} value={issue}>{issue}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>Priority</span>
                      <select value={ticketForm.priority} onChange={(event) => setTicketForm((current) => ({ ...current, priority: event.target.value }))}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </label>
                    <label>
                      <span>Describe the issue</span>
                      <textarea
                        value={ticketForm.description}
                        onChange={(event) => setTicketForm((current) => ({ ...current, description: event.target.value }))}
                        placeholder="What happened? Add a location or details that may help."
                        maxLength={10000}
                        required
                      />
                    </label>
                    {isMaintenanceTicket && (
                      <label className="chatbot-ticket-photo">
                        <span>Photo <small>Required for Maintenance · JPG, PNG, or WEBP · max 3 MB</small></span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" required={!ticketAttachment} onChange={(event) => { handleTicketAttachment(event.target.files?.[0]); event.target.value = ''; }} />
                        {ticketAttachment && (
                          <span className="chatbot-ticket-file">
                            {ticketAttachment.name}
                            <button type="button" onClick={() => setTicketAttachment(null)}>Remove</button>
                          </span>
                        )}
                      </label>
                    )}
                    {ticketSubmitState.message && <p className="chatbot-ticket-status is-error" role="alert">{ticketSubmitState.message}</p>}
                    <div className="chatbot-ticket-actions">
                      <button type="button" className="is-secondary" onClick={() => setTicketComposerOpen(false)}>Cancel</button>
                      <button type="submit" disabled={ticketSubmitState.status === 'loading'}>
                        {ticketSubmitState.status === 'loading' ? 'Submitting…' : 'Submit ticket'}
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}
            {sending && (
              <div className="chat-message assistant chatbot-typing" aria-live="polite">
                <AssistantAvatar small />
                <span>{getAssistantName()} is thinking</span>
                <span className="chatbot-typing-dots" aria-hidden="true"><i /><i /><i /></span>
              </div>
            )}
            {showFaqs && (
              <div className="chatbot-faqs">
                <div className="chatbot-faq-heading">
                  <div><strong>Explore common questions</strong><span>Browse by topic or search the FAQs.</span></div>
                </div>
                <label className="chatbot-faq-search">
                  <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.7" cy="8.7" r="5.4" /><path d="m12.7 12.7 4 4" /></svg>
                  <input value={faqSearch} onChange={(event) => setFaqSearch(event.target.value)} placeholder="Search a topic or question" aria-label="Search common questions" />
                  {faqSearch && <button type="button" onClick={() => setFaqSearch('')} aria-label="Clear FAQ search">×</button>}
                </label>
                <div className="chatbot-faq-list">
                  {filteredFaqGroups.map((group) => (
                    <details key={group.title} className="chatbot-faq-group">
                      <summary><span>{group.title}</span><span className="chatbot-faq-count">{group.questions.length}</span></summary>
                      <div className="chatbot-faq-group-questions">
                        {group.questions.map((question) => {
                          const questionText = typeof question === 'string' ? question : question.text;
                          return <button type="button" key={questionText} disabled={historyLoading} onClick={() => { setShowFaqs(false); sendMessage(null, question); }}>{questionText}</button>;
                        })}
                      </div>
                    </details>
                  ))}
                  {filteredFaqGroups.length === 0 && <p className="chatbot-faq-empty">No matching FAQs. Try a shorter search or ask your question below.</p>}
                </div>
              </div>
            )}
            <div ref={chatEndRef} aria-hidden="true" />
          </div>
          <div className="chatbot-footer">
            {!isAdminUser && (
              <button
                type="button"
                className="chatbot-ticket-toggle"
                onClick={() => (ticketComposerOpen ? setTicketComposerOpen(false) : openTicketComposer())}
                aria-expanded={ticketComposerOpen}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>
                {ticketComposerOpen ? 'Close ticket form' : 'Create a ticket'}
              </button>
            )}
            <button type="button" className="chatbot-faq-toggle" onClick={() => { setShowFaqs((value) => !value); setFaqSearch(''); }} aria-expanded={showFaqs}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4.5h14M3 10h14M3 15.5h8" /></svg>
              {showFaqs ? 'Hide FAQ browser' : 'Browse common questions'}
              <span>{showFaqs ? '−' : '+'}</span>
            </button>
            <form className="chatbot-input" onSubmit={sendMessage}>
              <input ref={inputRef} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask about campus support…" aria-label="Ask AssistDesk" disabled={historyLoading} />
              <button type="submit" aria-label="Send message" disabled={sending || historyLoading || !message.trim()}>
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 9.7 16.8 3l-3.2 14-3.2-5.5z" /><path d="m10.4 11.5 3.5-3.6" /></svg>
              </button>
            </form>
            <small className="chatbot-footer-note">AssistDesk · Campus support</small>
          </div>
        </section>
      )}
      <button ref={launcherButtonRef} type="button" className="chatbot-launcher" aria-label={open ? 'Close AssistDesk help center' : 'Open AssistDesk help center'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span ref={launcherMarkRef} className="chatbot-launcher-mark" aria-hidden="true">
          {open ? (
            <svg viewBox="0 0 20 20"><path d="m5 5 10 10M15 5 5 15" /></svg>
          ) : <AssistantAvatar small />}
        </span>
        <b>{open ? 'Close' : 'Help center'}</b>
        {!open && <span className="chatbot-launcher-signal" aria-hidden="true" />}
      </button>
    </div>
  );
}

export default ChatbotWidget;
