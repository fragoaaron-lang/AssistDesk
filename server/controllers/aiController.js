const { Faq, Service, Department, ChatLog, Ticket, TicketUpdate, Notification } = require('../models');
const { notifyUser, notifyAdmins, notifyDepartmentAdmins } = require('../utils/socket');

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (text) => normalize(text).split(' ').filter(Boolean);

const scoreText = (query, target) => {
  const qTokens = new Set(tokenize(query));
  const tTokens = tokenize(target);
  let score = 0;
  tTokens.forEach((token) => {
    if (qTokens.has(token)) score += 2;
  });
  return score;
};

const scoreFaq = (query, faq) => {
  const normalizedQuery = normalize(query);
  const normalizedQuestion = normalize(faq.question);
  if (normalizedQuery === normalizedQuestion) return 1000;
  return scoreText(query, faq.question) * 5 + scoreText(query, `${faq.answer} ${faq.keywords || ''}`);
};

const getLocalConversationResponse = (query) => {
  const normalizedQuery = normalize(query);
  const now = new Date();
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(normalizedQuery)) {
    return 'Hello! I am your AssistDesk assistant. How can I help you today?';
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

const getGeminiResponse = async (query, faqs, services, departments) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || typeof fetch !== 'function') return null;

  const context = [
    ...faqs.map((faq) => `FAQ [${faq.Department?.name || 'General'}] Q: ${faq.question} A: ${faq.answer}`),
    ...services.map((service) => `Service [${service.Department?.name || 'General'}] ${service.name}: ${service.requirements || ''} ${service.processing_time || ''}`),
    ...departments.map((department) => `Department: ${department.name}; location: ${department.location || 'not listed'}; point person: ${department.point_person || 'not listed'}`),
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
      score: scoreFaq(query, faq),
    }))
    .sort((a, b) => b.score - a.score);

  const scoredServices = services
    .map((service) => ({
      item: service,
      score: scoreText(query, `${service.name} ${service.requirements || ''} ${service.processing_time || ''}`),
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

  const department = best.item.Department;
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
