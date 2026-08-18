const { Faq, Service, Department, ChatLog } = require('../models');

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

exports.askAssistant = async (req, res) => {
  try {
    const { message, user_id } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'A message is required.' });
    }

    const result = await buildResponse(message);
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
