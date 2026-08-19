
Migration plan: Switch to PostgreSQL

Overview

This repository has been updated to use PostgreSQL. The server configuration supports selecting the dialect via `DB_DIALECT` (defaults to `postgres`) and the server's `package.json` includes `pg` and `pg-hstore`.

What to do next

1. Provision a Postgres database (managed provider, local, or cloud). Record connection details: host, port (usually 5432), database name, user, and password.

2. Set environment variables for the application (recommended: use `DATABASE_URL` or set individual vars):

- `DATABASE_URL` (preferred) — example: `postgres://user:pass@host:5432/dbname`
- or: `DB_DIALECT=postgres`, `DB_HOST`, `DB_PORT=5432`, `DB_USER`, `DB_PASS`, `DB_NAME`, and `DB_SSL=true` if your provider requires SSL.

3. Install server dependencies and restart the server:

cd server
npm install
npm start

4. Verify the connection from the repo root:

node -e "require('./server/models').sequelize.authenticate().then(()=>console.log('DB OK')).catch(e=>{console.error('DB ERR',e);process.exit(1)})"

Migrating data (if you have data to move)

- Use your provider's migration/ETL tools or a generic database migration tool to copy data into Postgres. If you need a specific command for a given source (for example, MSSQL, SQLite, or a managed DB), provide the source type and connection details (no secrets) and I will prepare a precise, non-destructive command you can run locally.

Post-deployment checklist

- Add the Postgres connection to your Vercel Project → Settings → Environment Variables (`DATABASE_URL` or individual vars).
- Trigger a redeploy and verify `/health` and API endpoints.
- Rotate any credentials you exposed during troubleshooting.

Notes

- I cannot access or modify live databases from this environment; migration commands must be run locally or on a machine you control.
- If you want me to generate a provider-specific migration command, tell me the source DB type (no passwords) and I will provide the exact command to run locally.

Post-migration checklist

- Ensure Vercel environment variables are set for Postgres (`DATABASE_URL` or individual `DB_` vars).
- Trigger a redeploy and verify `/health` and API endpoints.
- Rotate any credentials you exposed during troubleshooting.

If you want me to prepare a migration command for a specific source DB, tell me the source type and host (no passwords) and I will prepare a non-destructive command you can run locally.