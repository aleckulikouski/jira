import { createReducer, on } from '@ngrx/store';
import { UserActions } from './user.actions';
import { LocalStorageTokenStorage } from '../../tokens/local-storage-token-storage';
import type { User } from '@org/shared-types';

export interface UserState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  profileSaving: boolean;
  passwordChanging: boolean;
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

const initialState: UserState = {
  user: loadUser(),
  token: LocalStorageTokenStorage.readStoredToken(),
  loading: false,
  error: null,
  profileSaving: false,
  passwordChanging: false,
};

export const userReducer = createReducer(
  initialState,

  on(UserActions.register, UserActions.login, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(UserActions.registerSuccess, (state, { accessToken, user }) => ({
    ...state,
    user,
    token: accessToken,
    loading: false,
    error: null,
  })),

  on(UserActions.loginSuccess, (state, { accessToken, user }) => ({
    ...state,
    user,
    token: accessToken,
    loading: false,
    error: null,
  })),

  on(UserActions.registerFailure, UserActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(UserActions.logout, () => ({
    ...initialState,
    token: null,
    user: null,
  })),

  on(UserActions.updateProfile, (state) => ({
    ...state,
    profileSaving: true,
    error: null,
  })),

  on(UserActions.updateProfileSuccess, (state, { user }) => ({
    ...state,
    user,
    profileSaving: false,
  })),

  on(UserActions.updateProfileFailure, (state, { error }) => ({
    ...state,
    profileSaving: false,
    error,
  })),

  on(UserActions.changePassword, (state) => ({
    ...state,
    passwordChanging: true,
    error: null,
  })),

  on(UserActions.changePasswordSuccess, (state) => ({
    ...state,
    passwordChanging: false,
  })),

  on(UserActions.changePasswordFailure, (state, { error }) => ({
    ...state,
    passwordChanging: false,
    error,
  })),
);
