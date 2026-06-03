## Parent PRD

`issues/prd.md`

## What to build

Directory restructure and dev tooling updates:

### Directory move

Move all feature components from `apps/web/src/app/core/features/` to `apps/web/src/app/features/`. This includes:
- `auth/` (login, register)
- `board/` (with all dialogs)
- `user-settings/`

Update all imports in:
- Route file (`app.routes.ts`)
- `MainLayoutComponent` (if it imports features)
- Board component (for dialog imports)
- Test files
- Any other file referencing `core/features/`

### Script updates

- **start-dev.sh**: Export `UPLOADS_DIR` pointing to the uploads directory. Create the uploads directory tree if it doesn't exist (`mkdir -p`).
- **docker-compose.yml**: Add `uploads` named volume. Mount it in the API service definition for future containerization.

## Acceptance criteria

- [ ] All feature components live under `apps/web/src/app/features/`
- [ ] `core/features/` directory no longer exists
- [ ] `nx build web` succeeds with all imports updated
- [ ] `nx test web` passes all existing tests
- [ ] `start-dev.sh` creates `UPLOADS_DIR` (`apps/api/uploads/avatars/`) if missing
- [ ] `start-dev.sh` exports `UPLOADS_DIR` env var to concurrently-started API process
- [ ] `docker-compose.yml` has an `uploads` volume
- [ ] App starts successfully with `npm start`

## Blocked by

- Blocked by `issues/014-rename-auth-to-user-store.md` (imports that also got renamed must be consistent)

Can run in parallel with issues #015–#021 as long as #014 is done first for import consistency.

## User stories addressed

None — infrastructure/refactor.
