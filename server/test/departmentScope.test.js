const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getDepartmentScope,
  canUseDepartmentFilter,
  applyDepartmentScope,
  getTicketAccessWhere,
} = require('../utils/departmentScope');

test('department admins are scoped to their own department', () => {
  const itAdmin = { role: 'admin', department_id: 13 };

  assert.equal(getDepartmentScope(itAdmin), 13);
  assert.deepEqual(applyDepartmentScope(itAdmin, { status: 'open' }), {
    status: 'open',
    department_id: 13,
  });
  assert.equal(canUseDepartmentFilter(itAdmin, '13'), true);
  assert.equal(canUseDepartmentFilter(itAdmin, '3'), false);
  assert.deepEqual(getTicketAccessWhere(itAdmin), { department_id: 13 });
  assert.deepEqual(getTicketAccessWhere({ role: 'staff', department_id: 13 }), { department_id: 13 });
  assert.notDeepEqual(getTicketAccessWhere(itAdmin), { department_id: 3 });
});

test('global admins and non-admin users do not get an admin department scope', () => {
  assert.equal(getDepartmentScope({ role: 'admin', department_id: null }), null);
  assert.equal(getDepartmentScope({ role: 'staff', department_id: 13 }), null);
  assert.equal(canUseDepartmentFilter({ role: 'admin', department_id: null }, '3'), true);
  assert.deepEqual(getTicketAccessWhere({ role: 'admin', department_id: null }), {});
  assert.deepEqual(getTicketAccessWhere({ role: 'student', id: 42 }), { user_id: 42 });
});