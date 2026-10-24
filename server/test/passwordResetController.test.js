const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const models = require('../models');
const { resetPassword } = require('../controllers/authController');

const originals = {
  userTransaction: models.User.sequelize.transaction,
  findUser: models.User.findOne,
  incrementUser: models.User.increment,
  findResetToken: models.PasswordResetToken.findOne,
  destroyResetTokens: models.PasswordResetToken.destroy,
  createAuditLog: models.AuditLog.create,
  hashPassword: bcrypt.hash,
};

test('password reset returns success after committing and revoking sessions', async () => {
  const calls = { committed: false, rolledBack: false, updatedUser: null, destroyedTokens: null, audit: [] };
  const transaction = {
    LOCK: { UPDATE: 'UPDATE' },
    finished: false,
    async commit() { this.finished = 'commit'; calls.committed = true; },
    async rollback() { this.finished = 'rollback'; calls.rolledBack = true; },
  };
  const user = {
    id: 73,
    email: 'requester@example.edu',
    department_id: 3,
    async update(values, options) { calls.updatedUser = { values, options }; },
  };
  models.User.sequelize.transaction = async () => transaction;
  models.User.findOne = async () => user;
  models.User.increment = async () => {};
  models.PasswordResetToken.findOne = async () => ({
    email: user.email,
    expires_at: new Date(Date.now() + 60_000),
  });
  models.PasswordResetToken.destroy = async (options) => { calls.destroyedTokens = options; };
  models.AuditLog.create = async (values) => { calls.audit.push(values); return values; };
  bcrypt.hash = async () => 'new-password-hash';

  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  try {
    await resetPassword({
      body: { token: 'a'.repeat(64), newPassword: 'Valid1!x' },
      requestId: 'reset-test-request',
    }, response);
  } finally {
    models.User.sequelize.transaction = originals.userTransaction;
    models.User.findOne = originals.findUser;
    models.User.increment = originals.incrementUser;
    models.PasswordResetToken.findOne = originals.findResetToken;
    models.PasswordResetToken.destroy = originals.destroyResetTokens;
    models.AuditLog.create = originals.createAuditLog;
    bcrypt.hash = originals.hashPassword;
  }

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { message: 'Password reset successful.' });
  assert.equal(calls.committed, true);
  assert.equal(calls.rolledBack, false);
  assert.equal(calls.updatedUser.values.password_hash, 'new-password-hash');
  assert.equal(calls.destroyedTokens.where.email, user.email);
  assert.deepEqual(calls.audit.map(({ action }) => action), ['account.password_reset', 'auth.sessions_revoked']);
});
