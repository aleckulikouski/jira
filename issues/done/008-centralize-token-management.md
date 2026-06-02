# 008 — Centralize Token Management with TokenStorage + Auth Interceptor

## Problem

JWT token management is scattered across 4 files with 7 direct `localStorage` calls, no single owner of the token lifecycle, and duplicated header construction in every API service method.

### Current state

| File | What it does with the token | localStorage calls |
|---|---|---|
| `auth.effects.ts` — `persistAuth$` | Writes token on login/register success | `setItem('token', ...)` |
| `auth.effects.ts` — `logout$` | Removes token on logout | `removeItem('token')` |
| `auth.reducer.ts` | Reads token to hydrate initial state | `getItem('token')` |
| `board.service.ts` — `headers()` | Reads token, builds `Authorization: Bearer ${token}` header | `getItem('token')` (called in 8 methods) |
| `project.service.ts` — `getMine()` | Same pattern, inline | `getItem('token')` |

### Friction

- **One concern, many owners.** If you change the localStorage key from `'token'` to `'auth_token'`, you edit 4 files. If you switch from `Authorization: Bearer` to `X-API-Key`, you edit 2 services.
- **`BoardService.headers()` is called in 8 methods.** Every new API endpoint copies the `{ headers: this.headers() }` boilerplate. This is the definition of a shallow module — the interface (every method signature) is as complex as the implementation (one localStorage read).
- **Services know about HTTP details they shouldn't.** `BoardService` and `ProjectService` know the token is in localStorage, know it's a Bearer token, and know the header key is `Authorization`. These are infrastructure concerns, not business logic.
- **Auth endpoints get `Authorization: Bearer null`.** When unauthenticated, `localStorage.getItem('token')` returns `null`, and the header becomes `Authorization: Bearer null`. The server ignores it, but it's noise.
- **No test seam.** Testing any service requires mocking `localStorage`. Testing the auth effects requires spying on `localStorage.setItem`. There's no injectable boundary to swap.

## Proposed Interface

Three pieces compose to centralize token management:

### 1. `TokenStorage` — the persistence seam

An abstract class that owns reading, writing, and removing the token. Only the concrete implementation knows about `localStorage`.

```typescript
// core/tokens/token-storage.ts

export abstract class TokenStorage {
  abstract get(): string | null;
  abstract set(token: string): void;
  abstract remove(): void;
}
```

```typescript
// core/tokens/local-storage-token-storage.ts

import { Injectable } from '@angular/core';
import { TokenStorage } from './token-storage';

@Injectable({ providedIn: 'root' })
export class LocalStorageTokenStorage implements TokenStorage {
  private static readonly KEY = 'auth_token';

  get(): string | null {
    return localStorage.getItem(LocalStorageTokenStorage.KEY);
  }

  set(token: string): void {
    localStorage.setItem(LocalStorageTokenStorage.KEY, token);
  }

  remove(): void {
    localStorage.removeItem(LocalStorageTokenStorage.KEY);
  }

  /**
   * Static escape hatch for NgRx reducer initial-state hydration.
   * Reducers are pure functions that cannot inject — this one-line bridge
   * can be deleted when hydration moves to an APP_INITIALIZER action.
   */
  static readStoredToken(): string | null {
    return localStorage.getItem(LocalStorageTokenStorage.KEY);
  }
}
```

### 2. `authInterceptor` — the 95% case (zero-liner for services)

A functional HTTP interceptor that attaches the `Authorization: Bearer <token>` header to every outgoing request except auth endpoints.

```typescript
// core/tokens/auth.interceptor.ts

import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { TokenStorage } from './token-storage';

export function authInterceptor(): HttpInterceptorFn {
  return (req, next) => {
    if (req.url.includes('/auth/')) {
      return next(req);
    }
    const token = inject(TokenStorage).get();
    if (!token) {
      return next(req);
    }
    return next(req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }));
  };
}
```

### 3. Registration — one line in `app.config.ts`

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/tokens/auth.interceptor';
import { TokenStorage } from './core/tokens/token-storage';
import { LocalStorageTokenStorage } from './core/tokens/local-storage-token-storage';

provideHttpClient(withInterceptors([authInterceptor()])),
{ provide: TokenStorage, useClass: LocalStorageTokenStorage },
```

### Usage: Before and after

**BoardService** — the `headers()` helper and all `{ headers: this.headers() }` arguments are deleted:

```typescript
// BEFORE (8 methods, each with header boilerplate):
private headers() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}
getColumns(projectId: string) {
  return this.http.get<BoardColumn[]>(
    `${this.base}/projects/${projectId}/columns`,
    { headers: this.headers() },   // <-- deleted
  );
}

// AFTER (no auth code at all):
getColumns(projectId: string) {
  return this.http.get<BoardColumn[]>(
    `${this.base}/projects/${projectId}/columns`,
  );
}
```

**ProjectService** — inline `localStorage.getItem` + header object replaced:

```typescript
// BEFORE:
getMine() {
  const token = localStorage.getItem('token');
  return this.http.get<Project>(`${this.base}/projects/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// AFTER:
getMine() {
  return this.http.get<Project>(`${this.base}/projects/me`);
}
```

**persistAuth$ effect** — direct localStorage write replaced with `TokenStorage.set()`:

```typescript
// BEFORE:
tap(({ accessToken, user }) => {
  localStorage.setItem('token', accessToken);
  localStorage.setItem('user', JSON.stringify(user));
}),

// AFTER:
tap(({ accessToken, user }) => {
  this.tokenStorage.set(accessToken);
  localStorage.setItem('user', JSON.stringify(user)); // user storage is a separate concern
}),
```

**logout$ effect** — uses `TokenStorage.remove()`:

```typescript
// BEFORE:
tap(() => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.navigate(['/login']);
}),

// AFTER:
tap(() => {
  this.tokenStorage.remove();
  localStorage.removeItem('user');
  router.navigate(['/login']);
}),
```

**authReducer** — uses the static bridge:

```typescript
// BEFORE:
const initialState: AuthState = {
  token: localStorage.getItem('token'),
  user: loadUser(),
  loading: false,
  error: null,
};

// AFTER:
const initialState: AuthState = {
  token: LocalStorageTokenStorage.readStoredToken(),
  user: loadUser(),
  loading: false,
  error: null,
};
```

### What complexity it hides internally

| Hidden detail | Previously in |
|---|---|
| localStorage key name (`'auth_token'`) | 4 files, 7 call sites |
| `Authorization: Bearer ${token}` format | `board.service.ts`, `project.service.ts` |
| Null token guard (`if (!token)`) | Implicitly (previously sent `Bearer null`) |
| Auth endpoint exclusion | Not handled (previously sent token to `/auth/login`) |
| Header object allocation per request | Every service method |

## Dependency Strategy

**Category: In-process.** The `TokenStorage` abstraction and interceptor are pure in-process Angular constructs. No external services, no network calls.

- `TokenStorage` is an abstract class used as a DI token — consumers depend on the abstraction, not `localStorage`
- `LocalStorageTokenStorage` is the default implementation, provided via `{ provide: TokenStorage, useClass: LocalStorageTokenStorage }`
- Tests provide `MockTokenStorage` (in-memory) to avoid touching `localStorage`
- The `readStoredToken()` static is a temporary bridge for the NgRx reducer, which cannot use DI. It can be deleted when hydration moves to an `APP_INITIALIZER` that dispatches a hydration action

## Testing Strategy

### New tests to write

**`LocalStorageTokenStorage` unit tests:**
- `get()` returns null when no token is stored
- `get()` returns the token after `set()` is called
- `remove()` clears a stored token
- `set()` overwrites an existing token
- `readStoredToken()` returns the same value as `get()` (static and instance agree)

**`authInterceptor` unit tests:**
- Attaches `Authorization: Bearer <token>` header when token exists
- Passes request through unchanged when no token
- Passes request through unchanged for `/auth/` URLs (even when token exists)
- Does not mutate the original request object

**`auth.effects` updates:**
- `persistAuth$` calls `TokenStorage.set()` with the access token
- `logout$` calls `TokenStorage.remove()`

**`auth.reducer` updates:**
- Initial state reads from `LocalStorageTokenStorage.readStoredToken()`

### Old tests to delete/update

- **`board.effects.spec.ts`** and **`board.spec.ts`**: update any tests that mock `localStorage.getItem` for token access — they should mock `TokenStorage` instead (or not need to, since the interceptor handles headers)
- Tests that spy on `localStorage.setItem`/`removeItem` for token writes should instead verify `TokenStorage.set()`/`remove()` calls
- Service tests no longer need to set up `localStorage` mocks for token retrieval

### Test environment needs

```typescript
// A reusable mock for all token-dependent tests:
class MockTokenStorage extends TokenStorage {
  private token: string | null = null;
  get(): string | null { return this.token; }
  set(t: string): void { this.token = t; }
  remove(): void { this.token = null; }
}
```

## Implementation Recommendations

### What the module should own

- **Token persistence** — where and how the JWT is stored (currently localStorage; could be sessionStorage or a cookie in the future)
- **Token retrieval** — synchronous access for interceptors, guards, and services
- **Header formatting** — the `Authorization: Bearer <token>` convention
- **Auth endpoint exclusion** — the list of URL patterns that should NOT receive the token

### What it should hide

- The localStorage key name (currently `'token'`, proposed `'auth_token'`)
- The `Bearer` prefix and `Authorization` header name
- The difference between "no token" and "empty token"
- The localStorage API itself (`getItem`, `setItem`, `removeItem`)

### What it should expose

- `TokenStorage` abstract class — injectable read/write/remove for the token
- `authInterceptor()` — functional interceptor factory for `provideHttpClient`
- `LocalStorageTokenStorage.readStoredToken()` — static bridge for reducer hydration (temporary)

### Migration order

1. Create `core/tokens/token-storage.ts` (abstract class)
2. Create `core/tokens/local-storage-token-storage.ts` (concrete implementation)
3. Create `core/tokens/auth.interceptor.ts` (functional interceptor)
4. Register interceptor + `TokenStorage` provider in `app.config.ts`
5. Remove `headers()` method and all `{ headers: this.headers() }` from `BoardService`
6. Remove inline token/header construction from `ProjectService.getMine()`
7. Update `persistAuth$` to use `TokenStorage.set()`
8. Update `logout$` to use `TokenStorage.remove()`
9. Update `authReducer` initial state to use `LocalStorageTokenStorage.readStoredToken()`
10. Update existing tests: replace `localStorage` spies with `MockTokenStorage`

### Future growth path

If the app later needs token refresh, JWT expiry detection, or a different auth scheme, the `TokenStorage` abstraction can be extended without changing any consumer:

- **Token refresh**: add a `TokenRefresher` strategy and a class-based interceptor that queues requests during refresh
- **Different storage backend**: provide a different `TokenStorage` implementation (e.g., `SessionStorageTokenStorage`, `CookieTokenStorage`)
- **Different auth scheme**: move the `Authorization: Bearer` format out of the interceptor and into an injectable `AuthScheme` strategy
- **Hydration without the static**: dispatch a `hydrate` action from an `APP_INITIALIZER`, then delete `readStoredToken()`
