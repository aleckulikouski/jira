## Parent PRD

`issues/prd.md`

## What to build

Update the column editor dialog to reflect the new labeling, accept the new data shape, and echo `afterColumnId` in the result.

## Acceptance criteria

- [ ] Dialog title is "New Column" when creating (was "Add Column") and "Edit Column" when editing (unchanged)
- [ ] Submit button text is "Save" in both create and edit modes (was "Add" in create mode)
- [ ] Dialog accepts `ColumnEditorDialogData` instead of bare `BoardColumn | undefined`
- [ ] Edit mode is determined by `data.column` existing, not by `data` truthiness (`{ afterColumnId }` is still create mode)
- [ ] Existing edit-mode initialization reads name/id from `data.column`
- [ ] `afterColumnId` (if present in dialog data) is echoed back in the result — dialog does not use it itself
- [ ] Cancel behavior unchanged (unsaved-changes guard in edit mode)
- [ ] Dialog component tests: title in create mode, title in edit mode, submit button text in both modes, `afterColumnId` echoed in result
- [ ] Tests use the new data interface

## Blocked by

Blocked by `issues/034-frontend-aftercolumnid-plumbing.md` — needs `ColumnEditorDialogData` and `ColumnEditorDialogResult` interfaces.

## User stories addressed

- Supports the PRD dialog-labeling and add-column insertion work
