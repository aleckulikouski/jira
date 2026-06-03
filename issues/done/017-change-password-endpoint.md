## Parent PRD

`issues/prd.md`

## What to build

Add a `POST /api/users/me/change-password` endpoint to the `UserModule`:

- Accepts JSON body: `{ newPassword: string, confirmPassword: string }`
- Validates both fields are present (use class-validator DTO)
- Validates that `newPassword === confirmPassword`, otherwise returns 400 with message `'Passwords do not match'`
- Hashes the new password with bcrypt and updates the user's `passwordHash` in the database
- Returns `204 No Content` on success
- Protected by JWT auth guard

No password complexity rules. No current-password requirement.

## Acceptance criteria

- [ ] `POST /api/users/me/change-password` exists on the UserController
- [ ] Request body validated: both fields required strings
- [ ] Non-matching passwords returns 400 `'Passwords do not match'`
- [ ] Valid request hashes password and updates user record
- [ ] Returns 204 No Content on success
- [ ] Request without JWT returns 401
- [ ] `nx build api` succeeds

## Blocked by

- Blocked by `issues/015-backend-user-infra.md`

## User stories addressed

- User story 6 (change password)
