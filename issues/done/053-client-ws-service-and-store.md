## Parent PRD

`issues/prd.md`

## What to build

Create the Angular WsService that connects to the socket.io server and bridges incoming events to the NgRx store. Add the two new external create actions, the corresponding reducer handlers, a `selectTicketById` selector, and the NgRx effects for connect/disconnect on auth state changes. Wire the board component to manage room membership (join project room on navigate, leave on destroy).

The WsService wraps the socket.io client. It connects at login (or on page refresh if a token exists in localStorage), disconnects on logout, joins/leaves project rooms when the user navigates between projects, and buffers incoming socket events until the initial board load completes (preventing race conditions where events arrive before state). On reconnect, it refetches the full board via REST.

Each incoming socket event dispatches the correct NgRx action:
- `column:created` → `columnCreatedExternally`
- `column:updated` → `updateColumnSuccess`
- `column:deleted` → `deleteColumnSuccess`
- `ticket:created` → `ticketCreatedExternally`
- `ticket:updated` → `updateTicketSuccess`
- `ticket:deleted` → `deleteTicketSuccess`
- `columns:reordered` → `reorderColumns`

The board component calls `wsService.setCurrentProject(projectId)` on init and whenever the route param changes, which handles leaving the old room and joining the new one.

## Acceptance criteria

- [ ] `WsService` is injectable, provided in `root`
- [ ] `WsService.connect(token)` opens a socket.io connection with JWT in the auth object
- [ ] `WsService.disconnect()` closes the connection
- [ ] `WsService.setCurrentProject(projectId)` leaves the previous room (if any) and joins `project:<id>`
- [ ] `WsService.setBoardLoaded()` flushes buffered events; events received before this call are buffered
- [ ] On socket.io `connect` event, the current project room is rejoined and the board is refetched via `loadBoard`
- [ ] `ticket:updated` socket event dispatches `updateTicketSuccess` (works for both field updates and column moves)
- [ ] `ticket:created` socket event dispatches `ticketCreatedExternally`
- [ ] `column:created` socket event dispatches `columnCreatedExternally`
- [ ] `column:deleted` and `ticket:deleted` socket events dispatch the existing `deleteColumnSuccess` / `deleteTicketSuccess`
- [ ] `columns:reordered` socket event dispatches `reorderColumns` action
- [ ] `connectWs$` effect calls `wsService.connect()` on `loginSuccess` / `registerSuccess`
- [ ] `disconnectWs$` effect calls `wsService.disconnect()` on `logout`
- [ ] `BoardComponent` calls `wsService.setCurrentProject(projectId)` in constructor and on route param change
- [ ] New reducer handler for `ticketCreatedExternally` inserts the ticket into the correct column's ticket array
- [ ] New reducer handler for `columnCreatedExternally` appends the column (with empty tickets array) and sorts by order
- [ ] `selectTicketById` selector exists and returns a single ticket by ID
- [ ] Unit test for `WsService` with mocked socket.io-client: verifies socket events dispatch correct store actions
- [ ] `nx lint web` passes
- [ ] `nx test web` passes
- [ ] `nx build web` passes

## Blocked by

- Blocked by `issues/050-packages-and-shared-types.md`
- Can run in parallel with `issues/051-server-ws-pipeline.md` and `issues/052-server-emit-domain-events.md`

## User stories addressed

- User story 1 (new columns from others)
- User story 2 (column renames from others)
- User story 3 (column deletions from others)
- User story 4 (new tickets from others)
- User story 5 (ticket edits from others)
- User story 6 (ticket moves from others)
- User story 7 (ticket deletions from others)
- User story 8 (column reordering from others)
- User story 9 (reconnection recovery)
- User story 10 (optimistic updates not duplicated)
- User story 11 (project-scoped events)
