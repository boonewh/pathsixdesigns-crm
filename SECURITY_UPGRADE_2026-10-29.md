# Frontend security maintenance — October 29, 2026

This reviewed maintenance branch starts from staging source `b6612de24be3470420f3f862b964e0a1616ea88c`.
Release requires review of the tested result; merging to `staging` triggers its existing Vercel production deployment.
No database, hosted environment or customer-record change is included.

## Changes and impact

- React/DOM19.2.9, Router7.18.5, Zod4.6.7, Vite6.4.5, Playwright1.64.1,
  PostCSS8.5.32 and Tailwind3.4.19; FullCalendar6.1.22 packages aligned.
  Sentry stays on major10 (10.78.0), TypeScript5.9.3 is retained.
  The regenerated lockfile reports zero known npm advisories, including development dependencies.
- Pin local/CI Node24.22.1, Node types24.19.2, ESLint10.13.0 and compatible plugins.
  Existing hooks rules remain in effect. Three redundant initial assignments were
  removed and JSON parsing errors retain their cause for the newer lint rules.
  CommonJS Tailwind/PostCSS configuration remains compatible.
- Decode JWT base64url and UTF-8 correctly at login and expiry, with bounded claim
  validation. Storage keys, backend signature/permission enforcement, token lifetime
  and logout behavior are unchanged.
- Remove entered login emails and raw API error bodies from Sentry captures.
  Error, transaction, span, breadcrumb and replay custom-event hooks remove private
  fields and URL queries/reset credentials while retaining status, method, stack
  positions and trace linkage. Console/UI breadcrumbs are dropped; existing replay
  masking is retained and inputs are explicitly masked. Direct reset links do not
  start telemetry/replay. This deliberately reduces diagnostic detail.
- Modernize CI to pinned official action revisions, Ubuntu24.04 and Node24.22.1;
  run security helpers, typecheck, build and the complete browser suite.
  The test server binds only loopback, uses a strict port, never reuses an unrelated
  process and has a finite global timeout.

## Local verification

- Typecheck and production build pass; five security unit groups pass.
- **43 browser tests pass**, including login/expiry, telemetry/reset privacy,
  lead editing, tenant terminology, archive, retry/read cancellation, reports,
  Trash safeguards and unauthorized logout.
- Staging also retains its admin password reset, forgot-password progress and protected calendar-download checks.
- Lint remains visible: **92 existing errors /19 warnings**. Production's exact
  rule/message multiset matches its baseline; no historical rules were disabled.
  Lint is not represented as passing or added as a failing CI gate.
- Existing large-bundle and Node module-detection warnings remain visible.
  Early Windows runs passed assertions but stalled in test-server teardown inside
  the restricted process sandbox. A rerun with process permissions exited cleanly;
  this was not an application logout failure. Linux CI provides the release check.

## Preservation and release boundary

The dirty original `G:\Projects\pathsixdesigns-crm` remains untouched by application
edits. Full Git history, tracked/staged patches, untracked files and private local
configuration were preserved in the local-only upgrades backup. The four original
application/test files were verified unchanged. Do not publish private configuration.
Original-folder reconciliation stays urgent before its next coding/install/deploy;
compare wanted local edits individually rather than copying the old API/dialog over
newer tenant-aware/read-activity code. Production and staging retain distinct lineages
and backend targets. No live API mutations, real emails or database migrations were
used to verify this release.
