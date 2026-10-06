module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      actor_user_id: { type: DataTypes.INTEGER, allowNull: true },
      actor_name: { type: DataTypes.STRING(120), allowNull: true },
      actor_role: { type: DataTypes.STRING(24), allowNull: true },
      action: { type: DataTypes.STRING(80), allowNull: false },
      entity_type: { type: DataTypes.STRING(60), allowNull: false },
      entity_id: { type: DataTypes.STRING(80), allowNull: true },
      department_id: { type: DataTypes.INTEGER, allowNull: true },
      before_values: { type: DataTypes.JSON, allowNull: true },
      after_values: { type: DataTypes.JSON, allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'audit_logs', timestamps: false, underscored: true }
  );

  AuditLog.beforeUpdate(() => {
    throw new Error('Audit records are immutable.');
  });
  AuditLog.beforeDestroy(() => {
    throw new Error('Audit records cannot be deleted through the application.');
  });
  AuditLog.beforeBulkUpdate(() => {
    throw new Error('Audit records are immutable.');
  });
  AuditLog.beforeBulkDestroy(() => {
    throw new Error('Audit records cannot be deleted through the application.');
  });

  return AuditLog;
};
