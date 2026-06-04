## Parent PRD

`issues/prd.md`

## What to build

Extend the column creation API to accept an optional `afterColumnId`. When provided, the server inserts the new column immediately after the target column (incrementing the `order` of all trailing columns) and returns all columns in the project. When absent, behavior is unchanged (append to end). Stale `afterColumnId` silently falls back to appending.

## Acceptance criteria

- [ ] `CreateColumnDto` has an optional `afterColumnId?: string` field
- [ ] `afterColumnId` is validated with `@IsOptional()` and `@IsString()` (or stricter ID validation if the project standardizes on one)
- [ ] When `afterColumnId` is omitted, column is appended to end (existing behavior preserved)
- [ ] When `afterColumnId` is provided, new column's `order` is set to `targetColumn.order + 1`
- [ ] All columns with `order` greater than the target have their `order` incremented by 1
- [ ] Target lookup, trailing-column increment, new-column creation, and final column fetch happen in a single transaction
- [ ] The endpoint returns all project columns (not just the new one) as a `BoardColumn[]`, sorted by `order` ascending
- [ ] If `afterColumnId` points to a nonexistent column, the server silently falls back to appending (no 404)
- [ ] If `afterColumnId` belongs to a different project, it's treated as stale (fall back to append)
- [ ] `afterColumnId` lookup is scoped to the current `projectId`, so cross-project IDs are treated as stale and do not leak authorization state
- [ ] Column service tests verify: plain append, insert-after with correct order, order increment of trailing columns, insert after last column, stale afterColumnId fallback, cross-project afterColumnId fallback, returns all columns in order
- [ ] Column controller test verifies: afterColumnId passed from DTO to service

## Blocked by

None — can start immediately.

## User stories addressed

- User story 4 (add column from menu) — backend support
- User story 5 (column lands to the right of trigger column) — backend support
- User story 15 (stale afterColumnId handled gracefully)
