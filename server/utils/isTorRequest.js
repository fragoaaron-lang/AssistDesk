const normalizeFaqQuery = require('./normalizeFaqQuery');

const isTorRequest = (query) => {
  const normalizedQuery = normalizeFaqQuery(query);
  return /\b(?:tor|transcript(?: of records)?)\b/.test(normalizedQuery)
    && /\b(?:where|how|request|get|obtain|apply|claim)\b/.test(normalizedQuery);
};

module.exports = isTorRequest;
