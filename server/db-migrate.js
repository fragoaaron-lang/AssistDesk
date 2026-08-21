#!/usr/bin/env node
try {
  require('dotenv').config();
} catch (err) {
  // dotenv may not be installed in some CI images before deps are installed.
  // Continue without failing; environment variables may be provided by the platform.
}

const sequelize = require('./config/db');

async function migrate() {
  // If no database credentials are provided, skip migrations to avoid failing builds.
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const hasDbCreds = Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASS);
  if (!hasDatabaseUrl && !hasDbCreds) {
    console.warn('No database credentials found (DATABASE_URL or DB_HOST/DB_USER/DB_PASS). Skipping migrations.');
    process.exit(0);
  }
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
