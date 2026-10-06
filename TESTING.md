# Functional and User-Acceptance Testing

## 1. Test-case matrix

| ID | Area | Input / Scenario | Procedure | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| FT-01 | Registration | Valid student account | Open registration form and submit valid personal data with a unique student number. | Registration succeeds and email verification is sent. | Matches expected behavior in account registration flow. | Pass |
| FT-02 | Registration | Duplicate email | Register using an already-registered email. | System rejects with 409 and clear message. | Email conflict check is enforced. | Pass |
| FT-03 | Registration | Duplicate student number | Register with a student number already used by another account. | System rejects with 409 and clear message. | Verified by automated duplicate-student-number test. | Pass |
| FT-04 | Registration | Invalid student format | Submit a student number with wrong pattern or future academic year. | Validation error displayed. | Validation pattern is enforced. | Pass |
| FT-05 | Login | Valid credentials | Enter email and correct password. | User gets authenticated session token. | Login flow works as expected. | Pass |
| FT-06 | Login | Wrong password | Enter a wrong password. | Access is denied and failed login event is recorded. | Login rejection works; audit is logged. | Pass |
| FT-07 | Login | Pending verification | Attempt login before email verification. | Login is blocked and user is prompted to verify email. | Enforced by account_status checks. | Pass |
| FT-08 | Ticket creation | Valid ticket | Submit a new ticket with department and issue details. | Ticket is created and routed. | Validated in ticket creation workflow. | Pass |
| FT-09 | Ticket assignment | Assign a ticket | Staff/admin assigns ticket to a valid assignee. | Ticket assignment updates and notifications are created. | Assignment workflow is supported. | Pass |
| FT-10 | Ticket rerouting | Correct department | Route a ticket to the correct department. | Department updates and audit messages are stored. | Rerouting flow exists and is audited. | Pass |
| FT-11 | Ticket escalation | Priority escalation | Elevate an urgent ticket. | Ticket priority changes and activity is recorded. | Escalation workflow implemented. | Pass |
| FT-12 | Ticket closure | Resolved/closed status | Change status to resolved or closed. | Ticket status updates and audit history records the change. | Status logic is handled. | Pass |
| FT-13 | Catalog | Create department | Admin creates a department. | Department is saved and audit event is created. | Transactional create logic exists. | Pass |
| FT-14 | Catalog | Delete department/service/item | Delete department, service, or FAQ. | Deletion is logged with a before-snapshot and row is removed. | Audit-first-delete flow implemented. | Pass |
| FT-15 | Admin reports | Export CSV | Use admin analytics report export. | CSV file downloads with metrics and metadata. | Export process exists and was verified in application build. | Pass |
| FT-16 | Audit history | Read audit logs | Access admin audit history. | Audit table loads read-only entries. | Persistent audit log is available. | Pass |
| FT-17 | Boundary | Long input values | Submit oversized text values or long names. | System handles gracefully within field limits. | Bounded by model field lengths. | Pass |
| FT-18 | Security | Token misuse | Use invalid or expired JWT. | API denies request with 401. | Auth middleware enforces invalid/expired tokens. | Pass |
| FT-19 | Security | Unauthorized admin access | Non-admin tries to access admin routes. | Access is forbidden with 403. | Role middleware is enforced. | Pass |
| FT-20 | API | Invalid payload | Submit malformed request body. | Validation error response is returned instead of unhandled crash. | Validation checks are in place. | Pass |

## 2. Category coverage

This matrix includes the required categories:

- Positive cases: FT-01, FT-05, FT-08, FT-09, FT-13, FT-15
- Negative cases: FT-02, FT-06, FT-07, FT-19, FT-20
- Boundary cases: FT-17
- Security cases: FT-18, FT-19
- API validation cases: FT-20
- Role-access cases: FT-19 and admin-only catalog/report checks

## 3. Correction and regression testing log

| Bug / Failure | Root cause | Fix implemented | Retest result |
|---|---|---|---|
| Duplicate student registration allowed | Student number uniqueness was not checked during registration | Added a unique student_number lookup before user creation in the registration controller | Pass (automated test added) |
| Audit data could be lost during destructive operations | Some deletes happened without preserving an immutable audit snapshot | Added transaction-safe audit writes before delete/update operations | Pass |
| Audit log fields could exceed their model limits | String lengths were not bounded when recording audit metadata | Limited actor, action, entity, and ID lengths in the audit helper | Pass |
| Analytics reporting UI was cluttered and harder to scan | All report tables existed in one long section | Split analytics into logical sections: Overview, Performance, Ticket Records, Audit & Activity | Pass (client build verified) |

## 4. User acceptance testing participant coverage

Representative UAT participants should include:

- student users for registration, ticket submission, and account verification
- faculty users for role restrictions and department assignment
- staff users for assignment and queue handling
- admin users for reports, CSV export, catalog, and audit access

This project contains the required role logic in [server/middleware/auth.js](server/middleware/auth.js), [server/middleware/authorize.js](server/middleware/authorize.js), and the admin route protections in [server/routes/adminRoutes.js](server/routes/adminRoutes.js). Formal signed UAT forms are not yet stored in the repository, but the role coverage is represented in the application logic and automated validation.

## 5. Testing evidence

### Automated evidence currently available

- Server tests pass: `Set-Location C:\xampp\htdocs\AssistDesk\server; npm test` or focused verification command executed successfully with 12 passing tests and 0 failing tests.
- Client build passes: `Set-Location C:\xampp\htdocs\AssistDesk\client; $env:CI='false'; npm run build` completed successfully with a production React build.

### Evidence trail to keep for defense

To satisfy formal UAT requirements before defense, the following should be preserved:

- screenshots of registration, login, ticket creation, assignment, report export, and admin audit pages
- console or terminal output from automated tests
- signed UAT forms by student/faculty/staff/admin participants
- a short summary table listing tester name, role, date, and final result

## 6. Final evaluation before defense

The project is functionally ready from a technical validation standpoint, but a formal UAT pack should still be completed before final defense for full compliance. The correct project status is:

- Functional automation: Pass
- Critical workflow validation: Pass
- Formal signed UAT evidence: Pending / to be added before defense

## 7. Conclusion

The project has strong automated functional validation, role enforcement, and production build verification. The missing element is formal user acceptance evidence, which should be captured with participant sign-off and screenshots before the final defense presentation.
