const normalize = require('./normalizeStudentQuery');

const isStudentIdRequest = (value) => {
  const query = normalize(value);
  const mentionsId = /\b(?:id|identification|id card)\b/.test(query);
  const asksHowOrWhere = /\b(?:where|how|find|get|make|replace|renew|obtain|apply|request|lost|damaged)\b/.test(query);
  const schoolContext = /\b(?:my|student|school|campus|college|tcc|replacement|lost|damaged)\b/.test(query);
  return mentionsId && asksHowOrWhere && schoolContext;
};

module.exports = isStudentIdRequest;
