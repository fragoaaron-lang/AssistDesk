const test = require('node:test');
const assert = require('node:assert/strict');
const { isSchoolRelatedQuestion, OUT_OF_SCOPE_RESPONSE } = require('../utils/schoolQuestionScope');
const normalizeFaqQuery = require('../utils/normalizeFaqQuery');
const isTorRequest = require('../utils/isTorRequest');
const isClassScheduleRequest = require('../utils/isClassScheduleRequest');

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
  ['How to get my schedule?', 'Where can I find my class timetable?', 'How do I check my class schedule?']
    .forEach((question) => assert.equal(isClassScheduleRequest(question), true, question));
  assert.equal(isClassScheduleRequest('When is the exam schedule?'), false);
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
