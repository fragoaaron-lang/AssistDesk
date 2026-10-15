# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
Inferred from existing routes and permissions: AssistDesk administrators use the Data Analytics page to monitor ticket operations and maintain user accounts. Staff and students use separate ticket workflows.

## Product Purpose
Inferred from the existing application: AssistDesk centralizes campus support requests, routing, ticket progress, department services, and operational reporting for Tomas Claudio Colleges.

## Positioning
Inferred from existing features: reports combine ticket workflow data with department, requester, FAQ, and audit information in one campus support system.

## Operating Context
Inferred from AdminReportsPage and the report API: administrators review overview metrics, department and priority trends, response/resolution times, ticket records, ticket and persistent audit history, and user accounts. Report filters apply across report metrics and CSV export.

## Capabilities and Constraints
Confirmed in the codebase: role-protected admin reporting; date, department, category, priority, and status filters; CSV export; overview, performance, ticket-record, and audit sections; user directory and terminated-account archive. Keep these workflows and data meanings intact. Do not invent report metrics or imply data not supplied by the API.

## Brand Commitments
Confirmed: the product is AssistDesk, an institutional campus helpdesk. Preserve its current application identity and terminology.

## Evidence on Hand
Live report payloads and UI definitions in client/src/AdminReportsPage.js and server/controllers/adminController.js; no marketing claims or external benchmark evidence.

## Product Principles
- Make operational state quickly scannable.
- Keep reported values traceable to system data.
- Preserve access to detailed investigation and audit records.
- Keep report filters consistent across metrics and exports.

## Accessibility & Inclusion
Inferred from existing web UI conventions: controls should remain keyboard accessible, labeled, and responsive across desktop and mobile.
