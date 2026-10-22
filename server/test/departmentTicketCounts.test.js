const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeDepartmentTicketCounts, mergeDepartmentStatusCounts } = require('../utils/departmentTicketCounts');

test('department ticket counts include every department, including zero-ticket departments', () => {
  const result = mergeDepartmentTicketCounts([
    { id: 1, name: 'Facilities' },
    { id: 2, name: 'Computer Science' },
    { id: 3, name: 'Registrar' },
  ], [
    { department_id: 2, count: '9' },
  ]);

  assert.deepEqual(result, [
    { department_id: 1, department_name: 'Facilities', count: 0 },
    { department_id: 2, department_name: 'Computer Science', count: 9 },
    { department_id: 3, department_name: 'Registrar', count: 0 },
  ]);
});

test('ticket counts consolidate department aliases and sum their totals', () => {
  const result = mergeDepartmentTicketCounts([
    { id: 1, name: 'Accounting' },
    { id: 2, name: 'Accounting Department' },
    { id: 3, name: 'CHARM' },
    { id: 4, name: 'HM Department' },
  ], [
    { department_id: 1, count: '2' },
    { department_id: 2, count: '3' },
    { department_id: 4, count: '1' },
  ]);

  assert.deepEqual(result, [
    { department_id: 1, department_name: 'Accounting Department', count: 5 },
    { department_id: 3, department_name: 'College of Hospitality Management', count: 1 },
  ]);
});

test('unassigned ticket counts remain visible without duplicating known departments', () => {
  const result = mergeDepartmentTicketCounts(
    [{ id: 1, name: 'CS' }],
    [
      { department_id: 1, count: 9 },
      { department_id: null, count: 2 },
    ],
  );

  assert.deepEqual(result, [
    { department_id: 1, department_name: 'College of Computer Studies', count: 9 },
    { department_id: null, department_name: 'Unassigned', count: 2 },
  ]);
});

test('resolved/unresolved breakdown includes every department with zero defaults', () => {
  const result = mergeDepartmentStatusCounts([
    { id: 1, name: 'Accounting' },
    { id: 2, name: 'CS' },
    { id: 3, name: 'Registrar' },
  ], [
    { department_id: 2, department_name: 'CS', status: 'resolved', count: '2' },
    { department_id: 2, department_name: 'CS', status: 'open', count: '7' },
  ]);

  assert.deepEqual(result, [
    { department_id: 1, department_name: 'Accounting Department', resolved: 0, unresolved: 0 },
    { department_id: 2, department_name: 'College of Computer Studies', resolved: 2, unresolved: 7 },
    { department_id: 3, department_name: 'Registrar', resolved: 0, unresolved: 0 },
  ]);
});

test('resolved and unresolved counts consolidate department aliases', () => {
  const result = mergeDepartmentStatusCounts([
    { id: 1, name: 'Crim Department' },
    { id: 2, name: 'College of Criminology' },
  ], [
    { department_id: 1, department_name: 'Crim Department', status: 'resolved', count: '1' },
    { department_id: 2, department_name: 'College of Criminology', status: 'open', count: '3' },
  ]);

  assert.deepEqual(result, [
    { department_id: 1, department_name: 'College of Criminology', resolved: 1, unresolved: 3 },
  ]);
});