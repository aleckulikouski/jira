## Parent PRD

`PROJECT_SPEC.md`

## What to build

Bare-bones monorepo with both apps serving, a shared types library, PostgreSQL via Docker Compose, and Prisma wired up with an empty initial migration. Nothing user-facing yet — just the foundation every other slice builds on.

After this slice, running `docker-compose up` starts PostgreSQL, `nx serve api` starts NestJS on `:3000`, and `nx serve web` starts Angular on `:4200`. Prisma can connect to the DB and run migrations.

## Acceptance criteria

- [ ] Nx workspace initialized at repo root
- [ ] NestJS app generated at `apps/api`, serves on `localhost:3000`
- [ ] Angular app generated at `apps/web` (standalone components), serves on `localhost:4200`
- [ ] Shared types lib generated at `libs/shared-types`, importable from both apps
- [ ] `docker-compose.yml` at repo root with a `postgres` service (port 5432, persistent volume)
- [ ] Prisma initialized in `apps/api` with a datasource pointing at the Docker PostgreSQL
- [ ] Empty initial Prisma migration created and applied
- [ ] `nx serve api` and `nx serve web` both start without errors

## Blocked by

None — can start immediately.

## User stories addressed

N/A (infrastructure)
