const test = require('node:test');
const assert = require('node:assert/strict');
const authMiddleware = require('../middleware/auth');

const isAllowed = authMiddleware.isTerminatedAccountRouteAllowed;

test('terminated users are restricted to profile notice, appeal submission, and logout', () => {
  assert.equal(isAllowed({ baseUrl: '/api/auth', path: '/me', method: 'GET' }), true);
  assert.equal(isAllowed({ baseUrl: '/api/auth', path: '/appeal', method: 'POST' }), true);
  assert.equal(isAllowed({ baseUrl: '/api/auth', path: '/logout', method: 'POST' }), true);

  assert.equal(isAllowed({ baseUrl: '/api/auth', path: '/tickets', method: 'GET' }), false);
  assert.equal(isAllowed({ baseUrl: '/api/auth', path: '/profile', method: 'POST' }), false);
  assert.equal(isAllowed({ baseUrl: '/api/auth', path: '/appeal', method: 'GET' }), false);
  assert.equal(isAllowed({ baseUrl: '/api/tickets', path: '/', method: 'GET' }), false);
});
