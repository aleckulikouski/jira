## Problem Statement

The application currently embeds a minimal header inside the board page component, which shows the signed-in user's email and a flat logout button. As the application grows to include more pages (starting with user settings), this pattern doesn't scale — the header needs to appear consistently across all authenticated pages, and the user needs a proper dropdown menu for account actions. Additionally, the user's display name is stored in the database but never surfaced in the UI, and the file structure places features at inconsistent locations.

## Solution

Create a proper application shell with a sticky header that appears on all authenticated pages. The header shows the app branding on the left and a user dropdown on the right. The dropdown displays the user's display name (falling back to email) and contains menu items for navigating to a user settings page and logging out. A placeholder user settings page is added to prove the routing works. The header, settings, and existing auth/board features are organized under a consistent feature directory structure. Shared TypeScript interfaces are extracted to the shared-types library so both frontend and backend use a single source of truth.

## User Stories

1. As a signed-in user, I want to see my display name in the application header, so that I feel recognized and know which account I'm using.
2. As a signed-in user with no display name set, I want to see my email in the header instead, so that I can still identify my account.
3. As a signed-in user, I want a settings dropdown menu accessible from the header, so that I can access account actions from anywhere in the app.
4. As a signed-in user, I want a "Settings" option in the header dropdown, so that I can navigate to the settings page.
5. As a signed-in user, I want a "Logout" option in the header dropdown, so that I can securely end my session.
6. As a signed-in user, I want logging out to redirect me to the login page, regardless of which page I'm currently on.
7. As a signed-in user, I want the header to be visible on all pages except login and registration, so that I always have access to account actions while authenticated.
8. As a signed-in user, I want the header to be sticky at the top of the viewport, so that I can access it without scrolling.
9. As a signed-in user, I want page content to render below the sticky header without being hidden behind it, so that all content is visible.
10. As a signed-in user, I want the application branding in the header to remain static text, so that I always know what app I'm using.
11. As a signed-in user, I want to visit a user settings page at `/user-settings`, so that I have a destination for the settings menu item.
12. As an unauthenticated user, I should not see the header or be able to access the settings page.
13. As a developer, I want the user settings page to exist as a placeholder, so that future settings features have a clear place to land.
14. As a developer, I want shared type definitions for User and AuthResponse in the shared-types library, so that the API and frontend stay in sync.
15. As a signed-in user, I want clicking "Settings" while already on the settings page to simply close the dropdown menu, so that the navigation behaves intuitively.
16. As a developer, I want the header and layout to be independently testable components, so that changes can be made with confidence.

## Implementation Decisions

### Architecture

- **Layout pattern**: A `MainLayoutComponent` wraps authenticated routes. It renders the sticky header and a `<router-outlet>` inside a wrapper div that offsets content below the toolbar. Auth pages (login, register) sit outside this layout and get no header.
- **Routes**: `/login`, `/register`, and a parent route (`/`) using `MainLayoutComponent` with children `/board` and `/user-settings`. The default redirect remains `/board`.
- **File relocation**: The existing `auth/` and `board/` directories move into `core/features/` alongside the new `user-settings/` directory. Shared components like header live under `core/components/`, and layouts under `core/layouts/`.

### Header Component

- **State**: Reads `user$` and `isAuthenticated$` from `AuthFacade`.
- **Display**: Shows the user's `displayName` with `email` as fallback. If `displayName` is falsy, the email is shown instead.
- **Dropdown**: Uses Angular Material's `mat-menu`. Trigger is a button showing the display name with a down-arrow indicator. Menu items: "Settings" (gear icon, `mat-icon`) and "Logout" (logout icon).
- **Settings navigation**: Uses `routerLink` to `/user-settings`, unless already on `/user-settings` in which case the menu simply closes.
- **Logout**: Calls `AuthFacade.logout()`, which dispatches the existing NgRx action that clears tokens, removes stored user data, and navigates to `/login`.
- **Branding**: Static "Jira Clone" text on the left side of the toolbar.
- **Styling**: `mat-toolbar color="primary"`, sticky positioning via CSS.

### MainLayout Component

- **Template**: Sticky `HeaderComponent` on top, followed by a content wrapper div with top padding equal to the toolbar height (64px), containing `<router-outlet>`.
- **No conditional logic**: Auth pages are structurally outside this layout, so no auth-state gating is needed.

### User Settings Component

- **Content**: A minimal placeholder — a heading and brief text indicating the settings page is coming soon.
- **Route**: `/user-settings`, guarded by the existing `authGuard`.
- **Location**: Appears under `core/features/user-settings/`.

### Shared Types

- **New interfaces in `@org/shared-types`**: `User` (`id`, `email`, `displayName`) and `AuthResponse` (`accessToken`, `user`).
- **Consumers**: The API auth service and the web app's auth service, auth state, and auth effects all import from `@org/shared-types` instead of defining local inline interfaces.

### API Changes

- **Auth response**: The `tokenFor()` method in the API auth service adds `displayName` to the returned user object. The JWT payload itself is unchanged — it continues to carry only `sub` and `email`.

### State Management

- **Auth state shape**: The `AuthState` interface and reducer are updated to include `displayName` in the user object. The `registerSuccess` and `loginSuccess` actions include `displayName` in their payload.
- **Local storage**: The serialized user object in localStorage now includes `displayName`.

### Board Component Cleanup

- **Header removal**: The `<mat-toolbar>` and associated auth imports are removed from `BoardComponent`. Height calculation changes from `calc(100vh - 64px)` to `100vh` since the layout wrapper now handles the offset.

## Testing Decisions

### What Makes a Good Test

Tests verify external behavior, not implementation details. They assert what the component renders and how it responds to user interaction — not how it achieves those things internally.

### Modules to Test

- **HeaderComponent**: Renders branding text; displays user display name when available; falls back to email when display name is absent; shows settings and logout menu items on dropdown open; calls `AuthFacade.logout()` on logout click.
- **MainLayoutComponent**: Renders the header and a `<router-outlet>`; applies sticky positioning to the header.
- **UserSettingsComponent**: Renders a heading and placeholder content.

### Prior Art

The codebase already contains component tests using Angular's `TestBed` (e.g., `ticket-dialog.component.spec.ts`, `board.spec.ts`). New tests follow the same pattern: `TestBed.configureTestingModule` with mocked providers/facades, component instantiation via `createComponent`, and DOM assertions via `nativeElement.querySelector`.

## Out of Scope

- Actual settings functionality (profile editing, preferences, password changes)
- User avatars or Gravatar integration
- Responsive/mobile hamburger menu
- Multiple roles or admin-specific header items
- Internationalization of header text
- Any changes to the JWT token payload structure
- Extracting additional types beyond `User` and `AuthResponse` into shared-types

## Further Notes

- The file reorganization (moving auth/ and board/ into core/features/) is part of this same issue but should be done carefully to avoid breaking imports. The Nx project configuration does not need changes since both old and new paths are under the same source root.
- The board component currently calculates its height assuming the toolbar is inside it. After the toolbar is lifted to the layout, the board's height calculation needs to be simplified to `100vh` since the layout wrapper already provides the offset.
- The existing logout effect already handles token removal, localStorage cleanup, and navigation to `/login`. The header component simply dispatches the same action — no new logout logic is needed.
