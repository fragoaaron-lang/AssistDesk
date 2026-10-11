module.exports = (sequelize, DataTypes) => {
  const PushSubscription = sequelize.define(
    'PushSubscription',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      endpoint_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      endpoint: { type: DataTypes.TEXT, allowNull: false },
      p256dh: { type: DataTypes.STRING(255), allowNull: false },
      auth: { type: DataTypes.STRING(255), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'push_subscriptions', timestamps: false, underscored: true }
  );

  PushSubscription.associate = (models) => {
    PushSubscription.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  };

  return PushSubscription;
};