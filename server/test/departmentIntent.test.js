const test = require('node:test');
const assert = require('node:assert/strict');
const normalizeFaqQuery = require('../utils/normalizeFaqQuery');
const { getDepartmentIntent, shouldUseGenericDepartmentHelp } = require('../utils/departmentIntent');

test('BSCRIM wording is recognized as a CRIM department intent', () => {
  assert.equal(getDepartmentIntent('Where can I get modules in the BSCRIM Department?'), 'crim');
  assert.equal(getDepartmentIntent('Who is the dean of the BSCRIM department?'), 'crim');
  assert.equal(
    normalizeFaqQuery('Where can I get modules in the BSCRIM Department?'),
    normalizeFaqQuery('Where can I get modules in the CRIM Department?')
  );
});

test('generic department help does not override a specific department question', () => {
  assert.equal(shouldUseGenericDepartmentHelp('Where can I get modules in the BSCRIM Department?'), false);
  assert.equal(shouldUseGenericDepartmentHelp('Where can I find the department or office?'), true);
});