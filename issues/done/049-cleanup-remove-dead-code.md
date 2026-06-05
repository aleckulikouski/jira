## Parent PRD

`issues/prd.md`

## What to build

Remove dead code left behind by the refactor — unused GET endpoints, unused service methods, unused NgRx artifacts.

Backend:
- Remove `GET /projects/:projectId/columns` from `ColumnController`
- Remove `GET /columns/:columnId/tickets` from `TicketController`
- Remove `ColumnService.getForProject()`
- Remove `TicketService.getForColumn()`

Frontend:
- Remove `BoardService.getColumns()` and `BoardService.getTickets()`

Tests updated to reflect removals (no broken references).

## Acceptance criteria

- [ ] `GET /projects/:projectId/columns` returns 404
- [ ] `GET /columns/:columnId/tickets` returns 404
- [ ] `ColumnService` no longer has `getForProject` method
- [ ] `TicketService` no longer has `getForColumn` method
- [ ] `BoardService` no longer has `getColumns` or `getTickets` methods
- [ ] Controller tests confirm routes are removed
- [ ] Service tests confirm methods are gone
- [ ] `nx run api:test` passes
- [ ] `nx run web:test` passes

## Blocked by

- Blocked by `issues/047-frontend-store-and-wiring.md`

## User stories addressed

- User story 12 (unused GET endpoints removed)
- User story 13 (unused service methods removed)
