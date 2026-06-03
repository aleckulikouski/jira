## Parent PRD

`issues/prd.md`

## What to build

The Profile section card on the settings page. This is a vertical slice through the full stack: reactive form → user service → NgRx → snackbar.

**Layout:** A Material card at ~50% width centered. Contains:
- Read-only email field (disabled `mat-form-field`)
- Editable displayName field
- Clickable avatar upload area: shows current avatar or initials, clicking opens native file picker (`accept="image/*"`)
- On file selection: resize to 256×256 JPEG at 0.85 quality using Canvas API, show immediate preview
- Save button with Material spinner (disabled while saving)

**Behavior:**
- Form is a reactive `FormGroup` with `email` (disabled) and `displayName` controls. Avatar is a component property (Blob + object URL), not in the form.
- Save constructs `FormData` with `displayName` and optional `file` Blob
- Dispatches `UserActions.updateProfile` via `UserFacade`
- On success: snackbar "Profile updated" + update store user
- On failure: snackbar with server error message or "Something went wrong" fallback
- The unsaved-changes guard interface is implemented by the component

**Cleanup:** Revoke object URLs to prevent memory leaks.

## Acceptance criteria

- [ ] Page header shows back arrow + "Settings" title. Back arrow navigates to `/board`.
- [ ] Profile card shows at ~50% width, centered, with a "Profile" label
- [ ] Email field is present, populated from store, and disabled (read-only)
- [ ] Display name field is editable, pre-populated from store
- [ ] Clicking avatar area opens file picker (filtered to images)
- [ ] Selected image is resized client-side to 256×256, JPEG 0.85 quality
- [ ] Resized image shows as immediate preview in the avatar area
- [ ] Save button sends multipart FormData to `PATCH /api/users/me/profile`
- [ ] Save button shows spinner and is disabled while request is in flight
- [ ] Success snackbar "Profile updated" shown on success
- [ ] Error snackbar shown on failure with server message or fallback
- [ ] After save, header reflects updated display name and avatar
- [ ] Object URLs are revoked on component destroy
- [ ] Form initializes with user data from store
- [ ] `nx build web` succeeds

## Blocked by

- Blocked by `issues/014-rename-auth-to-user-store.md` (UserFacade, UserActions new actions)
- Blocked by `issues/016-profile-update-endpoint.md` (API endpoint)
- Blocked by `issues/018-avatar-component.md` (AvatarComponent for preview area — used as display within the upload area)

## User stories addressed

- User story 1 (see current profile info)
- User story 2 (edit display name)
- User story 3 (upload avatar)
- User story 4 (auto-resize on upload)
- User story 5 (immediate preview before saving)
- User story 10 (loading spinner on save)
- User story 11 (success snackbar)
- User story 12 (error snackbar)
