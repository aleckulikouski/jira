## Parent PRD

`issues/prd.md`

## What to build

Move existing feature directories (`auth/` and `board/`) from `app/` into `app/core/features/` to sit alongside the new `user-settings/` directory. Update all import references throughout the codebase. Ensure the build, lint, and all tests pass after the move.

## Acceptance criteria

- [ ] `app/auth/` is moved to `app/core/features/auth/`
- [ ] `app/board/` is moved to `app/core/features/board/`
- [ ] All imports referencing the old paths are updated (route config, test files, component imports)
- [ ] `nx build web` passes
- [ ] `nx lint web` passes
- [ ] `nx test web` passes (all existing tests green)
- [ ] The application functions identically — no user-visible changes

## Blocked by

- Blocked by `issues/012-user-settings-placeholder.md`

## User stories addressed

- User story 16 (consistent feature directory structure)
