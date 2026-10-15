const normalizeStudentQuery = require('./normalizeStudentQuery');

const schoolContextPatterns = [
  /\b(tomas claudio colleges?|\btcc\b|school|campus|college|university|academic|academics|education|educational|student|students|pupil|pupils|faculty|teacher|teachers|professor|professors|class|classes|classmate|classmates|schoolwork|homework|coursework|schoolwork|school rules|school policy|school policies|school office|school service|school services)\b/,
  /\b(department|registrar|enroll(?:ment|ments|ing|ed)?|enrol(?:ment|ments|ling|led)?|admission|admissions|tuition|school fee|school fees|grades?|grading|semester|term|subject load|class schedule|schedule|timetable|classroom|lecture|thesis|transcript|diploma|scholarship|school id|student id|student identification|id card|id replacement|library card|campus map|campus security|student affairs|guidance office|school clinic|school library|school account|student portal|school email|orientation|photocopies|photocopy|units|unit load|prerequisite|curriculum|cafeteria|canteen|dormitory|boarding house|shuttle|transportation|insurance|bullying|harassment|plagiarism|cheating|assignment|assignments|online learning platform|learning platform|academic adviser|academic advisor|counseling|counselling|adviser|advisor|library|clinic|maintenance|accounting|cashier|guidance|dean|principal|registrar|faculty|professor|teacher|ticket|support request|school document|reset my password|password reset)\b/,
  /\b(osa|bs\s?cs|bscs|bsa|bsba|bscrim|bshm|bspt|bsn|beed|bsed|jhs|shs|form 137|form 138|good moral|transcript of records|tor|coe|cor|certificate of enrollment|certificate of registration)\b/,
  /\b(student council|student organization|student organizations|club|clubs|school event|school events|campus event|campus events|events coming up|coming up this month|canteen|dormitory|school wifi|wifi|wi fi|online learning platform|payment method|payment methods|payment deadline|payment deadlines|pay on time|payment on time|cannot afford|can t afford|attendance policy|excuse letter|dress code|uniform policy|make up exam|makeup exam|grade correction|passing grade|gpa|gwa|room assignment|entrance exam|entrance exams|admission deadline|admission deadlines|graduation requirement|graduation requirements|school clearance|apply for clearance|document request|financial assistance|financial aid|office hours)\b/,
  /\b(?:shift|change)\s+(?:to\s+)?(?:another\s+)?(?:course|program)\b/,
];

const studentHelpPatterns = [
  /\b(study|studying|learn|learning|homework|assignment|exam|exams|quiz|quizzes|test|tests|revision|revise|study plan|study schedule|flashcards|research|presentation|essay|report|thesis|citation|citations|proofread|proofreading|grammar|paraphrase|summarize|summary|translate|translation|explain|explanation|define|definition|teach me|help me understand|solve|calculate|equation|algebra|geometry|calculus|math|mathematics|biology|chemistry|physics|science|history|literature|geography|economics|statistics|programming|coding|computer science|language learning)\b/,
  /\b(time management|manage my time|organize my day|organise my day|plan my day|stay focused|focus|concentration|motivation|motivated|procrastinat|study routine|sleep schedule|student budget|budgeting as a student|school stress|exam stress|study stress|feel overwhelmed with school|career advice|career path|internship|resume|cv|cover letter)\b/,
];

const conversationalPatterns = [
  /^(hi|hello|hey|good morning|good afternoon|thanks|thank you|thx|what can you do|how can you help|help me|help)$/,
  /^(what is assistdesk|what is this app|what is this for)$/,
  /^(what is today|what day is it|what day is today|what is the date|what is today s date|what time is it|what is the current time|current time|today s date)$/,
];

const identityQuestionPattern = /\b(who are you|what are y[o]{1,3}u|what is your name|what should i call you|tell me about yourself|what do you do|what is your role|are you (?:an? )?(?:ai|bot|human|assistant))\b/;
const studentIdQuestionPattern = /\b(?:where|how)\s+(?:do i|can i|to)?\s*(?:get|find|replace|renew|obtain|apply for|request|claim)?\s*(?:my|a|the)?\s*(?:student|school)?\s*id\b/;
const shortSchoolQuestionPattern = /^(?:tuition|fees?|grades?|enroll(?:ment)?|enrol(?:ment)?|schedule|id|documents?|requirements|admission|library|registrar|uniform)(?:\s+(?:po|ba|please|please help))?$/;
const taglishSchoolQuestionPattern = /\b(?:saan|nasaan|paano|magkano|kailan|ano|sino|pwede|puwede|pede)\b.*\b(?:enroll(?:ment)?|enrol(?:ment)?|tuition|fees?|grades?|schedule|registrar|library|student id|requirements|documents?|campus|office)\b/;
const studentDistressPattern = /\b(?:i feel|i am|i'm|im|feeling|sobrang|masyado)\b.{0,50}\b(?:distressed|overwhelmed|anxious|anxiety|stressed|stress|sad|depressed|panic|takot|nahihirapan|pagod)\b/i;

const isSchoolRelatedQuestion = (value) => {
  const normalized = normalizeStudentQuery(value);
  if (!normalized) return false;
  if (shortSchoolQuestionPattern.test(normalized)) return true;
  if (taglishSchoolQuestionPattern.test(normalized)) return true;
  if (studentDistressPattern.test(normalized)) return true;
  if (identityQuestionPattern.test(normalized)) return true;
  if (studentIdQuestionPattern.test(normalized)) return true;
  if (conversationalPatterns.some((pattern) => pattern.test(normalized))) return true;
  return schoolContextPatterns.some((pattern) => pattern.test(normalized))
    || studentHelpPatterns.some((pattern) => pattern.test(normalized));
};

const OUT_OF_SCOPE_RESPONSE = 'I can help students, parents, and applicants with TCC enrollment, fees, schedules, grades, documents, policies, and campus services. I can’t help with topics unrelated to school or student life.';

module.exports = { isSchoolRelatedQuestion, OUT_OF_SCOPE_RESPONSE };
