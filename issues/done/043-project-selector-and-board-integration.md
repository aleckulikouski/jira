## Parent PRD

`issues/prd.md`

## What to build

Create the project selector component and integrate it into the board. Remove the board's direct dependency on ProjectFacade. Add the board empty state. This is the primary UI slice.

### Project selector component
- mat-select dropdown, placed where `<h2>{{ project.name }}</h2>` currently sits
- Three visual states:
  - **Loading**: shows the project ID from the URL with a spinner to the right (while projects list is being fetched)
  - **Disabled**: shows "No projects" when the projects list is empty (user needs to create one)
  - **Normal**: shows "Select a project..." placeholder when projects exist but none selected; shows selected project name when one is picked
- On init: dispatches `ProjectActions.loadProjects()`
- Reads `selectedProject$` from store (derived from route param + projects array)
- On user selection: navigates to `/projects/:id/board`
- Validates route param against projects list after load — dispatches `selectProject` on match, shows snackbar error on mismatch

### Board component changes
- Replace `<h2>{{ (project.project$ | async)?.name }}</h2>` with `<app-project-selector>`
- Remove `ProjectFacade` injection and all related subscriptions
- Remove `ngOnInit` (no more `loadProject()` call)
- Remove constructor subscriptions to `project.project$`
- Read `selectedProjectId$` from store (via a selector) and use it for `addColumn` and `reorderColumns` dispatches
- Add empty state: when no project is selected, show centered message "Select a project to get started" with an icon below the selector

### Ticket loading
- Effect-driven: after `loadColumnsSuccess`, an effect dispatches `loadTickets` for each new column
- Board component no longer triggers ticket loads

## Acceptance criteria

- [ ] Project selector shows "No projects" (disabled) when the projects list is empty
- [ ] Project selector shows "Select a project..." when projects exist but none is selected
- [ ] Project selector shows selected project name when one is active
- [ ] Project selector shows project ID + spinner while loading (direct URL navigation before list arrives)
- [ ] Selecting a project from the dropdown navigates to `/projects/:id/board` and loads the board
- [ ] Board empty state renders at `/` when no project is selected
- [ ] Direct navigation to `/projects/valid-id/board` loads the project correctly
- [ ] Direct navigation to `/projects/nonexistent-id/board` shows a snackbar error
- [ ] Switching between projects via the selector clears old data and loads new data
- [ ] Board still works for column add/edit/delete, ticket add/edit/move, and column reorder (projectId comes from store selector, not local state)
- [ ] Board no longer injects `ProjectFacade`

## Blocked by

- Blocked by `issues/041-project-store-restructure.md`
- Blocked by `issues/042-routes-and-resolver.md`

## User stories addressed

- User story 1: project dropdown visible
- User story 2: selecting a project loads its board
- User story 6: board empty state when no project selected
- User story 8: invalid project ID error
- User story 9: loading state on direct navigation
- User story 11: "No projects" disabled state when list is empty
