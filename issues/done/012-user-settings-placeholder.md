## Parent PRD

`issues/prd.md`

## What to build

Add a minimal user settings placeholder page at `/user-settings` and wire the dropdown menu in the header to navigate to it. The page is guarded so only authenticated users can access it. When the user is already on `/user-settings` and clicks "Settings" in the dropdown, the menu simply closes without navigating.

## Acceptance criteria

- [ ] `UserSettingsComponent` exists at the agreed path with a heading and brief placeholder text
- [ ] `/user-settings` route is added as a child of `MainLayoutComponent` and guarded by `authGuard`
- [ ] Header "Settings" menu item navigates to `/user-settings` (using `routerLink` or programmatic navigation)
- [ ] When already on `/user-settings`, clicking "Settings" closes the dropdown without triggering navigation
- [ ] Unauthenticated users are redirected to `/login` when trying to access `/user-settings`
- [ ] `UserSettingsComponent` has a unit test verifying it renders the heading and placeholder text

## Blocked by

- Blocked by `issues/011-header-layout-and-route-restructure.md`

## User stories addressed

- User story 4 (settings option navigates to settings page)
- User story 6 (logout redirects to login — inherited from prior work, settings page behaves correctly with it)
- User story 11 (user settings page at `/user-settings`)
- User story 13 (settings page as placeholder)
- User story 15 (clicking Settings while on settings closes menu)
