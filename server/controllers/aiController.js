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

  const scoredFaqs = faqs
    .map((faq) => ({
      item: faq,
      score: scoreText(query, `${faq.question} ${faq.answer} ${faq.keywords || ''}`),
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
    return {
      ai_response: 'I could not find a strong match in the knowledge base. Please try a different wording or contact the helpdesk directly.',
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
  const hoursByPriority = { urgent: 8, high: 24, medium: 48, low: 72 };
  const estimated = new Date();
  estimated.setHours(estimated.getHours() + (hoursByPriority[priority] || 48));
  return estimated;
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
    priority: 'medium',
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
