module.exports = (sequelize, DataTypes) => {
  const GeneralIssue = sequelize.define(
    'GeneralIssue',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'departments', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: 'general_issues',
      timestamps: false,
      underscored: true,
      indexes: [{ unique: true, fields: ['department_id', 'name'] }],
    }
  );

  GeneralIssue.associate = (models) => {
    GeneralIssue.belongsTo(models.Department, { foreignKey: 'department_id' });
    GeneralIssue.hasMany(models.SpecificIssue, { foreignKey: 'general_issue_id', as: 'specificIssues', onDelete: 'CASCADE', hooks: true });
  };

  return GeneralIssue;
};
