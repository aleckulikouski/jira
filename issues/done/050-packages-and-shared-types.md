## Parent PRD

`issues/prd.md`

## What to build

Install the four new npm packages and define all shared TypeScript interfaces for WebSocket communication and internal domain events. This is pure configuration and type definition — no runtime behavior changes.

Install server packages (`@nestjs/event-emitter`, `@nestjs/websockets`, `@nestjs/platform-socket.io`) and the client package (`socket.io-client`). Then define two type files in the shared-types library.

The `DomainEvents` interface maps each mutation outcome to a typed payload carrying the entity and its project ID for room routing. The `ServerToClientEvents` and `ClientToServerEvents` interfaces provide compile-time type safety for socket.io on both sides.

## Acceptance criteria

- [ ] `@nestjs/event-emitter`, `@nestjs/websockets`, and `@nestjs/platform-socket.io` are added to `package.json` dependencies
- [ ] `socket.io-client` is added to `package.json` dependencies
- [ ] `libs/shared-types` exports a `DomainEvents` type with payloads for all 7 mutations (column.created, column.updated, column.deleted, ticket.created, ticket.updated, ticket.deleted, columns.reordered)
- [ ] `libs/shared-types` exports `ServerToClientEvents` with typed signatures for all 7 socket events
- [ ] `libs/shared-types` exports `ClientToServerEvents` with typed signatures for `join` and `leave`
- [ ] Nx typecheck passes on all projects

## Blocked by

None — can start immediately.

## User stories addressed

Foundation only — no user stories directly addressed.
