const normalizeStudentQuery = require('./normalizeStudentQuery');

const departmentNameNoise = new Set(['and', 'college', 'department', 'faculty', 'of', 'office', 'school', 'the', 'unit']);

const isOneEditApart = (first, second) => {
  if (Math.abs(first.length - second.length) > 1) return false;

  let firstIndex = 0;
  let secondIndex = 0;
  let edits = 0;
  while (firstIndex < first.length && secondIndex < second.length) {
    if (first[firstIndex] === second[secondIndex]) {
      firstIndex += 1;
      secondIndex += 1;
      continue;
    }

    edits += 1;
    if (edits > 1) return false;
    if (first.length > second.length) firstIndex += 1;
    else if (second.length > first.length) secondIndex += 1;
    else {
      firstIndex += 1;
      secondIndex += 1;
    }
  }

  if (firstIndex < first.length || secondIndex < second.length) edits += 1;
  return edits === 1;
};

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
    const matchedTokens = nameTokens.filter((token) => queryTokens.has(token)
      || (token.length >= 5 && [...queryTokens].some((queryToken) => (
        queryToken.length >= 5 && isOneEditApart(token, queryToken)
      ))));
    const allNameTokensPresent = nameTokens.length > 0 && matchedTokens.length === nameTokens.length;
    return { department, exactPhrase, allNameTokensPresent, tokenCount: nameTokens.length, matchedTokenCount: matchedTokens.length };
  }).filter(({ exactPhrase, allNameTokensPresent }) => exactPhrase || allNameTokensPresent)
    .sort((first, second) => Number(second.exactPhrase) - Number(first.exactPhrase)
      || second.matchedTokenCount - first.matchedTokenCount
      || second.tokenCount - first.tokenCount);

  return matches[0]?.department || null;
};

const getDepartmentLocationAnswer = (department) => department?.location
  ? `${department.name} is located at ${department.location}.`
  : `I don’t have a confirmed location for ${department?.name || 'that department'} in the directory. Please contact the department to confirm.`;

module.exports = { isDepartmentLocationRequest, findDepartmentByName, getDepartmentLocationAnswer };