Migration plan: MySQL → Postgres

Overview

This project originally uses MySQL with `sequelize` + `mysql2`. The repo has been updated so the server DB config reads `DB_DIALECT` (defaults to `postgres`) and `server/package.json` now depends on `pg` and `pg-hstore`.

I cannot access your live databases from here. Follow one of the migration paths below to move data and switch production to Postgres.

Option A — Recommended: use `pgloader` (fast, preserves types)

1. Install `pgloader` (Linux/macOS) or run in Docker. On Windows use WSL or Docker.

2. Create a Postgres instance (managed provider or local). Note connection info: host, port (5432), user, password, db name.

3. Run `pgloader` with a command like:

pgloader mysql://root:MYSQL_PASS@mysql-host/assistdesk postgresql://pguser:PG_PASS@pg-host/assistdesk

4. Verify data in Postgres, run app tests.

Option B — Export SQL and adapt

1. Dump MySQL data:

mysqldump --routines --no-create-db --databases assistdesk -u root -p > dump_mysql.sql

2. Edit `dump_mysql.sql` to remove MySQL-specific syntax (ENGINE=, `
CHARSET`, backticks, `AUTO_INCREMENT` to `SERIAL` replacements for schema). This is manual and error-prone.

3. Create Postgres DB and import with `psql`.

Option C — Use a migration tool or ETL (e.g., AWS DMS, third-party)

Checklist after migration

- Set Vercel environment variables for Postgres (in Vercel dashboard → Settings → Environment Variables):
  - `DB_DIALECT=postgres`
  - `DB_HOST`, `DB_PORT` (usually 5432), `DB_USER`, `DB_PASS`, `DB_NAME`
- Locally set `.env` with those values for development.
- Install server dependencies and redeploy:

cd server
npm install
npm start

- Run the connection test from repo root:

node -e "require('./server/models').sequelize.authenticate().then(()=>console.log('DB OK')).catch(e=>{console.error('DB ERR',e);process.exit(1)})"

Deleting MySQL artifacts

If you want me to remove MySQL-related files in the repo (for example `database/schema.sql`, `database/seed.sql`, and remove `mysql2`), confirm explicitly. I will NOT delete your production database or run destructive commands against it; you must delete the MySQL server/data yourself or confirm credentials and intent for me to provide exact commands.

If you confirm, I can:

- Remove or archive `database/schema.sql` and `database/seed.sql` (create backups first).
- Ensure `server/package.json` no longer lists `mysql2` (done).

Security note

- Back up MySQL data before deleting anything.
- Rotate any DB credentials that were shared or exposed.

Tell me which migration option to use and whether I should proceed to remove MySQL files in the repo (I will create backups instead of hard delete unless you explicitly request deletion).