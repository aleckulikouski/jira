## Problem Statement

The app currently hardcodes a single project per user. The board shows `{{ project.name }}` as a static title, and the API only supports `GET /projects/me` which returns the first project owned by the authenticated user. There is no way to switch between projects, create new projects, or work with projects owned by other users. The header shows "Jira Clone" as static brand text, and the user menu only has Settings and Logout.

The user wants: a project selector dropdown in place of the static project title, the ability to create projects, and unrestricted access to any project (no authorization gating for now).

## Solution

Replace the static project title in the board with a mat-select dropdown that lists all projects. Add a "Create project" button in the header's user menu that opens a dialog. Strip all ownership-based authorization checks so any authenticated user can access any project. Move to route-based project navigation (`/projects/:id/board`) with a resolver that redirects from `/` to the last-selected project (stored in localStorage).

## User Stories

1. As an authenticated user, I want to see a dropdown of all projects in the board header, so that I can switch between projects without reloading the app
2. As an authenticated user, I want to select a project from the dropdown and immediately see its board (columns and tickets), so that I can work across multiple projects
3. As an authenticated user, I want to create a new project from the header's user menu, so that I can start new work without leaving the current page
4. As an authenticated user, I want the app to remember which project I last viewed, so that when I return to the app I'm taken directly to that project
5. As an authenticated user, I want to access any project regardless of who created it, so that I can collaborate without permission management overhead
6. As an authenticated user, I want to see a clear empty state on the board when no project is selected, so that I know what action to take next
7. As an authenticated user, I want the URL to reflect the currently selected project (`/projects/:id/board`), so that I can bookmark and share project links
8. As an authenticated user, I want to see a clear error if I navigate to a project ID that doesn't exist, so that I know the link was invalid
9. As an authenticated user navigating directly to a project URL, I want to see the project ID with a loading spinner while the project list loads, so that I know the app is working on my request
10. As an authenticated user, I want to navigate away from a project (e.g., to Settings) and back to it easily, so that I don't lose my place
11. As an authenticated user with no projects yet, I want the project selector to show a disabled "No projects" state, so that I understand there are no projects available

## Implementation Decisions

- Project selector is a mat-select component inside the board, replacing the static `<h2>` project title. No label — dropdown only
- Project selector reads the selected project from a store selector that derives it from the route param and the projects array. On selection change, it navigates to `/projects/:id/board`
- Project selector shows three states: loading (project ID + spinner to the right), disabled ("No projects" when list is empty), and active ("Select a project..." placeholder when projects exist but none is selected)
- Create project button lives in the header's user menu (between Settings and Logout). No CTA on the empty board — user menu is the only creation path
- Create project opens a MatDialog with a single name field. The dialog data uses a typed `CreateProjectData` interface (shared between frontend and API) with only `name` for now, but structured for future extension (description, key, etc.)
- After creating a project, the dialog dispatches a store action that appends the new project to the list and navigates to `/projects/:newId/board`
- Routing: `/projects/:id/board` for the board with a selected project; `/` with a resolver that redirects to the last-selected project (from localStorage) or shows the empty board. The old `/board` route is removed
- A route resolver reads `lastSelectedProjectId` from localStorage. If present, it redirects to `/projects/:id/board`. If absent, the board renders at `/` with an empty state
- Board empty state: centered message "Select a project to get started" with an icon, below the project selector
- The board component no longer depends on ProjectFacade directly. It reads `selectedProjectId$` from the store for dispatching addColumn and reorderColumns actions. It does not call `loadProject()` or subscribe to `project$`
- The board component's ngOnInit is empty. All data loading is effect-driven
- Project store restructured: holds `projects: Project[]` instead of a single `project`. A `selectProjectId` selector derives the selected ID from the route param. A `selectProject` selector derives the project object from the array + route param
- A `selectProject` action is a pure signal (no reducer change). An effect listens to it and: writes the ID to localStorage, dispatches `clearBoard`, dispatches `loadColumns({ projectId: id })`
- A `clearBoard` action resets the board state to initialState. The project selection effect dispatches it before loading new columns
- After `loadColumnsSuccess`, an effect dispatches `loadTickets` for each new column. Ticket loading is fully effect-driven — the board component does not trigger ticket loads
- The project selection effect lives in project effects. It dispatches board actions — cross-feature coupling is explicit and intentional
- loadProjects is dispatched by the project selector component's onInit. It is the only consumer that needs the list
- Direct navigation to `/projects/:id/board` before projects load: the project selector validates the route param against the projects list once loaded. On mismatch, it shows a snackbar error. On match, it dispatches `selectProject`
- Settings "Back to board" button navigates to `/`, letting the resolver handle the redirect
- Header keeps the "Jira Clone" brand text. The project selector is board-level, not header-level
- API: remove `GET /projects/me`, add `GET /projects` (returns all projects, sorted by createdAt descending) and `POST /projects` (accepts `CreateProjectData`, sets ownerId from JWT, validates name is required, non-empty, and unique with exact match)
- AuthorizationService: remove ForbiddenException from project(), column(), ticket() methods. Keep NotFoundException for existence checks. Keep userId parameter in all service method signatures for future re-addition of auth
- Ownership: keep ownerId field populated on create, but don't enforce it in any access checks
- The Prisma schema does not change

## Testing Decisions

- Tests should verify external behavior, not implementation details
- Goal is deep modules that can be tested in isolation with minimal mocking
- Board effects: follow the existing Vitest pattern in `board.effects.spec.ts` — test that API calls are made correctly and success/failure actions are dispatched
- Project effects: same pattern as board effects — test loadProjects$, createProject$, selectProject$ (localStorage, clearBoard dispatch, loadColumns dispatch)
- Project reducer: follow `user.reducer.spec.ts` pattern — test state transitions for load/loadSuccess/loadFailure
- Project selector component: test that it dispatches loadProjects on init, reads selectedProject$, navigates on selection change, and renders correct states (loading, disabled, normal)

## Out of Scope

- Project edit (rename) or delete
- Project members/roles/permissions
- Project-specific settings or configuration
- Reintroducing authorization gating
- A project list landing page — the board handles both empty and loaded states
- The board "Create your first project" CTA — creation is only via header user menu

## Further Notes

- The typed `CreateProjectData` interface exists even though it has a single field — this makes future extension cheap and establishes the pattern
- The project store's `selectProject` action being a pure signal is deliberate: the URL is the sole source of truth for selection, never duplicated in store state
- The cross-feature effect coupling (project effects dispatching board actions) is simpler than adding a new orchestration layer
