## Parent PRD

`issues/prd.md`

## What to build

Restructure the column header to prepare it for drag-and-drop. Remove inline title editing (click-to-edit, blur/enter to save, escape to cancel). The title becomes a static display element. Constrain the future drag handle area to just the title text so the delete button sits outside it and won't conflict with column dragging. Add `cursor: grab` to the title area as a drag affordance.

The `updateColumn` store machinery (actions, reducer, effects, facade) stays intact — it will serve the edit button when that feature is added later.

## Acceptance criteria

- [ ] Inline editing removed from column header: no `(click)` to enter edit mode, no `(blur)`, `(keydown.enter)`, or `(keydown.escape)` handlers on the title
- [ ] Column title is a plain text element (no input swapping)
- [ ] Title area width is constrained so the delete button is outside the drag handle zone
- [ ] `cursor: grab` on the column title area
- [ ] Delete button still works and is clickable
- [ ] `updateColumn` action/reducer/effect/facade are NOT removed (still needed for future edit button)
- [ ] No other functionality is broken — ticket display, ticket drag-and-drop, add column dialog, delete column all still work

## Blocked by

None — can start immediately.

## User stories addressed

- User story 8 (grab cursor on title for discoverability)
- User story 11 (delete button still accessible)
