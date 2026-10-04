const test = require('node:test');
const assert = require('node:assert/strict');
const { inferDepartment } = require('../utils/departmentRouting');

const departments = [
  { id: 1, name: 'Registrar Office' },
  { id: 2, name: 'Accounting Department' },
  { id: 3, name: 'Maintenance Department' },
  { id: 4, name: 'Library' },
  { id: 5, name: 'Clinic' },
];

const faqs = [
  {
    department_id: 1,
    question: 'What is the enrollment process?',
    answer: 'Visit Guidance, then the Registrar. Pay tuition at Accounting and borrow books from the Library.',
    keywords: 'registrar enrollment freshman transferee registration process',
  },
  {
    department_id: 1,
    question: 'How can I request my Transcript of Records?',
    answer: 'Accounting checks fees and the Library clearance before release.',
    keywords: 'registrar transcript records tor request form',
  },
  {
    department_id: 2,
    question: 'How can I check my tuition balance?',
    answer: 'Ask at the cashier window.',
    keywords: 'accounting tuition balance payment fees cashier',
  },
  {
    department_id: 3,
    question: 'What should I do if there is no electricity in my classroom?',
    answer: 'Report the problem to Maintenance.',
    keywords: 'maintenance electricity power classroom electrician',
  },
  {
    department_id: 4,
    question: 'How long can I keep a borrowed library book?',
    answer: 'Return it to the library desk.',
    keywords: 'library borrow book overdue return',
  },
  {
    department_id: 5,
    question: 'Where can I get a medical certificate?',
    answer: 'Visit the school clinic.',
    keywords: 'clinic medical health certificate nurse',
  },
];

const models = {
  Department: { findAll: async () => departments },
  Faq: { findAll: async () => faqs },
  Service: { findAll: async () => [] },
};

const route = (description, subject = '') => inferDepartment(subject, description, 'Other', models);

test('routes enrollment to Registrar without following departments named in its answer', async () => {
  const result = await route('I need help with the enrollment process');
  assert.equal(result.department_id, 1);
  assert.equal(result.accepted, true);
});

test('routes transcript requests to Registrar instead of departments mentioned in its answer', async () => {
  const result = await route('I need a copy of my transcript of records');
  assert.equal(result.department_id, 1);
  assert.equal(result.accepted, true);
});

test('routes tuition balance issues to Accounting', async () => {
  const result = await route('My tuition balance is incorrect');
  assert.equal(result.department_id, 2);
});

test('routes facility and health inquiries to their respective departments', async (t) => {
  await t.test('classroom power issue', async () => {
    const result = await route('There is no electricity in my classroom');
    assert.equal(result.department_id, 3);
  });
  await t.test('medical certificate', async () => {
    const result = await route('Where can I get a medical certificate?');
    assert.equal(result.department_id, 5);
  });
});

test('uses an explicit department mention when the inquiry is otherwise generic', async () => {
  const result = await route('I need help', 'Accounting Department');
  assert.equal(result.department_id, 2);
});

test('does not accept an inquiry with no routing evidence', async () => {
  const result = await route('I have a question about something');
  assert.equal(result.accepted, false);
  assert.equal(result.department_id, null);
});
