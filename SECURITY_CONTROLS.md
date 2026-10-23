# Security controls and operational notes

This document records the security controls implemented for the OWASP Top 10:2025 A03–A10 areas. These controls reduce specific risks; they are not a certification or a claim that the application is free of vulnerabilities.

## Implemented controls

| OWASP area | Application controls |
| --- | --- |
| A03 Software Supply Chain Failures | CI installs tracked lockfiles with `npm ci`, runs server tests and a production client build, and audits production dependencies. Dependabot checks server, client, root npm manifests, and GitHub Actions weekly. |
| A04 Cryptographic Failures | Bcrypt cost 12; 12–72 character passwords; 256-bit password-reset tokens stored only as SHA-256 hashes; CSPRNG verification codes stored hashed; verified TLS for configured database and SMTP connections; HTTPS-only production reset URLs; HSTS and no-store API responses. |
| A05 Injection | ORM parameterized data access; explicit catalog update allowlists; bounded inputs; attachment binary-signature checks; faculty/staff ID images are stored outside static web roots with generated filenames and admin-only retrieval; HTML escaping for email templates; pinned external scripts with SRI and a restrictive CSP. |
| A06 Insecure Design | Per-IP rate limits for API, authentication/recovery, ticket creation, and AI; server-calculated ticket ETAs; bounded staff ETAs and request/file sizes; workflow checks; post-commit notification failures no longer report committed ticket mutations as failed. |
| A07 Authentication Failures | Login/recovery/signup throttles; non-enumerating login, registration, verification, and recovery messages; equal-cost unknown-account password checks; one-hour production JWTs restricted by algorithm/issuer/audience; session-version revocation on logout/password change/reset/account changes; current account status and database role checked for APIs and sockets. |
| A08 Software or Data Integrity Failures | Lockfile-based reproducible installs; PR/push build-and-test workflow; SRI for the pinned Three.js CDN scripts; allowlisted catalog fields; reset and verification secrets protected against tampering/disclosure. |
| A09 Security Logging and Alerting Failures | Existing immutable database audit events for authentication and business changes; structured rate-limit/error events with request IDs; rate-limit logs use a keyed source fingerprint instead of raw IPs. |
| A10 Mishandling of Exceptional Conditions | Centralized non-verbose Express errors, request correlation IDs, readiness gate while database setup is incomplete, bounded payloads, transactional reset-token consumption/session revocation, and safe handling of notification failures after committed ticket changes. |

## Production configuration

- Set a unique `JWT_SECRET` with at least 32 random characters in the server hosting environment. A 48-byte value can be generated with Node’s `crypto.randomBytes(48).toString('base64url')`. Never commit it or reuse a local secret. Replacing it invalidates existing JWTs.
- Configure `FRONTEND_URL` or `CLIENT_URL` as the actual HTTPS production origin. Reset/verification links use this origin.
- `TRUST_PROXY_HOPS` defaults to one in production for Railway’s proxy and zero in development. Set the value to match the real number of trusted reverse-proxy hops; do not increase it to accommodate arbitrary client-supplied forwarded headers.
- Configure database TLS (`DB_SSL=true` or `PGSSLMODE=require`) with a trusted certificate. SMTP certificate validation is enforced.
- Faculty/staff ID images are written to `server/private/staff-ids` by default. Set `STAFF_ID_STORAGE_DIR` to a private, persistent mounted directory in production; the application filesystem may be ephemeral, and multiple API instances need shared durable storage.
- The in-memory rate limiter is per application process. Multi-instance deployments should configure a shared rate-limit store for consistent cluster-wide limits.

## Remaining security work / known limits

- Multi-factor authentication is not implemented; production admins should use strong unique passwords and protect hosting/GitHub accounts with MFA.
- Access tokens are still held in browser `localStorage`; an XSS vulnerability could expose them. A future migration to secure, HttpOnly, SameSite cookies requires CSRF defenses and coordinating the REST and Socket.IO auth flows.
- The current Create React App / `react-scripts` build chain has known development-tool advisories without a safe in-place `npm audit fix`; replacing the legacy build chain is a tracked upgrade, not a forced package-lock change. Current full audits also report moderate transitive advisories in Sequelize’s `uuid` dependency and React Router 6; CI gates shipped dependencies at high severity while these compatible major-version upgrades are planned.
- Audit records are append-only through application hooks, not cryptographically tamper-proof or exported to a SIEM. Configure durable log retention, alert review, backups, and incident response in the hosting platform.
- Application code cannot enforce GitHub branch protection, two-person production approval, secret scanning settings, deployment environment protections, or host-level TLS/network policies; configure these in GitHub and the hosting providers.
