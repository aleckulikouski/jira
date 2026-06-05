## Parent PRD

`issues/prd.md`

## What to build

Replace `loadColumns`/`loadTickets` with `loadBoard` across the entire NgRx stack — actions, effects, reducer, selectors, facade — and wire the project-selection effect to dispatch `loadBoard` instead of `loadColumns`.

State shape changes: no flat `tickets` array in `BoardState`. Columns carry their tickets nested. `selectTickets` derives flat array from columns. `selectTicketsByColumn` finds column and returns its tickets.

Board loads in one request after this slice. All existing mutation reducers continue working with nested state. Board component needs no changes.

## Acceptance criteria

- [ ] `BoardActions` has `loadBoard`, `loadBoardSuccess`, `loadBoardFailure` and no longer has `loadColumns*` or `loadTickets*`
- [ ] `BoardEffects.loadBoard$` calls `boardService.getBoard()` on `loadBoard`, dispatches `loadBoardSuccess` with the board payload
- [ ] `LoadTicketsAfterColumns$`, `loadColumns$`, and `loadTickets$` effects removed
- [ ] `BoardState` no longer has a `tickets` array
- [ ] Reducer `loadColumnsSuccess` replaced with `loadBoardSuccess` that sets `columns` from the nested payload
- [ ] `selectTickets` derives from columns via `flatMap`
- [ ] `selectTicketsByColumn` looks up column and returns `tickets`
- [ ] `BoardFacade` has `loadBoard(projectId)` replacing `loadColumns` and `loadTickets`
- [ ] `ProjectEffects.selectProject$` dispatches `loadBoard` instead of `loadColumns`
- [ ] Reducer tests cover `loadBoardSuccess` and verify nested column+tickets state
- [ ] Selector tests verify `selectTickets` and `selectTicketsByColumn`
- [ ] Effect tests verify `loadBoard$` calls service and dispatches success/failure
- [ ] Facade tests verify `loadBoard` dispatches the action

## Blocked by

- Blocked by `issues/046-frontend-types-and-service.md`

## User stories addressed

- User story 1 (board loads in one request)
- User story 2 (board feels fast)
- User story 14 (frontend state shape reflects nested data)
