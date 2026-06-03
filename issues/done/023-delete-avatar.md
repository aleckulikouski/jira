## Parent PRD

`issues/prd.md`

## What to build

Add the ability for users to remove their avatar on the settings page. A trash icon badge appears at the top-right of the avatar circle when the user has an existing avatar or a pending upload preview. Clicking it immediately reverts the display to initials. The removal is batched with the existing Save button — on save, the frontend appends `removeAvatar: "true"` to the FormData sent to `PATCH /api/users/me/profile`. The backend deletes the avatar file from disk and sets `avatarUrl` to `null` in the database. Both the header and settings page already handle a null `avatarUrl` by falling back to initials via the `AvatarComponent`.

See `issues/prd.md` for full implementation decisions, API contract, and testing details.

## Acceptance criteria

- [ ] Trash icon badge is visible at top-right of avatar circle when user has an existing `avatarUrl` or a pending upload preview
- [ ] Trash icon is hidden when `avatarAction` is `'remove'` or when there is no avatar and no pending upload
- [ ] Clicking trash icon cancels any pending upload, revokes preview URL, and shows initials fallback
- [ ] Clicking the avatar area to pick a new file cancels the remove state
- [ ] Save button sends `removeAvatar: "true"` in FormData when removal is pending
- [ ] `PATCH /api/users/me/profile` accepts optional `removeAvatar` field, deletes file from disk, sets `avatarUrl` to `null`
- [ ] `displayName` is optional in the PATCH endpoint
- [ ] Backend handles missing avatar file gracefully (ENOENT caught silently)
- [ ] Unsaved changes guard triggers when avatar removal is pending
- [ ] On save success, avatar state resets and "Profile updated" snackbar appears
- [ ] After save with removal, header avatar shows initials (via existing `AvatarComponent` fallback)
- [ ] Existing tests are updated to cover new branches

## Blocked by

None — can start immediately.

## User stories addressed

From `issues/prd.md`:

- User story 1 — remove avatar, revert to initials
- User story 2 — remove avatar and change display name in single save
- User story 3 — trash icon hidden when no avatar
- User story 4 — cancel pending upload via trash icon
- User story 5 — see initials immediately as preview before save
- User story 6 — unsaved changes warning for pending removal
- User story 7 — file deleted from disk on removal
- User story 8 — handle missing file gracefully (ENOENT)
