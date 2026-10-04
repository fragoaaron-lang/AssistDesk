const { Department, Faq, Service } = require('../models');

const MIN_ROUTING_SCORE = 5;
const MIN_ROUTING_MARGIN = 2;
const CONFIDENCE_SCORE_SCALE = 12;

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const stopWords = new Set([
  'a', 'about', 'am', 'an', 'and', 'are', 'as', 'at', 'be', 'can', 'do', 'for', 'from', 'get', 'have',
  'help', 'how', 'i', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'please', 'the', 'to', 'was', 'what',
  'when', 'where', 'which', 'who', 'why', 'with', 'would', 'you', 'your', 'need', 'want', 'issue', 'problem',
]);

const departmentIntents = [
  {
    names: ['basic education', 'elementary', 'jhs', 'shs'],
    topics: ['basic education', 'elementary', 'junior high', 'senior high', 'kindergarten', 'grade school'],
  },
  {
    names: ['computer science', 'college of computer studies', 'bscs', 'cs department', 'cs'],
    topics: ['computer science', 'bscs'],
  },
  {
    names: ['accountancy', 'business administration', 'bsa', 'bsba', 'cba', 'college of business'],
    topics: ['accountancy', 'business administration', 'bsa', 'bsba'],
  },
  {
    names: ['criminology', 'criminal justice', 'bscrim', 'crim'],
    topics: ['criminology', 'criminal justice', 'bscrim'],
  },
  {
    names: ['hospitality management', 'college of hospitality', 'charm', 'bshm', 'hm department'],
    topics: ['hospitality management', 'restaurant management', 'bshm'],
  },
  {
    names: ['physical therapy', 'bspt', 'pt department'],
    topics: ['physical therapy', 'bspt'],
  },
  { names: ['nursing', 'bsn'], topics: ['nursing', 'bsn'] },
  { names: ['education department', 'college of education', 'beed', 'bsed'], topics: ['beed', 'bsed', 'education department'] },
  {
    names: ['maintenance', 'general services', 'physical plant'],
    topics: [
      'broken', 'repair', 'damaged', 'damage', 'electricity', 'power outage', 'no water', 'leaking', 'plumbing',
      'restroom', 'classroom equipment', 'facility', 'facilities', 'cleanliness', 'janitorial', 'electrician',
      'plumber', 'aircon', 'air conditioning', 'broken chair', 'broken table', 'light not working', 'garbage',
    ],
  },
  {
    names: ['clinic', 'health office'],
    topics: ['medical certificate', 'medical', 'clinic', 'sick', 'fever', 'injury', 'injured', 'medicine', 'nurse', 'first aid', 'headache'],
  },
  {
    names: ['accounting', 'cashier'],
    topics: ['tuition', 'school fees', 'balance', 'payment', 'cashier', 'refund', 'installment', 'official receipt', 'graduation fee'],
  },
  {
    names: ['registrar', 'records office'],
    topics: [
      'transcript of records', 'transcript', 'tor', 'form 137', 'form 138', 'certificate of enrollment', 'coe',
      'school records', 'academic records', 'grades', 'enrollment', 'subject load', 'class schedule', 'diploma',
      'incomplete grade', 'transfer credential',
    ],
  },
  {
    names: ['office of the student affairs', 'office of student affairs', 'student affairs', 'osa'],
    topics: ['lost and found', 'lost item', 'lost items', 'student affairs', 'student organization', 'school announcement', 'student id replacement', 'student event'],
  },
  {
    names: ['guidance', 'counseling'],
    topics: ['guidance', 'counseling', 'counselor', 'mental health', 'good moral', 'personal concern'],
  },
  {
    names: ['library'],
    topics: ['library', 'library card', 'borrow a book', 'borrow books', 'overdue book', 'book', 'books', 'research', 'thesis', 'opac'],
  },
];

const normalizedTokens = (text) => normalize(text).split(' ').filter((token) => token && !stopWords.has(token));

const scoreText = (query, target, weight) => {
  const queryTokens = new Set(normalizedTokens(query));
  const targetTokens = new Set(normalizedTokens(target));
  let score = 0;
  targetTokens.forEach((token) => {
    if (queryTokens.has(token)) score += weight;
    else if (token.length > 4 && queryTokens.has(`${token}s`)) score += weight;
    else if (token.length > 4 && queryTokens.has(token.slice(0, -1))) score += weight;
  });
  return score;
};

const includesPhrase = (text, phrase) => ` ${normalize(text)} `.includes(` ${normalize(phrase)} `);

const getIntentScore = (query, department) => {
  const intent = departmentIntents.find(({ names }) => names.some((name) => (
    includesPhrase(department.name, name) || includesPhrase(name, department.name)
  )));
  if (!intent) return 0;

  const explicitDepartmentMention = intent.names.some((name) => includesPhrase(query, name));
  if (explicitDepartmentMention) return 100;

  const matchingTopics = intent.topics.filter((topic) => includesPhrase(query, topic));
  return Math.min(16, matchingTopics.length * 7);
};

const scoreFaq = (query, faq) => {
  const question = faq.question || '';
  const keywords = faq.keywords || '';
  let score = scoreText(query, question, 3) + scoreText(query, keywords, 2);
  if (includesPhrase(query, question)) score += 8;
  return score;
};

const scoreService = (query, service) => (
  scoreText(query, service.name, 3) + scoreText(query, service.requirements || '', 1)
);

async function inferDepartment(subject, description, category = '', models = { Department, Faq, Service }) {
  const query = `${category || ''} ${subject || ''} ${description || ''}`;
  const [faqs, services, departments] = await Promise.all([
    models.Faq.findAll(),
    models.Service.findAll(),
    models.Department.findAll({ attributes: ['id', 'name'] }),
  ]);
  const scoresByDepartment = new Map();
  const addMatch = (departmentId, score) => {
    const id = Number(departmentId);
    if (score > (scoresByDepartment.get(id) || 0)) scoresByDepartment.set(id, score);
  };

  faqs.forEach((faq) => addMatch(faq.department_id, scoreFaq(query, faq)));
  services.forEach((service) => addMatch(service.department_id, scoreService(query, service)));
  departments.forEach((department) => {
    const intentScore = getIntentScore(query, department);
    if (intentScore) addMatch(department.id, intentScore);
  });

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
