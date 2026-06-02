# 009 — Extract AuthorizationService to Consolidate Duplicated Ownership Checks

## Problem

Ownership authorization follows a transitively-nested model — `User → Project → Column → Ticket` — but the check itself is duplicated 12 times across `ColumnService` and `TicketService`, with 4 subtly different patterns and one missing check.

### Current state

Every service method that touches a protected resource manually loads the entity with a chain of Prisma `include` clauses up to the project, then compares `ownerId` to the authenticated user's ID. The patterns vary structurally:

| Service method | Check pattern | Include depth | Lines |
|---|---|---|---|
| `ColumnService.create` | Query project by `{ id, ownerId }`; throw `ForbiddenException` if missing | 0 | 5 |
| `ColumnService.update` | Load column → `include: { project: true }` → check `column.project.ownerId` | 1 | 5 |
| `ColumnService.delete` | Same as update | 1 | 5 |
| `ColumnService.getForProject` | **None** — no ownership check (anyone can list anyone's columns) | 0 | 0 |
| `TicketService.getForColumn` | Load column → `include: { project: true }` → check `column.project.ownerId` | 1 | 5 |
| `TicketService.create` | Same as getForColumn | 1 | 5 |
| `TicketService.update` | Load ticket → `include: { column: { include: { project: true } } }` → check `ticket.column.project.ownerId`, THEN if column changes, load target column → `include: { project: true }` → check `targetColumn.project.ownerId` again | 2, then 1 | 10 |
| `TicketService.delete` | Load ticket → 2-level include → check `ticket.column.project.ownerId` | 2 | 5 |

### Friction

- **Same logic, 4 different Prisma include shapes.** `ColumnService.create` checks ownership via `findFirst({ id, ownerId })` — a single query. `TicketService.delete` uses a 2-level nested include. Both express the same concept ("does this user own this resource?") but with different query shapes that a developer must reconstruct each time.
- **`getForProject` has no ownership check.** It's the only read endpoint that doesn't verify ownership. Anyone who knows a project ID can list its columns. This is almost certainly a bug, not a deliberate decision — the pattern was simply forgotten.
- **The double-check in `TicketService.update` is the worst case.** When a ticket moves between columns, the code checks: (1) the ticket's owning column's project, then (2) the target column's project. This is 12 lines of boilerplate interleaved with business logic. If a future `Comment` entity needed the same cross-reference check, the developer would copy-paste all 12 lines.
- **Tests require a real database.** The only integration test (`ticket.integration.spec.ts`) takes 10+ seconds and needs PostgreSQL running because ownership checks are interleaved with Prisma queries inside service methods. There's no seam to test "did we check ownership?" without testing "did we query the database?"
- **Adding a new entity means copy-pasting the pattern again.** A `Comment` on a ticket would need a 3-level include chain (`comment → ticket → column → project`), and the developer would need to know the Prisma relation names at each level.

## Proposed Interface

One service with one method per entity type. The method name IS the entity type — no string parameters, no generics.

```typescript
// apps/api/src/app/auth/authorization.service.ts

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { Project, BoardColumn, Ticket } from '../../generated/prisma/client';

// ── Include shapes (module-private constants) ──────────────────────────────

const COLUMN_INCLUDE = { project: true } as const;
const TICKET_INCLUDE = { column: { include: { project: true } } } as const;

// ── Return types (structural — what Prisma returns with those includes) ─────

export type AuthorizedProject = Project;

export type AuthorizedColumn = BoardColumn & {
  project: Project;
};

export type AuthorizedTicket = Ticket & {
  column: BoardColumn & { project: Project };
};

// ── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async project(id: string, userId: string): Promise<AuthorizedProject> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException();
    return project;
  }

  async column(id: string, userId: string): Promise<AuthorizedColumn> {
    const column = await this.prisma.boardColumn.findUnique({
      where: { id },
      include: COLUMN_INCLUDE,
    });
    if (!column) throw new NotFoundException('Column not found');
    if (column.project.ownerId !== userId) throw new ForbiddenException();
    return column;
  }

  async ticket(id: string, userId: string): Promise<AuthorizedTicket> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: TICKET_INCLUDE,
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.column.project.ownerId !== userId) throw new ForbiddenException();
    return ticket;
  }
}
```

### Usage: Before and after

**TicketService.update** — the most complex case (Pattern D, double check):

```typescript
// BEFORE (20 lines of auth + renumbering boilerplate):
async update(ticketId: string, userId: string, data: { ... }) {
  const ticket = await this.prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { column: { include: { project: true } } },
  });
  if (!ticket) throw new NotFoundException();
  if (ticket.column.project.ownerId !== userId) throw new ForbiddenException();

  const { columnId, position, ...rest } = data;
  const hasPositionChange = columnId !== undefined || position !== undefined;
  if (!hasPositionChange) {
    return this.prisma.ticket.update({ where: { id: ticketId }, data: rest });
  }
  const targetColumnId = columnId ?? ticket.columnId;
  const targetPosition = position ?? ticket.position;
  if (columnId !== undefined && columnId !== ticket.columnId) {
    const targetColumn = await this.prisma.boardColumn.findUnique({
      where: { id: targetColumnId },
      include: { project: true },
    });
    if (!targetColumn) throw new NotFoundException();
    if (targetColumn.project.ownerId !== userId) throw new ForbiddenException();
  }
  return this.prisma.$transaction(async (tx) => { /* renumbering */ });
}

// AFTER (auth is 3 lines, rest is pure business logic):
async update(ticketId: string, userId: string, data: { ... }) {
  const ticket = await this.auth.ticket(ticketId, userId);
  const { columnId, position, ...rest } = data;
  const hasPositionChange = columnId !== undefined || position !== undefined;
  if (!hasPositionChange) {
    return this.prisma.ticket.update({ where: { id: ticketId }, data: rest });
  }
  const targetColumnId = columnId ?? ticket.columnId;
  const targetPosition = position ?? ticket.position;
  if (columnId !== undefined && columnId !== ticket.columnId) {
    await this.auth.column(targetColumnId, userId);
  }
  return this.prisma.$transaction(async (tx) => { /* renumbering unchanged */ });
}
```

**TicketService.getForColumn** — Pattern A:

```typescript
// BEFORE (7 lines):
async getForColumn(columnId: string, userId: string) {
  const column = await this.prisma.boardColumn.findUnique({
    where: { id: columnId },
    include: { project: true },
  });
  if (!column) throw new NotFoundException();
  if (column.project.ownerId !== userId) throw new ForbiddenException();
  return this.prisma.ticket.findMany({ where: { columnId }, orderBy: { position: 'asc' } });
}

// AFTER (2 lines, auth + query are separate concerns):
async getForColumn(columnId: string, userId: string) {
  await this.auth.column(columnId, userId);
  return this.prisma.ticket.findMany({ where: { columnId }, orderBy: { position: 'asc' } });
}
```

**ColumnService.create** — Pattern C:

```typescript
// BEFORE (5 lines — missing distinct NotFound vs Forbidden):
async create(projectId: string, userId: string, name: string) {
  const project = await this.prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) throw new ForbiddenException();
  // ...rest

// AFTER (1 line — NotFound and Forbidden are properly distinguished):
async create(projectId: string, userId: string, name: string) {
  await this.auth.project(projectId, userId);
  // ...rest
}
```

**ColumnService.getForProject** — the missing check:

```typescript
// BEFORE (no ownership check — a bug):
async getForProject(projectId: string) {
  return this.prisma.boardColumn.findMany({
    where: { projectId },
    orderBy: { order: 'asc' },
  });
}

// AFTER (adds the missing check, takes userId):
async getForProject(projectId: string, userId: string) {
  await this.auth.project(projectId, userId);
  return this.prisma.boardColumn.findMany({
    where: { projectId },
    orderBy: { order: 'asc' },
  });
}
```

### What complexity it hides

| Hidden concern | Previously in |
|---|---|
| Prisma include shape for column ownership (`{ project: true }`) | `ColumnService.update` line 34, `ColumnService.delete` line 48, `TicketService.getForColumn` line 10, `TicketService.create` line 24, `TicketService.update` line 70 |
| Prisma include shape for ticket ownership (`{ column: { include: { project: true } } }`) | `TicketService.update` line 52, `TicketService.delete` line 111 |
| NotFound vs Forbidden distinction | Every service method (12 times), inconsistently applied |
| Null check on the loaded entity | Every service method (12 times) |
| Owner ID comparison (`entity....ownerId !== userId`) | Every service method, with varying path depth |
| The double-check pattern in cross-column moves | `TicketService.update` lines 68-76 — 9 lines collapsed to 1 |

## Dependency Strategy

**Category: In-process.** The `AuthorizationService` depends only on `PrismaService`, which is already provided in every feature module. No new infrastructure, no new NestJS concepts.

- `AuthorizationService` is provided in `AuthModule` and exported so `ColumnModule` and `TicketModule` can inject it
- Each method uses `this.prisma` (the non-transactional client) — authorization always happens *before* any `$transaction`, matching the current pattern
- No request-scoped providers, no decorators, no guards, no custom pipes
- The include shapes are module-private constants — they cannot leak into service code

### Module wiring

```typescript
// AuthModule — add AuthorizationService to providers and exports
@Module({
  imports: [PassportModule, JwtModule.register({...})],
  controllers: [AuthController],
  providers: [AuthService, AuthorizationService, PrismaService, JwtStrategy],
  exports: [JwtModule, JwtStrategy, AuthorizationService],
})
export class AuthModule {}

// ColumnModule, TicketModule — already import AuthModule for JwtAuthGuard,
// so AuthorizationService is available without any module changes
```

## Testing Strategy

### New tests to write

**`AuthorizationService` unit tests** (mock PrismaService, no database):

- `project(id, userId)`: returns the project when owner matches; throws `NotFoundException` when project doesn't exist; throws `ForbiddenException` when owner doesn't match
- `column(id, userId)`: returns column + project when owner matches; throws `NotFoundException` when column doesn't exist; throws `ForbiddenException` when project owner doesn't match
- `ticket(id, userId)`: returns ticket + column + project when owner matches; throws `NotFoundException` when ticket doesn't exist; throws `ForbiddenException` when project owner doesn't match
- Type verification: `AuthorizedTicket` has `.column.project.ownerId` accessible without optional chaining

**`TicketService` and `ColumnService` unit tests** (mock AuthorizationService, no database):

- `TicketService.update`: verify `auth.ticket(ticketId, userId)` is called, verify `auth.column(targetColumnId, userId)` is called when `columnId` differs
- `TicketService.delete`: verify `auth.ticket(ticketId, userId)` is called
- `ColumnService.create`: verify `auth.project(projectId, userId)` is called
- `ColumnService.getForProject`: verify `auth.project(projectId, userId)` is called (the previously-missing check)

### Old tests to update

- **`ticket.integration.spec.ts`**: the authorization test ("returns 403 when column belongs to another user") should still pass — it tests the full HTTP stack. The mocked `JwtAuthGuard` injects `{ id: testUserId }` as `req.user`, and the real `AuthorizationService` will check against the real database. No change needed.

### Test environment needs

```typescript
// Reusable mock for service-level tests:
const mockAuth = {
  project: vi.fn(),
  column: vi.fn(),
  ticket: vi.fn(),
};

// Success case:
mockAuth.ticket.mockResolvedValue({
  id: 'ticket-1', columnId: 'col-1', position: 2,
  column: { id: 'col-1', projectId: 'proj-1', project: { id: 'proj-1', ownerId: 'user-1' } },
});

// Forbidden case:
mockAuth.ticket.mockRejectedValue(new ForbiddenException());
```

## Implementation Recommendations

### What the module should own

- **Ownership verification** — the decision "does user X own resource Y?" for every entity type
- **Prisma include shapes** — the exact `include` clauses needed to traverse the ownership chain
- **Error mapping** — `NotFoundException` when the resource doesn't exist, `ForbiddenException` when it belongs to someone else

### What it should hide

- The nested Prisma include paths (`{ column: { include: { project: true } } }`)
- The ownership chain traversal logic (`ticket.column.project.ownerId`)
- The distinction between "not found" and "not authorized" (currently inconsistently applied)

### What it should expose

- `AuthorizationService.project(id, userId)` → `AuthorizedProject`
- `AuthorizationService.column(id, userId)` → `AuthorizedColumn`
- `AuthorizationService.ticket(id, userId)` → `AuthorizedTicket`

Each method returns the fully-loaded entity so the caller can reuse it (e.g., `ticket.columnId` and `ticket.position` in `TicketService.update`) without a second database query.

### Migration order

1. Create `apps/api/src/app/auth/authorization.service.ts` with the three methods
2. Add `AuthorizationService` to `AuthModule` providers and exports
3. Update `ColumnService.getForProject` — add `userId` parameter, add `await this.auth.project(projectId, userId)` (fixes the missing check)
4. Update `ColumnService.create` — replace project lookup with `await this.auth.project(projectId, userId)`
5. Update `ColumnService.update` — replace column lookup + owner check with `await this.auth.column(columnId, userId)`
6. Update `ColumnService.delete` — same as update
7. Update `TicketService.getForColumn` — replace column lookup + owner check with `await this.auth.column(columnId, userId)`
8. Update `TicketService.create` — same as getForColumn
9. Update `TicketService.update` — replace ticket lookup + owner check with `const ticket = await this.auth.ticket(ticketId, userId)`; replace target column lookup + owner check with `await this.auth.column(targetColumnId, userId)`
10. Update `TicketService.delete` — replace ticket lookup + owner check with `await this.auth.ticket(ticketId, userId)`
11. Update `ColumnController.getForProject` and `TicketController` methods — pass `req.user.id` as `userId` (already done for most methods; verify all)
12. Write `authorization.service.spec.ts` — unit tests with mocked PrismaService
13. Run existing `ticket.integration.spec.ts` — verify all tests still pass

### Future growth path

If the app grows to 8+ entity types or adds team-based/role-based authorization, the method-per-type pattern can be refactored into a descriptor-based system without changing any service code:

```typescript
// The three methods are trivially wrappable into a registry pattern:
private async authorize(model: string, id: string, userId: string) {
  // ... lookup descriptor, execute generic Prisma query
}
// project/column/ticket methods become one-liner delegates
```

But this refactoring should happen *when the need arises*, not before. The concrete method-per-type approach is simpler to read, debug, and test at the current scale.
