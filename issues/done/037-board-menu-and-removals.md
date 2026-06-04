## Parent PRD

`issues/prd.md`

## What to build

Assemble all changes in the board component: add the two new items to every column's actions menu, remove the FAB and header "Add column" button, update the empty state, and wire the dialogs with the new data interfaces.

## Acceptance criteria

- [ ] Every column's `mat-menu` has "New ticket" as the first item (with `note_add` icon)
- [ ] Every column's `mat-menu` has "Add column" as the second item (with `add` icon)
- [ ] Menu order: New ticket → Add column → Edit → separator → Delete
- [ ] FAB (`mat-fab`) removed from template
- [ ] Header "Add column" button removed from template
- [ ] Empty state (`columns.length === 0`) shows a big centered button: `+` icon + "Add column" label
- [ ] "New ticket" menu item opens ticket dialog with `selectedColumnId` set to the column whose menu was clicked
- [ ] "Add column" menu item opens column editor dialog with `afterColumnId` set to the triggering column's ID
- [ ] Empty state "Add column" button opens column editor dialog WITHOUT `afterColumnId` (plain append)
- [ ] "Edit" menu item continues to open column editor dialog with `{ column }` (edit mode)
- [ ] Empty-state button includes a `mat-icon` with `add`, not only text
- [ ] Component tests: menu items rendered; correct icons; menu item order; FAB absent; header button absent; empty state button present and centered; empty state add icon present; dialogs opened with correct data for each menu item

## Blocked by

Blocked by `issues/035-column-editor-dialog-update.md` and `issues/036-ticket-dialog-update.md` — needs both dialogs to accept the new data interfaces.

## User stories addressed

- User story 1 (create ticket from column menu)
- User story 4 (add column from column menu)
- User story 5 (new column lands to the right)
- User story 6 (all creation actions in one menu)
- User story 7 (separator before delete)
- User story 8 (empty state bootstrap button)
- User story 9 (menu hover-reveal unchanged)
- User story 10 (touch device always-visible unchanged)
