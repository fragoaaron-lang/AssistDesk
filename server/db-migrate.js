#!/usr/bin/env node
require('dotenv').config();
const sequelize = require('./config/db');

async function migrate() {
  try {
    console.log('Running sequelize.sync() to apply model changes...');
    await sequelize.sync({ alter: true });
    console.log('Migrations applied (sequelize.sync completed).');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err && err.message ? err.message : err);
    process.exit(1);
  }
}

migrate();
