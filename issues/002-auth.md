## Parent PRD

`PROJECT_SPEC.md`

## What to build

Full auth vertical slice: user registration and login on both the backend and frontend. A new user signs up → a default Project with 3 default BoardColumns ("To Do", "In Progress", "Done") is created for them → they're redirected to the board page which shows those columns (read-only, no management UI yet). A returning user logs in → same flow.

Backend: `User` entity with Prisma migration, `/api/auth/register` and `/api/auth/login` endpoints returning a JWT, NestJS auth guard (`@nestjs/jwt` + Passport). Registration handler auto-creates the user's Project and populates the 3 default BoardColumns in a transaction.

Frontend: `/register` and `/login` routes with Angular Material forms, NgRx auth store (actions, reducer, effects, selectors for token + user + auth status), JWT persisted in localStorage, Angular route guard that redirects unauthenticated users to `/login`. Board page placeholder component at `/board` that calls `GET /api/projects/me` and renders the columns as simple cards (no editing).

## Acceptance criteria

- [ ] `User`, `Project`, and `BoardColumn` Prisma models defined, migration created and applied
- [ ] `POST /api/auth/register` — accepts `{ email, password, displayName }`, creates User, auto-creates 1 Project (ownerId = new user) with 3 BoardColumns ("To Do" / "In Progress" / "Done", order 0/1/2), returns JWT
- [ ] `POST /api/auth/login` — accepts `{ email, password }`, validates credentials, returns JWT with userId in payload
- [ ] NestJS JWT auth guard functional — rejects unauthenticated requests with 401
- [ ] `/register` page — email, password, display name fields, submit calls register endpoint, on success redirects to `/board`
- [ ] `/login` page — email, password fields, submit calls login endpoint, on success redirects to `/board`
- [ ] NgRx auth store — actions for register, login, logout; effect calls API and stores token on success; selectors for current user, isAuthenticated, auth token
- [ ] Auth guard on `/board` route — redirects to `/login` if no token is present
- [ ] Board placeholder page at `/board` calls `GET /api/projects/me`, fetches columns via `GET /api/projects/:projectId/columns`, and renders columns as simple cards (read-only, no add/edit/delete UI)
- [ ] `GET /api/projects/me` endpoint returns the current user's project (scoped by JWT userId)
- [ ] `GET /api/projects/:projectId/columns` endpoint returns columns ordered by `order` field

## Blocked by

- Blocked by `issues/001-scaffold-monorepo.md`

## User stories addressed

- User can register an account and log in
- User has a private workspace auto-created on signup
