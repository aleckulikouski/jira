import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthActions } from './auth.actions';
import { Router } from '@angular/router';

export const register$ = createEffect(
  (actions$ = inject(Actions), authService = inject(AuthService)) =>
    actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ email, password, displayName }) =>
        authService.register(email, password, displayName).pipe(
          map((res) => AuthActions.registerSuccess(res)),
          catchError((err) =>
            of(AuthActions.registerFailure({ error: err.error?.message ?? 'Registration failed' })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const login$ = createEffect(
  (actions$ = inject(Actions), authService = inject(AuthService)) =>
    actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        authService.login(email, password).pipe(
          map((res) => AuthActions.loginSuccess(res)),
          catchError((err) =>
            of(AuthActions.loginFailure({ error: err.error?.message ?? 'Login failed' })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const persistAuth$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(AuthActions.registerSuccess, AuthActions.loginSuccess),
      tap(({ accessToken, user }) => {
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
      }),
    ),
  { functional: true, dispatch: false },
);

export const redirectOnAuth$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(AuthActions.registerSuccess, AuthActions.loginSuccess),
      tap(() => router.navigate(['/board'])),
    ),
  { functional: true, dispatch: false },
);

export const logout$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/login']);
      }),
    ),
  { functional: true, dispatch: false },
);
