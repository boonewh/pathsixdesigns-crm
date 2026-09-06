# PathSix CRM MCP readiness roadmap

Last reconciled: 2026-09-06

Immediate REST fixes and tests: see backend `docs/reliability-security-2026-09-06.md`.
Staging verification is in progress. This does not mean all MCP gates are complete.

## Goal

Allow a tenant's users to connect their preferred AI client to PathSix CRM through a
remote MCP server without exposing another tenant's data or granting broader access
than the user approved.

The MCP server should be a thin adapter over the same tenant-safe business services
used by the web API. It should not duplicate route logic and should never query the
database directly from a generic tool handler.

Current MCP authorization reference:
<https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/basic/authorization/index.mdx>

## Non-negotiable invariants

- Tenant identity comes only from a validated access token and server-side user
  lookup.
- A tool never accepts `tenant_id` as an argument.
- Every entity lookup combines entity identity with the authenticated tenant.
- Permissions are evaluated from current server-side state, not stale token claims.
- An inactive user, tenant, connection, or OAuth grant is denied immediately.
- Access tokens are short-lived, audience-bound, scoped, and revocable.
- Every MCP call produces a durable audit event.
- Staging uses synthetic data and separate credentials.
- Read-only MCP capabilities ship before mutation tools.
- No generic SQL, unrestricted search, arbitrary URL fetch, or free-form code tool is
  exposed.

## Gate 0 — recover operations and establish a clean baseline

- [x] Preserve this roadmap and the current handoff in Git.
- [x] Commit the existing frontend and backend Sentry reliability fixes on feature
      branches. (Backend baseline preserved in `4401b02`; fixes in `7c4fd50`.)
- [ ] Audit all six CRM-related Fly resources. (Fly authentication works; current app/staging DB checks complete,
      full six-resource inventory remains.)
- [ ] Confirm staging and production deployment revisions.
- [x] Confirm staging contains synthetic data only.
- [ ] Record the expected cost and sleep policy for the staging database.
- [ ] Verify backup creation and restore procedures without restoring production.
- [x] Make backend dependency installation plus `pytest` a CI gate.

Exit criterion: both repositories are clean, staging is reproducible, and the team
can identify exactly which revision is running in each environment.

## Gate 1 — close immediate application security gaps

- [x] Disable the global backup-management API for tenant accounts or protect it
      with a separate platform-operator boundary; never expose backup/restore via
      MCP.
- [x] Authenticate and tenant-scope the interaction calendar endpoint.
- [x] Validate every request-body relationship ID against the authenticated tenant
      and record-access policy. Current gaps include account `client_id`, contact
      `client_id`/`lead_id`, project `client_id`/`lead_id`, interaction-update
      parent IDs, and client `source_lead_id`.
- [x] Enforce exactly-one/allowed-parent invariants for contacts, projects, and
      interactions on both create and update.
- [x] Decide and document whether accounts and contacts are tenant-shared or inherit
      parent record permissions, then enforce the decision server-side.
- [x] Enforce backend—not merely frontend—admin authorization for Reports and Lead
      Import, and align client restore with lead/project record-access checks.
- [x] Remove password-reset links/tokens from application logs.
- [x] Enforce `Tenant.is_active` in the central authentication path.
- [x] Stop trusting token-embedded roles for authorization decisions.
- [x] Inventory every public route and document why it is public.
- [x] Replace the current regex tenant-audit script with structural tests or a more
      reliable static check.
- [x] Review forwarded-IP handling before relying on it for rate limiting.

Account/contact policy: inherit client/lead access. Standalone projects remain valid;
contacts/interactions require exactly one parent. Forwarded headers are ignored
until trusted ingress is configured, so proxy clients may share a rate-limit bucket.

Exit criterion: no known route can return tenant data without authenticated,
tenant-scoped authorization.

## Gate 2 — make tenant isolation structural

- [ ] Create a request-scoped principal containing `user_id`, `tenant_id`, current
      roles/permissions, and connection identity.
- [ ] Move database access from route functions into tenant-bound service/repository
      APIs.
- [ ] Require a tenant context when constructing every tenant-owned query.
- [ ] Inventory all tenant-owned tables, including subscriptions, files, logs,
      preferences, imports, and backup metadata.
- [ ] Add missing tenant foreign keys and indexes.
- [ ] Add constraints that prevent relationships from crossing tenant boundaries.
- [ ] Evaluate and preferably implement PostgreSQL row-level security as a database
      backstop using transaction-local tenant context.
- [ ] Ensure background jobs, imports, backups, and restore jobs use explicit tenant
      context rather than bypassing the boundary.

Exit criterion: an application-code mistake is not sufficient by itself to read or
write another tenant's rows.

## Gate 3 — prove isolation adversarially

Create Tenant A and Tenant B with overlapping numeric IDs and users at each role
level. For every resource type and endpoint, verify:

- [ ] Tenant A cannot list Tenant B records.
- [ ] Tenant A cannot fetch Tenant B records by a guessed ID.
- [ ] Tenant A cannot update, assign, delete, restore, purge, or export Tenant B
      records.
- [ ] Tenant A cannot attach its records to Tenant B users or parent entities.
- [ ] Search, reports, counts, and autocomplete do not leak names or existence.
- [ ] File metadata, download paths, object-storage keys, and signed URLs are
      isolated.
- [ ] Bulk actions and imports validate every referenced object.
- [ ] Admin means tenant admin, not global admin.
- [ ] Disabled users, tenants, and grants lose access immediately.
- [ ] Tests run against PostgreSQL in CI so database policies are exercised.

Exit criterion: the cross-tenant suite is a required CI check and fails when a tenant
predicate or database policy is intentionally removed.

## Gate 4 — delegated authorization for remote MCP

- [ ] Choose or implement an OAuth 2.1 authorization server.
- [ ] Publish OAuth protected-resource metadata and authorization-server discovery.
- [ ] Use Authorization Code with PKCE for users connecting an AI client.
- [ ] Bind access tokens to the MCP server audience/resource.
- [ ] Implement short access-token lifetimes, refresh rotation, revocation, and grant
      management.
- [ ] Store grants by tenant, user, client, scopes, creation time, last use, and
      revocation status.
- [ ] Define incremental scopes, for example:
  - `clients:read`
  - `clients:write`
  - `leads:read`
  - `leads:write`
  - `projects:read`
  - `projects:write`
  - `interactions:read`
  - `interactions:write`
  - `reports:read`
- [ ] Provide a CRM page where users can inspect and revoke connected AI clients.
- [ ] Rate-limit by tenant, user, OAuth client, tool, and source—not only by process
      memory or IP address.

Exit criterion: a user can grant and revoke narrow MCP access without sharing their
CRM password or a long-lived web-session token.

## Gate 5 — read-only MCP pilot

Start with narrowly typed tools such as:

- `search_clients`
- `get_client`
- `search_leads`
- `get_lead`
- `list_followups`
- `get_project`
- `get_pipeline_summary`

Requirements:

- [ ] Explicit pagination and maximum result sizes.
- [ ] Field minimization by default.
- [ ] Stable, structured outputs rather than copied HTML.
- [ ] Tool-level scope checks plus existing CRM role checks.
- [ ] No detailed distinction between "not found" and "belongs to another tenant."
- [ ] Treat all CRM text as untrusted data, never as instructions to the server.
- [ ] Audit tenant, user, client, scopes, tool, sanitized argument summary, result
      count/status, latency, and request ID.
- [ ] Add MCP-level versions of the Gate 3 cross-tenant tests.

Exit criterion: a limited staging pilot can read only the exact data available to the
same user in the CRM UI, with a complete audit trail.

## Gate 6 — mutation tools

- [ ] Add write tools one workflow at a time.
- [ ] Use separate write scopes and clear tool descriptions.
- [ ] Require explicit client/user confirmation for consequential operations.
- [ ] Add idempotency keys for create and destructive operations.
- [ ] Add optimistic concurrency/version checks to prevent silent overwrites.
- [ ] Return previews for bulk or destructive work before applying it.
- [ ] Make delete/purge/export behavior consistent with CRM permissions and retention
      policy.
- [ ] Test duplicate, replayed, reordered, and partially failed requests.

Exit criterion: retries cannot duplicate work, stale agents cannot overwrite newer
human edits, and every mutation is attributable and reviewable.

## Gate 7 — production readiness

- [ ] Complete threat modeling for cross-tenant leakage, confused deputy, prompt
      injection, token theft, malicious OAuth clients, and excessive tool output.
- [ ] Perform an external security review focused on tenant isolation and OAuth.
- [ ] Add durable distributed rate limiting and abuse detection.
- [ ] Add MCP-specific Sentry filtering, alerts, dashboards, and runbooks without
      capturing CRM content unnecessarily.
- [ ] Test backup/restore behavior for OAuth grants and audit records.
- [ ] Establish incident response, key rotation, client revocation, and tenant export
      procedures.
- [ ] Pilot with synthetic staging accounts, then internal production accounts, then
      a small opt-in customer group.

Exit criterion: production access is gradual, observable, reversible, and supported
by documented incident procedures.

## Recommended implementation sequence

Do not begin with an MCP SDK. Begin by extracting one read path—such as client
search—into a tenant-bound service and proving it with two-tenant tests. Have the
existing REST route call that service. Once several core services are proven, add a
read-only MCP adapter that calls the same APIs. This prevents REST and MCP from
developing separate authorization behavior.
