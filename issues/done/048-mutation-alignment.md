## Parent PRD

`issues/prd.md`

## What to build

Align mutation endpoints and reducers for the new nested state shape. Backend mutation responses that previously returned lists now return single resources. Frontend mutation reducers operate on nested state.

Backend changes:
- `POST /projects/:id/columns` returns a single `BoardColumn` instead of `BoardColumn[]`
- `ColumnService.create` returns the created column only (not the full list)
- `BoardService.createColumn` return type narrowed to `BoardColumn`

Frontend reducer changes:
- `addColumnSuccess` appends the single column with empty `tickets: []` and sorts by order
- `updateColumnSuccess` finds the column by id and merges
- `deleteColumnSuccess` filters the column out
- `addTicket` (optimistic) pushes a temp ticket into the target column's tickets
- `addTicketSuccess` swaps the tempId ticket for the real one in the column's tickets
- `addTicketFailure` removes the tempId ticket from the column's tickets
- `updateTicketSuccess` finds the ticket across columns and replaces it
- `deleteTicketSuccess` finds and removes the ticket from its column
- `moveTicket` (optimistic) removes from source column, adds to target column with new position
- `moveTicketSuccess` replaces the moved ticket
- `moveTicketFailure` rolls back to previous ticket state

## Acceptance criteria

- [ ] Backend `ColumnService.create` returns single column
- [ ] `POST /projects/:id/columns` response is a single column object
- [ ] `BoardService.createColumn` returns `BoardColumn` not `BoardColumn[]`
- [ ] All reducer handlers listed above work correctly with nested state
- [ ] `onDrop` in `BoardComponent` works — computes drop positions using derived `selectTickets`
- [ ] Drag-drop between columns works in the running app
- [ ] Creating a column shows an empty column on the board
- [ ] Creating a ticket shows it in the right column
- [ ] Editing a ticket persists
- [ ] Deleting a ticket removes it
- [ ] Moving a ticket between columns persists
- [ ] Reducer tests cover each mutation handler
- [ ] Effect tests updated for the single-column create response

## Blocked by

- Blocked by `issues/047-frontend-store-and-wiring.md`

## User stories addressed

- User story 3 (create column)
- User story 4 (edit column)
- User story 5 (delete column)
- User story 6 (reorder columns — unchanged but verified)
- User story 7 (create ticket)
- User story 8 (edit ticket)
- User story 9 (delete ticket)
- User story 10 (drag ticket between columns)
- User story 15 (mutations return single resources)
