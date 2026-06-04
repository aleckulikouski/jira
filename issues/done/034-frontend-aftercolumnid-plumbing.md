## Parent PRD

`issues/prd.md`

## What to build

Introduce the frontend interfaces and state-management plumbing needed to pass `afterColumnId` through every layer. The board component, dialogs, and API integration all consume these — but they are wired up in later issues. This issue only creates the types and updates the NgRx chain (actions, reducer, effects, facade, service) to accept and pass `afterColumnId`.

Also update `TicketDialogData` with a `selectedColumnId` field for create mode. Because this interface is consumed by existing board/dialog call sites, this issue must either keep the type backward-compatible until `issues/036-ticket-dialog-update.md` and `issues/037-board-menu-and-removals.md`, or include the minimal call-site updates needed to keep the workspace compiling.

Dialog behavior and board UI are NOT modified here. Minimal compile-only call-site updates are allowed if the `TicketDialogData` type would otherwise break existing callers.

## Acceptance criteria

- [ ] `AddColumnData` interface (`{ projectId: string; name: string; afterColumnId?: string }`) added under `apps/web/src/app/core/interfaces/` (create `board.interface.ts` there if desired; it does not exist today)
- [ ] `ColumnEditorDialogData` interface (`{ column?: BoardColumn; afterColumnId?: string }`) added under `apps/web/src/app/core/interfaces/` or another explicit shared interface location
- [ ] `ColumnEditorDialogResult` interface (`{ id?: string; name: string; afterColumnId?: string }`) added under the same explicit shared interface location
- [ ] `TicketDialogData.selectedColumnId` is modeled so create mode gets a required selected column without breaking edit-mode callers; prefer a discriminated/union shape if that is clearest
- [ ] `BoardActions.addColumn` action payload type changed to `AddColumnData`
- [ ] `BoardActions.addColumnSuccess` action payload changed from a single column to `BoardColumn[]`, named clearly as `columns`
- [ ] Board reducer `on(addColumnSuccess, ...)` replaces `state.columns` with the full payload array
- [ ] Board effect for `addColumn` threads `afterColumnId` through to service, maps `BoardColumn[]` response to `addColumnSuccess`
- [ ] `BoardFacade.addColumn` accepts `AddColumnData` object
- [ ] `BoardService.createColumn` accepts optional `afterColumnId?: string` third parameter and sends it in the request body
- [ ] Existing board/ticket-dialog call sites still compile after the `TicketDialogData` interface change
- [ ] Reducer spec: `addColumnSuccess` replaces columns array
- [ ] Effects spec: addColumn calls service with correct data, maps response to success
- [ ] Facade spec: passes `AddColumnData` to store dispatch

## Blocked by

Blocked by `issues/033-backend-aftercolumnid.md` — needs the API contract (all-columns response, optional afterColumnId body field).

## User stories addressed

- User story 4 (add column plumbing)
- User story 5 (afterColumnId threading)
