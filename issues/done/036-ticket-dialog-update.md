## Parent PRD

`issues/prd.md`

## What to build

Update the ticket dialog title, button text, and column pre-selection behavior.

## Acceptance criteria

- [ ] Dialog title is "New Ticket" (was "Create Ticket" in create mode; edit mode unchanged)
- [ ] Submit button text is "Save" in both create and edit modes (was "Create" in create mode)
- [ ] Column selector is pre-selected to `selectedColumnId` (mandatory field from `TicketDialogData`)
- [ ] In edit mode, the selector still initializes from `ticket.columnId`; `selectedColumnId` only controls create mode
- [ ] Column selector is still visible and changeable — user can override the pre-selection
- [ ] Dialog component tests: title is "New Ticket", submit button says "Save", create-mode column selector defaults to `selectedColumnId`, edit-mode column selector defaults to `ticket.columnId`

## Blocked by

Blocked by `issues/034-frontend-aftercolumnid-plumbing.md` — needs mandatory `selectedColumnId` on `TicketDialogData`.

## User stories addressed

- User story 2 (ticket dialog pre-selects the triggering column)
- User story 3 (column selector still visible so user can correct misclick)
