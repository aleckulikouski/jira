# Project Spec — Jira-like Fullstack App

## Overview

Fullstack kanban board app. Single project, single board, drag-and-drop ticket management.
Built as a learning project with AI-assisted development.

## Stack

| Layer | Technology |
|---|---|
| Monorepo | Nx |
| Frontend | Angular (standalone components), Angular Material, NgRx |
| Backend | NestJS, Prisma, PostgreSQL |
| Shared | Nx library for DTOs/types |
| Infra | Docker Compose (API + PostgreSQL) |

---

## V1 Architecture

### Scope

Single project per user, auto-created on signup. One board with configurable columns.
Tickets are draggable between columns and reorderable within a column.

### Entities

```
User
  id: uuid (PK)
  email: string (unique)
  passwordHash: string
  displayName: string
  createdAt: datetime
  updatedAt: datetime

Project
  id: uuid (PK)
  ownerId: uuid (FK → User)
  name: string
  createdAt: datetime
  updatedAt: datetime

BoardColumn
  id: uuid (PK)
  projectId: uuid (FK → Project, on delete cascade)
  name: string
  order: integer
  createdAt: datetime
  updatedAt: datetime

Ticket
  id: uuid (PK)
  columnId: uuid (FK → BoardColumn, on delete cascade)
  assigneeId: uuid (FK → User, nullable)
  title: string
  description: string (default: "")
  position: integer
  createdAt: datetime
  updatedAt: datetime
```

No separate `Board` table in V1. Columns attach directly to the project.
A `Board` entity will be added in a future increment when multiple boards per project are needed.

### API Endpoints (REST)

```
# Auth
POST /api/auth/register     — create account (auto-creates project + default columns)
POST /api/auth/login         — returns JWT

# Projects (V1: single project per user)
GET  /api/projects/me        — get current user's project

# Columns
GET    /api/projects/:projectId/columns      — list columns
POST   /api/projects/:projectId/columns      — create column
PATCH  /api/columns/:id                       — update column (name, order)
DELETE /api/columns/:id                       — delete column (cascades tickets)

# Tickets
GET    /api/columns/:columnId/tickets         — list tickets in column
POST   /api/columns/:columnId/tickets         — create ticket
PATCH  /api/tickets/:id                       — update ticket (title, description, columnId, position)
DELETE /api/tickets/:id                       — hard delete
```

### Ticket Ordering

Integer `position` field. When inserting between positions, renumber all tickets
in the target column in a transaction:

```sql
UPDATE Ticket SET position = position + 1
WHERE columnId = $targetColumn AND position >= $insertPosition
```

### Auth & Authorization

- JWT-based auth (access token in Authorization header)
- Open registration (signup form → auto-create project + default columns → redirect to board)
- Login form → redirect to board
- Private ownership: each user sees only their own project
- Auth guards on all non-auth routes (Angular route guards + NestJS guards)

### Drag-and-Drop

- Angular CDK Drag & Drop (`cdkDropList` per column, `cdkDrag` per ticket)
- Optimistic NgRx updates: dispatch move action → update store immediately → fire PATCH
- Rollback on failure: effect's `catchError` restores previous state + MatSnackBar toast

### Create Ticket

- Single FAB on the board
- Opens MatDialog with: title, description, column picker (dropdown)
- On submit: POST to API, dispatch add action, close dialog

### Detail / Edit View

- Click ticket → MatDialog modal
- Editable fields: title, description, column dropdown
- Save button → PATCH to API
- Delete button in modal → DELETE, hard delete

### Error Handling

- NgRx effects catch API errors
- MatSnackBar toast with error message
- Optimistic rollback on mutation failures

### State Management (NgRx)

- Hand-rolled reducers (no @ngrx/entity)
- Single `board` feature slice: columns + tickets
- Auth slice: user, token, auth status
- UI slice: loading flags, modal state

### Tests

- NestJS integration tests (supertest + test DB)
- Angular unit tests for: services, effects, reducers
- No component/DOM tests in V1

---

## V1 Route Map

```
/register         — registration form
/login            — login form
/board            — main board (guarded)
```

---

## Development Setup

```bash
npx create-nx-workspace jira --preset=empty
npm install @nx/nest @nx/angular
nx g @nx/nest:app api
nx g @nx/angular:app web
nx g @nx/js:lib shared-types
```

`docker-compose.yml` with `postgres` service.
Prisma Migrate for schema management from day one.

---

## Future Feature Implementation Plan

Features are ordered by dependency — each builds on the prior increment without requiring
schema rewrites or architectural backtracking.

### Phase 2: Multi-Project

- Add project CRUD (create, rename, delete)
- Project list page at `/projects`
- User can own multiple projects
- Board scoped to selected project
- **Why here:** V1 already has the Project entity. This just removes the single-project constraint.

### Phase 3: Assignees

- Assignee dropdown in ticket create/detail modal (the `assigneeId` FK already exists)
- Display assignee avatar/name on ticket card
- Filter board by assignee
- **Why here:** The FK column is already in the schema (nullable). Only UI work needed.

### Phase 4: Comments

- `Comment` entity: id, ticketId (FK), authorId (FK → User), body, createdAt
- Comment thread in ticket detail modal
- **Why here:** Independent entity, no schema changes to existing tables.

### Phase 5: Project Membership & Sharing

- `ProjectMember` junction table: projectId + userId + role (Owner, Admin, Member)
- Invite users by email
- Member management UI (project settings page)
- Authorization by role (owner can delete project, members can edit tickets, etc.)
- **Why here:** Requires users to exist in the system (they do from day one) and multi-project to be in place so sharing is meaningful.

### Phase 6: Board Entity

- Extract `Board` as a separate table: id, projectId, name
- Migrate: add nullable `boardId` to `BoardColumn`, backfill with default board, make required
- Multiple boards per project (kanban board + sprint board, for example)
- Board switcher in UI
- **Why here:** Only needed when a project has enough complexity to justify multiple boards. The migration path is non-destructive because we deferred this from V1.

### Phase 7: Rich Tickets

- Priority field (Low / Medium / High) with color coding
- Labels/tags (`Label` entity + `TicketLabel` junction)
- Due dates
- Markdown support in description
- Ticket IDs (human-readable, like `PROJ-123`)

### Phase 8: Sprints / Iterations

- `Sprint` entity: id, projectId, name, startDate, endDate, goal
- `sprintId` nullable FK on Ticket
- Sprint board view (backlog + active sprint columns)
- Start/complete sprint flows

### Phase 9: Filtering & Search

- Board filters: by assignee, priority, label, text search on title
- Global search across all tickets
- Saved filters / quick filters

### Phase 10: Activity & Audit

- `ActivityLog` entity: id, ticketId, userId, action (created, moved, edited, deleted), diff (JSON before/after), createdAt
- Activity feed in ticket detail
- **Why here:** Granular audit data. Easier to add after the feature set stabilizes.

### Phase 11: Polish & Resilience

- Soft delete / archive for tickets (replace hard delete with `archivedAt`)
- Side panel replace modal for ticket detail
- Keyboard shortcuts
- Undo snackbar after actions
- Offline detection
- Rate limiting on auth endpoints
- Email verification on registration

---

## Design Decisions Log

These are the tradeoffs made in V1 and the reasoning behind them.
Each includes the migration path for when the constraint is lifted.

| Decision | V1 Choice | Reasoning | Future Path |
|---|---|---|---|
| Board table | Not present | Single board per project is sufficient. Columns attach to project. | Add Board entity, migrate columns with backfill (Phase 6) |
| Ticket ordering | Integer position | Simple, transactional. Fine at V1 scale. | Switch to lexorank/fractional if performance degrades with volume |
| Delete | Hard delete | Simple endpoint, no filtering overhead. | Add `archivedAt` soft delete, trash bin UI (Phase 11) |
| Detail view | MatDialog modal | Fastest to build, keeps board context. | Replace with side panel for Jira-like UX (Phase 11) |
| NgRx | Hand-rolled reducers | Maximum learning value, full control. | Adopt @ngrx/entity if reducer boilerplate becomes burdensome |
| Tests | API integration + Angular unit (no DOM) | Tests behavior at the boundary that matters. CDK drag-and-drop is brittle to test in DOM. | Add Cypress/Playwright E2E for critical flows |
| Authorization | Private (owner-only) | Simplest model. Each user sees only their projects. | Project-level roles with ProjectMember junction (Phase 5) |
