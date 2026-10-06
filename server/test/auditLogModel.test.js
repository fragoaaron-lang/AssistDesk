const test = require('node:test');
const assert = require('node:assert/strict');
const createAuditLogModel = require('../models/AuditLog');

test('AuditLog rejects row and bulk mutation hooks', async () => {
  const hooks = {};
  const sequelize = {
    define: () => ({
      beforeUpdate: (hook) => { hooks.beforeUpdate = hook; },
      beforeDestroy: (hook) => { hooks.beforeDestroy = hook; },
      beforeBulkUpdate: (hook) => { hooks.beforeBulkUpdate = hook; },
      beforeBulkDestroy: (hook) => { hooks.beforeBulkDestroy = hook; },
    }),
  };
  const DataTypes = { INTEGER: 'INTEGER', STRING: () => 'STRING', JSON: 'JSON', DATE: 'DATE' };
  createAuditLogModel(sequelize, DataTypes);

  for (const hookName of ['beforeUpdate', 'beforeDestroy', 'beforeBulkUpdate', 'beforeBulkDestroy']) {
    assert.equal(typeof hooks[hookName], 'function');
    assert.throws(() => hooks[hookName](), /Audit records/);
  }
});
