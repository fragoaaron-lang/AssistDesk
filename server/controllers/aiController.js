const { Faq, Service, Department, ChatLog, Ticket, TicketUpdate, Notification } = require('../models');
const { notifyUser, notifyAdmins, notifyDepartmentAdmins } = require('../utils/socket');

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (text) => normalize(text).split(' ').filter(Boolean);

const normalizeFaqQuery = (text) => normalize(text)
  .replace(/computer science/g, ' cs bscs ')
  .replace(/basic education/g, ' basic education ')
  .replace(/criminal justice|criminology/g, ' crim bscrim ')
  .replace(/hospitality management/g, ' hm bshm ')
  .replace(/physical therapy/g, ' pt bspt ')
  .replace(/information technology|it department/g, ' it ');

const departmentAliases = [
  { id: 'basic', terms: ['basic education', 'elementary', 'jhs', 'shs'] },
  { id: 'cs', terms: ['computer science', 'bscs', 'cs department', 'cs'] },
  { id: 'cba', terms: ['accountancy', 'business administration', 'bsa', 'bsba', 'cba'] },
  { id: 'crim', terms: ['criminology', 'criminal justice', 'bscrim', 'crim'] },
  { id: 'hm', terms: ['hospitality management', 'bshm', 'charm', 'hm department'] },
  { id: 'pt', terms: ['physical therapy', 'bspt', 'pt department'] },
  { id: 'nursing', terms: ['nursing', 'bsn'] },
  { id: 'education', terms: ['education department', 'educ department', 'beed', 'bsed'] },
  { id: 'maintenance', terms: ['maintenance'] },
  { id: 'clinic', terms: ['clinic'] },
  { id: 'accounting', terms: ['accounting department', 'accounting'] },
  { id: 'guidance', terms: ['guidance'] },
  { id: 'library', terms: ['library'] },
];

const getDepartmentIntent = (query) => {
  const normalizedQuery = normalize(query);
  return departmentAliases.find((department) => department.terms.some((term) => normalizedQuery.includes(term)))?.id || null;
};

const departmentMatchesIntent = (department, intent) => {
  if (!department || !intent) return false;
  const departmentName = normalize(department.name);
  const aliases = departmentAliases.find((item) => item.id === intent)?.terms || [];
  return aliases.some((alias) => departmentName.includes(normalize(alias)) || normalize(alias).includes(departmentName));
};

const findDepartmentForIntent = (departments, intent) => departments.find((department) => departmentMatchesIntent(department, intent));

const scoreText = (query, target) => {
  const qTokens = new Set(tokenize(query));
  const tTokens = tokenize(target);
  let score = 0;
  tTokens.forEach((token) => {
    if (qTokens.has(token)) score += 2;
  });
  return score;
};

const scoreFaq = (query, faq, departmentIntent) => {
  const normalizedQuery = normalizeFaqQuery(query);
  const normalizedQuestion = normalizeFaqQuery(faq.question);
  if (normalizedQuery === normalizedQuestion) return 1000;
  const questionScore = scoreText(normalizedQuery, normalizedQuestion);
  const keywordScore = scoreText(normalizedQuery, faq.keywords || '');
  const genericWords = new Set(['where', 'can', 'i', 'get', 'the', 'a', 'is', 'of', 'to', 'in', 'my', 'who', 'what', 'or', 'and']);
  const specificQuestionScore = tokenize(normalizedQuestion).filter((token) => !genericWords.has(token)).reduce((score, token) => (
    normalizedQuery.includes(token) ? score + 3 : score
  ), 0);
  const departmentScore = departmentIntent
    ? (departmentMatchesIntent(faq.Department, departmentIntent) ? 100 : -100)
    : 0;
  return questionScore * 4 + keywordScore + specificQuestionScore + departmentScore;
};

const getLocalConversationResponse = (query) => {
  const normalizedQuery = normalize(query);
  const now = new Date();
  const greetingPattern = /(?:^|\s)(hi|hii|hey|hello|good morning|good afternoon|good evening)(?:\s|$)/;

  if (/\b(what is your name|who are you|what should i call you)\b/.test(normalizedQuery)) {
    return 'I am AssistDesk, your campus support assistant. How can I help you today?';
  }

  if (greetingPattern.test(normalizedQuery)) {
    return 'Hello! I am AssistDesk, your campus support assistant. How can I help you today?';
  }

  if (/\b(thank you|thanks|thx)\b/.test(normalizedQuery)) {
    return 'You are welcome! I am here whenever you need help.';
  }
  if (/\b(what time|current time|time is it)\b/.test(normalizedQuery)) {
    return `The current time is ${now.toLocaleTimeString()}.`;
  }
  if (/\b(what day|today|date is it|what date)\b/.test(normalizedQuery)) {
    return `Today is ${now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
  }
  return null;
};

const schoolKnowledgeBase = [
  ['Where is the Registrar Office?', 'The Registrar Office is located in the Administration Building, usually near the main campus windows.'],
  ['How can I get my grades?', 'You may ask your adviser or check through the registrar or school portal, depending on the current school procedure.'],
  ['Where do I pay my school fees?', 'School fees are usually paid through the accounting department and cashier windows, especially Window 6 and Window 8.'],
  ['How do I apply for a scholarship?', 'You may ask the Guidance Office or the school administration for available scholarship programs and requirements.'],
  ['Where can I ask about my schedule or subject load?', 'Ask your adviser or the Registrar Office for your schedule and subject load concerns.'],
  ['Where can I get a certificate of enrollment?', 'You can request it from the Registrar Office, usually at Window 1 or 3.'],
  ['Where can I get a medical certificate?', 'You may secure a medical certificate from the clinic or the school health office.'],
  ['Where do I report a lost item?', 'You may report lost items to the Campus Security Office or the Office of Student Affairs.'],
  ['Where can I get a copy of my academic record?', 'Requests for academic records may be processed through the Registrar Office.'],
  ['Who should I ask if I have academic concerns?', 'You may consult your adviser, dean, or the Guidance Office depending on the concern.'],
  ['How can I request for a student ID replacement?', 'Visit the school office that handles IDs or coordination with the registrar or student affairs office.'],
  ['Where can I inquire about school announcements?', 'Check bulletin boards, school social media pages, or ask the Office of Student Affairs.'],
  ['Where can I ask for counseling or personal concerns?', 'Go to the Guidance Office for counseling and student support concerns.'],
  ['Where can I locate the nearest parking?', 'Parking can be located along the gates, in front of Administration building, CHARM parking, Criminology parking, and along the Education building until the SHS building.'],
  ['Where can I get a vehicle sticker pass?', 'In Window 10. First, you must pay for the sticker fee in Window 8 (cashier).'],
  ['Where is the canteen located?', 'Near TCC Gymnasium.'],
  ['Where is the Office of Student Affairs located?', 'Near TCC Gymnasium.'],
  ['Where can I get Form 137?', 'You can get these in registrar, either Window 1 or 3.'],
  ['Where can I get Form 138?', 'From professors or advisers.'],
  ['Who is the president of TCC?', 'The president of Tomas Claudio Colleges is Pres. Edmund C. Francisco.'],
  ['Who is the secretary of TCC?', 'The secretary of Tomas Claudio Colleges is Ms. Reylyn R. Geron.'],
  ['Where can I get a college school ID?', 'You can get a college school ID at Dante\'s Photo Image in Morong Proper.'],
  ['What is the enrollment process?', 'For freshmen and transferees: 1. Guidance Office. 2. Registrar\'s Office, Window 5. For old students: 1. Registrar\'s Office, Window 4, then the Dean\'s Office for advising. 2. Window 1, 2, or 3 for subject encoding; old-student encoding may be handled at Window 5. 3. Window 6 for tuition and other-fee assessment. 4. Administration Building for SC fee payment. 5. Window 8 for cashier payment. 6. Window 7 for the yellow copy. 7. Window 3 for the white copy. 8. Dean\'s Office for the green copy.'],
  ['Where can I get good moral?', 'You can get a Certificate of Good Moral Character at Guidance, located in the underground of the Administration Building.'],
  ['Where can I inquire about tuition or graduation fees?', 'Inquire at the Accounting Department, Window 6.'],
  ['Where can I ask about my current balance or tuition fee?', 'Ask at the Cashier, Window 8.'],
  ['Where can I get a college exam permit?', 'Get it from the Accounting Department, Window 6. Your current balance must be reduced first before claiming the permit.'],
  ['Where can I get a college PE uniform?', 'The respective professors coordinate the distribution or purchase of PE uniforms.'],
  ['Who is the point person for Maintenance?', 'The Maintenance point person is Mr. Jerry San Luis.'],
  ['Where is the Maintenance Department located?', 'The Maintenance Department is near the SHS Building.'],
  ['Who is the point person for the clinic?', 'The clinic point person is Marivic B. Rayo, RN, MAN.'],
  ['Where is the clinic located?', 'The clinic is behind the CBA Building.'],
  ['Who is the point person of Guidance?', 'The Guidance point person is Louie ES. Dematera.'],
  ['Who is the point person of the Library?', 'The Library point person is Julieta SJ. Belandres.'],
  ['What is Tomas Claudio Colleges?', 'Tomas Claudio Colleges (TCC) is a pioneering, community-owned educational institution in Taghangin, Morong, Rizal, Philippines. Founded on August 15, 1950, it honors Tomas Claudio, a local native recognized as the first Filipino national hero to die during World War I. TCC is a private institution in eastern Rizal offering programs from basic education through postgraduate studies.'],
  ['What does Tomas Claudio Colleges offer?', 'TCC offers Accountancy, Business Administration, Public Administration, Computer Science, Elementary Education, Secondary Education, Criminology, Hospitality Management, Nursing, Physical Therapy, and TESDA Caregiving courses. Basic Education includes Kindergarten, Elementary, Junior High School, Senior High School, and Special Needs Education. Graduate programs include Master in Business Administration, Master in Public Administration, and Master of Arts in Education. TCC also offers the College of Law Juris Doctor program.'],
  ['What are the admission requirements?', 'For incoming freshmen: Grade 12 Report Card (Form 138), Certificate of Good Moral Character, photocopy of PSA birth certificate, and two 2x2 ID pictures with name tag. For transferees: original Transcript of Records, Honorable Dismissal with Scholastic Record, photocopy of PSA birth certificate, and two 2x2 ID pictures with name tag. For cross-enrollees: Permit to Cross-Enroll, Certificate of Good Moral Character, photocopy of PSA birth certificate, and two 2x2 ID pictures with name tag. For graduate studies: original Transcript of Records, photocopy of birth certificate, marriage contract if married, and two 2x2 ID pictures with name tag.'],
  ['What is the mission and vision of TCC?', 'Vision: Tomas Claudio Colleges is the leading community-based institution of learning imbued with academic excellence, social advancement, and internationalization of education. Mission: TCC is committed to delivering affordable educational services guided by academic excellence, attaining social advancement and quality of life for all sectors of society, and actively participating in the internationalization of education.'],
  ['What is Accountancy?', 'The Bachelor of Science in Accountancy program prepares students for careers in accounting, auditing, taxation, and financial management while developing analytical, problem-solving, and decision-making skills.'],
  ['What is Business Administration?', 'The Bachelor of Science in Business Administration program develops skills for managing people, growing businesses, and making sound financial decisions in a dynamic business environment.'],
  ['What is Computer Science?', 'The Bachelor of Science in Computer Science program develops knowledge in programming, software development, and computing technologies, including system design, application development, and real-world problem solving.'],
  ['What is Education?', 'The Education program, including BSEd and BEEd, prepares effective and compassionate professional educators with the knowledge, skills, and values to teach and inspire the next generation.'],
  ['What is Criminology?', 'The Bachelor of Science in Criminology program prepares students for careers in law enforcement, public safety, and criminal justice, with emphasis on discipline, justice, and community safety.'],
  ['What is Hospitality Management?', 'The Bachelor of Science in Hospitality Management program prepares students for careers in hotels, restaurants, tourism, and events, developing service, management, and guest-relations skills.'],
  ['What is Nursing?', 'The Bachelor of Science in Nursing program prepares competent, compassionate, and globally competitive healthcare professionals with knowledge and clinical skills for quality patient care.'],
  ['What is Physical Therapy?', 'The Bachelor of Science in Physical Therapy program prepares healthcare professionals focused on rehabilitation, recovery, physical function, strength, mobility, and independence.'],
];

const getGeminiResponse = async (query, faqs, services, departments) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || typeof fetch !== 'function') return null;

  const context = [
    ...faqs.map((faq) => `FAQ [${faq.Department?.name || 'General'}] Q: ${faq.question} A: ${faq.answer}`),
    ...services.map((service) => `Service [${service.Department?.name || 'General'}] ${service.name}: ${service.requirements || ''} ${service.processing_time || ''}`),
    ...departments.map((department) => `Department: ${department.name}; location: ${department.location || 'not listed'}; point person: ${department.point_person || 'not listed'}`),
    ...schoolKnowledgeBase.map(([question, answer]) => `School fact Q: ${question} A: ${answer}`),
  ].join('\n');

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: 'You are AssistDesk, a friendly student help center assistant. Answer everyday questions naturally and briefly. For campus facts, use only the supplied context and say you do not have that information when it is missing. Never claim to have performed an action you cannot perform.' }],
      },
      contents: [{ role: 'user', parts: [{ text: `School context:\n${context}\n\nStudent question: ${query}` }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
    }),
  });

  if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join('').trim() || null;
};

const inferDepartmentId = async (query) => {
  const [faqs, services] = await Promise.all([
    Faq.findAll(),
    Service.findAll(),
  ]);
  const candidates = [
    ...faqs.map((faq) => ({ id: faq.department_id, text: `${faq.question} ${faq.answer} ${faq.keywords || ''}` })),
    ...services.map((service) => ({ id: service.department_id, text: `${service.name} ${service.requirements || ''}` })),
  ];
  const best = candidates
    .map((candidate) => ({ ...candidate, score: scoreText(query, candidate.text) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)[0];
  return best ? best.id : null;
};

const buildResponse = async (query) => {
  const faqs = await Faq.findAll({ include: [{ model: Department }] });
  const services = await Service.findAll({ include: [{ model: Department }] });
  const normalizedQuery = normalize(query);
  const departmentIntent = getDepartmentIntent(query);
  const exactFaq = faqs.find((faq) => normalize(faq.question) === normalizedQuery);

  if (!exactFaq) {
    const localResponse = getLocalConversationResponse(query);
    if (localResponse) {
      return { ai_response: localResponse, matched_department: null, department_details: null, service_details: null };
    }
  }

  const scoredFaqs = faqs
    .map((faq) => ({
      item: faq,
      score: scoreFaq(query, faq, departmentIntent),
    }))
    .sort((a, b) => b.score - a.score);

  const scoredServices = services
    .map((service) => ({
      item: service,
      score: scoreText(query, `${service.name} ${service.requirements || ''} ${service.processing_time || ''}`)
        + (departmentIntent
          ? (departmentMatchesIntent(service.Department, departmentIntent) ? 100 : -100)
          : 0),
    }))
    .sort((a, b) => b.score - a.score);

  const topFaq = scoredFaqs[0];
  const topService = scoredServices[0];
  const best = topFaq && topService ? (topFaq.score >= topService.score ? topFaq : topService) : (topFaq || topService);

  if (!best || best.score <= 0) {
    try {
      const conversationalResponse = await getGeminiResponse(query, faqs, services, await Department.findAll());
      if (conversationalResponse) {
        return { ai_response: conversationalResponse, matched_department: null, department_details: null, service_details: null };
      }
    } catch (error) {
      console.error('Conversational AI fallback error:', error.message);
    }
    return {
      ai_response: 'I can help with everyday questions and AssistDesk services. Please ask me something specific, or choose one of the FAQ questions below.',
      matched_department: null,
      department_details: null,
      service_details: null,
    };
  }

  const department = findDepartmentForIntent(await Department.findAll(), departmentIntent) || best.item.Department;
  const response = best.item.answer || best.item.name || 'I found a likely match in the knowledge base.';

  return {
    ai_response: response,
    matched_department: department ? department.id : null,
    department_details: department
      ? {
          id: department.id,
          name: department.name,
          point_person: department.point_person,
          location: department.location,
          office_hours: department.office_hours,
        }
      : null,
    service_details: best.item instanceof Service
      ? {
          name: best.item.name,
          requirements: best.item.requirements,
          processing_time: best.item.processing_time,
        }
      : null,
  };
};

const getEstimatedCompletion = (priority) => {
  const hoursByPriority = { urgent: 24, medium: 48, low: 72 };
  const estimated = new Date();
  estimated.setHours(estimated.getHours() + (hoursByPriority[priority] || 48));
  return estimated;
};

const mapPriorityToDatabase = (priority) => {
  // Direct mapping - frontend and database use same priority values
  return priority || 'medium';
};

const handleTicketCommand = async (message, userId) => {
  const normalized = normalize(message);
  if (normalized.startsWith('status') || normalized.includes('my tickets') || normalized.includes('track my')) {
    const tickets = await Ticket.findAll({ where: { user_id: userId }, include: [{ model: Department }], order: [['created_at', 'DESC']], limit: 10 });
    return {
      ai_response: tickets.length ? `You have ${tickets.length} recent request${tickets.length === 1 ? '' : 's'}.` : 'You have no submitted requests yet.',
      tickets,
      action: 'status',
    };
  }

  const submitMatch = message.match(/^(?:submit|create|report)\s+(?:a\s+)?(?:request|ticket|incident)\s*:?\s*(.*)$/i);
  if (!submitMatch) return null;

  const description = submitMatch[1].trim();
  if (!description) return { ai_response: 'Please include a short description after “submit request”.', action: 'submit_help' };
  const departmentId = await inferDepartmentId(description);
  const department = departmentId ? await Department.findByPk(departmentId) : null;
  const ticket = await Ticket.create({
    user_id: userId,
    department_id: departmentId || 1,
    subject: description.slice(0, 200),
    description,
    category: 'Other',
    priority: mapPriorityToDatabase('medium'),
    status: 'open',
    estimated_completion_at: getEstimatedCompletion('medium'),
  });
  await TicketUpdate.create({ ticket_id: ticket.id, message: 'Ticket created through the assistant.', updated_by: userId });
  await Notification.create({ user_id: userId, message: `Your ticket "${ticket.subject}" has been created.` });
  notifyUser(userId, 'ticketCreated', { ticket });
  notifyAdmins('ticketCreated', { ticket });
  if (departmentId) notifyDepartmentAdmins(departmentId, 'ticketCreated', { ticket });
  return {
    ai_response: `Your request was submitted${department ? ` to ${department.name}` : ''}.`,
    ticket,
    action: 'created',
  };
};

exports.askAssistant = async (req, res) => {
  try {
    const { message, user_id } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'A message is required.' });
    }

    const commandResult = await handleTicketCommand(message, req.user.id);
    const result = commandResult || await buildResponse(message);
    const chatLog = await ChatLog.create({
      user_id: user_id || 0,
      message,
      ai_response: result.ai_response,
      matched_department_id: result.matched_department,
    });

    return res.json({
      message: 'Assistant response generated.',
      chatLog,
      ...result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to process assistant request.' });
  }
};
