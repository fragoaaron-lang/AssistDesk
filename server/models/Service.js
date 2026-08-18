module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define(
    'Service',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      requirements: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      processing_time: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      tableName: 'services',
      timestamps: false,
      underscored: true,
    }
  );

  Service.associate = (models) => {
    Service.belongsTo(models.Department, { foreignKey: 'department_id' });
  };

  return Service;
};
