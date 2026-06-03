## Parent PRD

`issues/prd.md`

## What to build

Rename all auth-related store artifacts to user-focused naming. The store slice, actions, facade, service, and state interface are renamed without changing any behavior.

- `AuthState` → `UserState`
- `AuthActions` → `UserActions`
- `AuthFacade` → `UserFacade`
- `AuthService` → `UserService`
- Feature key `'auth'` → `'user'`
- Add `profileSaving` and `passwordChanging` boolean flags to `UserState` (for future profile/password sections)

Update all imports, selectors, effects, the app config module registration, and test files. The app must build and all existing tests must pass with zero behavioral change.

## Acceptance criteria

- [ ] `UserState`, `UserActions`, `UserFacade`, `UserService` exist and are used everywhere the old names were
- [ ] Feature key in `provideStore` is `{ user: userReducer }`
- [ ] All files (components, guards, effects, config, tests) import from the renamed paths
- [ ] `nx build web` and `nx build api` succeed
- [ ] `nx test web` passes all existing tests
- [ ] `UserState` includes `profileSaving: boolean` and `passwordChanging: boolean` (both default `false`)

## Blocked by

None — can start immediately.

## User stories addressed

None — pure refactor. Enables user stories 2, 3, 6, 9, 13.
