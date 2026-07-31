# Improvement 2 — Phase 0: Safety rails & housekeeping

Working branch: `phase-0-safety-rails` (off `main`). Full plan lives in
`~/.claude/plans/in-this-project-is-functional-galaxy.md`.

## Frontend (this repo)

- [x] Create feature branch off `main` (`phase-0-safety-rails`).
- [x] Fix the **ErrorBoundary route-reset bug** in `App.tsx` — added
      `useLocation()` + `key={location.pathname}` so it remounts on navigation
      (the original `todo.md` item, which was marked done but never applied).
- [x] Delete dead frontend code: `components/Layout.tsx` (legacy shell),
      unused `NetworkErrorPage`/`LoadingErrorPage` exports in `ErrorBoundary.tsx`.
- [x] Fix ESLint: removed legacy `.eslintrc.json`, installed the missing flat-config
      toolchain (pinned to era-matched majors: TS 5, ESLint 9), added `lint` +
      `typecheck` npm scripts, bumped stale `ecmaVersion` 2020 → 2022.
- [x] Get **typecheck green** (was 13 latent errors, never enforced because `build`
      never ran `tsc`): removed unused imports/vars across 8 files; fixed a real
      Zod-4 API break in `subscriptionSchemas.ts`; removed a dead `onClose` prop in
      `Projects.tsx` (verified redundant — `handleCancel` already closes the modal).
- [x] Add **CI** (`.github/workflows/ci.yml`): PRs gate on `typecheck` + `build`.

## Backend (`pathsix-backend` — separate repo, next)

- [ ] Branch off `main` there.
- [ ] Archive obsolete docs out of repo root (`CRM_MIGRATION_GUIDE.md`,
      `CRM_MIGRATION_SCRIPT_FOR_ASFI.md`, `migrate_from_old_crm.py`,
      `wipe_tenant1_new_db.py`) → `docs/archive/`.
- [ ] Delete dead code: `app/utils/security.py` (dead PyJWT module), redundant
      `Message` model (verify unreferenced first).
- [ ] Add a backend CI stub (pytest wired in Phase 4).

## Fly housekeeping (user action)

- [ ] After the observation window: `flyctl apps destroy pathsix-backend` and
      `pathsix-db` (old apps, already stopped; snapshot taken).

## Not gating CI yet (deferred)

- Lint currently reports 122 problems (mostly `no-explicit-any`) — config now works,
  but the `any` cleanup is Phase 5. Lint is runnable locally; not a CI gate yet.

## Review

*Frontend Phase 0 complete on branch `phase-0-safety-rails`; nothing committed yet
(awaiting go-ahead). Typecheck + build both green. No behavior changes — only dead
code removed, a broken Zod message fixed, the ErrorBoundary navigation bug fixed, and
tooling/CI added. Backend Phase 0 items pending. Full review to be completed once the
whole phase lands.*
