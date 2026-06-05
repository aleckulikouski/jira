## Parent PRD

`issues/prd.md`

## What to build

Add `GET /projects/:id/board` to `ProjectController`. The endpoint returns the project with its columns and each column's tickets nested. Uses a single Prisma `include` query.

Existing column and ticket GET endpoints remain untouched in this slice — the frontend still uses them. This is purely additive.

## Acceptance criteria

- [ ] `GET /projects/:id/board` returns JSON shaped as `{ id, name, columns: [{ id, name, order, tickets: [{ id, title, description, position, columnId, assigneeId, createdAt, updatedAt }] }] }`
- [ ] Endpoint is protected by `JwtAuthGuard`
- [ ] `ProjectService.getBoard(projectId, userId)` calls `auth.project()` then `prisma.project.findUnique` with nested includes
- [ ] Controller test verifies route exists and guard is applied
- [ ] Service test verifies nested data is returned given valid project and user

## Blocked by

None — can start immediately.

## User stories addressed

- User story 1 (board loads in one request — backend side)
- User story 2 (board feels fast — backend side)
- User story 11 (single Prisma query with includes)
