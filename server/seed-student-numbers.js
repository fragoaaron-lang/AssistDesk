const { Op } = require('sequelize');
const { sequelize, User } = require('./models');

const studentNumbers = [
  ['Aaron', '2023-00461'],
  ['Jhezz', '2021-00038'],
  ['Andrei', '2021-00062'],
  ['Gerald', '2023-00555'],
];

async function seed() {
  await sequelize.authenticate();
  const transaction = await sequelize.transaction();

  try {
    const results = [];
    for (const [firstName, studentNumber] of studentNumbers) {
      const users = await User.findAll({
        where: {
          role: 'student',
          name: { [Op.like]: `${firstName}%` },
        },
        transaction,
      });

      if (users.length !== 1) {
        throw new Error(`${firstName}: expected exactly one student account, found ${users.length}.`);
      }

      const user = users[0];
      await user.update({ student_number: studentNumber }, { transaction });
      results.push({ id: user.id, name: user.name, student_number: studentNumber });
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
