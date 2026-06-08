import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { UserService } from '../../services/user.service';
import { WsService } from '../../services/ws.service';
import { UserActions } from './user.actions';
import { Router } from '@angular/router';
import { TokenStorage } from '../../tokens/token-storage';

export const register$ = createEffect(
  (actions$ = inject(Actions), userService = inject(UserService)) =>
    actions$.pipe(
      ofType(UserActions.register),
      switchMap(({ email, password, displayName }) =>
        userService.register(email, password, displayName).pipe(
          map((res) => UserActions.registerSuccess(res)),
          catchError((err) =>
            of(UserActions.registerFailure({ error: err.error?.message ?? 'Registration failed' })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const login$ = createEffect(
  (actions$ = inject(Actions), userService = inject(UserService)) =>
    actions$.pipe(
      ofType(UserActions.login),
      switchMap(({ email, password }) =>
        userService.login(email, password).pipe(
          map((res) => UserActions.loginSuccess(res)),
          catchError((err) =>
            of(UserActions.loginFailure({ error: err.error?.message ?? 'Login failed' })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const persistUser$ = createEffect(
  (actions$ = inject(Actions), tokenStorage = inject(TokenStorage)) =>
    actions$.pipe(
      ofType(UserActions.registerSuccess, UserActions.loginSuccess),
      tap(({ accessToken, user }) => {
        tokenStorage.set(accessToken);
        localStorage.setItem('user', JSON.stringify(user));
      }),
    ),
  { functional: true, dispatch: false },
);

export const redirectOnAuth$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(UserActions.registerSuccess, UserActions.loginSuccess),
      tap(() => router.navigate(['/board'])),
    ),
  { functional: true, dispatch: false },
);

export const logout$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router), tokenStorage = inject(TokenStorage)) =>
    actions$.pipe(
      ofType(UserActions.logout),
      tap(() => {
        tokenStorage.remove();
        localStorage.removeItem('user');
        router.navigate(['/login']);
      }),
    ),
  { functional: true, dispatch: false },
);

export const updateProfile$ = createEffect(
  (actions$ = inject(Actions), userService = inject(UserService)) =>
    actions$.pipe(
      ofType(UserActions.updateProfile),
      switchMap(({ formData }) =>
        userService.updateProfile(formData).pipe(
          map((user) => UserActions.updateProfileSuccess({ user })),
          catchError((err) =>
            of(UserActions.updateProfileFailure({ error: err.error?.message ?? 'Failed to update profile' })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const persistProfileUpdate$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(UserActions.updateProfileSuccess),
      tap(({ user }) => {
        localStorage.setItem('user', JSON.stringify(user));
      }),
    ),
  { functional: true, dispatch: false },
);

export const connectWs$ = createEffect(
  (actions$ = inject(Actions), wsService = inject(WsService)) =>
    actions$.pipe(
      ofType(UserActions.loginSuccess, UserActions.registerSuccess),
      tap(({ accessToken }) => wsService.connect(accessToken)),
    ),
  { functional: true, dispatch: false },
);

export const disconnectWs$ = createEffect(
  (actions$ = inject(Actions), wsService = inject(WsService)) =>
    actions$.pipe(
      ofType(UserActions.logout),
      tap(() => wsService.disconnect()),
    ),
  { functional: true, dispatch: false },
);

export const changePassword$ = createEffect(
  (actions$ = inject(Actions), userService = inject(UserService)) =>
    actions$.pipe(
      ofType(UserActions.changePassword),
      switchMap(({ newPassword, confirmPassword }) =>
        userService.changePassword(newPassword, confirmPassword).pipe(
          map(() => UserActions.changePasswordSuccess()),
          catchError((err) =>
            of(UserActions.changePasswordFailure({ error: err.error?.message ?? 'Failed to change password' })),
          ),
        ),
      ),
    ),
  { functional: true },
);
