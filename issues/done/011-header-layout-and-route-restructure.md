## Parent PRD

`issues/prd.md`

## What to build

Create the `HeaderComponent` and `MainLayoutComponent`, then restructure routes so authenticated pages share a common shell. The header lives in the layout shell and appears on all authenticated pages (board, future settings) but not on auth pages (login, register). It shows "Jira Clone" branding on the left and a user dropdown on the right displaying the signed-in user's display name (with email fallback). The dropdown contains a Settings menu item (gear icon, linked to `/user-settings`) and a Logout menu item (logout icon, dispatches existing logout action). The header is sticky at the top of the viewport. A wrapper div in the layout offsets page content below the toolbar. Remove the embedded toolbar from `BoardComponent` and simplify its height calculation.

## Acceptance criteria

- [ ] `HeaderComponent` renders "Jira Clone" branding text on the left
- [ ] `HeaderComponent` shows the signed-in user's `displayName` (falling back to `email` if falsy) on the right
- [ ] Clicking the display name opens a `mat-menu` dropdown with two items: "Settings" (gear icon) and "Logout" (logout icon)
- [ ] "Settings" navigates to `/user-settings` via `routerLink`
- [ ] "Logout" calls `AuthFacade.logout()`, which clears session and redirects to `/login`
- [ ] `MainLayoutComponent` renders the `HeaderComponent` and a `<router-outlet>` inside a wrapper div with top padding equal to toolbar height
- [ ] Header is sticky (positioned at top of viewport)
- [ ] Routes restructured: `/login` and `/register` are top-level; `MainLayoutComponent` is parent route with `/board` as child; default redirect still goes to `/board`
- [ ] Header does NOT appear on `/login` or `/register`
- [ ] Board page no longer contains the embedded `<mat-toolbar>` header
- [ ] Board height simplified to `100vh`
- [ ] `HeaderComponent` has unit tests covering: branding text, user display name, email fallback, dropdown menu items, logout dispatch
- [ ] `MainLayoutComponent` has unit tests covering: renders header, contains router-outlet
- [ ] Existing tests (board, auth) continue to pass

## Blocked by

- Blocked by `issues/010-shared-types-and-display-name.md`

## User stories addressed

- User story 1 (display name in header)
- User story 2 (email fallback when no display name)
- User story 3 (settings dropdown menu)
- User story 5 (logout option in dropdown)
- User story 7 (header on all authenticated pages)
- User story 8 (sticky header)
- User story 9 (content offset below header)
- User story 10 (static branding text)
- User story 12 (no header for unauthenticated users)
