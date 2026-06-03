## Parent PRD

`issues/prd.md`

## What to build

Add backend enforcement that prevents deleting a non-empty column.

1. **Schema migration**: Change `Ticket.column` relation from `onDelete: Cascade` to `onDelete: NoAction`. This makes the foreign key constraint a backstop — the database itself rejects deleting a column that still has tickets referencing it.

2. **Transactional delete check**: In `ColumnService.delete()`, wrap the operation in a Prisma interactive transaction: count tickets in the column, throw `ConflictException` if count > 0, then delete the column. The transaction prevents a TOCTOU race between the count and the delete.

3. **Error surfacing**: The `ConflictException` maps to HTTP 409 automatically via NestJS. The frontend effects already catch errors from `deleteColumn` and dispatch both `deleteColumnFailure` (sets error in state) and `showError` (shows a snackbar). No frontend effect changes needed — the existing error handling pipeline surfaces the 409 message.

See PRD sections: API Contracts, Error Flow, Implementation Decisions (Backend enforcement, Database backstop, Schema Changes).

## Acceptance criteria

- [ ] `Ticket.column` relation has `onDelete: NoAction` (migration generated and applied)
- [ ] `DELETE /columns/:id` on a column with tickets returns HTTP 409 with body `{ statusCode: 409, message: "Cannot delete column: it still contains N ticket(s)" }`
- [ ] `DELETE /columns/:id` on an empty column succeeds and returns 204
- [ ] ColumnService delete test: rejects with ConflictException when column has tickets
- [ ] ColumnService delete test: succeeds when column has no tickets

## Blocked by

None — can start immediately.

## User stories addressed

- User story 5: reject deletion if tickets exist despite frontend guard
- User story 6: clear error message if deletion is rejected by backend
