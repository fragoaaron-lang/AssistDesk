const test = require('node:test');
const assert = require('node:assert/strict');
const authMiddleware = require('../middleware/auth');

const isAllowed = authMiddleware.isTerminatedAccountRouteAllowed;
const isStaffApprovalAllowed = authMiddleware.isStaffApprovalAccountRouteAllowed;

test('terminated users are restricted to profile notice, appeal submission, and logout', () => {
  assert.equal(isAllowed({ baseUrl: '/api/auth', path: '/me', method: 'GET' }), true);
  assert.equal(isAllowed({ baseUrl: '/api/auth', path: '/appeal', method: 'POST' }), true);
  assert.equal(isAllowed({ baseUrl: '/api/auth', path: '/logout', method: 'POST' }), true);

  assert.equal(isAllowed({ baseUrl: '/api/auth', path: '/tickets', method: 'GET' }), false);
  assert.equal(isAllowed({ baseUrl: '/api/auth', path: '/profile', method: 'POST' }), false);
  assert.equal(isAllowed({ baseUrl: '/api/auth', path: '/appeal', method: 'GET' }), false);
  assert.equal(isAllowed({ baseUrl: '/api/tickets', path: '/', method: 'GET' }), false);
});

test('unapproved faculty and staff can only access status, logout, and required ID submission', () => {
  assert.equal(isStaffApprovalAllowed({ baseUrl: '/api/auth', path: '/me', method: 'GET' }, 'pending_id'), true);
  assert.equal(isStaffApprovalAllowed({ baseUrl: '/api/auth', path: '/staff-id', method: 'POST' }, 'pending_id'), true);
  assert.equal(isStaffApprovalAllowed({ baseUrl: '/api/auth', path: '/staff-id', method: 'POST' }, 'id_rejected'), true);
  assert.equal(isStaffApprovalAllowed({ baseUrl: '/api/auth', path: '/logout', method: 'POST' }, 'pending_approval'), true);
  assert.equal(isStaffApprovalAllowed({ baseUrl: '/api/auth', path: '/staff-id', method: 'POST' }, 'pending_approval'), false);
  assert.equal(isStaffApprovalAllowed({ baseUrl: '/api/tickets', path: '/', method: 'GET' }, 'pending_approval'), false);
  assert.equal(isStaffApprovalAllowed({ baseUrl: '/api/auth', path: '/profile', method: 'POST' }, 'id_rejected'), false);
});
