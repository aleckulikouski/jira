## Parent PRD

`issues/prd.md`

## What to build

Replace the existing `GET /projects/me` endpoint with two new endpoints:

- `GET /projects` — returns all projects, sorted by `createdAt` descending. No filtering or pagination.
- `POST /projects` — accepts `CreateProjectData { name: string }`, validates that name is required, non-empty, and unique (exact match). Sets `ownerId` from the JWT. Returns the created `Project`.

Add a `CreateProjectDto` class in the project module with NestJS validation decorators.

Update `ProjectService`:
- Replace `getForUser(userId)` with `getAll()`
- Add `create(data: CreateProjectDto, userId: string)` — checks uniqueness, creates with ownerId, returns the project

## Acceptance criteria

- [ ] `GET /projects` returns all projects as an array, newest first
- [ ] `GET /projects` returns 200 with empty array when no projects exist
- [ ] `POST /projects` with valid `{ name: "My Project" }` returns 201 with the created Project
- [ ] `POST /projects` with empty name returns 400
- [ ] `POST /projects` with missing name returns 400
- [ ] `POST /projects` with duplicate name (exact match) returns 409
- [ ] Created project has `ownerId` set from the JWT
- [ ] `GET /projects/me` no longer exists — returns 404
- [ ] Endpoints require JWT authentication

## Blocked by

- Blocked by `issues/038-strip-authorization-gating.md`

## User stories addressed

- User story 1: see all projects in the dropdown
- User story 3: create a new project
