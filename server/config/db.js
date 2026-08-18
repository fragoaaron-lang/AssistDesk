require('dotenv').config();

const { Sequelize } = require('sequelize');

const host = process.env.DB_HOST || '127.0.0.1';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASS || '';
const database = process.env.DB_NAME || 'assistdesk';
const port = Number(process.env.DB_PORT || 3306);

const sequelize = new Sequelize(database, user, password, {
  host,
  port,
  dialect: 'mysql',
  logging: false,
  define: {
    underscored: true,
  },
});

module.exports = sequelize;
