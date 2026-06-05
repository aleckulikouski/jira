## Parent PRD

`issues/prd.md`

## What to build

Restructure the Angular routes to support project-based navigation. Add a resolver that redirects from `/` to the last-selected project.

### Route changes
- Remove `{ path: 'board', component: BoardComponent }`
- Add `{ path: 'projects/:id/board', component: BoardComponent }`
- Add `{ path: '', component: BoardComponent }` — board serves as the root page, renders empty state when no project selected
- Redirect `/board` to `/` (legacy URL support)

### Project redirect resolver
- Functional resolver at `apps/web/src/app/core/resolvers/project-redirect.resolver.ts`
- Reads `lastSelectedProjectId` from localStorage
- If present, redirects to `/projects/:id/board`
- If absent, allows navigation to `/` (board shows empty state)

### Settings page
- Update `onBack()` to navigate to `/` instead of `/board`

## Acceptance criteria

- [ ] `/projects/:id/board` renders the board for that project
- [ ] `/` renders the board (empty state when no last-selected project)
- [ ] `/board` redirects to `/`
- [ ] Resolver redirects `/` → `/projects/:id/board` when localStorage has a last-selected ID
- [ ] Resolver allows `/` when localStorage has no last-selected ID
- [ ] Settings "Back" button navigates to `/`
- [ ] Auth guard still protects all board routes

## Blocked by

None — route configuration is independent of store changes.

## User stories addressed

- User story 4: last-selected project redirect
- User story 7: URL reflects selected project
- User story 10: navigating back from Settings works
