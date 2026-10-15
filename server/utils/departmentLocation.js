const normalizeStudentQuery = require('./normalizeStudentQuery');

const departmentNameNoise = new Set(['and', 'college', 'department', 'faculty', 'of', 'office', 'school', 'the', 'unit']);

const isDepartmentLocationRequest = (value) => {
  const query = normalizeStudentQuery(value);
  return /\bwhere\b.*\b(?:is|are|located|find|locate)\b/.test(query)
    || /\b(?:location|located)\b/.test(query);
};

const findDepartmentByName = (query, departments = []) => {
  const normalizedQuery = ` ${normalizeStudentQuery(query)} `;
  const queryTokens = new Set(normalizedQuery.trim().split(/\s+/));
  const matches = departments.map((department) => {
    const normalizedName = normalizeStudentQuery(department?.name);
    const nameTokens = normalizedName.split(' ').filter((token) => token && !departmentNameNoise.has(token));
    const exactPhrase = normalizedName && normalizedQuery.includes(` ${normalizedName} `);
    const allNameTokensPresent = nameTokens.length > 0 && nameTokens.every((token) => queryTokens.has(token));
    return { department, exactPhrase, allNameTokensPresent, tokenCount: nameTokens.length };
  }).filter(({ exactPhrase, allNameTokensPresent }) => exactPhrase || allNameTokensPresent)
    .sort((first, second) => Number(second.exactPhrase) - Number(first.exactPhrase)
      || second.tokenCount - first.tokenCount);

  return matches[0]?.department || null;
};

const getDepartmentLocationAnswer = (department) => department?.location
  ? `${department.name} is located at ${department.location}.`
  : `I don’t have a confirmed location for ${department?.name || 'that department'} in the directory. Please contact the department to confirm.`;

module.exports = { isDepartmentLocationRequest, findDepartmentByName, getDepartmentLocationAnswer };