const test = require('node:test');
const assert = require('node:assert/strict');
const { REGISTRATION_PASSWORD_ERROR, validateRegistrationPassword } = require('../utils/passwordPolicy');

test('password policy accepts the registration minimum for signup, change, and reset', () => {
  assert.equal(validateRegistrationPassword('Valid1!x'), null);
  assert.equal(validateRegistrationPassword('ValidPassword123!'), null);
});

test('password policy rejects missing character classes or fewer than eight characters', () => {
  for (const password of ['short1!', 'lowercase1!', 'UPPERCASE1!', 'NoNumber!!', 'NoSpecial123']) {
    assert.equal(validateRegistrationPassword(password), REGISTRATION_PASSWORD_ERROR, password);
  }
});

test('password policy enforces bcrypt UTF-8 byte limit', () => {
  const tooManyBytes = `Aa1!${'é'.repeat(35)}`;
  assert.ok(Buffer.byteLength(tooManyBytes, 'utf8') > 72);
  assert.equal(validateRegistrationPassword(tooManyBytes), REGISTRATION_PASSWORD_ERROR);
});

test('password policy rejects missing and non-string values', () => {
  assert.equal(validateRegistrationPassword(''), REGISTRATION_PASSWORD_ERROR);
  assert.equal(validateRegistrationPassword(null), REGISTRATION_PASSWORD_ERROR);
  assert.equal(validateRegistrationPassword(12345678), REGISTRATION_PASSWORD_ERROR);
});
