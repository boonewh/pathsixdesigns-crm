# Bug fix (production): typing in Notes shows nothing, saves only the last letter — done

Same bug and fix as on staging (PR #20). The Lead and Project pages passed
`setNoteDraft` to `CompanyNotes` but not `noteDraft`, so the textarea kept its
own empty value and each keystroke replaced the draft with one letter; they also
showed the unsaved draft as the saved note, so Cancel could not restore it.

- [x] Lead and Project pages: `notes={record.notes || ""}` and `noteDraft={noteDraft}`.
- [x] `tests/notes-editing.spec.ts` (production layout: Notes is a collapsible
      box): fails on the old code (3 failed), passes on the new.
- [x] Checks: typecheck and build pass; lint unchanged (3 before and after);
      41 browser tests pass.

---

# UI refresh — corporate look and record-page UX (PLAN, awaiting approval)

Goal: make the CRM look and feel like a professional business product, based on
the approved mockup (https://claude.ai/artifact/CiGydUE1YobSD9BExQTiy1).
Frontend only. No database or API changes in this plan. Each phase is small,
ships as its own commit, and is checked before the next phase starts.

Checks after every phase: `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run test:e2e` (existing Playwright specs), plus a screenshot of the
changed screens for review.

## Phase 1 — Theme cleanup (look only, no behavior change)
- [ ] Set the theme tokens in `src/index.css` to the new palette: navy
      (logo color) for chrome, one blue for actions, neutral greys, and
      green/amber/red kept only for status.
- [ ] Change lead status badges in `src/config/crmConfig.ts` from emoji
      (🟡 📞 🔴) to plain colored pills; drop the emoji map in `Leads.tsx`
      and `LeadsTable.tsx`.
- [ ] Replace the hard-coded `bg-blue-600` / `bg-gray-300` buttons on the
      Leads, Lead detail and Account detail pages with the existing
      `components/ui/button.tsx` variants (primary / outline / destructive).
      Other pages are left alone in this phase.

## Phase 2 — Navigation (`SidebarNav.tsx`, `ProtectedLayout.tsx`)
- [ ] Sidebar: navy background, plain text links (no grey boxes or
      dividers), thin highlight on the active page; keep collapse + mobile drawer.
- [ ] Regroup to **Sales** (Dashboard, Leads, Accounts, Projects, Calendar),
      **Insights** (Reports, Files) and **Admin** (Users, Overviews, Import,
      Deletes, Settings). Same routes and admin rules; only grouping changes.
- [ ] Top bar: navy, search box styled for the dark bar, replace the ☰ text
      with an icon, and move Logout / Change password / User Guide into an
      avatar menu (uses the existing `@headlessui/react` Menu).

## Phase 3 — Lead and Account record pages (fixes the collapsed boxes)
- [ ] New shared `RecordHeader` component: name, type, key fields row
      (stage, source, owner, created), and all actions in one place
      (Edit, Assign, Convert). Shows lead status and source, which the lead
      page does not display today.
- [ ] New shared `RecordTabs` component: Activity / Notes / Contacts /
      Projects (+ Subscriptions on accounts) as always-visible tabs with counts.
- [ ] Remove the `<details>` wrapper from `CompanyInteractions`,
      `CompanyNotes`, `CompanyContacts`, `CompanySubscriptions` and the
      inline Projects block, so they render open inside a tab. Their inner
      logic is not changed.
- [ ] Use the header + tabs in `LeadDetailPage.tsx` and `ClientDetailPage.tsx`;
      details (phone, email, address) move to a labeled side panel.
- [ ] Stage path (Open → Qualified → Proposal → Won) on the lead page, using
      the existing `PUT /leads/:id` with `lead_status`.

## Phase 4 — Leads list (`Leads.tsx`, `LeadsTable.tsx`)
- [ ] Make Table the default view for new users (saved preference still wins).
- [ ] Pipeline strip above the list: count per stage, click to filter
      (replaces the Status dropdown). Counts come from the leads already loaded.
- [ ] Toolbar cleanup: one "New lead" primary button, remove the duplicate
      top pagination and the "Showing X of Y" line.

## Phase 5 — Small UX polish on the touched pages
- [ ] Replace `alert()` on the Leads / Lead detail / Account detail pages
      with `toast.error` / `toast.success` (Toaster already mounted in `main.tsx`).
- [ ] After assigning a lead, update the page state instead of
      `window.location.reload()`.
- [ ] Replace "Loading..." text with simple skeleton placeholders on these pages.

## Not in this plan (need backend work, listed for a later decision)
- Single `POST /leads/:id/convert` endpoint. Today Convert is 4 separate
  browser requests; a failure midway can leave a duplicate account or a lead
  marked Won but not converted. Recommended as the next backend task.
- "Last activity" / "Next step" columns and overdue highlighting on the
  Leads table (needs the API to return these per lead).
- Estimated value per lead and $ totals in the pipeline strip (no field today).
- Saved views, bulk actions, Ctrl+K search.

## Review
(to be filled in when the work is done)

---

# October 29 frontend security upgrade — tested maintenance

- [x] Preserve original branch/history, modified source, untracked files and
      private local configuration in a local-only backup under the upgrades folder.
- [x] Identify live production/staging projects and sources; compare newer code
      with preserved purge/API work instead of overwriting it.
- [x] Audit lockfile: 20 affected entries (17 high, 2 moderate, 1 low), fixes available.
- [x] Assess token-decoding and explicit telemetry privacy issues; record impacts.
- [x] Review `G:\Projects\upgrades\PATHSIX_FRONTEND_UPGRADE_PLAN.md` before edits. User approved implementation.
- [x] Implement/test approved dependency, Node/CI, token and telemetry maintenance. Local type/build, five security groups and 38 browser tests pass.
- [ ] Preserve separate production/staging behavior; review tested result and
      release to the correct projects when authorized. No database changes planned.
- [ ] Record final versions/source/release evidence and reconcile local handoff.

**Review:** approved implementation complete locally on the separate production lineage; see SECURITY_UPGRADE_2026-10-29.md. Linux CI and tested-result review precede release. No database, hosted environment, original app files or deployment changed. Original local sync remains deferred. The older Phase0 notes below are historical, not a request
to repeat old tasks or destroy Fly apps.

---

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

## Backend (`pathsix-backend` — separate repo)

- [x] **Reconcile git with prod (main):** committed 3 interaction/search fixes that
      were live in prod (`v78`, deployed May 14) but never committed — git was behind
      production. Backend deploys from the working tree via `flyctl deploy`, so this
      drift is easy to hit. Commit `8c7275a`.
- [x] Branch off `main` (`phase-0-safety-rails`).
- [x] Archive obsolete docs → `docs/archive/` (`CRM_MIGRATION_GUIDE.md`,
      `CRM_MIGRATION_SCRIPT_FOR_ASFI.md`, `migrate_from_old_crm.py`,
      `wipe_tenant1_new_db.py`).
- [x] Delete dead `app/utils/security.py` (unused PyJWT module) and the redundant
      `Message` model (bare duplicate of `ChatMessage`, referenced nowhere; the
      orphan `messages` table can be dropped later via a staged migration).
      Note: `ChatMessage` is also currently unused — left for a possible future chat.
- [x] gitignore `.codex/`; add `.github/workflows/ci.yml` (compile gate; pytest in P4).
- Backend Phase 0 commit `b8319a7`.

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
