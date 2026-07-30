# Plan: Safe development workflow for the production CRM frontend

## Goal
Resume active development on this frontend (and the separate `pathsix-backend`)
without disrupting live customers or their data.

## Context (current setup)
- Vite + React 19 SPA, deployed on **Vercel** via its Git integration (`vercel.json`).
- Frontend talks to the backend through one env var: `VITE_API_BASE_URL` (`src/lib/api.ts`).
- Local dev proxies `/api` → `http://localhost:8000` (`vite.config.ts`).
- Backend lives in a **separate repo** (`pathsix-backend`).
- No CI workflows exist today (`.github/workflows` is absent).

## Decision: branch, not fork
Use branches + PRs into `main`. A fork is for repos you don't own or upstream
contributions; here it would only add friction and lose Vercel preview deploys.

## The branching model (the rule that keeps prod safe)
- [ ] `main` = production, and is sacred. Vercel auto-deploys `main` to the live site.
      Never commit directly to `main`.
- [ ] All work happens on feature branches off `main`.
- [ ] Every branch push gets its own isolated **Vercel preview URL** — verify the
      change there before it can reach customers.
- [ ] Merge to `main` (via PR) is the *only* path to production.

## Where to do the work
- [ ] **Full-stack / API-touching work → locally on the PC.** Run the backend on
      `localhost:8000` + `npm run dev`, against a local/dev database. This is the
      full request loop with zero risk to production data, and it's the only place
      both repos can be built and tested against each other.
- [ ] **Isolated frontend-only fixes → fine in the cloud** (UI tweaks, bugfixes that
      don't change the API contract), because each push gets an isolated preview URL.
- [ ] Note: cloud sessions here are scoped to the frontend repo only; the backend
      repo is not accessible from this environment.

## Coordinating the two repos (avoid breaking live customers)
- [ ] Keep frontend changes backward-compatible with the *currently deployed* backend.
- [ ] Ship backend changes **additively first** (new/optional fields and endpoints),
      deploy backend, then merge the frontend that depends on them.
- [ ] Never merge a frontend that calls an endpoint which isn't live in prod yet.

## Data isolation for testing (decide when picking this up)
Preview deploys inherit prod env vars by default, so a preview frontend hits the
**production backend + real customer data**. Options:
- [ ] **Option A — staging backend + DB:** stand up a staging copy of the backend
      with its own database; set Vercel's *Preview* `VITE_API_BASE_URL` to point at it.
      Full isolation; most setup. (Best long-term.)
- [ ] **Option B — local-only writes:** preview deploys are view/UI testing only;
      any write-heavy testing is done against the local backend. No new infra; relies
      on discipline.
- Working default: develop against local backend (Option B) now; revisit staging (A)
  once the cadence of work justifies it.

## Optional safety net: CI on PRs
- [ ] Add a small GitHub Action that runs `tsc` + `vite build` (and the Playwright
      test) on every PR, so a broken build can't be merged to production. Cheapest
      insurance, since nothing enforces this today.

## Review
*To be completed once the workflow is adopted.*
