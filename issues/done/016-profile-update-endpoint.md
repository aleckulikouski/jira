## Parent PRD

`issues/prd.md`

## What to build

New `UserModule`, `UserController`, and `UserService` on the NestJS backend with the profile update endpoint:

- **`PATCH /api/users/me/profile`** — Accepts `multipart/form-data` with fields:
  - `displayName` (required string)
  - `file` (optional image file, max 1MB)
- Validates the uploaded file is actually an image (check magic bytes). Rejects non-images with `400 BadRequestException('File is not a valid image')`.
- Updates the user's `displayName` and/or `avatarUrl` in the database.
- Saves avatar file to `UPLOADS_DIR/avatars/<user-id>.jpg` (overwrites on subsequent uploads).
- Returns the updated `User` object.
- Protected by JWT auth guard.

No password-related logic — that's a separate endpoint.

## Acceptance criteria

- [ ] `UserModule` is imported in `AppModule`
- [ ] `PATCH /api/users/me/profile` accepts multipart FormData with `displayName` + optional `file`
- [ ] Request without `displayName` returns 400
- [ ] Uploaded file > 1MB returns 400
- [ ] Non-image file returns 400 with message `'File is not a valid image'`
- [ ] Valid request updates displayName in DB and returns updated User
- [ ] Valid request with file saves to `<UPLOADS_DIR>/avatars/<user-id>.jpg` and sets `avatarUrl` on User
- [ ] Valid request without file updates displayName only (avatar unchanged)
- [ ] Request without JWT returns 401
- [ ] `nx build api` succeeds

## Blocked by

- Blocked by `issues/015-backend-user-infra.md`

## User stories addressed

- User story 2 (edit display name)
- User story 3 (upload avatar)
- User story 16 (invalid image rejection)
- User story 17 (avatar persists server-side)
