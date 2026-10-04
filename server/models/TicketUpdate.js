module.exports = (sequelize, DataTypes) => {
  const TicketUpdate = sequelize.define(
    'TicketUpdate',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: 'comment',
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      previous_department_id: {
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
      tableName: 'ticket_updates',
      timestamps: false,
      underscored: true,
    }
  );

  TicketUpdate.associate = (models) => {
    TicketUpdate.belongsTo(models.Ticket, { foreignKey: 'ticket_id' });
    TicketUpdate.belongsTo(models.User, { foreignKey: 'updated_by', as: 'Updater' });
  };

  return TicketUpdate;
};
