# 042 — Rename AuthorizationService to Reflect What It Actually Does

## Problem

`AuthorizationService` is named "authorization" but doesn't check authorization. Its three methods only validate entity existence:

```ts
@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async project(id: string, userId: string): Promise<AuthorizedProject> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project; // userId is never compared to project.ownerId
  }

  async column(id: string, userId: string): Promise<AuthorizedColumn> {
    const column = await this.prisma.boardColumn.findUnique({
      where: { id },
      include: COLUMN_INCLUDE,
    });
    if (!column) throw new NotFoundException('Column not found');
    return column; // userId is never compared to column.project.ownerId
  }

  async ticket(id: string, userId: string): Promise<AuthorizedTicket> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: TICKET_INCLUDE,
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket; // userId is never compared to ticket.column.project.ownerId
  }
}
```

### Why this is friction

1. **The name is a lie**: Every method signature says `userId: string`, implying an ownership check. Every call site reads as `await this.auth.project(projectId, userId)` — which looks like "check if this user can access this project." But the implementation only checks that the project *exists*. A developer reading the code assumes authorization is happening.

2. **The intentional gap is documented in a comment, not the type system**: `ws.gateway.ts:46-48` says:

   ```ts
   // Verify project exists. Authorization is intentionally open —
   // any authenticated user can access any project, matching the
   // existing REST authorization model (see issue 038).
   ```

   This comment exists because the name `AuthorizationService` creates confusion that must be explained away. If the class were named `EntityLookupService`, no comment would be needed.

3. **The return types propagate the confusion**: `AuthorizedProject`, `AuthorizedColumn`, `AuthorizedTicket` — these type aliases suggest authorization produced them. They're just the Prisma model types with `include` relationships resolved.

4. **The `userId` parameter is dead weight**: It's passed through every call chain (`controller → service → auth.project(id, userId)`) but never used. It hints at a future where ownership will be checked (Phase 5 in PROJECT_SPEC.md: "Project Membership & Sharing"), but that future isn't here. Dead parameters increase the cognitive load of every call site.

5. **It makes the call sites harder to read**: When a service method starts with `await this.auth.project(projectId, userId)`, you have to remember "right, this isn't actually checking auth, it's just looking up the project." If it were `await this.lookup.project(projectId)`, the intent would be immediate.

### Scope note

Issue 039 absorbs `AuthorizationService` into `BoardService` as private helpers, which solves the naming issue for the board domain. This issue captures the **broader principle**: across the codebase, code should say what it means. If the authorization model is "any authenticated user can access any project," then:
- Entity lookup methods should be named `lookup*`, `find*`, or `resolve*`
- The `userId` parameter should be removed until it's actually used for ownership checks
- Type aliases should describe what they are (`ProjectWithOwner`, `ColumnWithProject`), not imply a check that didn't happen

## Proposed Change

### Rename and simplify

```ts
// Before
@Injectable()
export class AuthorizationService {
  async project(id: string, userId: string): Promise<AuthorizedProject> { ... }
  async column(id: string, userId: string): Promise<AuthorizedColumn> { ... }
  async ticket(id: string, userId: string): Promise<AuthorizedTicket> { ... }
}

// After
@Injectable()
export class EntityResolver {
  async project(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async column(id: string): Promise<BoardColumn & { project: Project }> {
    const column = await this.prisma.boardColumn.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!column) throw new NotFoundException('Column not found');
    return column;
  }

  async ticket(id: string): Promise<Ticket & { column: BoardColumn & { project: Project } }> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { column: { include: { project: true } } },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }
}
```

### Call site changes

```ts
// Before
await this.auth.project(projectId, userId);
await this.auth.column(columnId, userId);
await this.auth.ticket(ticketId, userId);

// After
await this.entities.project(projectId);
await this.entities.column(columnId);
await this.entities.ticket(ticketId);
```

### Naming options

| Name | Pros | Cons |
|---|---|---|
| `EntityResolver` | Clear it resolves entities by ID | Slightly abstract |
| `EntityLookupService` | Obvious what it does | Verbose |
| `BoardLookupService` | Scoped to board entities | Doesn't cover user entity if added later |
| `RecordFinder` | Short | Too generic |

Recommendation: **`EntityResolver`** — it's concise, says what it does (resolves entity references to loaded objects), and scopes naturally to any entity type.

## Dependency Strategy

**Category: In-process**

- No dependency changes. The class still injects `PrismaService` and performs the same database queries.
- Callers drop the `userId` argument. If a future Phase 5 adds ownership checks, the parameter can be re-added at that point with actual logic behind it.

## Testing Strategy

### Changes to existing tests

- `authorization.service.spec.ts` → rename to `entity-resolver.service.spec.ts`
- Update test descriptions: "returns the project when owner matches" → "returns the project when it exists"
- Remove tests that assert "returns project regardless of owner" — those tests were documenting the gap between the name and the behavior. After the rename, the behavior is expected and doesn't need justification.
- Update call sites in all service specs to drop `userId` from resolver calls

### No new tests needed

This is a pure rename/refactor. Behavior is unchanged.

## Implementation Recommendations

### What this refactor should do
- Rename the file and class from `AuthorizationService` to `EntityResolver`
- Rename type aliases from `AuthorizedProject/Column/Ticket` to use descriptive names or inline the Prisma types
- Remove the `userId` parameter from all 3 methods
- Update all call sites to drop `userId`
- Update all spec files to match

### What this refactor should not do
- Add actual authorization checks — that's Phase 5 work
- Change the database query logic — the queries are correct and well-tested
- Remove the comment in `ws.gateway.ts` about open authorization — that documentation is still valuable, but the comment can be simplified since it no longer needs to explain a misleading class name

### Migration path
1. Rename the class, file, and types
2. Remove `userId` parameter
3. Update call sites in `ProjectService`, `ColumnService`, `TicketService`, `WsGateway`
4. Update spec files
5. Run integration tests to confirm no regression
