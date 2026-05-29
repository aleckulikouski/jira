## Parent PRD

`PROJECT_SPEC.md`

## What to build

The Ticket entity and its REST API. Tickets belong to a column, have an integer position within that column, and support full CRUD. The position logic uses integer renumbering: when inserting between two tickets (or at a specific position), all tickets at or after the insert position get bumped by +1 inside a database transaction. Deletion does not renumber (gaps are fine).

This slice is backend-only. No UI changes — test via curl, Postman, or the NestJS integration tests.

## Acceptance criteria

- [ ] `Ticket` Prisma model: id (uuid), columnId (FK → BoardColumn, cascade delete), assigneeId (FK → User, nullable), title (string), description (string, default ""), position (int), createdAt, updatedAt. Migration created and applied.
- [ ] `GET /api/columns/:columnId/tickets` — returns tickets for the column ordered by position ASC
- [ ] `POST /api/columns/:columnId/tickets` — accepts `{ title, description? }`, assigns position = max(position) + 1 in that column (or 0 if first ticket), returns created ticket
- [ ] `PATCH /api/tickets/:id` — accepts partial `{ title?, description?, columnId?, position? }`. If `columnId` or `position` changes, renumbers atomically: bump positions in target column, then set the ticket's columnId + position. Returns updated ticket.
- [ ] `DELETE /api/tickets/:id` — hard deletes the ticket, returns 204
- [ ] Position renumbering is transactional (Prisma `$transaction` or interactive transaction)
- [ ] Position edge cases handled: moving to position 0, moving to end of column, moving within same column up and down
- [ ] Integration tests for all endpoints with a test database
- [ ] All ticket endpoints are behind the JWT auth guard, scoped to the user's own project (verify column → project → owner)

## Blocked by

- Blocked by `issues/003-board-columns.md`

## User stories addressed

- Ticket data model and API surface
