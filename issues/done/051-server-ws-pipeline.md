## Parent PRD

`issues/prd.md`

## What to build

Create the server-side WebSocket infrastructure module (`WsModule`) inside the NestJS API. This includes the socket.io gateway, JWT guard for socket handshakes, and the notifier service that listens to internal domain events and translates them to socket.io room emissions. Also register the global EventEmitter in the root AppModule.

The `WsJwtGuard` extracts the JWT from `socket.handshake.auth.token`, verifies it via `JwtService`, and attaches the user to `socket.data`. Invalid tokens disconnect the socket.

The `WsGateway` handles connection lifecycle: on connect, the guard runs; on disconnect, cleanup is automatic. It exposes `joinProject`/`leaveProject` handler methods and an `emitToProject(projectId, event, payload)` helper that broadcasts to everyone in a room.

The `WsNotifierService` uses `@OnEvent()` decorators to listen for all 7 domain events and calls the gateway's `emitToProject` with the correct socket event name and payload.

Unit tests verify the guard's token validation logic (valid/invalid/missing) and the notifier's event-to-emit mapping.

At the end of this slice, the server's WebSocket pipeline is structurally complete but no domain events flow yet — controllers don't emit them.

## Acceptance criteria

- [ ] `WsModule` is created and imported in `AppModule`
- [ ] `EventEmitterModule.forRoot()` is imported in `AppModule`
- [ ] `WsJwtGuard` validates JWT from `handshake.auth.token` and attaches user to `socket.data`
- [ ] Invalid or missing JWT causes the socket to be disconnected
- [ ] `WsGateway` handles `join` and `leave` client messages, adding/removing sockets from `project:<id>` rooms with project existence check via `AuthorizationService`
- [ ] `WsGateway.emitToProject(event, projectId, payload)` broadcasts to the room
- [ ] `WsNotifierService` has `@OnEvent` handlers for all 7 domain events that call the gateway's emit
- [ ] Unit test for `WsJwtGuard` with mocked `JwtService`: valid token passes, invalid/missing token disconnects
- [ ] Unit test for `WsNotifierService` with mocked `WsGateway`: each domain event calls the correct emit method
- [ ] `nx typecheck api` passes
- [ ] `nx test api` passes

## Blocked by

- Blocked by `issues/050-packages-and-shared-types.md`

## User stories addressed

All server-side infrastructure for user stories 1–8. No user-visible behavior yet.
