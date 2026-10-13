module.exports = (sequelize, DataTypes) => {
  const SpecificIssue = sequelize.define(
    'SpecificIssue',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      general_issue_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'general_issues', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
    },
    {
      tableName: 'specific_issues',
      timestamps: false,
      underscored: true,
      indexes: [{ unique: true, fields: ['general_issue_id', 'name'] }],
    }
  );

  SpecificIssue.associate = (models) => {
    SpecificIssue.belongsTo(models.GeneralIssue, { foreignKey: 'general_issue_id', as: 'generalIssue' });
  };

  return SpecificIssue;
};
