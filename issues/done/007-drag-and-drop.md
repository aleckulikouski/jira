## Parent PRD

`PROJECT_SPEC.md`

## What to build

Wire up Angular CDK drag-and-drop on the board. Each ticket card becomes a `cdkDrag` item. Each column's `cdkDropList` (already in place from 003) connects to every other column's list, so tickets can be dragged between columns. Within a column, tickets can be reordered vertically by dragging.

On drop: the store is updated optimistically (ticket moves to new column/new position instantly), and a `PATCH /api/tickets/:id` fires in the background with the new `columnId` and `position`. If the API fails, the store rolls back to the previous state and a MatSnackBar toast shows the error.

The CDK drag placeholder shows where the ticket will land. A visual drag preview (or the card itself) follows the cursor.

## Acceptance criteria

- [ ] Each ticket card has `cdkDrag` directive — card is draggable
- [ ] Each column's `cdkDropList` is connected to all other column drop lists via `[cdkDropListConnectedTo]`
- [ ] Dragging a ticket between columns: on drop, ticket appears in the new column at the drop position, PATCH fires with new `columnId` and `position`
- [ ] Reordering within a column: on drop, ticket moves to new position, PATCH fires with new `position`
- [ ] Store update is optimistic — ticket position/column changes immediately on drop, before the API responds
- [ ] On API failure: store rolls back to previous state, MatSnackBar toast shows error message
- [ ] `cdkDragPlaceholder` shows a visual placeholder (e.g., dashed outline) where the ticket will land
- [ ] Cards animate smoothly during drag (CDK default animations are sufficient)
- [ ] Edge case: dragging a ticket to an empty column works (drop zone accepts even when empty)
- [ ] Edge case: rapid sequential drags don't corrupt state (each drop fires its own PATCH, effects handle out-of-order responses gracefully via store snapshot)

## Blocked by

- Blocked by `issues/006-ticket-detail-and-delete.md`

## User stories addressed

- User can drag tickets between columns
- User can reorder tickets within a column
- Board state updates instantly (optimistic), with rollback on error
