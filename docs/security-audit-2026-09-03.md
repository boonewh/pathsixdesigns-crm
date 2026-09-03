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

### Critical: possible credentials are committed to Git

The backend repository tracks `password_changes.txt`. Without displaying its
contents, the audit confirmed that it is non-empty (152 lines), mentions passwords,
and contains assignment-like text. Git history dates the file to commit `180a3bc`
on 2026-01-25.

Treat every credential recorded there as potentially disclosed:

1. Identify the affected accounts and systems without copying values into tickets,
   chat, logs, or commits.
2. Rotate or revoke each credential from the authoritative service.
3. Remove the file from the current tree and add an appropriate ignore rule.
4. Decide whether coordinated Git-history rewriting is needed. Removing the current
   file alone does not remove earlier copies.
5. Verify local clones, CI variables, deployments, and integrations use the rotated
   values.

Do not begin with history rewriting; credential rotation is what invalidates an
already copied secret.

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
possible violations. Manual review reduced these to the two real findings above:

- the public, unscoped interaction calendar query;
- the unvalidated/unscoped source-lead relationship.

The other 16 are false positives caused by the script's short text window or by
`UserPreference` being scoped through the globally unique authenticated user ID and
having no `tenant_id` column. Replace this regex/context check with structural tests
or a more reliable static check before making it a CI gate.

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

