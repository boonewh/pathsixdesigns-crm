# PathSix CRM security audit — 2026-09-03

This is a read-only audit of the local frontend and backend clones. No Fly, Vercel,
database, credential, or Git-history changes were made as part of the audit.

## Confirmed findings

### Critical: interaction calendar export is public

`GET /api/interactions/<interaction_id>/calendar.ics` is the only tenant-data route
found without `@requires_auth()`. It queries a sequential interaction ID without a
tenant predicate and can return CRM notes, email addresses, and phone numbers.

Frontend commit `070a549` replaces the public link with an authenticated API
download. The backend must still add authentication, tenant scoping, normal entity
access checks, and cross-tenant regression tests before the fix is complete.

### High: client-to-source-lead relationship can cross tenants

`POST /api/clients` accepts `source_lead_id` and stores it without verifying that
the referenced lead belongs to the authenticated tenant. `GET /api/clients/<id>`
then follows that ID without a tenant predicate and exposes limited source-lead
metadata. This permits a guessed ID to create an invalid cross-tenant relationship
and may disclose whether another tenant's lead exists.

The create path should reject a source lead unless it is in the authenticated
tenant and accessible to the current user. The read path should also include the
tenant predicate as defense in depth. A database-level same-tenant relationship
constraint should be considered in the structural-isolation work.

### High: multiple relationship IDs are not tenant-validated

A second pass audited IDs accepted from request bodies rather than only database
query predicates. Several authenticated endpoints write foreign IDs directly. An
attacker who guesses an ID can create a cross-tenant relationship, and some response
paths subsequently eager-load and expose the related record's name.

| Resource | Unsafe operations | Unvalidated relationship IDs |
| --- | --- | --- |
| Accounts | create, update | `client_id` |
| Contacts | create, update | `client_id`, `lead_id` |
| Projects | create, update | `client_id`, `lead_id` |
| Interactions | update | `client_id`, `lead_id`, `project_id` |
| Clients | create and source lookup | `source_lead_id` |

Interaction creation is a useful correct example: it requires exactly one related
entity, loads it with the authenticated tenant predicate, and applies record-level
access checks before writing. The update path does not repeat those checks and can
also leave more than one parent ID populated.

For every operation above, validate the proposed relationship before changing the
row. At minimum, the related object must belong to `request.user.tenant_id`; where
ordinary users are restricted to assigned/created records, the same access rule
must apply. Invalid cross-tenant IDs should use the same response as nonexistent IDs
to avoid an existence oracle.

Add two-tenant tests for both create and re-parent/update operations, including:

- a Tenant A ID used by Tenant B;
- an inaccessible record in the same tenant;
- two parent IDs supplied together;
- changing a valid relationship to an invalid one;
- verifying the database row is unchanged after rejection;
- list/detail/report queries after a deliberately malformed fixture, to prove they
  do not leak related names, counts, or dates.

### Authorization model needs an explicit decision

Tenant predicates prevent cross-company access, but several account and contact
routes allow every authenticated user to read or mutate every record in their
tenant. Other resources restrict ordinary users to records they created or were
assigned. Before MCP work, document whether accounts and contacts are intentionally
tenant-shared. If they inherit client/lead access, enforce that server-side on list,
detail, create, update, and delete—not only by hiding UI links.

### Critical: tenant admins can reach global database-backup operations

The backend actively registers `/api/admin/backups` routes that list, create,
restore, and delete whole-database backups. `Backup` and `BackupRestore` are global
models with no `tenant_id`, but these routes require only the ordinary `admin` role
used for tenant administration. The frontend page and navigation are commented out,
but that does not disable the API.

In the current multi-tenant model, an administrator from any tenant can call these
endpoints directly. A restore affects the shared database, making this a
platform-control boundary rather than a tenant-admin feature. The risk is amplified
because `requires_auth` currently authorizes roles from 30-day token claims rather
than the user's current database roles.

Before another production release:

1. Disable registration of the backup-management blueprint, or require a distinct
   platform-operator authorization mechanism unavailable to tenant accounts.
2. Do not attempt to fix whole-database restore merely by adding `tenant_id` to the
   metadata row; the underlying operation remains global.
3. Test that tenant admins receive a denial for list, status, create, restore,
   delete, and restore-history operations when calling the API directly.
4. Keep all backup and restore operations out of the MCP tool surface.

### High: frontend-only admin restrictions are not enforced consistently

The frontend places Reports and Lead Import under its admin-only route, but most
report endpoints and all lead-import endpoints use plain `@requires_auth()` on the
backend. Any authenticated user can bypass the hidden navigation and call them
directly. The client restore route likewise permits any authenticated tenant user to
restore any deleted client in that tenant, unlike lead/project restore paths that
apply record-level checks.

Treat the frontend route guard as presentation only. Confirm the intended policy,
then enforce it on the backend and add direct-API tests for non-admin users. Reports
intended for ordinary users should instead filter to records that user can access;
tenant-wide revenue, pipeline, and assignment data should not be exposed merely
because the caller has a valid login.

## Cleared concern: `password_changes.txt`

Despite its misleading name, this tracked backend file contains implementation
notes and example code for password-related features, not recorded credentials. A
targeted scan found no private key, password hash, JWT, GitHub token, AWS access key,
Sentry DSN, or password assigned to a string literal. No credential rotation or
Git-history rewrite is indicated by this file. Renaming it to describe its contents
would prevent the same false alarm later.

## Route inventory

The route-decorator scan found only these expected unauthenticated API operations:

- login
- forgot password
- reset password
- health check

The interaction calendar export was the sole unexpected public data route. Public
authentication endpoints still need rate-limit, token-lifetime, logging, and
forwarded-IP review.

## Tenant-audit script triage

The backend's `audit_tenant_isolation.py` scanned 106 query sites and reported 18
possible violations. Manual review reduced these to two real tenant findings:

- the public, unscoped interaction calendar query;
- the unvalidated/unscoped source-lead relationship.

The other 16 are false positives caused by the script's short text window or by
`UserPreference` being scoped through the globally unique authenticated user ID and
having no `tenant_id` column. Replace this regex/context check with structural tests
or a more reliable static check before making it a CI gate.

That script examines query text only; it did not detect the request-body
relationship issues listed above. Future checks must cover both query predicates and
foreign-ID validation on writes.

## Frontend observations

- No `dangerouslySetInnerHTML`, direct `innerHTML`, `eval`, or client-supplied
  `tenant_id` use was found under `src`.
- Many components redundantly pass Bearer headers even though `apiFetch` already
  supplies the current token. This is maintenance debt and makes consistent 401 and
  error behavior harder, but is not by itself a confirmed tenant leak.
- Web-session tokens are stored in `localStorage`. Moving to a hardened cookie or a
  carefully designed short-lived token model should be evaluated separately; the
  future MCP server must not reuse a long-lived browser token.

## Verification performed

- Frontend TypeScript check: passed.
- Frontend production build: passed.
- Frontend Playwright suite: 4 passed.
- Protected calendar regression verifies `Authorization: Bearer ...` is present.
- Focused lint found only pre-existing issues in the two caller pages: four explicit
  `any` errors and one hook-dependency warning.
