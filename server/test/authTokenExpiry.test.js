const test = require('node:test');
const assert = require('node:assert/strict');
const { REMEMBER_ME_TOKEN_EXPIRY, getLoginTokenExpiry } = require('../utils/authTokenExpiry');

test('remember-me login gets a 30-day token while regular login keeps the configured expiry', () => {
  assert.equal(REMEMBER_ME_TOKEN_EXPIRY, '30d');
  assert.equal(getLoginTokenExpiry(true, '1h'), '30d');
  assert.equal(getLoginTokenExpiry(false, '1h'), '1h');
  assert.equal(getLoginTokenExpiry(undefined, '2h'), '2h');
  assert.equal(getLoginTokenExpiry('true', '1h'), '1h');
});