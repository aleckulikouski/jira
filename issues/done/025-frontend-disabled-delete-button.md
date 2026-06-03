## Parent PRD

`issues/prd.md`

## What to build

Prevent column deletion on the frontend when the column contains tickets.

1. **Disable delete button on non-empty columns**: Derive an `isDeletable` flag per column from the existing `ticketsByColumn(col.id)` selector. Bind `[disabled]` on the delete button.

2. **Tooltip on disabled button**: Wrap the delete button in a `<span matTooltip="Cannot delete a column that contains tickets">` so the tooltip fires even on a disabled button (Angular Material disabled elements don't emit pointer events, but a wrapper span does).

3. **Confirmation message**: Change the confirmation dialog message to just "Delete column X? This cannot be undone." (no mention of tickets, since the button is only active for empty columns).

See PRD sections: UI Details, Implementation Decisions (Frontend primary guard).

## Acceptance criteria

- [ ] Delete button on a column with tickets is disabled (grayed out, not clickable)
- [ ] Hovering the disabled delete button shows tooltip "Cannot delete a column that contains tickets"
- [ ] Delete button on an empty column is enabled and clickable
- [ ] Clicking delete on an empty column shows confirmation dialog with message "Delete column X? This cannot be undone."
- [ ] Confirming the dialog dispatches the delete action as before
- [ ] Board component test: delete button disabled when column has tickets
- [ ] Board component test: delete button enabled when column is empty

## Blocked by

None — can start immediately. Uses existing store selectors (`ticketsByColumn`). The backend guard in `024-backend-reject-nonempty-column-delete.md` is an independent safety net.

## User stories addressed

- User story 1: delete button disabled on non-empty columns
- User story 2: tooltip explains why button is disabled
- User story 3: empty columns can still be deleted after confirmation
- User story 4: clear confirmation message for empty column deletion
