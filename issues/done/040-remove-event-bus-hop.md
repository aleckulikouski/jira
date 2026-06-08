# 040 — Remove EventEmitter2 Hop: Return Events as Values

## Problem

Every board mutation in the NestJS backend follows a 3-hop chain to broadcast to WebSocket clients:

```
Controller → EventEmitter2.emit() → WsNotifierService.@OnEvent() → WsGateway.emitToProject()
```

This pattern is duplicated 7 times across `ColumnController` and `TicketController`:

```ts
// ColumnController — 5 occurrences
const column = await this.columnService.create(projectId, req.user.id, dto.name, dto.afterColumnId);
this.eventEmitter.emit('column.created', { projectId: column.projectId, column });
return column;

// TicketController — 3 occurrences
const ticket = await this.ticketService.create(columnId, req.user.id, dto);
const projectId = ticket.column.projectId;
this.eventEmitter.emit('ticket.created', { projectId, ticket });
return ticket;
```

`WsNotifierService` then has 7 `@OnEvent` handlers that each do the same thing:

```ts
@OnEvent('ticket.created')
handleTicketCreated(payload: TicketCreatedPayload): void {
  try {
    this.gateway.emitToProject('ticket:created', payload.projectId, payload.ticket);
  } catch (e) {
    this.logger.error('Failed to emit ticket:created', e);
  }
}
```

### Why this is friction

1. **3 hops for a direct call**: The controller already has `WsGateway` available (they're in the same DI container). The EventEmitter2 adds latency and obscures the call graph without providing any decoupling — both sides are in-process and always deployed together.

2. **Stringly-typed event names**: `'ticket.created'` in the emit and `'ticket:created'` in the gateway — note the `.` vs `:` mismatch between EventEmitter event names and Socket.io event names. The mapping is only correct because `WsNotifierService` manually translates them. A typo in either string is a runtime bug with no compiler check.

3. **Event payloads are reconstructed, not passed through**: The controller builds `{ projectId, ticket }`, then the notifier unpacks it and calls `emitToProject('ticket:created', payload.projectId, payload.ticket)`. The payload is destructured and reassembled for no reason.

4. **Error handling is duplicated**: Each `@OnEvent` handler wraps its call in try/catch with identical logging. If a new event is added, this pattern must be copied again.

5. **WsNotifierService is a pure pass-through**: It has zero business logic — every method is `this.gateway.emitToProject(event, projectId, payload)`. It exists solely because EventEmitter2 decouples the emitter from the handler, but in this codebase they're always deployed together.

### Scope

This issue is about the **general pattern**, not just the board domain. While issue 039 solves this for board operations by returning broadcast events from `BoardService`, this issue captures the architectural principle: **EventEmitter2 should not be used for synchronous in-process dispatch when the caller can invoke the receiver directly.**

The fix also applies to any future NestJS modules added to this codebase (comments, sprints, etc.) — they should follow the return-value pattern, not the event-bus pattern.

## Proposed Interface

Replace the 3-hop chain with a single direct call. The service (or controller) returns a typed result, and the controller broadcasts it.

### Before (current)

```
ColumnController
  → ColumnService.create()
  → EventEmitter2.emit('column.created', payload)
      → WsNotifierService.@OnEvent('column.created')
          → WsGateway.emitToProject('column:created', projectId, payload)
```

### After

```
ColumnController
  → ColumnService.create()
  → WsGateway.emitToProject('column:created', projectId, column)
```

### Concrete change

If applied standalone (without issue 039's deeper restructure), each service method returns the broadcast payload alongside its result:

```ts
// column.service.ts
async create(projectId: string, userId: string, name: string, afterColumnId?: string) {
  // ... existing logic ...
  const column = await tx.boardColumn.create({ data: { projectId, name, order: nextOrder } });
  return {
    column,
    broadcast: { event: 'column:created', projectId: column.projectId, payload: column },
  };
}
```

```ts
// column.controller.ts
@Post('projects/:projectId/columns')
async create(...) {
  const { column, broadcast } = await this.columnService.create(projectId, req.user.id, dto.name, dto.afterColumnId);
  this.ws.emitToProject(broadcast.event, broadcast.projectId, broadcast.payload);
  return column;
}
```

`WsNotifierService` is deleted. `EventEmitter2` is removed from `BoardModule` imports (though it may remain for truly asynchronous or cross-module events if those emerge).

## Dependency Strategy

**Category: In-process**

- **EventEmitter2**: Removed from the board mutation flow. May remain in `AppModule` for future use cases that genuinely need decoupled in-process messaging (e.g., audit logging, analytics), but those should justify themselves case-by-case.
- **WsNotifierService**: Deleted. Its 7 methods are dead code.
- **WsGateway**: Injected directly into controllers instead of into `WsNotifierService`. This is already possible — `WsGateway` is a NestJS provider.

## Testing Strategy

### New boundary tests to write

None — this is a refactor with no behavioral change. Existing integration tests verify WS notifications arrive at the client; those tests should continue to pass.

### Old tests to delete

- `ws/ws-notifier.service.spec.ts` — the service is deleted
- Any test that mocks `EventEmitter2` in controller or service tests — those mocks become unnecessary

### Test environment needs

- `WsGateway` mock in controller unit tests (currently controllers don't inject `WsGateway`; they'll need a mock after this change)
- Integration tests that assert WS behavior remain unchanged — they test end-to-end from HTTP response + Socket.io client

## Implementation Recommendations

### What this refactor should do
- Delete `WsNotifierService` and its spec
- Remove `EventEmitter2` injection from `ColumnController` and `TicketController`
- Add `WsGateway` injection to controllers
- Update service methods to return broadcast metadata alongside results
- Replace each `this.eventEmitter.emit(...)` with `this.ws.emitToProject(...)`

### What this refactor should not do
- Change REST response shapes (frontend contract is stable)
- Change Socket.io event names or payloads (frontend WsService depends on these)
- Remove `EventEmitterModule.forRoot()` from `AppModule` (other features may use it; audit first)

### Migration path
1. Add broadcast return types to service methods (or apply issue 039 first, which already designs this)
2. Update controllers to call `WsGateway` directly
3. Delete `WsNotifierService`
4. Remove `EventEmitter2` injection from affected controllers
5. Run integration tests to confirm WS notifications still arrive
