## Parent PRD

`issues/prd.md`

## What to build

Add success snackbar feedback for all column actions. A new `Show Success` action is added to the board action group. A corresponding `showSuccess$` effect opens a `MatSnackBar` with 5-second duration and a "Close" action button. The existing add, update, and delete effects are updated to dispatch `Show Success` alongside their success actions.

Messages:
- Add column: "Column created"
- Edit column: "Column saved"
- Delete column: "Column deleted"

The pattern mirrors the existing `Show Error` action and `showError$` effect.

Each successful column effect should emit both the existing success action and the new `Show Success` action. The current effects use `map(...)` for success; implementation should switch those success paths to an operator shape that can emit multiple actions, such as `switchMap(() => of(successAction, BoardActions.showSuccess(...)))`.

## Acceptance criteria

- [ ] `Show Success` action added to board action group
- [ ] `showSuccess$` effect opens snackbar with duration 5000 and "Close" action
- [ ] Column success effects emit both their existing success action and `Show Success`
- [ ] `addColumn$` effect dispatches `Show Success` with "Column created" on success
- [ ] `updateColumn$` effect dispatches `Show Success` with "Column saved" on success
- [ ] `deleteColumn$` effect dispatches `Show Success` with "Column deleted" on success
- [ ] Error snackbar behavior is unchanged (still dispatches `Show Error`)
- [ ] Effects tests cover success snackbar dispatch for all three actions

## Blocked by

None — can start immediately.

## User stories addressed

- User story 7: Snackbar confirmation when creating, renaming, or deleting a column
