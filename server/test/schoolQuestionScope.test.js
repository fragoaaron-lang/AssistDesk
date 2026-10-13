const test = require('node:test');
const assert = require('node:assert/strict');
const { isSchoolRelatedQuestion, OUT_OF_SCOPE_RESPONSE } = require('../utils/schoolQuestionScope');

test('allows questions about TCC, its campus, and school support', () => {
  const schoolQuestions = [
    'What is the enrollment process at TCC?',
    'Where is the library?',
    'How do I reset my school password?',
    'Can I check my ticket status?',
    'What courses does the college offer?',
    'How can I get my transcript of records?',
    'What is photosynthesis for my Biology class?',
  ];

  schoolQuestions.forEach((question) => assert.equal(isSchoolRelatedQuestion(question), true, question));
});

test('keeps brief conversational messages available', () => {
  ['Hello', 'Thank you', 'What can you do?'].forEach((message) => {
    assert.equal(isSchoolRelatedQuestion(message), true, message);
  });
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
  assert.match(OUT_OF_SCOPE_RESPONSE, /only answer questions related to Tomas Claudio Colleges/i);
});
