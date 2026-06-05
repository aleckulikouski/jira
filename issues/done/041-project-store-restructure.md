## Parent PRD

`issues/prd.md`

## What to build

Restructure the project NgRx store from holding a single project to holding a list of projects with URL-derived selection. Add board state clearing. All changes are testable in isolation.

### Project actions (new/modified)
- `loadProjects` / `loadProjectsSuccess` / `loadProjectsFailure` — fetch all projects
- `createProject` / `createProjectSuccess` / `createProjectFailure` — create and append
- `selectProject({ id })` — pure signal action, no reducer change

### Project reducer
- `projects: Project[]` replaces single `project: Project | null`
- `loadProjectsSuccess` sets the array
- `createProjectSuccess` appends the new project
- `selectProject` — no handler (signal only)

### Project selectors
- `selectProjects` — raw array
- `selectProjectId` — reads `:id` route param via `ActivatedRoute` (passed as prop)
- `selectProject` — derives the matched project from `selectProjects` + route param

### Project effects
- `loadProjects$` — calls `ProjectService.getAll()`, maps to success/failure
- `createProject$` — calls `ProjectService.create()`, maps to success/failure
- `selectProject$` — on `selectProject`, writes `lastSelectedProjectId` to localStorage, dispatches `BoardActions.clearBoard()`, then `BoardActions.loadColumns({ projectId: id })`

### Project facade
- `projects$`, `selectedProjectId$`, `selectedProject$` (accepts route param prop)
- `loadProjects()`, `createProject(data)`

### Board actions (new)
- `clearBoard` — resets board state to initialState

### Board reducer
- Handle `clearBoard` by returning `initialState`

### Board effects (new)
- After `loadColumnsSuccess`, an effect dispatches `loadTickets` for each new column

## Acceptance criteria

- [ ] Project reducer correctly handles `loadProjects`, `loadProjectsSuccess`, `loadProjectsFailure`, `createProjectSuccess`
- [ ] `selectProject` action exists but does not modify project state
- [ ] `selectProject$` effect writes to localStorage and dispatches `clearBoard` + `loadColumns`
- [ ] `loadProjects$` effect calls `getAll()` and dispatches success/failure
- [ ] `createProject$` effect calls `create()` and dispatches success/failure
- [ ] `clearBoard` action resets board state to `initialState`
- [ ] `loadColumnsSuccess` triggers `loadTickets` for each column
- [ ] `UserActions.logout` still resets both project and board state
- [ ] All existing board effects tests still pass
- [ ] New project effects follow the same test pattern as `board.effects.spec.ts`

## Blocked by

- Blocked by `issues/040-shared-types-and-project-service.md`

## User stories addressed

- User story 1: project list in store
- User story 2: selecting a project triggers board load
- User story 4: last-selected project persisted to localStorage
- User story 8: invalid project ID validation (selector validates before dispatching)
