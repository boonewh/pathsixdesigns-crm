# PathSix CRM current handoff

Last reconstructed: 2026-09-03

## Purpose

This document is the durable recovery point for the PathSix CRM after the Windows
corruption/reinstall interrupted the earlier production-hardening work. It records
what was completed, what is only local, and what must be verified before another
deployment.

## Repositories

- Frontend: `G:\Projects\pathsixdesigns-crm`
- Backend: `G:\Projects\pathsix-backend`
- Frontend production is deployed from `main` through Vercel.
- Backend production is deployed manually to Fly.io.

## Environment map

| Purpose | Frontend | Backend | Database |
| --- | --- | --- | --- |
| Production | Vercel production from `main` | `pathsixsolutions-backend` | `pathsixsolutions-db` |
| Staging | Vercel deployment from the long-lived `staging` branch | `pathsixsolutions-backend-staging` | `pathsixsolutions-db-staging` |
| Legacy, pending verification/removal | N/A | `pathsix-backend` | `pathsix-db` |

The staging database contains synthetic data and must never be copied into
production. Code is promoted by deploying the tested backend revision and merging
the tested frontend revision; database contents are not promoted.

## Reconstructed history

### December 2025: replacement production stack

- The newer `pathsixsolutions-backend` Fly app was connected to the current backend
  repository.
- `fly.toml` was reconciled so deploys from that repository targeted the correct
  production app.
- The older `pathsix-backend` and `pathsix-db` pair was left stopped after migration.

### July 30-31, 2026: Improvement 2 production hardening

1. Phase 0 — safety rails and housekeeping
   - Adopted branches and pull requests; `main` is production.
   - Added frontend typecheck/build CI and backend compile CI.
   - Removed dead code and reconciled backend code that was already deployed but had
     not been committed.
2. Phase 1 — isolated staging
   - Created the staging Fly backend and database.
   - Added `fly.staging.toml`, configurable CORS origins, and an idempotent synthetic
     data seeder.
   - Validated login and data rendering against staging.
3. Phase 2 — startup reliability
   - Added `/api/health` and Fly health-gated deployments.
   - Removed the background database keep-alive that could poison a SQLAlchemy
     session while Fly stopped a machine.
   - Intended production to keep one machine running while staging sleeps when idle.
4. Phase 3 — configuration and Sentry hardening
   - Disabled default PII collection and masked replay content.
   - Reduced tracing sample rate and corrected the production trace target.
   - Added explicit render-error capture.
   - Required `SECRET_KEY`, removed hard-coded Sentry configuration, and added local
     `.env` loading.

The frontend Phase 3 and backend Phase 3a changes were merged. The backend Phase 3a
pull request said the changes were not yet deployed and would ride with later auth
work. No later auth pull request or commit exists.

## Current local state

### Frontend

- Branch: `codex/sentry-database-reliability`
- Local commits:
  - `e68970c Fix frontend handling of CRM API failures`
  - `6519d42 Document CRM recovery and MCP readiness roadmap`
  - `070a549 Authenticate CRM calendar downloads`
- Not pushed or deployed.
- The reliability commit preserves failed response bodies and handles client, dashboard, search,
  and unauthorized-request failures without unhandled browser errors.
- Calendar downloads now use the authenticated API client; the backend endpoint is
  still public and must be fixed before this issue is closed.
- Latest verification: typecheck passed, production build passed, and all four
  Playwright tests passed.

### Backend

The backend remains on `main` with local, uncommitted changes:

- `app/database.py`
- `app/utils/auth_utils.py`
- `tests/test_lead_schemas.py`
- `tests/test_database_retry.py` (new)

Those changes give each Quart request its own SQLAlchemy session and retry a dropped
database connection once for read-only requests. The last full backend test run
passed all nine tests. They must be moved to a feature branch and committed before
any other backend editing.

## Current error incident

The latest CRM Sentry issues were a cascade:

1. PostgreSQL closed connections during read requests.
2. `/api/clients`, `/api/interactions`, and `/api/activity/recent` returned 500 errors.
3. Frontend error handling consumed a response body and callers tried to read it
   again, producing `Body stream already read` errors.

The frontend and backend fixes exist locally but are not deployed.

## Security findings discovered during recovery

`GET /api/interactions/<interaction_id>/calendar.ics` is currently unauthenticated
and queries only by sequential interaction ID. Its calendar response can include CRM
notes, email addresses, and phone numbers. This should be treated as the first
backend security fix before MCP work or another production release.

The backend also accepts `source_lead_id` when creating a client without verifying
that the lead belongs to the authenticated tenant, and later follows that ID without
a tenant predicate.

A deeper request-body audit found the same relationship-validation class in account
create/update (`client_id`), contact create/update (`client_id`/`lead_id`), project
create/update (`client_id`/`lead_id`), and interaction update
(`client_id`/`lead_id`/`project_id`). The interaction create route already
demonstrates the required tenant and record-access validation, but update does not.

The actively registered database-backup API is a critical platform-boundary issue:
any tenant `admin` token can reach global whole-database list/create/restore/delete
operations even though the frontend page is hidden. Reports and lead import are also
admin-only in the frontend but mostly require only a login in the backend, and
client restore omits the ownership checks used by lead/project restore.

The tracked backend file `password_changes.txt` was inspected after its name raised
a concern. It contains implementation notes and example code, not credentials; a
targeted secret-pattern scan was negative. No rotation or history cleanup is needed
for that file. Details are in `docs/security-audit-2026-09-03.md`.

## Operational unknowns

- Fly CLI is not installed on the reloaded Windows environment.
- The remote production/staging machine configuration and deployment versions have
  not been audited after recovery.
- The staging database may have remained running continuously while development was
  paused.
- Production appearing stopped in Fly conflicts with the intended Phase 2
  always-on configuration and must be investigated.
- The two legacy Fly apps must not be deleted until volumes, snapshots, attachments,
  and migration completion are verified.

## Safe resume order

1. Re-add the backend as a writable project folder.
2. Move the backend local changes to `codex/sentry-database-reliability` and commit.
3. Install and authenticate Fly CLI.
4. Perform a read-only inventory of production, staging, and legacy Fly resources.
5. Verify deployment revisions, machine policies, secrets by name, database
   attachments, volumes, snapshots, and estimated cost.
6. Disable or platform-restrict the global backup-management API; tenant admins must
   never be able to invoke whole-database operations.
7. Enforce backend authorization for Reports, Lead Import, and client restore.
8. Fix the unauthenticated calendar endpoint and every unvalidated relationship ID
   listed in `docs/security-audit-2026-09-03.md`; add two-tenant create/update tests.
9. Deploy the existing reliability fixes to staging and run the two-tenant test
   matrix before considering production.
10. Continue with `docs/mcp-readiness-roadmap.md`.

## Do not do without a fresh verification

- Do not delete or restore a Fly app, database, machine, volume, or snapshot.
- Do not run the staging seed script against production.
- Do not merge or deploy the current local fixes directly from `main`.
- Do not expose a CRM MCP endpoint until tenant enforcement and delegated
  authorization gates are complete.
