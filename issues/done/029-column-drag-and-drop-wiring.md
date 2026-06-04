## Parent PRD

`issues/prd.md`

## What to build

Wire up Angular CDK drag-and-drop on the board for column reordering. This is the UI layer that connects user gestures to the store. The board columns container becomes a horizontal `cdkDropList`. Each column card gets `cdkDrag` with horizontal lock and a `cdkDragHandle` on the title area. A custom `*cdkDragPlaceholder` renders an outlined gap card. The scroll container gets `cdkScrollable` for edge auto-scroll. The drop handler computes the new index, skips same-position drops, and dispatches `reorderColumns` to the store.

This is the final slice — after this, column reordering is fully functional from drag to database.

## Acceptance criteria

- [ ] Board template: inner wrapper `div` with `cdkDropList`, `cdkDropListOrientation="horizontal"`, and `[cdkDropListData]="columns"` wrapping all column cards
- [ ] Each column card wrapped in `<div cdkDrag [cdkDragLockAxis]="'x'" [cdkDragData]="column">`
- [ ] Column title element has `cdkDragHandle` directive, constrained to title area only (delete button outside handle)
- [ ] Custom `*cdkDragPlaceholder` template: an empty `div` with dashed outline matching column card width
- [ ] Board scroll container has `cdkScrollable` directive for edge auto-scroll during drag
- [ ] `onColumnDrop(event: CdkDragDrop<...>)` handler: pulls column from `event.item.data`, computes new index from drop position, skips if same position, builds new `orderedIds` array, dispatches `facade.reorderColumns`
- [ ] `columnDropListIds` computed property for `[cdkDropListConnectedTo]`
- [ ] Ticket drag-and-drop still works — dragging tickets between columns is unaffected
- [ ] Columns can be dragged to any position including first and last
- [ ] Same-position drop does nothing (no API call, no state change)
- [ ] Dragging a column near the left or right edge of the board auto-scrolls in that direction
- [ ] Column drag preview is constrained to horizontal axis only

## Blocked by

- Blocked by `issues/027-column-header-restructuring.md` (header must be restructured with drag handle area before CDK directives are added)
- Blocked by `issues/028-frontend-store-service-column-reorder.md` (store must accept `reorderColumns` dispatch for the drop handler to call)

## User stories addressed

- User story 1 (drag column by header to new position)
- User story 2 (columns slide apart to show drop target)
- User story 3 (horizontal axis lock)
- User story 5 (auto-scroll near board edge)
- User story 7 (drag to any position, including first and last)
- User story 10 (ticket drag-and-drop unaffected)
