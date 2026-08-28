require('dotenv').config();

const { Sequelize } = require('sequelize');

// If a single DATABASE_URL is provided (common on hosts), use it directly.
const DATABASE_URL = process.env.DATABASE_URL;
const urlDialect = DATABASE_URL ? new URL(DATABASE_URL).protocol.replace(':', '') : null;
const dialect = urlDialect || process.env.DB_DIALECT || 'mysql';

let sequelize;

if (DATABASE_URL) {
  // When using DATABASE_URL, allow SSL to be toggled via DB_SSL or PGSSLMODE.
  const useSsl = process.env.DB_SSL === 'true' || process.env.PGSSLMODE === 'require';
  const dialectOptions = useSsl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {};

  sequelize = new Sequelize(DATABASE_URL, {
    dialectOptions,
    logging: false,
    define: { underscored: true },
  });

} else {
  const host = process.env.DB_HOST || '127.0.0.1';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || '';
  const database = process.env.DB_NAME || 'assistdesk';
  const port = Number(process.env.DB_PORT || 3306);

  const useSsl = process.env.DB_SSL === 'true' || process.env.PGSSLMODE === 'require';
  const dialectOptions = useSsl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {};

  sequelize = new Sequelize(database, user, password, {
    host,
    port,
    dialect,
    logging: false,
    define: { underscored: true },
    dialectOptions,
  });
}

module.exports = sequelize;
