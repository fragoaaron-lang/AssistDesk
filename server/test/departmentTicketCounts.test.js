const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeDepartmentTicketCounts, mergeDepartmentStatusCounts } = require('../utils/departmentTicketCounts');

test('department ticket counts include every department, including zero-ticket departments', () => {
  const result = mergeDepartmentTicketCounts([
    { id: 1, name: 'Accounting' },
    { id: 2, name: 'CS' },
    { id: 3, name: 'Registrar' },
  ], [
    { department_id: 2, count: '9' },
  ]);

  assert.deepEqual(result, [
    { department_id: 1, department_name: 'Accounting', count: 0 },
    { department_id: 2, department_name: 'CS', count: 9 },
    { department_id: 3, department_name: 'Registrar', count: 0 },
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
    { department_id: 1, department_name: 'CS', count: 9 },
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
    { department_id: 1, department_name: 'Accounting', resolved: 0, unresolved: 0 },
    { department_id: 2, department_name: 'CS', resolved: 2, unresolved: 7 },
    { department_id: 3, department_name: 'Registrar', resolved: 0, unresolved: 0 },
  ]);
});