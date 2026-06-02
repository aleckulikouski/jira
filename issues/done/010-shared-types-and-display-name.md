## Parent PRD

`issues/prd.md`

## What to build

Add `User` and `AuthResponse` interfaces to the shared-types library so both API and frontend use a single source of truth. Update the API auth service to include `displayName` in the response body (JWT payload remains unchanged — carries only `sub` and `email`). Update the frontend auth state, reducer, service, and effects to carry `displayName` through the system, including localStorage persistence.

## Acceptance criteria

- [ ] `User` interface (`id`, `email`, `displayName`) exists in `@org/shared-types` and is exported
- [ ] `AuthResponse` interface (`accessToken`, `user`) exists in `@org/shared-types` and is exported
- [ ] API `tokenFor()` returns `displayName` in the response body alongside `id` and `email`
- [ ] Frontend `AuthService` uses `AuthResponse` from `@org/shared-types` instead of its inline interface
- [ ] `AuthState` user object includes `displayName`
- [ ] `AuthActions.registerSuccess` and `AuthActions.loginSuccess` payloads include `displayName`
- [ ] Auth effects persist `displayName` to localStorage and restore it on page load
- [ ] `AuthFacade.user$` emits user objects with `displayName`
- [ ] Registering or logging in populates `displayName` in the NgRx store

## Blocked by

None — can start immediately.

## User stories addressed

- User story 1 (display name in header)
- User story 2 (email fallback — enabled by having displayName available to check)
- User story 14 (shared type definitions)
