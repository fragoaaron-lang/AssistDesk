const { Op } = require('sequelize');
const { sequelize, User } = require('./models');

const studentNumbers = [
  { label: 'Aaron', studentNumber: '2023-00461', firstName: 'Aaron' },
  { label: 'Jhezz Louise Licudan', studentNumber: '2021-00038', email: 'jhelolicudan16@gmail.com' },
  { label: 'Jhezz G. Licudan', studentNumber: '2021-00038', email: 'jhelolicudan@gmail.com' },
  { label: 'Andrei', studentNumber: '2021-00062', firstName: 'Andrei' },
  { label: 'Gerald', studentNumber: '2023-00555', firstName: 'Gerald' },
];

async function seed() {
  await sequelize.authenticate();
  const transaction = await sequelize.transaction();

  try {
    const results = [];
    for (const target of studentNumbers) {
      const users = await User.findAll({
        where: {
          role: 'student',
          ...(target.email ? { email: target.email } : { name: { [Op.like]: `${target.firstName}%` } }),
        },
        transaction,
      });

      if (users.length !== 1) {
        throw new Error(`${target.label}: expected exactly one student account, found ${users.length}.`);
      }

      const user = users[0];
      await user.update({ student_number: target.studentNumber }, { transaction });
      results.push({ id: user.id, name: user.name, student_number: target.studentNumber });
    }

    await transaction.commit();
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

seed()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
