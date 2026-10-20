const normalizeStudentQuery = require('./normalizeStudentQuery');

const departmentAliases = [
  { id: 'basic', terms: ['basic education', 'elementary', 'jhs', 'shs'] },
  { id: 'cs', terms: ['computer science', 'bscs', 'cs department', 'cs'] },
  { id: 'cba', terms: ['accountancy', 'business administration', 'bsa', 'bsba', 'cba'] },
  { id: 'crim', terms: ['criminology', 'criminal justice', 'bscrim', 'crim'] },
  { id: 'hm', terms: ['hospitality management', 'bshm', 'charm', 'hm department'] },
  { id: 'pt', terms: ['physical therapy', 'bspt', 'pt department'] },
  { id: 'nursing', terms: ['nursing', 'bsn'] },
  { id: 'education', terms: ['education department', 'college of education', 'education', 'educ department', 'beed', 'bsed'] },
  { id: 'maintenance', terms: ['maintenance'] },
  { id: 'clinic', terms: ['clinic'] },
  { id: 'accounting', terms: ['accounting department', 'accounting'] },
  { id: 'registrar', terms: ['registrar office', 'registrar department', 'registrar', 'transcript of records', 'tor'] },
  { id: 'osa', terms: ['office of the student affairs', 'office of student affairs', 'student affairs', 'osa'] },
  { id: 'guidance', terms: ['guidance'] },
  { id: 'library', terms: ['library'] },
];

const normalize = (value) => normalizeStudentQuery(value);

const getDepartmentIntent = (query) => {
  const normalizedQuery = normalize(query);
  return departmentAliases.find(({ terms }) => terms.some((term) => normalizedQuery.includes(term)))?.id || null;
};

const shouldUseGenericDepartmentHelp = (query) => {
  const normalizedQuery = normalize(query);
  const asksForDepartmentHelp = /\b(department|office|service|help desk)\b.*\b(find|locate|where|contact)\b|\b(find|locate|where|contact)\b.*\b(department|office|service|help desk)\b/.test(normalizedQuery);
  return asksForDepartmentHelp && !getDepartmentIntent(query);
};

const departmentMatchesIntent = (department, intent) => {
  if (!department || !intent) return false;
  const departmentName = normalize(department.name);
  const aliases = departmentAliases.find((item) => item.id === intent)?.terms || [];
  return aliases.some((alias) => departmentName.includes(normalize(alias)) || normalize(alias).includes(departmentName));
};

const findDepartmentForIntent = (departments, intent) => departments.find((department) => departmentMatchesIntent(department, intent));

module.exports = {
  getDepartmentIntent,
  shouldUseGenericDepartmentHelp,
  departmentMatchesIntent,
  findDepartmentForIntent,
};