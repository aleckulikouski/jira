## Parent PRD

`PROJECT_SPEC.md`

## What to build

Clicking a ticket card opens a detail/edit MatDialog. The dialog shows the ticket's title (editable), description (editable textarea), and a column dropdown to move the ticket without dragging. Save commits changes via PATCH. A delete button in the dialog hard-deletes the ticket after confirmation.

MatSnackBar error toasts: any API failure during save or delete shows a toast with the error message. The NgRx effects that handle these operations dispatch a "show error" action, and a global/app-level component subscribes to error actions and opens the snackbar.

NgRx board store extended with updateTicket and deleteTicket actions + effects.

## Acceptance criteria

- [ ] Clicking a ticket card opens a MatDialog with the ticket's current title, description, and column
- [ ] Dialog fields: title input (pre-filled), description textarea (pre-filled), column dropdown (pre-filled with current column)
- [ ] Save button: calls `PATCH /api/tickets/:id` with changed fields, dispatches updateTicket action on success, updates the card in-place on the board, closes dialog
- [ ] Delete button: opens a confirmation dialog ("Are you sure?"), on confirm calls `DELETE /api/tickets/:id`, dispatches deleteTicket action on success, removes card from board, closes dialog
- [ ] Column change via dropdown in dialog moves the ticket card to the new column on the board (via store update)
- [ ] If API call fails (network error, 4xx, 5xx), a MatSnackBar toast appears with the error message
- [ ] Cancel / clicking outside dialog closes without changes
- [ ] NgRx board store: updateTicket and deleteTicket actions + effects
- [ ] Error handling: failed save or delete → dispatch a global error action → snackbar service displays message
- [ ] Toasts auto-dismiss after ~5 seconds

## Blocked by

- Blocked by `issues/005-ticket-create-and-list.md`

## User stories addressed

- User can view and edit ticket details (title, description, column)
- User can delete tickets
- User sees error feedback when an operation fails
