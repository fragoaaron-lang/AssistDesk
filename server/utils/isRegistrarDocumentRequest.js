const normalizeFaqQuery = require('./normalizeFaqQuery');

const isRegistrarDocumentRequest = (query) => {
  const normalizedQuery = normalizeFaqQuery(query);
  if (!/\b(?:where|how|request|get|obtain|apply|claim)\b/.test(normalizedQuery)) return null;
  if (/\bcoe\b/.test(normalizedQuery)) return 'coe';
  if (/\bcor\b/.test(normalizedQuery)) return 'cor';
  return null;
};

module.exports = isRegistrarDocumentRequest;
