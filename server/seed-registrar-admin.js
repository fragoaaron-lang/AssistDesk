require('dotenv').config();

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, Department, User, Admin } = require('./models');

const ADMIN_EMAIL = 'registrar@tcc.edu';
const ADMIN_NAME = 'Registrar Office Admin';
const DEPARTMENT_NAMES = ['Registrar Office', 'Registrar Department'];
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,128}$/;

async function seedRegistrarAdmin({ closeConnection = true } = {}) {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (typeof password !== 'string' || Buffer.byteLength(password, 'utf8') > 72 || !PASSWORD_POLICY.test(password)) {
    throw new Error('Set SEED_ADMIN_PASSWORD to a 12–72 byte password with uppercase, lowercase, number, and special character.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const transaction = await sequelize.transaction();

  try {
    let department = await Department.findOne({
      where: { name: { [Op.in]: DEPARTMENT_NAMES } },
      order: [['id', 'ASC']],
      transaction,
    });
    if (!department) {
      department = await Department.create({
        name: 'Registrar Office',
        description: 'Handles student records, enrollment, and official document requests.',
      }, { transaction });
    }

    const [user, created] = await User.findOrCreate({
      where: { email: ADMIN_EMAIL },
      defaults: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password_hash: passwordHash,
        role: 'admin',
        department_id: department.id,
      },
      transaction,
    });
    if (!created) {
      await user.update({
        name: ADMIN_NAME,
        password_hash: passwordHash,
        role: 'admin',
        department_id: department.id,
        account_status: 'active',
      }, { transaction });
    }

    let admin = await Admin.findOne({
      where: { [Op.or]: [{ email: ADMIN_EMAIL }, { user_id: user.id }] },
      transaction,
    });
    if (admin) {
      await admin.update({
        user_id: user.id,
        department_id: department.id,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password_hash: passwordHash,
      }, { transaction });
    } else {
      admin = await Admin.create({
        user_id: user.id,
        department_id: department.id,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password_hash: passwordHash,
      }, { transaction });
    }

    await transaction.commit();
    console.log(JSON.stringify({
      result: created ? 'created' : 'updated',
      email: ADMIN_EMAIL,
      department: department.name,
      department_id: department.id,
    }));
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    if (closeConnection) await sequelize.close();
  }
}

module.exports = seedRegistrarAdmin;

if (require.main === module) {
  seedRegistrarAdmin().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}