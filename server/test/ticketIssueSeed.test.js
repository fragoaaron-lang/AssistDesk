const test = require('node:test');
const assert = require('node:assert/strict');
const ticketOptions = require('../../client/src/ticketIssueOptions.json');
const { getOptionsForDepartment } = require('../seed-ticket-issues');

const departmentCases = [
  ['IT department', 'it'],
  ['Maintenance Department', 'maintenance'],
  ['Clinic', 'clinic'],
  ['Library', 'library'],
  ['Accounting Department', 'accounting'],
  ['Registrar Department', 'registrar'],
  ['Registrar Office', 'registrar'],
  ['Office of Student Affairs', 'osa'],
  ['Guidance Office', 'guidance'],
  ['Basic Education Department', 'basic'],
  ['CS', 'cs'],
  ['College of Computer Studies', 'cs'],
  ['CBA', 'cba'],
  ['College of Business and Accountancy', 'cba'],
  ['College of Criminology', 'crim'],
  ['CHARM', 'hm'],
  ['College of Hospitality Management', 'hm'],
  ['College of Physical Therapy', 'pt'],
  ['College of Nursing', 'nursing'],
  ['Education Department', 'education'],
  ['College of Education', 'education'],
];

test('issue seeder matches the ticket form options for each supported department', () => {
  departmentCases.forEach(([departmentName, optionKey]) => {
    assert.deepEqual(
      getOptionsForDepartment(departmentName),
      ticketOptions.departmentGeneralIssueOptions[optionKey],
      departmentName
    );
  });
});

test('unmapped departments get the same generic issue choices as the ticket form', () => {
  assert.deepEqual(getOptionsForDepartment('College of Law'), ticketOptions.defaultGeneralIssueOptions);
});
