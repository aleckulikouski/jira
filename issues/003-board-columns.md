## Parent PRD

`PROJECT_SPEC.md`

## What to build

Replace the read-only column cards from 002 with a proper board layout and full column management. The board page becomes a horizontal row of columns using Angular CDK's `cdkDropList` (drop lists in place, no drag items yet — that's 007). Each column has a header with inline rename and a delete button. An "Add column" button at the end of the row opens a small dialog or inline input.

Backend: full column CRUD — create, update (name + reorder), delete. Deleting a column cascades to its tickets, with a confirmation step in the UI.

Frontend: NgRx board store with column actions (load, add, update, delete). Board component fetches columns on init, renders them in a CSS Grid/flexbox horizontal layout with `cdkDropList` directives attached (connected lists for future drag-and-drop). Inline rename: click column title → input field → blur/Enter saves via PATCH. Delete: trash icon → confirm dialog → DELETE.

## Acceptance criteria

- [ ] `POST /api/projects/:projectId/columns` — creates a new column at the end (max order + 1), returns the column
- [ ] `PATCH /api/columns/:id` — updates column name and/or order, returns updated column
- [ ] `DELETE /api/columns/:id` — deletes column (cascades to tickets), returns 204
- [ ] Board page replaces placeholder from 002 — columns rendered horizontally with title, ticket area (empty), and header actions
- [ ] Inline rename: clicking a column title switches to an input field, blur or Enter fires PATCH and updates store
- [ ] Delete column: each column header has a delete icon, click opens a MatDialog confirmation, confirm fires DELETE and removes column from store
- [ ] "Add column" button at the right end — opens a small MatDialog with a name field, submit fires POST and adds column to store
- [ ] Each column container has `cdkDropList` directive with a unique ID (wired for connected lists, no draggable items yet)
- [ ] NgRx board store supports: load columns, add column, update column, delete column — with corresponding effects calling the API
- [ ] Columns render in order by `order` field
- [ ] Empty state: if all columns are deleted, show a prompt to create the first column

## Blocked by

- Blocked by `issues/002-auth.md`

## User stories addressed

- User can customize board columns (add, rename, reorder, delete)
