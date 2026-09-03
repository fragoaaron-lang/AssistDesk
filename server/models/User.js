module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
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
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      role: {
        type: DataTypes.ENUM('student', 'faculty', 'staff', 'admin'),
        allowNull: false,
        defaultValue: 'student',
      },
      profile_picture: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      marker_positions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'users',
      timestamps: false,
      underscored: true,
    }
  );

  User.associate = (models) => {
    User.belongsTo(models.Department, { foreignKey: 'department_id' });
    User.hasOne(models.Admin, { foreignKey: 'user_id' });
  };

  return User;
};
