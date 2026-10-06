const { AuditLog } = require('../models');

const snapshotActor = (actor) => ({
  actor_user_id: actor?.id == null ? null : Number(actor.id),
  actor_name: String(actor?.name || actor?.email || '').slice(0, 120) || null,
  actor_role: String(actor?.role || '').slice(0, 24) || null,
});

async function recordAudit({ actor = null, action, entityType, entityId = null, departmentId = null, before = null, after = null, metadata = null, transaction = undefined }, AuditModel = AuditLog) {
  if (!action || !entityType) throw new Error('Audit action and entity type are required.');
  return AuditModel.create({
    ...snapshotActor(actor),
    action: String(action).slice(0, 80),
    entity_type: String(entityType).slice(0, 60),
    entity_id: entityId == null ? null : String(entityId).slice(0, 80),
    department_id: departmentId == null ? actor?.department_id || null : Number(departmentId),
    before_values: before,
    after_values: after,
    metadata,
  }, transaction ? { transaction } : undefined);
}

module.exports = { recordAudit };
