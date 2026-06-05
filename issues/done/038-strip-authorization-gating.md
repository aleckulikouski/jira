## Parent PRD

`issues/prd.md`

## What to build

Remove all ownership-based access checks from the API's `AuthorizationService`. Currently `project()`, `column()`, and `ticket()` methods throw `ForbiddenException` if the requesting user is not the project owner. Strip those checks so any authenticated user can access any project, column, or ticket.

Keep the `NotFoundException` existence checks — if an entity doesn't exist, still return 404.

Keep the `userId` parameter in all service method signatures (ColumnService, TicketService, ProjectService) as dead params — they'll be used again when authorization is reintroduced.

## Acceptance criteria

- [ ] `AuthorizationService.project(id, userId)` returns the project without checking `ownerId`
- [ ] `AuthorizationService.column(id, userId)` returns the column without checking project ownership
- [ ] `AuthorizationService.ticket(id, userId)` returns the ticket without checking column/project ownership
- [ ] All three methods still throw `NotFoundException` if the entity doesn't exist
- [ ] ColumnService and TicketService methods still receive and pass `userId` (no signature changes)
- [ ] Existing tests pass (no behavior change for the owner-user case)
- [ ] Manual verification: request columns for a project owned by a different user — returns 200 with columns, not 403

## Blocked by

None — can start immediately.

## User stories addressed

- User story 5: access any project regardless of ownership
