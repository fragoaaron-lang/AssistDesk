const test = require('node:test');
const assert = require('node:assert/strict');
const { findExactFaq, buildExactFaqResponse } = require('../utils/exactFaqResponse');

const faq = {
  id: 12,
  department_id: 4,
  question: 'Who is the dean, secretary, or point person of the Nursing Department?',
  answer: 'Dean Perlita Santiago is the dean.',
  Department: {
    id: 4,
    name: 'College of Nursing',
    point_person: 'Dean Perlita Santiago',
    location: 'Nursing Building',
    office_hours: null,
  },
};

test('exact FAQ lookup wins directly even when duplicate records exist', () => {
  const selected = findExactFaq(faq.question, [faq, { ...faq, id: 13, answer: 'Duplicate answer' }]);
  const result = buildExactFaqResponse(selected);

  assert.equal(result.ai_response, faq.answer);
  assert.equal(result.matched_faq_id, faq.id);
  assert.equal(result.source.type, 'FAQ');
  assert.equal(result.clarification_required, false);
});

test('exact FAQ matching supports normalized BSCRIM aliases', () => {
  const crimFaq = {
    ...faq,
    question: 'Where can I get uniforms in the BSCRIM Department?',
  };

  assert.equal(findExactFaq('Where can I get uniforms in the Criminology Department?', [crimFaq]), crimFaq);
});

test('exact FAQ matching treats BSPT and PT as the same department alias', () => {
  const ptFaq = {
    ...faq,
    question: 'Where is the PT Department building?',
    answer: 'The PT Department Building is between the CBA Building and the SHS Building.',
  };

  assert.equal(findExactFaq('Where is the BSPT Department building?', [ptFaq]), ptFaq);
});