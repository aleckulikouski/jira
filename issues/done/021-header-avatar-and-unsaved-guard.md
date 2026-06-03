## Parent PRD

`issues/prd.md`

## What to build

Two things that touch routing and the header:

### Header avatar

Update the header component to show the user's avatar (via `AvatarComponent`) to the left of the display name in the user menu button. Falls back to initials circle when no avatar is set. The avatar should be ~32px.

### Unsaved changes guard

Create a reusable unsaved-changes guard:
- `CanComponentDeactivate` interface in `apps/web/src/app/core/interfaces/` with `canDeactivate(): boolean`
- `unsavedChangesGuard` as a `CanDeactivateFn<CanComponentDeactivate>` in `apps/web/src/app/core/guards/`
- Wire the guard to the `/user-settings` route as `canDeactivate: [unsavedChangesGuard]`

The `UserSettingsComponent` declares that it implements `CanComponentDeactivate` (the method body is implemented in the profile section issue, but the interface declaration can be set up now).

## Acceptance criteria

- [ ] Header user menu button shows AvatarComponent (32px) to the left of display name
- [ ] Header shows initials fallback when user has no avatar
- [ ] `CanComponentDeactivate` interface exists with `canDeactivate(): boolean`
- [ ] `unsavedChangesGuard` exists as a `CanDeactivateFn`
- [ ] Guard returns `true` when component's `canDeactivate()` returns `true`
- [ ] Guard returns `false` when component's `canDeactivate()` returns `false`
- [ ] `/user-settings` route has `canDeactivate: [unsavedChangesGuard]`
- [ ] `nx build web` succeeds

## Blocked by

- Blocked by `issues/014-rename-auth-to-user-store.md`
- Blocked by `issues/018-avatar-component.md`

## User stories addressed

- User story 9 (warn if leaving with unsaved changes)
- User story 13 (avatar in header)
- User story 18 (header reflects profile changes)
