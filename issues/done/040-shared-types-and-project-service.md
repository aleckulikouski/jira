## Parent PRD

`issues/prd.md`

## What to build

Add the `CreateProjectData` interface to the shared types library so the frontend and API share the same contract. Update the frontend `ProjectService` to match the new API shape.

Shared types addition:
```typescript
interface CreateProjectData {
  name: string;
}
```

Frontend `ProjectService` changes:
- Remove `getMine()`
- Add `getAll(): Observable<Project[]>` — calls `GET /projects`
- Add `create(data: CreateProjectData): Observable<Project>` — calls `POST /projects`

## Acceptance criteria

- [ ] `CreateProjectData` interface exported from `@org/shared-types`
- [ ] `ProjectService.getAll()` returns `Observable<Project[]>` from `GET /projects`
- [ ] `ProjectService.create(data)` returns `Observable<Project>` from `POST /projects`
- [ ] `ProjectService.getMine()` is removed
- [ ] Types compile without errors across both `libs/shared-types` and `apps/web`

## Blocked by

None — can start immediately. Types and service signatures are independent of the API implementation.

## User stories addressed

- User story 1 (infrastructure)
- User story 3 (infrastructure)
