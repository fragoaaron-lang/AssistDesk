const schoolContextPatterns = [
  /\b(tomas claudio colleges?|\btcc\b|school|campus|college|university|academic|academics|education|educational|student|students|pupil|pupils|faculty|teacher|teachers|professor|professors|class|classes|classmate|classmates|schoolwork|homework|coursework|schoolwork|school rules|school policy|school policies|school office|school service|school services)\b/,
  /\b(department|registrar|enrollment|enrolment|admission|admissions|tuition|school fee|school fees|grades?|grading|semester|term|subject load|class schedule|classroom|lecture|thesis|transcript|diploma|scholarship|school id|student id|library card|campus map|campus security|student affairs|guidance office|school clinic|school library|school account|library|clinic|maintenance|accounting|cashier|guidance|dean|principal|registrar|faculty|professor|teacher|ticket|support request|school document|reset my password|password reset)\b/,
  /\b(osa|bs\s?cs|bscs|bsa|bsba|bscrim|bshm|bspt|bsn|beed|bsed|jhs|shs|form 137|form 138|good moral|transcript of records|tor|certificate of enrollment)\b/,
];

const studentHelpPatterns = [
  /\b(study|studying|learn|learning|homework|assignment|exam|exams|quiz|quizzes|test|tests|revision|revise|study plan|study schedule|flashcards|research|presentation|essay|report|thesis|citation|citations|proofread|proofreading|grammar|paraphrase|summarize|summary|translate|translation|explain|explanation|define|definition|teach me|help me understand|solve|calculate|equation|algebra|geometry|calculus|math|mathematics|biology|chemistry|physics|science|history|literature|geography|economics|statistics|programming|coding|computer science|language learning)\b/,
  /\b(time management|manage my time|organize my day|organise my day|plan my day|stay focused|focus|concentration|motivation|motivated|procrastinat|study routine|sleep schedule|student budget|budgeting as a student|school stress|exam stress|study stress|feel overwhelmed with school|career advice|career path|internship|resume|cv|cover letter)\b/,
];

const conversationalPatterns = [
  /^(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you|thx|who are you|what are you|what is your name|what can you do|how can you help|help me|help)$/,
  /^(what is assistdesk|what is this app|what is this for)$/,
  /^(what is today|what day is it|what day is today|what is the date|what is today s date|what time is it|what is the current time|current time|today s date)$/,
];

const normalizeForScope = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const isSchoolRelatedQuestion = (value) => {
  const normalized = normalizeForScope(value);
  if (!normalized) return false;
  if (conversationalPatterns.some((pattern) => pattern.test(normalized))) return true;
  return schoolContextPatterns.some((pattern) => pattern.test(normalized))
    || studentHelpPatterns.some((pattern) => pattern.test(normalized));
};

const OUT_OF_SCOPE_RESPONSE = 'I can help with TCC, studying, learning, and everyday student-life questions. I can’t help with topics unrelated to school or student life.';

module.exports = { isSchoolRelatedQuestion, OUT_OF_SCOPE_RESPONSE };
