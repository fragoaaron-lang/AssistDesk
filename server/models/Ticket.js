module.exports = (sequelize, DataTypes) => {
  const Ticket = sequelize.define(
    'Ticket',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ticket_code: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('ticket_code');
        },
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      attachment_data: {
        type: DataTypes.TEXT('medium'),
        allowNull: true,
      },
      attachment_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      attachment_type: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: 'Other',
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      status: {
        type: DataTypes.ENUM('open', 'pending', 'in_progress', 'resolved', 'closed'),
        allowNull: false,
        defaultValue: 'open',
      },
      estimated_completion_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'tickets',
      timestamps: false,
      underscored: true,
    }
  );

  Ticket.associate = (models) => {
    Ticket.belongsTo(models.User, { foreignKey: 'user_id' });
    Ticket.belongsTo(models.Department, { foreignKey: 'department_id' });
    Ticket.hasMany(models.TicketUpdate, { foreignKey: 'ticket_id' });
  };

  return Ticket;
};
