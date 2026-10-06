# Privacy, Security, and Compliance Policy

## Purpose

This privacy and compliance policy defines how AssistDesk handles personal data, account data, ticket information, chat logs, and attachment data in a manner consistent with the Data Privacy Act of 2012 and responsible institutional data handling practices.

## Personal data collected

The system may process the following personal and operational data:

- user full name and email address
- student number and department information
- profile picture
- ticket subject, description, and metadata
- department assignment information
- chat logs and user communication records
- attachment data stored with a ticket
- audit log records for system accountability

## Lawful and legitimate use

Data is collected only for legitimate system operations, including:

- user authentication and account management
- ticket creation and routing
- staff and admin operations
- reporting and operational analytics
- security, audit, and accountability monitoring

## Consent and notice

Users are informed through the application interface that personal data is used for account access, department routing, ticket resolution, and administrative reporting. Each user must understand that the system stores account and ticket data necessary for service delivery.

## Access, correction, and limitation

- Only authenticated users may access their own account data within the system limits.
- Admins and department-scoped admins can access information necessary for ticket and support operations.
- Sensitive data is limited to what is necessary for legitimate functions.
- Users may update profile data and change their password through the application flows in [server/controllers/authController.js](server/controllers/authController.js).

## Password and credential protection

The application uses bcrypt hashing before storing passwords. Passwords are never stored in plain text and are never returned to the client in raw form. See [server/controllers/authController.js](server/controllers/authController.js) and [server/models/User.js](server/models/User.js).

## Role-based access control

The API enforces access control by checking the authenticated role and department before allowing access to protected operations:

- [server/middleware/auth.js](server/middleware/auth.js)
- [server/middleware/authorize.js](server/middleware/authorize.js)
- [server/routes/adminRoutes.js](server/routes/adminRoutes.js)
- [server/routes/catalogRoutes.js](server/routes/catalogRoutes.js)
- [server/routes/ticketRoutes.js](server/routes/ticketRoutes.js)

This follows the least-privilege principle for admin, staff, department-scoped admin, and end-user access.

## Security safeguards

The system implements the following protection measures:

- password hashing with bcryptjs
- JWT-based authentication
- account status checks before granting app access
- validation of input fields and structured values before processing
- transactional updates for sensitive account and workflow changes
- audit trail preservation for key system actions

Relevant files:

- [server/controllers/authController.js](server/controllers/authController.js)
- [server/controllers/ticketController.js](server/controllers/ticketController.js)
- [server/controllers/adminController.js](server/controllers/adminController.js)
- [server/models/AuditLog.js](server/models/AuditLog.js)

## Retention and disposal

Data should be retained only as long as needed for service delivery, legal or operational review, or institutional policy obligations. The project includes a self-delete flow for user accounts and account termination support in [server/controllers/authController.js](server/controllers/authController.js) and [server/controllers/adminController.js](server/controllers/adminController.js). The system anonymizes account data and removes identifiable credentials while retaining operational audit records that are necessary for accountability.

## Secure disposal

- Accounts are not hard-deleted without preserving an audit trail.
- Sensitive account data is anonymized where appropriate.
- Notifications, chat logs, and password reset tokens are removed during account termination or self-deletion to reduce unnecessary personal data exposure.
- Audit records remain immutable to preserve accountability and evidence.

## Data Privacy Act of 2012 compliance note

AssistDesk aligns with the Data Privacy Act of 2012 principles by aiming to:

- process data fairly and lawfully
- limit collection to necessary purposes
- protect personal data using reasonable security measures
- maintain accountability through audit logs and access enforcement
- avoid unnecessary retention of sensitive or non-essential records

This policy does not replace legal counsel or institutional policy approval, but it provides the operational baseline required for responsible data governance in the current application.

## Review and update

This privacy policy should be reviewed whenever the system adds new data collection features, new user roles, or new storage locations for files, reports, or logs.
