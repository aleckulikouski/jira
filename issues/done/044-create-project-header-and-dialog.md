## Parent PRD

`issues/prd.md`

## What to build

Add a "Create project" button to the header's user menu and build the create project dialog. This is the final UI slice — completing the full create-to-board flow.

### Header changes
- Add "Create project" menu item in the mat-menu, between Settings and Logout
- Uses a divider to visually separate it from Settings/Logout, or placed above them (recommendation: above Settings, separated by divider)
- Clicking it opens the `CreateProjectDialogComponent`

### Create project dialog
- Location: `apps/web/src/app/features/project/create-project-dialog.component.ts`
- MatDialog with a single form field: project name
- Uses typed `CreateProjectData` interface (not a bare string)
- On submit: calls `ProjectService.create(data)`, dispatches `ProjectActions.createProjectSuccess({ project })` on success
- The reducer appends the new project to the list
- After successful creation: navigates to `/projects/:newId/board`
- On error: shows snackbar with error message
- Dialog has Cancel and Create buttons. Create is disabled when name is empty.

## Acceptance criteria

- [ ] "Create project" button visible in header user menu (between Settings and Logout)
- [ ] Clicking "Create project" opens a dialog with a project name field
- [ ] Create button is disabled when name is empty
- [ ] Submitting with a valid name creates the project via the API
- [ ] On success: dialog closes, navigates to `/projects/:newId/board`, project appears in selector
- [ ] On error (duplicate name, network error): shows snackbar with error, dialog stays open
- [ ] Cancel button closes the dialog without side effects
- [ ] Works end-to-end: no projects → create one → redirected to board → selector shows the new project
- [ ] Dialog component lives in `features/project/` directory

## Blocked by

- Blocked by `issues/041-project-store-restructure.md`

## User stories addressed

- User story 3: creating a new project
- User story 1: new project appears in selector after creation
- User story 11: first project creation path (user menu when no projects exist)
