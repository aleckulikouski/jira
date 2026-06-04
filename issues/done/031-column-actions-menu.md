## Parent PRD

`issues/prd.md`

## What to build

Replace the trash icon in each column header with a `more_vert` triple-dot button that opens a `mat-menu` dropdown with two items: Edit and Delete. The menu trigger is hidden by default and appears on column card hover, except on touch devices where it's always visible.

The Edit menu item is always enabled and opens the `ColumnEditorDialogComponent` in edit mode. The Delete menu item is disabled when the column has tickets, with secondary helper text "Column must be empty". Clicking Delete opens the existing confirmation dialog and dispatches the delete on confirm.

Add `MatMenuModule` to the board component's imports. Rename the `.delete-btn` CSS class to `.column-actions-btn`.

The trigger should appear when the column is hovered and when the column has keyboard focus via `:focus-within`. Touch devices still show the trigger all the time.

Use contextual ARIA labels so repeated column controls are distinguishable:
- Trigger: `aria-label="Column actions for {column name}"`
- Edit: `aria-label="Edit {column name} column"`
- Delete when enabled: `aria-label="Delete {column name} column"`
- Delete when disabled: label or description must expose the reason, for example `aria-label="Delete {column name} column. Column must be empty"`

The disabled Delete helper text must be both visible and accessible. Because disabled menu items can be awkward for assistive tech, use `aria-describedby` or an equivalent label/description strategy rather than relying only on nested visual text.

## Acceptance criteria

- [ ] Triple-dot `more_vert` button replaces the trash icon in each column header
- [ ] Clicking the button opens a `mat-menu` dropdown with Edit and Delete items
- [ ] Edit item has `<mat-icon>edit</mat-icon>` icon and "Edit" label
- [ ] Delete item has `<mat-icon>delete</mat-icon>` icon and "Delete" label
- [ ] Edit item opens `ColumnEditorDialogComponent` in edit mode with the column's data
- [ ] Delete item opens the existing confirmation dialog and dispatches delete on confirm
- [ ] Delete item is disabled when column has tickets, with "Column must be empty" helper text
- [ ] Menu trigger is hidden by default, visible on column card hover
- [ ] Menu trigger is visible when the column has keyboard focus via `:focus-within`
- [ ] Menu trigger is always visible on touch devices via `@media (hover: none)`
- [ ] CSS class `.delete-btn` renamed to `.column-actions-btn`
- [ ] Smooth opacity transition on the menu trigger visibility change
- [ ] Menu trigger has contextual `aria-label`, e.g. `Column actions for To Do`
- [ ] Edit item has contextual `aria-label`, e.g. `Edit To Do column`
- [ ] Delete item has contextual `aria-label`, e.g. `Delete To Do column`
- [ ] Disabled Delete item exposes the disabled reason to assistive tech, not only visually
- [ ] `MatMenuModule` added to board component's imports
- [ ] Board component tests updated for menu trigger, menu items, and disabled state
- [ ] Menu tests use Angular Material harnesses or `OverlayContainer`, since `mat-menu` renders in the overlay outside the component fixture
- [ ] Existing add column button still works (uses `ColumnEditorDialogComponent` from #030)

## Blocked by

- Blocked by `issues/030-column-editor-dialog.md` (Edit menu item needs the dialog to exist)

## User stories addressed

- User story 1: Triple-dot menu consolidates column actions
- User story 2: Menu trigger visible on column hover
- User story 3: Always visible on touch devices
- User story 8: Delete disabled with helper text when column has tickets
- User story 9: Delete shows confirmation dialog
- User story 12: Keyboard-navigable menu and dialog
- User story 13: ARIA labels on controls
