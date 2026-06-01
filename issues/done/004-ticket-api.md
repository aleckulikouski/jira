## Parent PRD

`PROJECT_SPEC.md`

## What to build

The Ticket entity and its REST API. Tickets belong to a column, have an integer position within that column, and support full CRUD. The position logic uses integer renumbering: when inserting between two tickets (or at a specific position), all tickets at or after the insert position get bumped by +1 inside a database transaction. Deletion does not renumber (gaps are fine).

This slice is backend-only. No UI changes — test via curl, Postman, or the NestJS integration tests.

## Acceptance criteria

- [x] `Ticket` Prisma model: id (uuid), columnId (FK → BoardColumn, cascade delete), assigneeId (FK → User, nullable), title (string), description (string, default ""), position (int), createdAt, updatedAt. Migration created and applied.
- [x] `GET /api/columns/:columnId/tickets` — returns tickets for the column ordered by position ASC
- [x] `POST /api/columns/:columnId/tickets` — accepts `{ title, description? }`, assigns position = max(position) + 1 in that column (or 0 if first ticket), returns created ticket
- [x] `PATCH /api/tickets/:id` — accepts partial `{ title?, description?, columnId?, position? }`. If `columnId` or `position` changes, renumbers atomically: bump positions in target column, then set the ticket's columnId + position. Returns updated ticket.
- [x] `DELETE /api/tickets/:id` — hard deletes the ticket, returns 204
- [x] Position renumbering is transactional (Prisma `$transaction` or interactive transaction)
- [x] Position edge cases handled: moving to position 0, moving to end of column, moving within same column up and down
- [x] Integration tests for all endpoints with a test database
- [x] All ticket endpoints are behind the JWT auth guard, scoped to the user's own project (verify column → project → owner)

## Blocked by

- Blocked by `issues/003-board-columns.md`

## User stories addressed

- Ticket data model and API surface
