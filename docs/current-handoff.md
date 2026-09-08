# Current reconciliation — 2026-09-08

Latest staging is **v21 / 1b32d82**, with **109 PostgreSQL tests passed**.
Lead create/detail/update/soft-delete/restore now use a tenant-bound service with
caller-owned transactions and a pure detail read. The web route records views
explicitly. Cross-tenant and record-access denial, rollback, contact filtering,
conversion timestamps and HTTP behavior are tested. Live login, thirteen protected
reads and the full lead/contact lifecycle passed with no browser errors. Cleanup
left the original two clients/two leads and zero test schemas. The database head
remains parent_link_rules; all fourteen RLS tables remain forced and unscoped reads
return zero rows. Production, frontend deployments and Fly resource configuration
are unchanged. See backend docs/lead-service.md.

Next service work includes lists, assignment/email delivery, bulk operations and
remaining entities. Delegated AI authorization and MCP are still outstanding.

Previous parent-link milestone follows.

Latest staging is **v20 / 322f057**, Alembic head **parent_link_rules**.
Three validated database CHECK constraints now enforce exactly one parent for
contacts/interactions and at most one for projects. Permanent deletion with
related records returns HTTP 409 and rolls back the whole operation, including
bulk purge. Client and lead purge work with the restricted database login.

Validation: 74 local tests passed (28 PostgreSQL-only skipped); full PostgreSQL
suite passed 102 tests, followed by three focused passes after the final lead
purge fix. Rehearsal, migration, live login, thirteen protected reads and both
client/contact and lead/contact conflict/restore/cleanup workflows passed.
Independent inspection confirms all three constraints, fourteen forced RLS tables,
zero unscoped runtime reads and zero test schemas. Original two clients/two leads
remain, with contacts/interactions/projects empty. Production and frontend
deployments, Fly machine count/sizes and auto-stop settings are unchanged.
See backend docs/parent-link-rules.md. Next: remaining tenant-bound services and
polymorphic activity relationships, followed by delegated AI authorization/MCP.
CRM_RLS_ENABLED=1 must remain enabled while RLS policies are active.

Previous row-security milestone follows.

Latest staging is **v18 / 000de69**, Alembic head **tenant_row_security**, with
**98 PostgreSQL tests passed** under RLS. Fourteen tables have row security enabled
and forced. Transaction-local identity denies unscoped reads/writes and clears on
commit/rollback; login/reset use a narrow identity-only bootstrap. Live login,
thirteen protected read endpoints and full client lifecycle passed. Independent
runtime queries with no identity returned zero clients/leads/users/tenants.
Original two clients/two leads remain; zero test schemas. Production, frontend
deployment and Fly resource sizes/count are unchanged.

IMPORTANT: CRM_RLS_ENABLED=1 must remain set on staging while policies are active.
A pre-RLS application rollback alone is incompatible. Operator maintenance requires
operator credentials or explicit trusted principal context; unscoped runtime reads
now intentionally return no data. See backend docs/tenant-row-security.md.

Previous relationship milestone follows.


Latest staging is **v16 / 9c72c29**, with migration **tenant_relationships**.
Thirty composite foreign keys now prevent declared record/user relationships from
crossing company boundaries. The rehearsal, migration and independent validation
passed. PostgreSQL testing: 90 passed in the suite, plus the corrected new HTTP
contract test passed on targeted rerun. Live CRM reads and full client lifecycle
passed without browser errors. Zero test schemas remain; original two clients/two
leads remain; runtime role stays restricted. Production, frontend deployment and
Fly machine sizes/count are unchanged. See backend docs/tenant-relationship-migration.md.
RLS, parent-cardinality/polymorphic constraints and remaining service work are next.

Previous membership milestone follows.


Latest staging is **v14 / fd629f5**, with **85 PostgreSQL tests passed**.
Migration tenant_membership_indexes merged the three legacy Alembic heads and
added/validated direct tenant foreign keys and full tenant indexes across all
eleven tables with tenant_id. The rolled-back rehearsal and actual migration
passed; rows were preserved. Live login, reads, search, reports, clients page and
full client lifecycle passed with no browser errors; the test client was removed.
Zero temporary test schemas remain. Runtime DB privileges remain restricted.
See backend docs/tenant-membership-migration.md. Composite tenant foreign keys,
remaining services and RLS are next. Production and frontend deployment unchanged.

The prior restricted-login milestone follows.


Current staging is now **v13 / e311c19**, using dedicated restricted database login
pathsix_crm_staging_runtime on both backend machines. Production remains unchanged.
The initial role suite passed 76 PostgreSQL tests; final expanded verification is
recorded in backend docs/staging-database-role.md. Live login, search, reports,
clients page and complete client lifecycle passed. The live purge check exposed
an unnecessary chat-table load and rollback logging bug; both are fixed without
broadening database privileges. Synthetic test clients were removed. Operator
recovery credentials are encrypted outside Git; no additional administrator secret
was left in the app. RLS, tenant constraints/indexes and remaining services are
still outstanding. The preceding superuser observation below is historical.


Current staging: **v10 / `64dfe15`**, with **68 tests passed** locally and on
PostgreSQL. Client create/detail/update/delete/restore now use a tenant-bound
service. Live client page checks passed; zero temporary schemas remain. Read-only
schema audit found no invalid staging relationships, but missing tenant indexes,
no composite tenant foreign keys/RLS, and a superuser application DB role. All
three migration heads are recorded in staging despite the missing indexes. See
backend `docs/client-service-and-schema-audit.md` for the next migration plan.
Production and frontend deployment remain unchanged. Earlier milestones follow.

Latest milestone: tenant-bound search service deployed to backend staging **v9**
(`c88ce35`); **61 tests passed** locally and on staging PostgreSQL, with live search
and dashboard checks passing and zero test schemas left. See backend
`docs/tenant-service-foundation.md` for scope, table inventory, and next steps.
Frontend remains on staging `cdab5ed`; production remains unchanged.
The preceding v8 milestone is documented below.

This section supersedes the September 3 reconstruction below. See the backend
`G:\Projects\pathsix-backend\docs\reliability-security-2026-09-06.md` for implementation,
validation results, staging revision and remaining roadmap boundaries.

- Backend began on `codex/admin-password-reset` at `6bd505e`, with `31d65fe`
  already implementing admin reset email delivery. The user confirmed Resend works;
  that setup was preserved. It was not missing work.
- All four uncommitted reliability files were preserved in `4401b02` on
  `codex/crm-reliability-security`. Security/reliability fixes are committed in `7c4fd50`.
- Frontend `540641b` includes the recovery work plus admin reset emails and request
  progress. Typecheck/build and all six browser regressions passed September 6.
- Backend local validation passed 56 tests, including two-tenant CRUD/relationship
  checks, calendar auth, disabled users/tenants, current roles and public-route coverage.
- Backup HTTP API registration is disabled. Reports/import require current admin
  roles. Calendar, source leads, parent IDs, transfer, client restore and project
  detail/update/delete now enforce access. Accounts/contacts inherit parent access.
- JWT expiry is enforced. ORM relationship loads are tenant-scoped. Read retries
  stop after a write begins; warmup closes failed sessions. No MCP endpoint was added.
- Production was inspected read-only: healthy release v80, September 4, one running
  machine in ord. No production deployment or configuration change was made.
- Staging was v6 from August 1 with sleeping app machines, a healthy running DB,
  synthetic tenant `staging`, test-domain users, two clients and two leads. Its DB
  hostname is `pathsixsolutions-db-staging.flycast`.
- Staging has no SMTP secrets; reset email behavior is tested with mocks. Working
  production Resend credentials were not copied into staging.
- Staging is verified: backend release **v8** at `186e6c9`, frontend `cdab5ed` at
  https://pathsixdesigns-crm-staging.vercel.app. All 56 backend tests passed against
  staging PostgreSQL; live synthetic login/dashboard and 22 read endpoints passed.
  Zero temporary test schemas remain; demo-data counts are unchanged.
- The frontend staging checkout is `G:\Projects\pathsixdesigns-crm-staging`, branch
  `codex/crm-staging-validation`. Only remote `staging` was promoted. Backend changes
  remain on `codex/crm-reliability-security`; final documentation follows the deployed
  application/test revision. Production remains explicitly prohibited.

The historical observations below are retained for context; do not follow their
stale branch/commit or Fly-authentication status as current instructions.

---

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
  - `ec57a0a Document CRM security audit findings`
  - `5955d02 Clarify password notes contain no credentials`
  - `38ffe12 Expand CRM tenant boundary audit`
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

## Local tooling and operational unknowns

- Fly CLI `v0.4.97` is installed and its binary was verified. A new terminal may be
  needed for the `flyctl` alias to enter `PATH`. It has not been authenticated and
  no live Fly resources were queried or changed.
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
