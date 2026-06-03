## Parent PRD

`issues/prd.md`

## What to build

The Change Password section card on the settings page. Stacked below the Profile card, same 50% centered width.

**Layout:** A Material card containing:
- New password field (`type="password"`)
- Confirm password field (`type="password"`)
- Save button with Material spinner (disabled while saving)

**Behavior:**
- Reactive `FormGroup` with `newPassword` and `confirmPassword` controls
- Save dispatches `UserActions.changePassword` via `UserFacade`
- On success: snackbar "Password changed", form resets (clear both fields)
- On failure: snackbar with server error message or "Something went wrong" fallback
- Save button disabled if either field is empty or request is in flight

## Acceptance criteria

- [ ] Password card appears below the Profile card, ~50% width, centered
- [ ] New password and confirm password fields are present and masked
- [ ] Save button is disabled when fields are empty
- [ ] Save button shows spinner and is disabled while request is in flight
- [ ] Successful change shows snackbar "Password changed"
- [ ] Form fields clear after successful save
- [ ] Failed change shows snackbar with server error or "Something went wrong"
- [ ] `nx build web` succeeds

## Blocked by

- Blocked by `issues/014-rename-auth-to-user-store.md` (UserFacade, UserActions)
- Blocked by `issues/017-change-password-endpoint.md` (API endpoint)

## User stories addressed

- User story 6 (change password)
- User story 7 (independent section save — password saves without touching profile)
- User story 10 (loading spinner on save)
- User story 11 (success snackbar)
- User story 12 (error snackbar)
