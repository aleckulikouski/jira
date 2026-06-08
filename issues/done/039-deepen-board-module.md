# 039 — Deepen Board Module: Unify Column + Ticket + Project.getBoard

## Problem

Board operations are spread across 3 services and 2 controllers in the NestJS backend, creating a shallow module structure where the interface is nearly as complex as the implementation:

- **`ProjectService.getBoard()`** — assembles columns + tickets for the board view
- **`ColumnService`** — CRUD + reorder for columns (5 public methods)
- **`TicketService`** — CRUD + position renumbering for tickets (3 public methods)
- **`ColumnController`** — 5 REST endpoints, each emits an EventEmitter2 event after the service call
- **`TicketController`** — 3 REST endpoints, same event-emission pattern
- **`WsNotifierService`** — 7 `@OnEvent` handlers that forward events to `WsGateway`

### Why this is friction

1. **Tight coupling hidden across module boundaries**: `TicketService.update()` reaches into column authorization when a ticket moves between columns (line 54-56). `ColumnService.delete()` queries `tx.ticket.count()` to enforce the "no tickets in column" invariant (line 65-71). These are cross-module concerns masquerading as independent modules.

2. **Event emission is duplicated 7 times**: Every controller method follows the identical pattern `result = await service.method()` → `this.eventEmitter.emit(event, payload)` → `return result`. The EventEmitter2 hop (controller → EventEmitter → WsNotifierService → WsGateway) is 3 layers for what could be a direct call.

3. **AuthorizationService is misnamed and scattered**: It's called "authorization" but only does entity existence checks (findUnique + throwIfNotFound). Every service method calls it as a preamble. Its 3 methods (`project`, `column`, `ticket`) would be private helpers on a unified BoardService.

4. **One concept, 11 files**: Understanding a single board mutation requires tracing through controller → authorization service → entity service → Prisma → event emitter → notifier → gateway. That's 7 hops for an operation that should be "tell the board to do X, broadcast the result."

## Proposed Interface

A single `BoardService` replaces `ProjectService.getBoard()`, `ColumnService`, `TicketService`, and `AuthorizationService`. A single `BoardController` replaces `ColumnController` and `TicketController`. `WsNotifierService` is deleted — the controller broadcasts directly.

### BoardService

```ts
@Injectable()
export class BoardService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Query ──────────────────────────────────────────────────────

  getBoard(projectId: string, userId: string): Promise<BoardView>;

  // ── Column operations ──────────────────────────────────────────

  createColumn(
    projectId: string,
    userId: string,
    name: string,
    afterColumnId?: string,
  ): Promise<{ column: BoardColumn; broadcast: ColumnCreatedEvent }>;

  updateColumn(
    columnId: string,
    userId: string,
    changes: { name?: string },
  ): Promise<{ column: BoardColumn; broadcast: ColumnUpdatedEvent }>;

  deleteColumn(
    columnId: string,
    userId: string,
  ): Promise<{ broadcast: ColumnDeletedEvent }>;

  reorderColumns(
    projectId: string,
    userId: string,
    orderedIds: string[],
  ): Promise<{ broadcast: ColumnsReorderedEvent }>;

  // ── Ticket operations ──────────────────────────────────────────

  createTicket(
    columnId: string,
    userId: string,
    data: { title: string; description?: string },
  ): Promise<{ ticket: Ticket; broadcast: TicketCreatedEvent }>;

  updateTicket(
    ticketId: string,
    userId: string,
    changes: { title?: string; description?: string; columnId?: string; position?: number },
  ): Promise<{ ticket: Ticket; broadcast: TicketUpdatedEvent }>;

  deleteTicket(
    ticketId: string,
    userId: string,
  ): Promise<{ broadcast: TicketDeletedEvent }>;
}
```

### Broadcast event types

```ts
interface BroadcastEvent {
  event: string;
  projectId: string;
  payload: unknown;
}

interface ColumnCreatedEvent extends BroadcastEvent {
  event: 'column:created';
  payload: BoardColumn;
}

interface ColumnUpdatedEvent extends BroadcastEvent {
  event: 'column:updated';
  payload: BoardColumn;
}

interface ColumnDeletedEvent extends BroadcastEvent {
  event: 'column:deleted';
  payload: { id: string };
}

interface ColumnsReorderedEvent extends BroadcastEvent {
  event: 'columns:reordered';
  payload: { projectId: string; orderedIds: string[] };
}

interface TicketCreatedEvent extends BroadcastEvent {
  event: 'ticket:created';
  payload: Ticket;
}

interface TicketUpdatedEvent extends BroadcastEvent {
  event: 'ticket:updated';
  payload: Ticket;
}

interface TicketDeletedEvent extends BroadcastEvent {
  event: 'ticket:deleted';
  payload: { id: string };
}
```

### BoardController

```ts
@Controller()
export class BoardController {
  constructor(
    private readonly board: BoardService,
    private readonly ws: WsGateway,
  ) {}

  @Get('projects/:id/board')
  @UseGuards(JwtAuthGuard)
  async getBoard(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.board.getBoard(id, req.user.id);
  }

  @Post('projects/:projectId/columns')
  @UseGuards(JwtAuthGuard)
  async createColumn(
    @Param('projectId') projectId: string,
    @Body() dto: CreateColumnDto,
    @Req() req: RequestWithUser,
  ) {
    const { column, broadcast } = await this.board.createColumn(
      projectId, req.user.id, dto.name, dto.afterColumnId,
    );
    this.broadcastToProject(broadcast);
    return column;
  }

  @Patch('columns/:id')
  @UseGuards(JwtAuthGuard)
  async updateColumn(
    @Param('id') id: string,
    @Body() dto: UpdateColumnDto,
    @Req() req: RequestWithUser,
  ) {
    const { column, broadcast } = await this.board.updateColumn(id, req.user.id, dto);
    this.broadcastToProject(broadcast);
    return column;
  }

  @Delete('columns/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteColumn(@Param('id') id: string, @Req() req: RequestWithUser) {
    const { broadcast } = await this.board.deleteColumn(id, req.user.id);
    this.broadcastToProject(broadcast);
  }

  @Patch('projects/:projectId/columns/reorder')
  @UseGuards(JwtAuthGuard)
  async reorderColumns(
    @Param('projectId') projectId: string,
    @Body() dto: ReorderColumnsDto,
    @Req() req: RequestWithUser,
  ) {
    const { broadcast } = await this.board.reorderColumns(projectId, req.user.id, dto.orderedIds);
    this.broadcastToProject(broadcast);
    return { statusCode: 200 };
  }

  @Post('columns/:columnId/tickets')
  @UseGuards(JwtAuthGuard)
  async createTicket(
    @Param('columnId') columnId: string,
    @Body() dto: CreateTicketDto,
    @Req() req: RequestWithUser,
  ) {
    const { ticket, broadcast } = await this.board.createTicket(columnId, req.user.id, dto);
    this.broadcastToProject(broadcast);
    return ticket;
  }

  @Patch('tickets/:id')
  @UseGuards(JwtAuthGuard)
  async updateTicket(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Req() req: RequestWithUser,
  ) {
    const { ticket, broadcast } = await this.board.updateTicket(id, req.user.id, dto);
    this.broadcastToProject(broadcast);
    return ticket;
  }

  @Delete('tickets/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTicket(@Param('id') id: string, @Req() req: RequestWithUser) {
    const { broadcast } = await this.board.deleteTicket(id, req.user.id);
    this.broadcastToProject(broadcast);
  }

  // Shared broadcast helper — the single place that emits WS events
  private broadcastToProject(event: BroadcastEvent): void {
    this.ws.emitToProject(event.event as any, event.projectId, event.payload);
  }
}
```

### Usage example: how callers use it

```ts
// Before (current): TicketController → TicketService → AuthService → Prisma
//                                               → EventEmitter2 → WsNotifierService → WsGateway
// 6 classes involved for one ticket update

const ticket = await this.ticketService.update(id, req.user.id, dto);
this.eventEmitter.emit('ticket.updated', { projectId: ticket.column.projectId, ticket });
return ticket;

// After: BoardController → BoardService → Prisma
//                                         → returns broadcast event
// 2 classes involved, event emission is a return value

const { ticket, broadcast } = await this.board.updateTicket(id, req.user.id, dto);
this.broadcastToProject(broadcast);
return ticket;
```

### What complexity it hides internally

- **Position math**: `max(position) + 1` for creating tickets, gap renumbering on moves, order computation for column insertion — all private methods
- **Transaction wrapping**: `$transaction` boundaries are internal; callers never see `tx`
- **Entity existence checks**: The old `AuthorizationService.project/column/ticket()` methods become private `lookupProject/Column/Ticket()` helpers — no separate class needed
- **Cross-column move detection**: When `updateTicket` receives a `columnId`, it verifies the target column and runs the renumbering algorithm — the caller just passes the fields
- **Column-not-empty guard**: `deleteColumn` checks ticket count internally and throws `ConflictException` if needed
- **Event payload construction**: The `broadcast` return value is pre-assembled with the correct event name and payload shape — the controller can't get it wrong

## Dependency Strategy

**Category: In-process** (Prisma is local-substitutable with PGLite)

- **PrismaService**: Injected into `BoardService` as today. No change to how the database is accessed — the Prisma calls move from 3 service files into 1.
- **AuthorizationService**: Deleted. Its 3 methods (`project`, `column`, `ticket`) become private helpers on `BoardService`: `#lookupProject()`, `#lookupColumn()`, `#lookupTicket()`. The `userId` parameter is retained for future ownership checks but currently only validates existence (matching the existing open-authorization model from issue 038).
- **EventEmitter2**: Removed from the board flow entirely. The `BoardModule` no longer imports `EventEmitterModule`. `BoardService` returns `broadcast` objects synchronously instead of emitting events.
- **WsNotifierService**: Deleted. Its 7 `@OnEvent` handlers are replaced by `BoardController.broadcastToProject()`.
- **WsGateway**: Injected into `BoardController` instead of `WsNotifierService`. The `emitToProject()` method is called directly — no intermediate event bus.

## Testing Strategy

### New boundary tests to write

**BoardService unit tests** (replace `project.service.spec.ts`, `column.service.spec.ts`, `authorization.service.spec.ts`):
- `getBoard` returns nested columns + tickets ordered by position
- `createColumn` with no `afterColumnId` appends to end with correct order
- `createColumn` with `afterColumnId` inserts at correct position and increments trailing columns
- `createColumn` when project has no columns creates with order 0
- `deleteColumn` with tickets throws `ConflictException`
- `deleteColumn` empty column succeeds and returns correct broadcast event
- `createTicket` computes position as max + 1
- `createTicket` in empty column assigns position 0
- `updateTicket` title-only change does not trigger renumbering
- `updateTicket` position change renumbers within same column
- `updateTicket` column change verifies target column and renumbers both columns
- `updateTicket` on non-existent ticket throws `NotFoundException`
- `reorderColumns` with mismatched IDs throws `ConflictException`
- `reorderColumns` with duplicates throws `ConflictException`
- `reorderColumns` updates each column order to its index
- Every mutation method returns a correctly-shaped `broadcast` object

**BoardController unit tests** (replace `project.controller.spec.ts`, `column.controller.spec.ts`):
- Each endpoint delegates to the correct `BoardService` method
- `broadcastToProject` is called with the returned broadcast event
- `JwtAuthGuard` is applied to all non-auth endpoints

**BoardService integration tests** (extend `ticket.integration.spec.ts`):
- Full CRUD flow: create column → create tickets → move ticket between columns → delete
- WS event shape verification after each mutation
- Concurrent position updates don't create gaps

### Old tests to delete

- `project/project.service.spec.ts` — replaced by BoardService unit tests
- `project/project.controller.spec.ts` — replaced by BoardController unit tests
- `column/column.service.spec.ts` — replaced by BoardService unit tests
- `column/column.controller.spec.ts` — replaced by BoardController unit tests
- `auth/authorization.service.spec.ts` — the lookup logic is tested through BoardService boundary tests
- `ws/ws-notifier.service.spec.ts` — the notifier is deleted; broadcast behavior tested in BoardController

### Test environment needs

- No new infrastructure required. Tests use mocked `PrismaService` as today.
- Optionally introduce PGLite for integration tests to eliminate the need for a running Postgres, but this is a separate concern.

## Implementation Recommendations

### What the module should own
- All board state mutations: column CRUD, ticket CRUD, column reordering, ticket position management
- Entity existence validation (absorbing the old AuthorizationService)
- Transaction boundary management for multi-row operations

### What it should hide
- Position computation algorithms (max+1, renumbering, gap insertion)
- Prisma query shapes and `include`/`select` structures
- The fact that columns and tickets are separate database tables
- The distinction between a "title change" and a "position change" — both are just `updateTicket`

### What it should expose
- 1 query method (`getBoard`) returning the full board view
- 7 mutation methods, each returning `{ result, broadcast }` with a typed broadcast event
- The broadcast event type union for use by the controller

### Migration path
1. Create `board/board.service.ts` with all 8 methods, copying logic from existing services
2. Create `board/board.controller.ts` with all 8 endpoints
3. Create `board/board.module.ts` importing `PrismaModule` (not `EventEmitterModule`)
4. Update `AppModule` to import `BoardModule` instead of `ProjectModule`, `ColumnModule`, `TicketModule`
5. Verify all existing integration tests pass against the new endpoints
6. Delete old files: `project/`, `column/`, `ticket/`, `auth/authorization.service.ts`, `ws/ws-notifier.service.ts`
7. Keep `ProjectService.getAll()` and `ProjectService.create()` — those aren't board concerns. Move them to a slimmed-down `ProjectService` or inline into `ProjectController`.
8. Keep `AuthService`, `AuthController`, `JwtStrategy`, `JwtAuthGuard` — those are auth concerns, not board concerns.
