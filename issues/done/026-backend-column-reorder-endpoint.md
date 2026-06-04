## Parent PRD

`issues/prd.md`

## What to build

New `PATCH projects/:projectId/columns/reorder` endpoint. Accepts `{ orderedIds: string[] }`, validates the ID set matches the project's actual columns exactly (409 on mismatch), then assigns each column `order = index` in a Prisma transaction. This is the server-side half of column reordering — a complete HTTP→DB→HTTP vertical slice.

## Acceptance criteria

- [ ] `PATCH projects/:projectId/columns/reorder` accepts `{ orderedIds: string[] }` with `@IsArray()` and `@IsString({ each: true })` validation
- [ ] Service method verifies the authenticated user owns the project
- [ ] Service method validates the set of `orderedIds` exactly matches the project's column IDs (same elements, any order). Returns 409 Conflict if not.
- [ ] Service method updates all columns in one `$transaction`, setting `order` to the index in `orderedIds` for each
- [ ] Columns returned by `GET projects/:projectId/columns` are sorted by `order` ascending (already implemented — verify it still works)
- [ ] Existing column creation assigning `order = max + 1` continues to work (already implemented — verify no regression)

## Blocked by

None — can start immediately.

## User stories addressed

- User story 4 (order persists after reload)
- User story 6 (new columns appear at rightmost end)
- User story 13 (server validates column ID set, rejects stale requests)
