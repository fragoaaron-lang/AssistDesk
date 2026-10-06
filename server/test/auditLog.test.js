const test = require('node:test');
const assert = require('node:assert/strict');
const { recordAudit } = require('../utils/auditLog');

test('recordAudit snapshots actor, action, entity, department and before/after values', async () => {
  let captured;
  const transaction = { id: 'tx-1' };
  const fakeAuditModel = {
    create: async (values, options) => {
      captured = { values, options };
      return values;
    },
  };

  await recordAudit({
    actor: { id: 12, name: 'Department Admin', email: 'admin@example.test', role: 'admin', department_id: 7 },
    action: 'ticket.status_changed',
    entityType: 'ticket',
    entityId: 99,
    before: { status: 'open' },
    after: { status: 'pending' },
    metadata: { reason: 'accepted' },
    transaction,
  }, fakeAuditModel);

  assert.equal(captured.values.actor_user_id, 12);
  assert.equal(captured.values.actor_name, 'Department Admin');
  assert.equal(captured.values.actor_role, 'admin');
  assert.equal(captured.values.action, 'ticket.status_changed');
  assert.equal(captured.values.entity_type, 'ticket');
  assert.equal(captured.values.entity_id, '99');
  assert.equal(captured.values.department_id, 7);
  assert.deepEqual(captured.values.before_values, { status: 'open' });
  assert.deepEqual(captured.values.after_values, { status: 'pending' });
  assert.deepEqual(captured.values.metadata, { reason: 'accepted' });
  assert.equal(captured.options.transaction, transaction);
});

test('recordAudit truncates bounded actor/entity fields and accepts system actors', async () => {
  let captured;
  const fakeAuditModel = { create: async (values) => { captured = values; return values; } };

  await recordAudit({
    actor: { name: 'N'.repeat(200), role: 'R'.repeat(40) },
    action: 'a'.repeat(100),
    entityType: 'e'.repeat(100),
    entityId: 'i'.repeat(100),
  }, fakeAuditModel);

  assert.equal(captured.actor_user_id, null);
  assert.equal(captured.actor_name.length, 120);
  assert.equal(captured.actor_role.length, 24);
  assert.equal(captured.action.length, 80);
  assert.equal(captured.entity_type.length, 60);
  assert.equal(captured.entity_id.length, 80);
});
