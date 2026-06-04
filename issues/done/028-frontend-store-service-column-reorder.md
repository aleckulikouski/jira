## Parent PRD

`issues/prd.md`

## What to build

Add the full frontend store and service layer for column reordering. New `reorderColumns` NgRx action group (init, success, failure). Reducer with optimistic update — applies the new column order immediately, stores a previous-order snapshot, and rolls back on failure. Effect calls the new API endpoint and dispatches success or failure. Selector defensively sorts columns by `order`. Facade exposes `reorderColumns`. Service adds the HTTP method.

This is a complete vertical slice from the facade API surface through to the HTTP call. Verifiable entirely through unit tests without touching the UI.

## Acceptance criteria

- [ ] `board.actions.ts`: new `reorderColumns` / `reorderColumnsSuccess` / `reorderColumnsFailure` action group. `reorderColumns` carries `{ projectId: string, orderedIds: string[] }`. Failure carries the `previousOrderedIds` for rollback.
- [ ] `board.reducer.ts`: on `reorderColumns`, optimistically reorder the `columns` array to match `orderedIds` and store the previous ordered IDs. On success, clear the snapshot. On failure, restore columns to the previous order.
- [ ] `board.effects.ts`: `reorderColumns$` effect calls `BoardService.reorderColumns`, maps to success with no payload, catches error and maps to failure with the previous ordered IDs from the action.
- [ ] `board.selectors.ts`: `selectColumns` sorts by `order` ascending as a defensive measure.
- [ ] `board.facade.ts`: `reorderColumns` method dispatches the action.
- [ ] `board.service.ts`: `reorderColumns(projectId, orderedIds)` sends `PATCH projects/:projectId/columns/reorder` with body `{ orderedIds }`.
- [ ] Unit tests: reducer optimistic apply and rollback, effect success and failure dispatch, selector sort order.

## Blocked by

- Blocked by `issues/026-backend-column-reorder-endpoint.md` (API endpoint must exist for the effect and service to call)

## User stories addressed

- User story 4 (order persists after reload)
- User story 9 (instant snap on drop via optimistic update)
- User story 12 (rollback on API failure)
