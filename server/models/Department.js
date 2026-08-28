module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define(
    'Department',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      point_person: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      contact_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      office_hours: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'departments',
      timestamps: false,
      underscored: true,
    }
  );

  Department.associate = (models) => {
    Department.hasMany(models.Service, { foreignKey: 'department_id' });
    Department.hasMany(models.Faq, { foreignKey: 'department_id' });
    Department.hasMany(models.Ticket, { foreignKey: 'department_id' });
    Department.hasMany(models.User, { foreignKey: 'department_id' });
    Department.hasMany(models.Admin, { foreignKey: 'department_id' });
  };

  return Department;
};
