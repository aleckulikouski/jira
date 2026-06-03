## Parent PRD

`issues/prd.md`

## What to build

A reusable, display-only `AvatarComponent` in `apps/web/src/app/core/components/avatar/`.

**Inputs:**
- `user: User | null`
- `size: number` (diameter in pixels)

**Behavior:**
- If `user.avatarUrl` is truthy, render an `<img>` element with the avatar URL.
- Otherwise, render a colored circle with the user's initials (from `displayName`). Extract up to 2 initials (first character of first name, first character of last name). If no displayName, use "?".
- The background color is derived from a deterministic hash of the displayName, selecting from a fixed palette so the same user always gets the same color.
- No file picker, no click handler, no output.

## Acceptance criteria

- [ ] Component renders an `<img>` when `user.avatarUrl` is set, with the image sized to the `size` input
- [ ] Component renders a colored circle with initials when `user.avatarUrl` is null or undefined
- [ ] Component renders a colored circle when `user` is null
- [ ] Same displayName produces the same color on every render (deterministic hash)
- [ ] Text color contrasts with background color (white text on dark backgrounds, dark text on light)
- [ ] Circle diameter and image size match the `size` input
- [ ] `nx test web` passes (new component tests)
- [ ] `nx build web` succeeds

## Blocked by

- Blocked by `issues/014-rename-auth-to-user-store.md`

## User stories addressed

- User story 14 (initials fallback)
- User story 15 (reusable AvatarComponent)
