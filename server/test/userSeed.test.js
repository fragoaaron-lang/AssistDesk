const test = require('node:test');
const assert = require('node:assert/strict');
const { seedUser } = require('../seed-user');

const env = {
  SEED_USER_NAME: 'Example Staff',
  SEED_USER_EMAIL: 'example.staff@example.edu',
  SEED_USER_PASSWORD_HASH: '$2b$12$' + 'a'.repeat(53),
  SEED_USER_DEPARTMENT_NAME: 'Registrar Department',
};

function models({ existingUser = null, department = { id: 24 } } = {}) {
  const captured = { create: null };
  const User = {
    findOne: async () => existingUser,
    create: async (values, options) => {
      captured.create = { values, options };
      return values;
    },
  };
  const Department = { findOne: async () => department };
  return { User, Department, captured };
}

test('user seeder maps department by name, preserves supplied hash and discards verification token', async () => {
  const { User, Department, captured } = models();
  const seeded = await seedUser({ User, Department, env });
  assert.equal(seeded.department_id, 24);
  assert.equal(seeded.password_hash, env.SEED_USER_PASSWORD_HASH);
  assert.equal(seeded.account_status, 'pending_verification');
  assert.equal(seeded.verification_token, null);
  assert.deepEqual(seeded.marker_positions, {});
  assert.equal(captured.create.options.transaction, undefined);
});

test('user seeder refuses to overwrite an existing account', async () => {
  const { User, Department } = models({ existingUser: { id: 1 } });
  await assert.rejects(
    () => seedUser({ User, Department, env }),
    /already exists; refusing to overwrite/,
  );
});

test('user seeder requires a valid bcrypt hash and existing department', async () => {
  const { User, Department } = models({ department: null });
  await assert.rejects(
    () => seedUser({ User, Department, env: { ...env, SEED_USER_PASSWORD_HASH: 'not-a-hash' } }),
    /valid bcrypt hash/,
  );
  await assert.rejects(
    () => seedUser({ User, Department, env }),
    /Department not found/,
  );
});
