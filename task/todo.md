# UI refresh — corporate look and record-page UX (approved — staging only)

Goal: make the CRM look and feel like a professional business product, based on
the approved mockup (https://claude.ai/artifact/CiGydUE1YobSD9BExQTiy1).
Frontend only. No database or API changes in this plan.
Target: `staging` branch only (Vercel staging project + staging backend).
Nothing goes to `main`/production until the owner approves the finished result.
Each phase is small,
ships as its own commit, and is checked before the next phase starts.

Checks after every phase: `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run test:e2e` (existing Playwright specs), plus a screenshot of the
changed screens for review.

## Phase 1 — Theme cleanup (look only, no behavior change)
- [x] Set the theme tokens in `src/index.css` to the new palette: navy
      (logo color) for chrome, one blue for actions, neutral greys, and
      green/amber/red kept only for status.
- [x] Change lead status badges in `src/config/crmConfig.ts` from emoji
      (🟡 📞 🔴) to plain colored pills; drop the emoji map in `Leads.tsx`
      and `LeadsTable.tsx`.
- [x] Replace the hard-coded `bg-blue-600` / `bg-gray-300` buttons on the
      Leads, Lead detail and Account detail pages with the existing
      `components/ui/button.tsx` variants (primary / outline / destructive).
      Other pages are left alone in this phase.

Phase 1 notes (done):
- Tokens: action blue, blue-tinted greys and darker navy text. Accent and
  neutral are unchanged because the sidebar hover uses them; Phase 2 restyles it.
- New `components/ui/StatusBadge.tsx`: colored pill with a dot and the status
  label (tenant `statusConfig.labels`, else capitalized). It keeps each tenant's
  own colors. Emoji no longer render on the Leads cards or table.
- Buttons on the Leads / Lead detail / Account detail pages now use the shared
  `Button` (primary = blue, secondary = outline). Convert went from green to
  primary and Assign from yellow to outline. Added a gap between them.
- `Button` outline hover changed from mid-blue to light grey.
- Not yet changed: the emoji badges on the Accounts list, Accounts table and
  Admin Leads pages (outside this phase's files). Same one-line swap if wanted.
- Checks: typecheck and build pass; lint has the same 10 errors on these files
  as before; all 43 browser tests pass.

## Phase 2 — Navigation (`SidebarNav.tsx`, `ProtectedLayout.tsx`)
- [x] Sidebar: navy background, plain text links (no grey boxes or
      dividers), thin highlight on the active page; keep collapse + mobile drawer.
- [x] Regroup to **Sales** (Dashboard, Leads, Accounts, Projects, Calendar),
      **Insights** (Reports, Files) and **Admin** (Users, Overviews, Import,
      Deletes, Settings). Same routes and admin rules; only grouping changes.
- [x] Top bar: navy, search box styled for the dark bar, replace the ☰ text
      with an icon, and move Logout / Change password / User Guide into an
      avatar menu (uses the existing `@headlessui/react` Menu).

Phase 2 notes (done):
- New `chrome` color tokens (navy) in `index.css` + `tailwind.config.js` for the
  sidebar and top bar.
- Sidebar groups: Sales (Dashboard, Leads, Accounts, Projects, Calendar),
  Insights (Reports for admins, Files), Workspace (Settings, Deletes) and Admin.
  Settings and Deletes stay in their own group rather than Admin, because every
  user (not just admins) can use them today. Routes and admin rules unchanged.
- Active link also highlights on detail pages (e.g. /leads/12 highlights Leads).
- Logo fix: "Path", "Six" and "CRM" were separate SVG texts at fixed positions,
  so a gap could open between Path and Six depending on the font. Now one
  <text> with <tspan>s so PathSix always renders as one word. White text on navy;
  custom tenant logos sit on a small white background so dark logos stay visible.
- Top bar: navy, Menu icon instead of the ☰ character, search with an icon, and
  an account menu (Settings, Change password, User Guide, Log out). The "PathSix
  CRM" title shows on phones only (the sidebar logo covers desktop). On phones
  the search box wraps to its own row (the first try overflowed 390px screens,
  caught by the existing mobile tests).
- Checks: typecheck and build pass; lint unchanged on touched files (2 errors,
  1 warning before and after); all 43 browser tests pass.

## Phase 3 — Lead and Account record pages (fixes the collapsed boxes)
- [x] New shared `RecordHeader` component: name, type, key fields row
      (stage, source, owner, created), and all actions in one place
      (Edit, Assign, Convert). Shows lead status and source, which the lead
      page does not display today.
- [x] New shared `RecordTabs` component: Activity / Notes / Contacts /
      Projects (+ Subscriptions on accounts) as always-visible tabs with counts.
- [x] Remove the `<details>` wrapper from `CompanyInteractions`,
      `CompanyNotes`, `CompanyContacts`, `CompanySubscriptions` and the
      inline Projects block, so they render open inside a tab. Their inner
      logic is not changed.
- [x] Use the header + tabs in `LeadDetailPage.tsx` and `ClientDetailPage.tsx`;
      details (phone, email, address) move to a labeled side panel.
- [x] Stage path (Open → Qualified → Proposal → Won) on the lead page, using
      the existing `PUT /leads/:id` with `lead_status`.

Phase 3 notes (done):
- New `components/ui/RecordLayout.tsx`: RecordHeader, StagePath, RecordFields
  (the "About" panel), RecordTabs and ProjectList (the project list was
  duplicated on both pages).
- The collapsible boxes got an `embedded` option instead of being removed, so
  the Project detail page (which also uses Interactions and Notes) is unchanged.
  Embedded sections render open, and report their counts for the tab badges.
- Tabs keep every panel mounted (just hidden), so each section loads once on
  page open, the same as the old collapsible boxes did. No extra API calls.
- Lead page: header shows Status, Source, Owner, Type, Created (status and
  source were not shown on this page before). Assign and Convert moved to the
  header. Stage path uses the existing `PUT /leads/:id` with `lead_status` and
  shows a toast. "Lost" is left off the path (it is not a forward step) and
  still shows in the Status badge.
- Account page: header shows Status, Type, Lead source, Converted, Created.
  The green "Converted from Lead" box became header fields plus an "In
  pipeline" line in About. Subscriptions tab shows only when the feature is on.
- No Edit button was added to the header: these pages have no edit form today.
- Checks: typecheck and build pass; lint unchanged on touched files (10 before
  and after); all 43 browser tests pass; no horizontal overflow at 390px.

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
- [x] Implement/test approved dependency, Node/CI, token and telemetry maintenance. Local type/build, five security groups and 43 browser tests pass.
- [ ] Preserve separate production/staging behavior; review tested result and
      release to the correct projects when authorized. No database changes planned.
- [ ] Record final versions/source/release evidence and reconcile local handoff.

**Review:** approved implementation complete locally on the separate staging lineage; see SECURITY_UPGRADE_2026-10-29.md. Linux CI and tested-result review precede release. No database, hosted environment, original app files or deployment changed. Original local sync remains deferred. The older Phase0 notes below are historical, not a request
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
