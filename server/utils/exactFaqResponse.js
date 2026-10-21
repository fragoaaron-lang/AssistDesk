const normalizeFaqQuery = require('./normalizeFaqQuery');

const findExactFaq = (query, faqs = []) => {
  const normalizedQuery = normalizeFaqQuery(query);
  return faqs.find((faq) => normalizeFaqQuery(faq.question) === normalizedQuery) || null;
};

const buildExactFaqResponse = (faq) => {
  if (!faq) return null;
  const department = faq.Department || null;
  return {
    ai_response: faq.answer || '',
    matched_department: faq.department_id || department?.id || null,
    matched_faq_id: faq.id || null,
    department_details: department ? {
      id: department.id,
      name: department.name,
      point_person: department.point_person,
      location: department.location,
      office_hours: department.office_hours,
    } : null,
    service_details: null,
    source: {
      type: 'FAQ',
      id: faq.id || null,
      label: faq.question,
      department: department?.name || null,
    },
    clarification_required: false,
    escalation_available: false,
  };
};

module.exports = { findExactFaq, buildExactFaqResponse };