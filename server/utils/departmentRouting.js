const { Department, Faq, Service } = require('../models');

const MIN_ROUTING_SCORE = 5;
const MIN_ROUTING_MARGIN = 2;
const CONFIDENCE_SCORE_SCALE = 12;

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const scoreText = (query, target) => {
  const queryTokens = new Set(normalize(query).split(' ').filter(Boolean));
  return normalize(target).split(' ').filter(Boolean).reduce((score, token) => (
    queryTokens.has(token) ? score + 2 : score
  ), 0);
};

async function inferDepartment(subject, description, category = '') {
  const query = `${category || ''} ${subject || ''} ${description || ''}`;
  const [faqs, services, departments] = await Promise.all([
    Faq.findAll(),
    Service.findAll(),
    Department.findAll({ attributes: ['id', 'name'] }),
  ]);
  const scoresByDepartment = new Map();
  const addMatch = (departmentId, text) => {
    const id = Number(departmentId);
    const score = scoreText(query, text);
    if (score > (scoresByDepartment.get(id) || 0)) scoresByDepartment.set(id, score);
  };

  faqs.forEach((faq) => addMatch(faq.department_id, `${faq.question} ${faq.answer} ${faq.keywords || ''}`));
  services.forEach((service) => addMatch(service.department_id, `${service.name} ${service.requirements || ''}`));

  const ranked = [...scoresByDepartment.entries()]
    .map(([id, score]) => ({ id, score, department: departments.find((item) => Number(item.id) === id) }))
    .filter((match) => match.department && match.score > 0)
    .sort((first, second) => second.score - first.score);
  const best = ranked[0];
  const margin = best ? best.score - (ranked[1]?.score || 0) : 0;
  const accepted = Boolean(best && best.score >= MIN_ROUTING_SCORE && margin >= MIN_ROUTING_MARGIN);

  return {
    department_id: accepted ? best.id : null,
    suggested_department_id: best?.id || null,
    score: best?.score || 0,
    margin,
    confidence: best ? Math.min(1, best.score / CONFIDENCE_SCORE_SCALE) : 0,
    accepted,
    candidates: ranked.slice(0, 3).map(({ id, score, department }) => ({ id, name: department.name, score })),
  };
}

module.exports = { inferDepartment, MIN_ROUTING_SCORE, MIN_ROUTING_MARGIN, CONFIDENCE_SCORE_SCALE };
