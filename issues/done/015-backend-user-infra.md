## Parent PRD

`issues/prd.md`

## What to build

Create the backend infrastructure needed for user profile and avatar features:

- **Global PrismaModule**: Extract PrismaService into a `@Global()` module so it's injectable everywhere without repeated imports.
- **User model change**: Add `avatarUrl String?` to the Prisma User model. Run migration.
- **ServeStaticModule**: Install `@nestjs/serve-static` and configure it to serve `/uploads` from the `UPLOADS_DIR` path.
- **Infrastructure**: Add `uploads` volume to docker-compose.yml. Add `UPLOADS_DIR` to start-dev.sh. Add `apps/api/uploads/` to .gitignore. Update shared-types `User` interface to include `avatarUrl?: string | null`.

No API endpoints yet — just the plumbing.

## Acceptance criteria

- [ ] `PrismaModule` is `@Global()` and used by AppModule
- [ ] Other modules (AuthModule, etc.) no longer import PrismaService directly
- [ ] `User` model has `avatarUrl String?` column in the database
- [ ] `@nestjs/serve-static` is installed and configured
- [ ] `UPLOADS_DIR` env var is exported in start-dev.sh, defaulting to `apps/api/uploads/`
- [ ] `apps/api/uploads/` is in `.gitignore`
- [ ] `uploads` volume exists in docker-compose.yml
- [ ] Shared types `User` interface includes `avatarUrl?: string | null`
- [ ] `nx build api` succeeds

## Blocked by

None — can start immediately.

## User stories addressed

- User story 17 (avatar persists across sessions — storage infra in place)
