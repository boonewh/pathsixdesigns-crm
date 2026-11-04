# Phase 10 — Admin pages (staging) — plan, waiting for approval

Target: `staging` only. Same ideas as the earlier phases. Nothing to `main`.

Found while reading the code:
- **Bug (Admin Leads): bulk delete can delete leads you can't see.** Checked
  leads stay selected when you change page, page size, sort or user, so
  "Delete Selected (3)" can delete leads from another page or another user's
  list. The delete button is also duplicated (top and bottom), and a network
  error during delete is not handled.
- **Bug (Admin Interactions): project interactions show "—" as the name.**
  The backend sends `project_name`, the page only looks at client/lead names.
- **Bug (Admin Interactions): wrong groups.** Interactions with no follow-up
  at all are listed under "Upcoming", and "today" is worked out in UTC, so in
  the US evening tomorrow's follow-ups show as "Today" (the Dashboard uses
  local time).
- **Bug (Admin Leads/Accounts/Projects): the "No … found" row is one column
  short** (colSpan 8/7/9 for 10/8/10 columns).
- Admin Projects: "Account:" label is hard-coded (wrong for a tenant that
  calls them Customers); project names aren't links (Leads/Accounts are).
- `alert()` popups for failed saves/deletes on Admin Leads, Accounts,
  Projects and Users; Users role/email changes don't handle network errors.
- Old look: emoji + lowercase status badges ("🟡 proposal"), blue titles,
  plain gray tables with shadows, wrench icon for Edit, pagination shown twice.

## Todo
- [ ] Admin Leads: clear the selection whenever the list reloads (page, page
      size, sort, user); one bulk-delete button in a toolbar above the table;
      try/catch with toasts; single confirm stays.
- [ ] Admin Interactions: show project names (and link); put interactions
      without a follow-up in their own "No follow-up" group; use local dates
      (same rules as the Dashboard).
- [ ] Fix the colSpan of the empty rows (Leads, Accounts, Projects).
- [ ] Admin Projects: use the configured label (Account/Customer…), link
      project names to the project page, status via shared `StatusBadge`.
- [ ] Admin Leads: status via shared `StatusBadge` (no emoji, proper labels).
- [ ] Replace `alert()` with toasts (Leads, Accounts, Projects, Users) and add
      try/catch where missing.
- [ ] Same look as the rest: page frame `p-4 lg:p-6`, plain titles, "Filter
      by user" select styled like other inputs, tables in white bordered
      cards with the muted header, pencil "Edit" button (like Leads table),
      pagination once (bottom), shared `Button` (Users "New user", Save, etc.).
- [ ] Backups / Import: page frame and title style only (they already use
      toasts).
- [ ] Browser tests: selection clears on page change (no hidden deletes),
      project interaction name shows, no-follow-up group, empty row spans the
      table, failed save shows a toast (no alert).
- [ ] Run all browser tests + lint (compare with before), screenshots, PR into `staging`.

Not included (say if you want it): phone-specific lists for admin tables
(they scroll sideways inside their card, which is usual for admin screens).

# Phase 9 — Deletes, Reports, Settings, Help (staging) — done

Target: `staging` only. Same ideas as the earlier phases. Nothing to `main`.

Found while reading the code and screenshots:
- **Bug (Deletes): broken character in the error message.** The file has a
  stray Windows-1252 apostrophe, so "Trash couldn't be refreshed" shows as
  "Trash couldn�t be refreshed". It's the only file in `src/` with this problem.
- **Bug (Deletes): Restore has no error handling.** A failed restore shows a
  browser `alert()`; a network error throws an unhandled error and nothing is
  shown. A successful restore gives no feedback (the row just vanishes).
- Deletes: page says "Trash" but the menu says "Deletes"; tables sit
  straight on the gray background; every row has a solid blue Restore and a
  solid red "Delete Permanently" button (very loud, and on phones two
  full-width buttons per record).
- Reports: report cards use a drop shadow instead of the bordered cards used
  everywhere else; tab underline/colors are hard-coded blues.
- Settings: narrow column centered in the middle of the page (everything
  else is left-aligned); "Change Password" is a plain link.
- Help: the account menu calls it "User Guide", but the page is only about
  Reports and is titled "Reports User Guide". Very large heading, bright blue
  callout box, colored bullets.
- `src/components/reports/ActivityReports.tsx` (316 lines) and
  `src/pages/TrashPage.module.css` are not used anywhere.

## Todo
- [x] Deletes: fix the broken character.
- [x] Deletes: Restore uses try/catch; toast "<name> restored" on success,
      toast error on failure. No `alert()`.
- [x] Deletes: title "Deletes" (same as the menu); each section in a white
      bordered card with a count ("Deleted Leads (2)"); Restore as an outline
      button, "Delete permanently" as a quiet red text button (the
      confirmation dialog stays exactly as it is). Phones: buttons side by side.
- [x] Reports: bordered cards instead of shadows (class swap in the report
      components), tabs use the theme colors, page frame `p-4 lg:p-6`.
- [x] Settings: left-aligned like other pages, bordered card, "Change password"
      as an outline button. (Dev-only Sentry test box left alone.)
- [x] Help: title "Reports guide" and the account menu item renamed to
      "Reports guide" so they match; normal-size heading, neutral callout,
      plain bullets, bordered cards. Content unchanged.
- [x] Remove the two unused files.
- [x] Browser tests: Deletes restore success/failure (toast, no alert), error
      text has no broken character; existing Trash/purge tests still pass.
- [x] Run all browser tests + lint (compare with before), screenshots, PR into `staging`.

## Review
- `src/pages/TrashPage.tsx`: fixed the broken apostrophe (stray Windows-1252
  byte); Restore wrapped in try/catch with toasts ("<name> restored" /
  "Couldn't restore <name>…"), no `alert()`; title "Deletes"; sections are
  white bordered cards with counts; Restore = outline button, "Delete
  permanently" = quiet red text button (confirmation dialog untouched);
  phone buttons side by side.
- Reports: report cards use borders instead of shadows (class swap in 5
  report components), date filter box white/bordered, tabs use theme colors,
  page frame `p-4 lg:p-6`.
- `src/pages/Settings.tsx`: left-aligned, bordered card, "Change password"
  outline button. Dev-only Sentry box unchanged.
- `src/pages/HelpPage.tsx` + account menu: both now "Reports guide"; calmer
  sizes/colors; content unchanged.
- Removed unused `src/components/reports/ActivityReports.tsx` and
  `src/pages/TrashPage.module.css`.
- `tests/deletes.spec.ts`: 4 tests (restore success, restore failure, error
  text without broken characters, phone fits). Existing Trash/purge tests
  pass unchanged.
- Checks: 69/69 browser tests, `tsc` clean, lint unchanged on touched files
  (7 old problems, none new).


# Phase 8 — Calendar (staging) — done

Target: `staging` only. Same ideas as Leads/Dashboard. Nothing to `main`.

Found while reading the code and screenshots:
- **Bug: changing the filter throws you back to today.** Every filter change
  re-downloads all interactions and swaps the calendar for "Loading...", so
  the calendar is rebuilt and you lose the month/week you navigated to.
- **Bug: loading never ends if the request fails.** No error handling: a
  network error or a 500 leaves "Loading follow-ups..." on screen forever.
- **Bug: the follow-up window has no summary.** The Calendar doesn't pass the
  interaction summary to the window (the Dashboard does), so you see outcome
  and notes but not what the follow-up is about.
- Dragging a follow-up to a new day: failures use browser `alert()` popups,
  and success gives no feedback at all.
- Old look: default FullCalendar dark-gray buttons, yellow "today" cell,
  emoji legend and emoji on every event, bold "Filter by:" label, double
  padding on desktop.
- Phones: opens on a single-day 5am–10pm grid, which is mostly empty
  scrolling. Phone calendar apps open on an agenda list instead.

## Todo
- [x] Load once; filter in the page (no re-download, calendar keeps its place).
- [x] Error handling: message "Couldn't load follow-ups. Please refresh…"
      instead of loading forever; loading placeholder like the other pages.
- [x] Pass the summary to the follow-up window.
- [x] Drag to reschedule: toast "Follow-up moved to <date>" on success, toast
      error (and the event jumps back) on failure. No `alert()`.
- [x] Page frame like the other pages: `p-4 lg:p-6`, title "Calendar".
- [x] Toolbar: type filter as a small segmented control
      (All / Clients / Leads / Projects), "24 hours" toggle as the shared
      outline Button, legend as colored dots (no emoji).
- [x] Calendar inside a white card; theme FullCalendar with our colors
      (outline buttons, blue active view, light-blue "today", our borders) —
      CSS variables in `src/index.css`, no library changes.
- [x] Events: colored dot by type + name (no emoji); overdue in red;
      completed in gray with a line through (kept as today).
- [x] Phones: open on a "List" (agenda) view of the week — needs one small
      official package, `@fullcalendar/list` (same version as the other
      FullCalendar packages). Desktop keeps Month as default, List added as a
      4th view button.
- [x] Browser tests: filter keeps your place and doesn't re-download; error
      message on failure; summary shown in the window; drag failure shows a
      message instead of an alert; phone opens on the list, no sideways scroll.
- [x] Run all browser tests + lint (compare with before), screenshots, PR into `staging`.

## Review
- `src/pages/CalendarPage.tsx`: loads once (with error handling and a
  loading placeholder); the type filter works on loaded data, so the calendar
  keeps your place. Follow-up window gets the summary (window now reads the
  interaction directly instead of copying fields). Drag to reschedule shows a
  toast either way, keeps the moved date, jumps back on failure. Segmented
  type filter doubles as the color legend; events show a colored dot, overdue
  red, completed gray/struck through. Phones open on List (week); desktop
  keeps Month with a List button. Removed the 4 `any` lint errors.
- `src/index.css`: FullCalendar theme via its CSS variables (outline
  buttons, blue active view, light "today", our borders and header style).
- `package.json` / `package-lock.json`: added `@fullcalendar/list` 6.1.22
  (lockfile edited by hand to add only that entry; the local npm version
  would otherwise have rewritten unrelated lines).
- `tests/calendar.spec.ts`: 6 tests (filter keeps place without reloading,
  load error, summary, drag success, drag failure without alert, phone list).
- Checks: 65/65 browser tests, `tsc` clean, lint 0 errors on the Calendar,
  production build OK.


# Phase 7 — Dashboard (staging) — done

Target: `staging` only. Same ideas as Leads/Accounts/Projects. Nothing to `main`.

Found while reading the code:
- **Bug: the Dashboard only looks at the 10 newest interactions.** It calls
  `/interactions/` with no paging, and the backend defaults to 10 per page,
  newest first. Any follow-up on an older interaction never shows as overdue,
  today or upcoming. The Calendar page has the same bug.
- **Bug: "All Caught Up!" shows while loading**, and also when loading fails,
  so a network error looks like "nothing to do".
- "Recently Touched" links use a plain `<a href>`, so clicking one reloads the
  whole app instead of moving to the page.
- Old look: colored alert boxes with emoji headings, times with seconds
  ("2:00:00 PM"), double padding on desktop (page `p-6` inside the layout's
  `p-6`), the support e-mail banner sits at the top above the real content.
- Follow-up rows are clickable `<li>`s (no keyboard access).

## Todo
- [x] Fix the data: Dashboard and Calendar ask for `sort=pending&per_page=200`
      (backend already supports it: open follow-ups come first, soonest first).
- [x] Page frame like the other pages: `p-4 lg:p-6` (same as Leads), title "Dashboard" + today's date.
- [x] Summary tiles: Overdue / Due today / Next 7 days counts (reuse the unused
      `MetricCard`, switched to the theme colors). Overdue number in red when > 0.
- [x] One "My follow-ups" card with three groups (Overdue, Today, Next 7 days).
      Rows: record name, small muted type ("Lead", "Account", "Project"),
      summary, and the date/time on the right (overdue dates in red). Rows are
      buttons and still open the existing follow-up window. No emoji.
- [x] "Recently touched" card next to it (two columns on desktop, stacked on
      phones), rows use in-app links, type label instead of emoji.
- [x] Loading skeleton; "Couldn't load follow-ups" message on error; the
      "all caught up" empty state only after a successful load.
- [x] Support e-mail line moves to a small line at the bottom of the page.
- [x] Browser test: follow-ups beyond 10 interactions show, counts are right,
      no "all caught up" while loading, phone has no sideways scroll.
- [x] Run all browser tests + lint (compare with before), screenshots, PR into `staging`.

## Review
- `src/pages/Dashboard.tsx`: asks for `/interactions/?sort=pending&per_page=200`
  so open follow-ups come first and are no longer cut off at 10. New layout:
  title + date, three summary tiles (one row on phones), one "My follow-ups"
  card grouped Overdue / Today / Next 7 days (rows are buttons, open the same
  follow-up window), "Recently touched" card with in-app links, loading
  skeleton, error message, empty state only after a successful load, support
  line at the bottom. No emoji; removed the two `any` lint errors.
- `src/components/ui/MetricCard.tsx` (was unused): theme colors, compact on
  phones, optional `valueClassName` (red overdue count).
- `src/pages/CalendarPage.tsx`: same one-line data fix (Calendar was also
  limited to the 10 newest interactions).
- `tests/dashboard.spec.ts`: 4 tests (older follow-ups + counts, in-app links,
  no "all caught up" while loading / on error, phone fits).
- Checks: 59/59 browser tests (incl. new ones), `tsc` clean, lint unchanged on
  Calendar (4 old errors), Dashboard now 0.
- Note: 200 is the backend's per-page maximum. More than 200 *open*
  follow-ups for one user would still be cut off; unlikely, but a dedicated
  backend endpoint would remove the limit if it ever matters.

Out of scope (later phases, if you want them):
- **Calendar**: `alert()` popups → toasts, emoji, double padding.
- **Deletes (Trash), Reports, Settings, Help**: double padding / phone gutters,
  `alert()` popups in Trash, Help page titled "Reports User Guide".
- **Admin pages** (Leads, Accounts, Projects, Interactions): still use emoji
  status badges (19 on Admin Leads alone) — switch to `StatusBadge`.

# Phase 6 — Accounts and Projects caught up with Leads (staging) — done

Target: `staging` only. Same patterns and shared pieces as Leads (StatusBadge,
Button, RecordLayout, toasts, skeletons, compact phone list). Nothing to `main`.

Found in screenshots (staging, sample data):
- Accounts list: old Filters toggle (on phones an empty full-width button),
  emoji + ALL-CAPS status badges, oversized hard-coded "New" button, pagination
  shown twice (top and bottom), cards default, tall cards on phones.
- Projects list: same issues (emoji badges, Filters toggle, double pagination).
- Project page: still the old layout (plain text rows, "Linked Entity",
  collapsed Interactions/Notes boxes, yellow Assign button).
- Account page: already on the new layout (Phase 3); only the shared section
  buttons inside the tabs ("Add Interaction" etc.) are still the old big style.
- Bug (same as Leads had): deleting an account or project asks "Are you sure?"
  twice (card/table confirm, then the page confirms again).

Keep each section's own features:
- Accounts: Type filter (business types), account statuses (new / prospect /
  active / inactive), Subscriptions tab, Assign.
- Projects: project statuses (pending / active / completed / cancelled / lost),
  value with one-time / monthly / yearly, start and end dates, link to an
  account OR a lead OR standalone with its own primary contact, type,
  description, Assign.

## A. Accounts list (`Clients.tsx`)
- [x] Status pills (StatusBadge) instead of emoji/caps, cards and table.
- [x] One always-visible toolbar like Leads: view toggle, Type dropdown, sort,
      rows. Remove the Filters toggle, the duplicate top pagination and the
      unused filter-visibility code.
- [x] Table default on desktop (saved choice wins); compact list on phones
      (name, contact · city, status).
- [x] Shared Button for New / modal buttons; toasts instead of alert();
      skeleton while loading; delete asks once.

## B. Projects list (`Projects.tsx`, `ProjectsTable.tsx`)
- [x] Same as A, with the Status dropdown kept (project statuses). The backend
      has no project status filter, so the summary says "on this page" when a
      status is picked (same honest wording Leads had before its fix).
- [x] Compact phone row: project name, account/lead · value, status.

## C. Project page (`ProjectDetailPage.tsx`)
- [x] RecordHeader: Status, Value (with / mo or / yr), Dates, Linked to (link to
      the account or lead, or "Standalone"), Owner; Assign in the header.
- [x] About panel: type, description, primary contact (standalone projects).
- [x] Tabs: Activity and Notes (embedded, always open, with counts).
- [x] Toasts, skeleton, error message if it fails to load, no reload after assign.

## D. Shared section buttons
- [x] "Add Interaction" / "Add Contact" / "Add Note" / "Add Subscription" use
      the shared Button (fixes the oversized buttons on Lead, Account and
      Project pages at once).

## Checks
- [x] Typecheck, build, lint unchanged, all browser tests; new tests for the
      Projects/Accounts phone list and the single delete confirmation.
- [x] Before/after screenshots (desktop and phone) of all four pages.

## Review
- Accounts list (`Clients.tsx`): StatusBadge pills (no emoji/caps) in cards,
  table (new Status column) and the new phone list; always-visible toolbar
  with the Type filter; Filters toggle, duplicate top pagination and the
  filter-visibility code removed; shared Button; toasts; skeleton; delete asks
  once. The Type filter only filters the loaded page (same as Leads had), so
  its page-only counts were removed and the summary says "on this page".
- Projects list (`Projects.tsx`, `ProjectsTable.tsx`): same treatment; status
  colors/labels now in `src/lib/projectStatus.ts` (shared with the Project
  page); table "Entity" column renamed "Linked to", emoji removed; phone rows
  show value first ("$12,000 / yr · Account"). Server error text on a failed
  delete is kept (now a toast).
- Table is the default view for Leads, Accounts and Projects (saved choice wins).
- Project page: RecordHeader (Status, Value, Dates, Linked to, Owner), About
  panel (type, description, per-month for yearly values, primary contact with
  editable title for standalone projects, created), Activity and Notes tabs.
  "Convert to account" kept for standalone projects only. Toasts, skeleton,
  clear load error, assign updates in place.
- Shared buttons: section components (Interactions, Contacts, Notes,
  Subscriptions) and the create/edit forms (Lead, Account, Project) use the
  shared Button, fixing the oversized buttons everywhere they appear.
- Tests: new `tests/accounts-projects.spec.ts` (phone lists, single delete
  confirmation, Project page header/tabs) fails on the old code and passes on
  the new. `tests/read-recovery.spec.ts` looked for the old "Loading
  projects..." text; it now checks the loading placeholder (same intent).
- Checks: typecheck and build pass; lint unchanged (27 before and after on the
  touched files); 55 browser tests pass (52 existing + 3 new).
- Follow-up (backend): Type filter for accounts and Status filter for projects
  only filter the loaded page; a server-side filter like the Leads one fixes it.

---

# Bug fix: typing in Notes shows nothing, saves only the last letter — done

Reported on the Lead page; the Project page had the same bug, and so does
production (`main`), since it predates the UI refresh.

Cause: `CompanyNotes` can manage its own text or be driven by the page. The
Lead and Project pages passed `setNoteDraft` (so each keystroke updated the
page) but not `noteDraft`, so the textarea kept showing its own empty value and
each keystroke replaced the page's draft with just that one letter. They also
passed the unsaved draft as `notes`, so Cancel could not restore the saved note.

- [x] Lead and Project pages: `notes={record.notes || ""}` (the saved note) and
      `noteDraft={noteDraft}` (the text being typed). The Account page already
      worked (it lets the box manage its own text).
- [x] `tests/notes-editing.spec.ts`: types a full note on both pages, checks
      every letter shows and the whole note is saved, and that Cancel restores
      the saved note. Fails on the old code (3 failed), passes on the new.
- [x] Checks: typecheck and build pass; lint unchanged (3 before and after);
      52 browser tests pass.
- [ ] Same fix for production: separate small PR into `main` (after this one).

---

# UI tweaks round 1 (staging) — done

Target: `staging` only, one small PR. Nothing goes to `main`.

## 1. Use the full width on phones
Cause: double side margin. The layout's `<main>` adds 24px on every side
(`ProtectedLayout.tsx`), then each page adds its own 16–24px. On a 390px phone
that is ~80–96px of empty edges.
- [x] `ProtectedLayout.tsx`: `<main>` padding only from the `sm` breakpoint up
      (`p-0 sm:p-6`). One line; desktop unchanged. Pages keep their own margin.
- [x] Check the pages with no padding of their own (Vault, Project archive,
      Not found, Account page wrapper) still have a margin on phones; add
      `p-4` to any that would touch the screen edge.
- [x] Screenshots at 390px: Leads, Lead page, Account page, Dashboard.

## 2. Leads list on phones: compact list
Professional CRMs (Salesforce, HubSpot, Pipedrive mobile) use a compact list on
phones: one tappable row per record, name in bold, contact and status
underneath, no sideways scrolling. Our 9-column table scrolls sideways; our
cards show only 2–3 leads per screen.
- [x] `Leads.tsx`: under the `sm` breakpoint, always show a compact list
      (name, contact, status badge, tap to open the lead), whatever view is
      saved. Desktop keeps the Table / Cards choice (Table default).
- [x] Hide the Table / Cards toggle on phones (it would do nothing there).
- [x] Browser test at 390px: compact list shown, no horizontal overflow,
      tapping a row opens the lead.

## Review
- `<main>` padding now starts at `sm`; phones keep only each page's own 16–24px
  margin. Files (Vault) had no margin of its own, so it got `p-4 sm:p-0`.
  Not found and the Project archive already had their own; desktop unchanged.
- Leads on phones: compact list (name, contact · city, status badge, chevron),
  each row links to the lead. Shown under `sm` whatever view is saved; the
  Table / Cards toggle is hidden there. Because the list has no column headers,
  phones get the sort dropdown even when Table is the saved view.
- New `tests/mobile-leads.spec.ts` (390px: list shown, table and toggle hidden,
  no overflow, list starts within 16px of the edge, tap opens the lead). Fails
  on the old code, passes on the new.
- Checks: typecheck and build pass; lint unchanged on touched files (8 before
  and after); 49 browser tests pass (48 existing + 1 new).

---

# Leads status filter + counts (backend + frontend) — done (staging PRs open)

Why: the Leads page's status filter only filters the 10–50 leads on the current
page, and per-status counts can't be shown, because `GET /api/leads/` only
accepts page / per_page / sort (pathsix-backend `app/routes/leads.py`,
`LeadService.list_mine` in `app/services/leads.py`).

Scope: staging only, in both repos. Branch `ccr-5934bc6a-eapcnw` in each repo,
PRs into `staging`. No database or schema change. Nothing goes to `main`.

## Backend (boonewh/pathsix-backend)
- [x] `LeadService.list_mine(..., status=None)`: when `status` is given, filter
      `Lead.lead_status == status` before counting/paging, so `total` and the
      pages reflect the filter.
- [x] Also return `status_counts`: one count per status over the same leads the
      user can see (same tenant / own-or-assigned / not-deleted rules), ignoring
      the status filter and paging. One extra GROUP BY query.
- [x] Route `GET /api/leads/`: pass `request.args.get("status")` through.
      Existing callers that don't send `status` get the same results as today,
      plus the new `status_counts` field.
- [x] Tests (PostgreSQL, existing `crm` fixture): filter returns only that
      status with the right total; counts cover all the user's statuses;
      another user's / tenant's leads never appear in results or counts.
- [x] Run the backend suite locally against PostgreSQL 16 before pushing.
- Admin `/api/leads/all` is unchanged (not used by the Leads page).

## Frontend (this repo)
- [x] `Leads.tsx`: send `status` with the list request when a status is picked;
      reset to page 1 when the filter changes.
- [x] Status strip shows real counts from `status_counts` ("Qualified 12").
      If the backend hasn't been deployed yet (no `status_counts`), the strip
      just shows names like today and the current-page filter still applies,
      so deploy order can't break the page.
- [x] Summary line drops "on this page" once the server is filtering.
- [x] Browser test for: status param sent, counts shown, page reset.

## Deploy note
- Backend staging is deployed with Fly (`fly.staging.toml`), not by merging.
  After the backend PR merges to `staging`, it needs a staging deploy before
  the frontend counts appear. The frontend works either way.

## Review
- Backend PR boonewh/pathsix-backend#31 (into `staging`): `list_mine` takes an
  optional `status`, applied before counting/paging, and returns
  `status_counts` over the same visible leads (one GROUP BY). Route passes
  `?status=` through; callers without it get the same leads as before.
  New `tests/test_lead_status_filter.py` (3 tests) fail on the old code and
  pass on the new. Full suite locally on PostgreSQL 16 with RLS and the
  restricted runtime role (same setup as CI): 612 passed (609 before + 3).
- Frontend (this repo): one `leadsUrl` used by all three list requests (load,
  after save, after assign) adds `&status=`; changing the filter resets to
  page 1; the strip shows real counts from `status_counts`; the summary reads
  "Showing X of N Qualified leads". Without `status_counts` (backend not yet
  deployed) it keeps the old page-only behaviour, so deploy order is safe.
  New `tests/lead-status-filter.spec.ts` covers both cases.
  Checks: typecheck and build pass; lint unchanged (4 before and after);
  45 browser tests pass (43 existing + 2 new).
- Deploy: after the backend PR merges, staging needs a Fly deploy
  (`fly.staging.toml`) before the counts appear.

---

# UI refresh — corporate look and record-page UX (done — staging only)

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
- [x] Make Table the default view for new users (saved preference still wins).
- [x] Pipeline strip above the list: count per stage, click to filter
      (replaces the Status dropdown). Counts come from the leads already loaded.
- [x] Toolbar cleanup: one "New lead" primary button, remove the duplicate
      top pagination and the "Showing X of Y" line.

Phase 4 notes (done):
- Table is the default Leads view when no saved preference exists
  (`usePreferences` defaults per table; other lists keep cards).
- Status strip replaces the Filters toggle and Status dropdown: "All leads (N)"
  plus one button per status. No per-status numbers, on purpose: the backend
  `GET /leads/` only takes page/per_page/sort (checked in pathsix-backend
  staging), so counts from the loaded page would be wrong. The old dropdown
  showed those page-only counts as if they were totals.
- Filtering by status still only filters the current page (unchanged
  behaviour). The summary line now says "on this page" so it is not misleading.
  Real fix needs a backend `status` filter + counts (added to the list below).
- Toolbar is always visible (view toggle, sort, rows); removed the duplicate
  top pagination and the unused filter-visibility/resize code.
- `tests/lead-options.spec.ts` opened the Edit form from the card menu; with
  table as default it now uses the table's "Edit lead" button, which calls the
  same `handleTableEdit` and opens the same form. Assertions unchanged.
- Checks: typecheck and build pass; lint unchanged on touched files (4 before
  and after); all 43 browser tests pass; no overflow at 390px.

## Phase 5 — Small UX polish on the touched pages
- [x] Replace `alert()` on the Leads / Lead detail / Account detail pages
      with `toast.error` / `toast.success` (Toaster already mounted in `main.tsx`).
- [x] After assigning a lead, update the page state instead of
      `window.location.reload()`.
- [x] Replace "Loading..." text with simple skeleton placeholders on these pages.

## Not in this plan (need backend work, listed for a later decision)
- Single `POST /leads/:id/convert` endpoint. Today Convert is 4 separate
  browser requests; a failure midway can leave a duplicate account or a lead
  marked Won but not converted. Recommended as the next backend task.
- "Last activity" / "Next step" columns and overdue highlighting on the
  Leads table (needs the API to return these per lead).
- Estimated value per lead and $ totals in the pipeline strip (no field today).
- `status` filter and per-status counts on `GET /leads/`, so the status strip
  can filter all leads (not just the current page) and show real counts.
- Saved views, bulk actions, Ctrl+K search.

## Review
All five phases are done and merged into `staging` (PRs #12–#15 and this one);
nothing has gone to `main`/production.

Phase 5 notes:
- Leads, Lead and Account pages: every `alert()` is now a toast with a plain
  "Couldn't … Please try again." message; successful delete/assign also toast.
- Assigning a lead or account re-fetches just that record instead of
  `window.location.reload()`, so the Owner updates in place.
- New `RecordSkeleton` (in `RecordLayout.tsx`) replaces "Loading..." on the
  Lead and Account pages; the Leads list shows skeleton table rows. Counts and
  the "Showing X of Y" line are hidden while loading so it never shows "0 leads".
- Bug fixed: a lead that failed to load left the Lead page on "Loading..."
  forever (the error was only logged). It now shows a clear message, like the
  Account page already did.
- Bug fixed: deleting a lead asked "Are you sure?" twice (card/table confirm,
  then `handleDelete` confirmed again). It now asks once.
- `confirm()` dialogs for delete/convert are kept: they are deliberate
  confirmations, not error messages.
- New `tests/record-feedback.spec.ts` (3 tests: assign without reload, failed
  save shows a toast not an alert, failed load shows an error). They fail on
  the old code and pass on the new.
- Checks: typecheck and build pass; lint unchanged on touched files (11 before
  and after); 48 browser tests pass (45 existing + 3 new).

Still open (needs backend or a decision): single "convert lead" endpoint,
last-activity / next-step columns, lead value field, saved views and bulk
actions, and the emoji status badges on the Accounts and Admin Leads pages.

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
