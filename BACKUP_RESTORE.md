# Database Backup and Restore Procedure

## Purpose

This procedure defines how to protect the AssistDesk production database against data loss and how to restore service quickly if there is a storage failure, accidental deletion, schema issue, or migration problem.

## Scope

This applies to the MySQL database used by the AssistDesk system, including user accounts, tickets, notifications, FAQs, services, chat logs, and audit records.

## Backup policy

### Required frequency

- Daily full database dumps for production
- Weekly retention of the last 4 weekly backups
- Monthly retention of the last 6 monthly backups
- Immediate backup before production schema change or migration

### Backup method

Use `mysqldump` with transaction-safe settings to create a full logical backup:

```bash
mysqldump -u [DB_USER] -p --single-transaction --routines --events --add-drop-table assistdesk > assistdesk_backup_$(date +%F_%H%M%S).sql
```

Compress the backup after creation:

```bash
gzip assistdesk_backup_$(date +%F_%H%M%S).sql
```

### Storage location

Backup files must be stored outside the application runtime directory or database volume. Use a dedicated backup folder or secure remote storage bucket. Do not store production backups inside the app folder or in the same disk partition as the main database if avoidable.

### Retention

- 7 daily backups retained online
- 4 weekly backups retained for at least 30 days
- 6 monthly backups retained for archival use
- Older backups can be archived to cold storage

## Restore procedure

### Restore a full database dump

If the database already exists:

```bash
mysql -u [DB_USER] -p assistdesk < assistdesk_backup_2026-10-06_120000.sql
```

If the database does not exist:

```bash
mysql -u [DB_USER] -p -e "CREATE DATABASE assistdesk;"
mysql -u [DB_USER] -p assistdesk < assistdesk_backup_2026-10-06_120000.sql
```

### Restore for deployed hosting environments

Use the same process in a staging or replacement environment before switching traffic back to the restored database.

## Validation after restore

After importing the backup, verify the following:

1. The application API starts successfully.
2. Authentication works for a sample user.
3. The dashboard loads ticket metrics.
4. Ticket creation and updates still work.
5. Audit logs are readable.
6. Reports can be generated.

## Recovery responsibilities

- The system administrator is responsible for configuring scheduled backups.
- The application owner is responsible for validating restore operations.
- Developers are responsible for confirming that data model changes are covered by the backup and migration workflow.

## Evidence from implementation

The project already includes runtime safeguards and schema backfill logic that support restoreability, including:

- Model-driven schema alignment in [server/models/index.js](server/models/index.js)
- Startup migration checks in [server/server.js](server/server.js)
- Audit trail preservation in [server/models/AuditLog.js](server/models/AuditLog.js)
- Transactional writes in [server/controllers/ticketController.js](server/controllers/ticketController.js) and [server/controllers/authController.js](server/controllers/authController.js)

This document establishes the formal operational backup and restore procedure expected for a deployed production deployment.
