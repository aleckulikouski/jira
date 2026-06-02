import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { LocalStorageTokenStorage } from '../../tokens/local-storage-token-storage';
import type { User } from '@org/shared-types';

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

function loadUser(): User | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const initialState: AuthState = {
  user: loadUser(),
  token: LocalStorageTokenStorage.readStoredToken(),
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialState,

  on(AuthActions.register, AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.registerSuccess, (state, { accessToken, user }) => ({
    ...state,
    user,
    token: accessToken,
    loading: false,
    error: null,
  })),

  on(AuthActions.loginSuccess, (state, { accessToken, user }) => ({
    ...state,
    user,
    token: accessToken,
    loading: false,
    error: null,
  })),

  on(AuthActions.registerFailure, AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(AuthActions.logout, () => ({
    ...initialState,
    token: null,
    user: null,
  })),
);
