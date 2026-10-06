# Reports and CSV exports

## Access and filters

The analytics API and CSV export are restricted to authenticated administrator accounts. The report screen filters tickets by creation date (inclusive UTC calendar dates), department, category, priority, and status. When unset, ticket reports include all matching records. The ticket detail table is capped at the 100 most recent matching tickets; the audit activity table shows up to 200 recent workflow events for the matching tickets. CSV export includes every ticket matching the selected filters, not just the on-screen recent-ticket limit.

## Metrics and interpretation

- Ticket totals are grouped by status, assignment state, department, category, and priority.
- First response time is measured from ticket creation to the first recorded update by a staff/admin user (including assignment/acceptance actions). This is an operational proxy, not a calibrated service-level metric.
- Resolution time is measured from ticket creation to the first recorded status update whose message indicates `resolved` or `closed`. Older tickets without corresponding update history may not contribute.
- Audit reporting includes ticket creation, assignment/acceptance/reassignment/unassignment, status changes, manual/automatic priority escalation, routing corrections, and ETA changes. It is based on `ticket_updates` records.
- FAQ usage, registered user counts, and account lists describe their own underlying data sets and are not ticket metrics; ticket filters do not narrow those populations.
- Monthly ticket creation data is a rolling 30-day aggregate. The heat map is all-time ticket volume by department; it is descriptive, not predictive.

## CSV output

Use **Export CSV** on the Data Analytics page. The generated UTF-8 CSV contains a title, selected coverage/filter values, generated timestamp, authenticated administrator name, status/assignment/department/category/priority totals, and matching ticket records. CSV values are quoted and spreadsheet formula prefixes are neutralized. CSV export is available; PDF export is not currently implemented.
