## Parent PRD

`PROJECT_SPEC.md`

## What to build

Render tickets as cards inside their columns and add the ability to create new tickets. Each column shows its tickets as a vertical stack of cards (title visible). A FAB (floating action button) in the bottom-right corner of the board opens a MatDialog with fields for title, description (optional), and a column picker dropdown. On submit, the ticket is created via the API and appears optimistically in the correct column.

NgRx board store extended with ticket actions: load tickets for a column, add ticket (optimistic), and selectors for tickets by column.

## Acceptance criteria

- [ ] Board page loads tickets for each visible column on init (dispatches load action per column, or a combined load)
- [ ] Ticket cards render inside their column's `cdkDropList` area — card shows ticket title, is styled with Angular Material (e.g., `MatCard`)
- [ ] Empty column shows a subtle "No tickets" message or just empty space
- [ ] FAB (Angular Material) rendered on the board page, opens a MatDialog
- [ ] Create ticket dialog contains: title input (required), description textarea (optional), column dropdown (defaults to the first column)
- [ ] Dialog submit: POST to API → on success, dispatch add ticket action to store, ticket card appears in the column instantly, dialog closes
- [ ] Dialog cancel: closes without side effects
- [ ] NgRx board store: loadTickets, addTicket actions + effects, tickets stored keyed by columnId or in a flat list
- [ ] Ticket cards have no drag or click behavior yet (that arrives in 006 and 007)

## Blocked by

- Blocked by `issues/004-ticket-api.md`

## User stories addressed

- User can create tickets in any column
- User can see all tickets on the board organized by column
