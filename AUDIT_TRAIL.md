# Audit trail and accountability

## Storage and access

Persistent events are written to `audit_logs` through `server/utils/auditLog.js`. Events snapshot the actor's user ID, display name, and role, an action, affected entity type/ID, optional department scope, before/after JSON values, metadata, and server timestamp. Audit rows intentionally do not have a cascading user/ticket foreign key, so account/ticket deletion does not erase the audit event. Audit-log writes are application-created, and model hooks reject update/delete operations. There are no audit mutation routes. `GET /api/admin/audit-logs` requires an active administrator and returns the newest records (maximum 500 per request); department-scoped admins only see records scoped to their department. `GET /api/auth/activity` requires authentication and returns only the current actor's newest activity (maximum 100 per request), exposing only event type, affected entity reference, and timestamp—not before/after values or metadata.

## Logged events

- Authentication: successful/failed/denied login and authenticated logout. Unknown-email login attempts are recorded as anonymous attempts with the attempted email, never the submitted password.
- Account lifecycle: registration, email verification/resend, password change/reset, profile update, self-deletion, administrator deactivation/reactivation, and department changes.
- Tickets: creation, status/resolution/closure, assignment/unassignment/reassignment, routing correction, ETA change, manual/system priority escalation, comments, and requester ticket deletion.
- Catalog: department, service, and FAQ create/update/delete operations.

Self-service account deletion anonymizes the user record instead of hard-deleting it, removes private chat/notification/reset-token data, and preserves ticket and ticket-update history. Requester ticket deletion can remove the original ticket updates, but writes a separate audit-log snapshot in the same transaction first. Catalog hard deletion similarly saves a before-snapshot and deletion event in the transaction. Full audit access and all mutation restrictions remain admin/system-only; ordinary users can read only the limited activity history belonging to their authenticated account and cannot read or mutate other audit records.

## Limitations

Failed login attempts for unknown email addresses have no authenticated actor; the attempted email and failure reason are recorded as metadata. Logout recording requires the client to reach the authenticated logout endpoint before clearing its local token; if the client is offline, the event may be absent. Audit-log integrity is enforced at the application/API layer and database access should remain restricted to trusted operators; this is not cryptographic tamper-proof storage or an external SIEM.
