module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'notifications',
      timestamps: false,
      underscored: true,
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  const queuePush = (notification) => {
    setImmediate(() => {
      require('../utils/pushNotifications')
        .sendPushToUser(notification.user_id, notification)
        .catch((error) => console.error(JSON.stringify({ event: 'push_delivery_failed', user_id: notification.user_id, error_name: error.name || 'Error' })));
    });
  };

  Notification.addHook('afterCreate', (notification, options) => {
    const dispatch = () => queuePush(notification);
    if (options.transaction) options.transaction.afterCommit(dispatch);
    else dispatch();
  });

  Notification.addHook('afterBulkCreate', (notifications, options) => {
    const dispatch = () => notifications.forEach(queuePush);
    if (options.transaction) options.transaction.afterCommit(dispatch);
    else dispatch();
  });

  return Notification;
};
