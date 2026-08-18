module.exports = (sequelize, DataTypes) => {
  const ChatLog = sequelize.define(
    'ChatLog',
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
      ai_response: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      matched_department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'chat_logs',
      timestamps: false,
      underscored: true,
    }
  );

  ChatLog.associate = (models) => {
    ChatLog.belongsTo(models.User, { foreignKey: 'user_id' });
    ChatLog.belongsTo(models.Department, { foreignKey: 'matched_department_id' });
  };

  return ChatLog;
};
