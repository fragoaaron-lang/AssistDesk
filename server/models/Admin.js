module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define(
    'Admin',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'admins',
      timestamps: false,
      underscored: true,
    }
  );

  Admin.associate = (models) => {
    Admin.belongsTo(models.User, { foreignKey: 'user_id' });
    Admin.belongsTo(models.Department, { foreignKey: 'department_id' });
  };

  return Admin;
};