module.exports = (sequelize, DataTypes) => {
  const Faq = sequelize.define(
    'Faq',
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
      question: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      answer: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      keywords: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'faqs',
      timestamps: false,
      underscored: true,
    }
  );

  Faq.associate = (models) => {
    Faq.belongsTo(models.Department, { foreignKey: 'department_id' });
  };

  return Faq;
};
