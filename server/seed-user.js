require('dotenv').config();

const REQUIRED_ENV = [
  'SEED_USER_NAME',
  'SEED_USER_EMAIL',
  'SEED_USER_PASSWORD_HASH',
  'SEED_USER_DEPARTMENT_NAME',
];

async function seedUser({ User, Department, transaction, env = process.env } = {}) {
  if (!User || !Department) throw new Error('User and Department models are required.');
  const missing = REQUIRED_ENV.filter((name) => !String(env[name] || '').trim());
  if (missing.length) throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);

  const email = String(env.SEED_USER_EMAIL).trim().toLowerCase();
  const role = String(env.SEED_USER_ROLE || 'staff').trim().toLowerCase();
  if (!['student', 'faculty', 'staff', 'admin'].includes(role)) {
    throw new Error('SEED_USER_ROLE must be student, faculty, staff, or admin.');
  }

  const accountStatus = String(env.SEED_USER_ACCOUNT_STATUS || 'pending_verification').trim();
  if (!['active', 'pending_verification'].includes(accountStatus)) {
    throw new Error('SEED_USER_ACCOUNT_STATUS must be active or pending_verification.');
  }

  const passwordHash = String(env.SEED_USER_PASSWORD_HASH).trim();
  if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(passwordHash)) {
    throw new Error('SEED_USER_PASSWORD_HASH must be a valid bcrypt hash.');
  }

  const existing = await User.findOne({ where: { email }, transaction });
  if (existing) throw new Error(`User ${email} already exists; refusing to overwrite its account or password.`);

  const departmentName = String(env.SEED_USER_DEPARTMENT_NAME).trim();
  const department = await Department.findOne({
    where: { name: departmentName },
    transaction,
  });
  if (!department) throw new Error(`Department not found: ${departmentName}`);

  return User.create({
    name: String(env.SEED_USER_NAME).trim(),
    email,
    password_hash: passwordHash,
    department_id: department.id,
    role,
    account_status: accountStatus,
    student_number: String(env.SEED_USER_STUDENT_NUMBER || '').trim() || null,
    profile_picture: null,
    marker_positions: {},
    // Never import a verification token from an export; it is authentication material.
    verification_token: null,
    session_version: Number.parseInt(env.SEED_USER_SESSION_VERSION || '0', 10) || 0,
    created_at: env.SEED_USER_CREATED_AT ? new Date(env.SEED_USER_CREATED_AT) : new Date(),
  }, { transaction });
}

async function run() {
  const { sequelize, User, Department } = require('./models');
  let transaction;
  try {
    await sequelize.authenticate();
    transaction = await sequelize.transaction();
    const user = await seedUser({ User, Department, transaction });
    await transaction.commit();
    console.log(`User seeded successfully: ${user.email} (department: ${process.env.SEED_USER_DEPARTMENT_NAME}, status: ${user.account_status}). A fresh verification token was not imported.`);
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    console.error('User seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    const { sequelize } = require('./models');
    await sequelize.close();
  }
}

if (require.main === module) {
  run();
}

module.exports = { seedUser };
