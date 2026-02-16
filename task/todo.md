# Fix: Navigation stuck on detail pages

## Problem
When on ClientDetailPage or LeadDetailPage, clicking sidebar nav links changes the URL but the page content stays on the detail page until a manual refresh.

## Root Cause
The custom `ErrorBoundary` in `App.tsx` wraps `<Routes>`. It's a class component with no mechanism to reset its error state when the route changes. If any page throws a render error, the ErrorBoundary catches it, and subsequent navigations update the URL (browser history) but the ErrorBoundary keeps its `hasError: true` state, preventing the new route from rendering.

## Fix
Add `key={location.pathname}` to the ErrorBoundary in App.tsx. This forces it to remount on route changes, clearing any stale error state. This is the standard fix for class-based ErrorBoundaries in React Router v6.

## Tasks
- [x] Add `useLocation()` hook and pass `key` to ErrorBoundary in App.tsx

## Review
*To be completed after fix*
