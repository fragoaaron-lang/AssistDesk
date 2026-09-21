require('dotenv').config();

const { Sequelize } = require('sequelize');

// Prefer a valid connection URL, then fall back to Railway's MYSQL_* variables.
const configuredUrls = [process.env.DATABASE_URL, process.env.MYSQL_URL].filter(Boolean);
let DATABASE_URL = null;

for (const configuredUrl of configuredUrls) {
  try {
    const parsedUrl = new URL(configuredUrl);
    if (parsedUrl.protocol && parsedUrl.hostname) {
      DATABASE_URL = configuredUrl;
      break;
    }
  } catch (error) {
    // Try the structured variables before failing configuration validation below.
  }
}

if (!DATABASE_URL) {
  const host = process.env.MYSQLHOST || process.env.DB_HOST;
  const port = process.env.MYSQLPORT || process.env.DB_PORT || 3306;
  const user = process.env.MYSQLUSER || process.env.DB_USER;
  const password = process.env.MYSQLPASSWORD || process.env.DB_PASS || '';
  const database = process.env.MYSQLDATABASE || process.env.DB_NAME;

  if (host && user && database) {
    DATABASE_URL = `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
  }
}

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
  const host = process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1';
  const user = process.env.MYSQLUSER || process.env.DB_USER || 'root';
  const password = process.env.MYSQLPASSWORD || process.env.DB_PASS || '';
  const database = process.env.MYSQLDATABASE || process.env.DB_NAME || 'assistdesk';
  const port = Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306);

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
