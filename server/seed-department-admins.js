const bcrypt = require('bcryptjs');
const { sequelize, Department, User } = require('./models');

const accounts = [
  ['Basic Education Department', 'basiceducation@tcc.edu'],
  ['College of Nursing', 'nursing@tcc.edu'],
  ['CS', 'cs@tcc.edu'],
  ['CBA', 'cba@tcc.edu'],
  ['CHARM', 'charm@tcc.edu'],
  ['College of Criminology', 'criminology@tcc.edu'],
  ['College of Physical Therapy', 'physicaltherapy@tcc.edu'],
  ['Maintenance Department', 'maintenance@tcc.edu'],
  ['Accounting Department', 'accounting@tcc.edu'],
  ['Library', 'library@tcc.edu'],
  ['Guidance', 'guidance@tcc.edu'],
  ['Office of Student Affairs', 'studentaffairs@tcc.edu'],
  ['Clinic', 'clinic@tcc.edu'],
  ['IT department', 'it@tcc.edu'],
];

async function seed() {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) throw new Error('SEED_ADMIN_PASSWORD is required.');

  const password_hash = await bcrypt.hash(password, 10);
  const transaction = await sequelize.transaction();

  try {
    const results = [];
    for (const [departmentName, email] of accounts) {
      const [department] = await Department.findOrCreate({
        where: { name: departmentName },
        defaults: { name: departmentName, description: `${departmentName} support department.` },
        transaction,
      });
      const [user, created] = await User.findOrCreate({
        where: { email },
        defaults: {
          name: `${departmentName} Admin`,
          email,
          password_hash,
          role: 'admin',
          department_id: department.id,
        },
        transaction,
      });
      if (!created) {
        await user.update({ role: 'admin', department_id: department.id, password_hash }, { transaction });
      }
      results.push({ department: department.name, email, created: created ? 'created' : 'updated' });
    }

    await transaction.commit();
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
}

seed().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});