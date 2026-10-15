const test = require('node:test');
const assert = require('node:assert/strict');
const { isSchoolRelatedQuestion, OUT_OF_SCOPE_RESPONSE } = require('../utils/schoolQuestionScope');
const normalizeFaqQuery = require('../utils/normalizeFaqQuery');
const isTorRequest = require('../utils/isTorRequest');
const isClassScheduleRequest = require('../utils/isClassScheduleRequest');
const isRegistrarDocumentRequest = require('../utils/isRegistrarDocumentRequest');
const isStudentIdRequest = require('../utils/isStudentIdRequest');
const { isDepartmentLocationRequest, findDepartmentByName, getDepartmentLocationAnswer } = require('../utils/departmentLocation');
const { getClassScheduleFollowupQuery, getDepartmentScheduleAnswer, SCHEDULE_PROMPT } = require('../utils/classScheduleFollowup');

test('allows questions about TCC, its campus, and school support', () => {
  const schoolQuestions = [
    'What is the enrollment process at TCC?',
    'How do I enroll?',
    'Where is the library?',
    'How do I reset my school password?',
    'Can I check my ticket status?',
    'What courses does the college offer?',
    'How can I get my transcript of records?',
    'What is photosynthesis for my Biology class?',
  ];

  schoolQuestions.forEach((question) => assert.equal(isSchoolRelatedQuestion(question), true, question));
});

test('normalizes TOR phrasing so it matches transcript FAQs', () => {
  assert.equal(
    normalizeFaqQuery('Where can I get my transcript of records?'),
    normalizeFaqQuery('Where can I get my TOR?')
  );
});

test('recognizes common TOR request wording without treating unrelated TOR mentions as requests', () => {
  ['Where can I get my TOR?', 'How do I request my Transcript of Records?', 'Where do I claim my transcript?']
    .forEach((question) => assert.equal(isTorRequest(question), true, question));
  assert.equal(isTorRequest('What does TOR mean in a game?'), false);
});

test('recognizes student class-schedule requests but leaves exam schedules separate', () => {
  [
    'How to get my schedule?',
    'Where can I find my class timetable?',
    'How do I check my class schedule?',
    'Where to get my schedule?',
    'Where is my schedule?',
  ]
    .forEach((question) => assert.equal(isClassScheduleRequest(question), true, question));
  assert.equal(isClassScheduleRequest('When is the exam schedule?'), false);
});

test('resolves a department reply after the class-schedule clarification', () => {
  assert.equal(
    getClassScheduleFollowupQuery('computer science', SCHEDULE_PROMPT),
    'Where can I get the CS class schedule?'
  );
  assert.equal(getClassScheduleFollowupQuery('computer science', 'How can I help?'), null);
  assert.equal(getClassScheduleFollowupQuery('something unrelated', SCHEDULE_PROMPT), null);
});

test('provides known program-specific class schedule guidance', () => {
  assert.match(getDepartmentScheduleAnswer('cs'), /BSCS page/i);
  assert.match(getDepartmentScheduleAnswer('basic'), /advisers/i);
  assert.match(getDepartmentScheduleAnswer('nursing'), /Dean’s Office/i);
  assert.equal(getDepartmentScheduleAnswer('registrar'), null);
});

test('recognizes COR and COE requests and normalizes full document names', () => {
  assert.equal(isRegistrarDocumentRequest('Where to get COR?'), 'cor');
  assert.equal(isRegistrarDocumentRequest('Where to get COE?'), 'coe');
  assert.equal(isRegistrarDocumentRequest('How do I request my Certificate of Enrollment?'), 'coe');
  assert.equal(isRegistrarDocumentRequest('How do I request a Certificate of Registration?'), 'cor');
  assert.equal(normalizeFaqQuery('Certificate of Enrollment'), normalizeFaqQuery('COE'));
  assert.equal(normalizeFaqQuery('Certificate of Registration'), normalizeFaqQuery('COR'));
});

test('recognizes student ID questions without treating unrelated IDs as school questions', () => {
  ['Where to get my ID?', 'How do I replace my student ID?', 'My school ID was lost'].forEach((question) => {
    assert.equal(isStudentIdRequest(question), true, question);
    assert.equal(isSchoolRelatedQuestion(question), true, question);
  });
  assert.equal(isStudentIdRequest('Where do I get an ID for a software license?'), false);
});

test('understands minor typos and common shorthand in student questions', () => {
  ['ere to get my id?', 'whr to get my ID?', 'wher can u get ur student id pls?'].forEach((question) => {
    assert.equal(isStudentIdRequest(question), true, question);
    assert.equal(isSchoolRelatedQuestion(question), true, question);
  });
  assert.equal(
    normalizeFaqQuery('ere to get my id?'),
    normalizeFaqQuery('where to get my id?')
  );
});

test('recognizes department location questions and answers from directory data', () => {
  ['Where is the Registrar?', 'Where can I find the Library?', 'What is the location of Accounting?']
    .forEach((question) => assert.equal(isDepartmentLocationRequest(question), true, question));
  assert.equal(isDepartmentLocationRequest('How do I request documents from the Registrar?'), false);
  assert.equal(
    getDepartmentLocationAnswer({ name: 'Registrar Office', location: 'Administration Building (J.B. Angeles Building)' }),
    'Registrar Office is located at Administration Building (J.B. Angeles Building).'
  );
  assert.equal(
    findDepartmentByName('Where is the Law department?', [
      { id: 44, name: 'College of Law', location: 'Law Building' },
    ])?.id,
    44
  );
  assert.equal(
    findDepartmentByName('where is libriary', [
      { id: 4, name: 'Library', location: 'Administration Building' },
    ])?.id,
    4
  );
  assert.match(getDepartmentLocationAnswer({ name: 'Library', location: null }), /confirmed location/i);
});

test('allows everyday academic and student-life questions', () => {
  const studentQuestions = [
    'Can you explain photosynthesis?',
    'Help me solve this algebra equation.',
    'Can you proofread my essay?',
    'Translate this paragraph into Filipino.',
    'How can I make a study plan for exams?',
    'How can I stop procrastinating and focus?',
    'How do I organize my day as a student?',
    'Can you help me prepare a resume for an internship?',
  ];

  studentQuestions.forEach((question) => assert.equal(isSchoolRelatedQuestion(question), true, question));
});

test('keeps brief conversational messages available', () => {
  [
    'Hello',
    'Thank you',
    'What can you do?',
    'What are you?',
    'What are yoou?',
    'That is who are you',
    'Are you an AI?',
    'Tell me about yourself',
  ].forEach((message) => {
    assert.equal(isSchoolRelatedQuestion(message), true, message);
  });
});

test('allows simple everyday date and time questions', () => {
  ['What is today?', 'What day is it?', 'What is the date?', 'What time is it?'].forEach((question) => {
    assert.equal(isSchoolRelatedQuestion(question), true, question);
  });
});

test('allows school topics from the expanded suggested-question catalog', () => {
  const suggestedQuestions = [
    'What are the enrollment deadlines?',
    'What payment methods are accepted?',
    'Who do I contact about financial assistance?',
    'What is the passing grade, and how is GPA computed?',
    'When are the exam schedules?',
    'What should I do if a class is cancelled?',
    'How do I file an excuse letter for an absence?',
    'How do I connect to the school Wi-Fi?',
    'Is there a canteen or dormitory information?',
    'What events are coming up this month?',
    'How do I apply for clearance?',
    'When is the orientation, and is it required?',
    'How do I activate my student portal and school email account?',
    'How many units can I take in a semester?',
    'What is a prerequisite, and how do I know which subjects I can take?',
    'What are the school rules on cheating and plagiarism?',
    'Who do I report to if I experience bullying or harassment?',
    'Where do I submit assignments online?',
    'Can I shift to another course if I change my mind?',
    'How do I make friends or meet my classmates?',
    'What if I cannot afford to pay on time?',
  ];

  suggestedQuestions.forEach((question) => assert.equal(isSchoolRelatedQuestion(question), true, question));
});

test('blocks questions unrelated to school', () => {
  const unrelatedQuestions = [
    'What is the weather tomorrow?',
    'Tell me a joke.',
    'How do I bake a chocolate cake?',
    'Who won the football match?',
    'What are the latest stock prices?',
  ];

  unrelatedQuestions.forEach((question) => assert.equal(isSchoolRelatedQuestion(question), false, question));
  assert.match(OUT_OF_SCOPE_RESPONSE, /unrelated to school or student life/i);
});
