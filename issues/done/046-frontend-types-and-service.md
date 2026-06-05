## Parent PRD

`issues/prd.md`

## What to build

Add `tickets?: Ticket[]` to the `BoardColumn` type. Add `getBoard(projectId)` to `BoardService` that calls the new board endpoint.

Existing service methods (`getColumns`, `getTickets`) stay. The app still works with old endpoints at this stage.

## Acceptance criteria

- [ ] `BoardColumn` in shared-types has optional `tickets?: Ticket[]`
- [ ] `BoardService.getBoard(projectId)` calls `GET /projects/:id/board` and returns the nested response
- [ ] `BoardService` unit test verifies `getBoard` uses the correct URL and HTTP method

## Blocked by

- Blocked by `issues/045-backend-board-endpoint.md`

## User stories addressed

- User story 14 (type reflects nested data)
