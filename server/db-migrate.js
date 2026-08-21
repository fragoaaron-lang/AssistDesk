#!/usr/bin/env node
try {
  require('dotenv').config();
} catch (err) {
  // dotenv may not be installed in some CI images before deps are installed.
  // Continue without failing; environment variables may be provided by the platform.
}

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
