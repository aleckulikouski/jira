## Parent PRD

`issues/prd.md`

## What to build

Wire the TicketController and ColumnController to emit internal domain events after every successful mutation. Also update the TicketService to always include the parent column's `projectId` in returned ticket objects, so the controller has the project ID needed for room routing without an extra query.

Each mutation endpoint (create, update, delete, reorder) emits one typed domain event via the global `EventEmitter2`. The event payload includes the `projectId` for room routing and the full entity.

The existing WsNotifierService from the previous slice picks these events up automatically and translates them to socket.io emissions. After this slice, events flow server-side — if a WebSocket client were connected, it would receive events. The client is built in the next slice.

## Acceptance criteria

- [ ] `TicketService` includes `column.projectId` in ticket create and update return values (Prisma `include`)
- [ ] `TicketController.create()` emits `ticket.created` domain event with projectId and full ticket
- [ ] `TicketController.update()` emits `ticket.updated` domain event with projectId and full ticket
- [ ] `TicketController.delete()` emits `ticket.deleted` domain event with projectId and ticket ID
- [ ] `ColumnController.create()` emits `column.created` domain event with projectId and full column
- [ ] `ColumnController.update()` emits `column.updated` domain event with projectId and full column
- [ ] `ColumnController.delete()` emits `column.deleted` domain event with projectId and column ID
- [ ] `ColumnController.reorder()` emits `columns.reordered` domain event with projectId and orderedIds
- [ ] REST endpoints continue to return the same HTTP responses as before (no breaking change)
- [ ] `nx test api` passes
- [ ] `nx typecheck api` passes

## Blocked by

- Blocked by `issues/051-server-ws-pipeline.md`

## User stories addressed

- User story 1 (new columns from others)
- User story 2 (column renames from others)
- User story 3 (column deletions from others)
- User story 4 (new tickets from others)
- User story 5 (ticket edits from others)
- User story 6 (ticket moves from others)
- User story 7 (ticket deletions from others)
- User story 8 (column reordering from others)
