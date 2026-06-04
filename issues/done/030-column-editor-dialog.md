## Parent PRD

`issues/prd.md`

## What to build

Create a reusable `ColumnEditorDialogComponent` that handles both add and edit column flows, replacing the existing `AddColumnDialogComponent`. The dialog detects its mode implicitly: if a `BoardColumn` object is passed via `MAT_DIALOG_DATA`, it operates in edit mode; otherwise add mode.

In add mode, the dialog shows title "Add Column", an empty name field, and an "Add" button. In edit mode, it shows title "Edit Column", a name field pre-filled with the current column name, and a "Save" button. The save button is disabled when the name is empty or whitespace-only.

In edit mode, if the user clicks Save without changing the name, the dialog closes silently without dispatching any action. If the user has modified the name and tries to cancel, press Escape, or click the backdrop, a confirmation dialog warns "unsaved changes will be lost" and lets them stay or discard.

The dialog closes with `{ id?: string; name: string }` — `id` is present only in edit mode. The name is trimmed before submission.

Use explicit local types for the dialog contract, for example:
- `ColumnEditorDialogData = BoardColumn | undefined`
- `ColumnEditorDialogResult = { id?: string; name: string }`

In edit mode, unchanged-name detection compares the trimmed current column name to the trimmed input value. For example, changing `To Do` to `To Do ` is treated as unchanged and closes silently.

To support the unsaved-changes prompt, open the editor dialog with `disableClose: true` and handle cancel, Escape, and backdrop click through the component's close guard. This prevents Material's default backdrop/Escape behavior from closing the dialog before the confirmation prompt can run.

The existing `AddColumnDialogComponent` and its directory are deleted. The board component's `openAddColumnDialog` method is replaced with `openColumnEditorDialog` that handles both flows. A new `editColumn` method opens the dialog in edit mode and dispatches `updateColumn` on save.

## Acceptance criteria

- [ ] Dialog opens in add mode when no `BoardColumn` data is passed
- [ ] Dialog opens in edit mode when `BoardColumn` data is passed, with name field pre-filled
- [ ] Add mode: title "Add Column", button "Add"
- [ ] Edit mode: title "Edit Column", button "Save"
- [ ] Save button is disabled when name is empty or whitespace-only
- [ ] Name is trimmed before submission
- [ ] Explicit dialog data/result types are defined and used
- [ ] Dialog closes with `{ name: string }` in add mode, `{ id: string, name: string }` in edit mode
- [ ] In edit mode, Save with unchanged trimmed name closes silently — no dispatch
- [ ] Dialog is protected from default Escape/backdrop close while unsaved-change guard is active
- [ ] In edit mode, Cancel/Esc/backdrop with modified trimmed name shows "unsaved changes will be lost" confirmation
- [ ] Choosing "stay" in the unsaved-changes prompt keeps the dialog open
- [ ] Choosing "discard" in the unsaved-changes prompt closes the dialog with no result
- [ ] `AddColumnDialogComponent` and its directory are deleted
- [ ] Add Column button on the board opens the new reusable dialog and dispatches `addColumn`
- [ ] `editColumn` method on board component opens the dialog in edit mode and dispatches `updateColumn`
- [ ] Dialog component has tests covering all modes and edge cases
- [ ] Board component tests are updated for the new dialog usage

## Blocked by

None — can start immediately.

## User stories addressed

- User story 4: Edit option to rename a column
- User story 5: Edit dialog pre-filled with current column name
- User story 6: Add Column uses same dialog as Edit Column
- User story 10: Warned about unsaved changes when closing Edit dialog
- User story 11: Edit dialog closes silently when Save with unchanged name
