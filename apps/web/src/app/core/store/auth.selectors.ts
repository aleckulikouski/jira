import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(selectAuthState, (s) => s.user);
export const selectToken = createSelector(selectAuthState, (s) => s.token);
export const selectIsAuthenticated = createSelector(selectToken, (token) => !!token);
export const selectAuthLoading = createSelector(selectAuthState, (s) => s.loading);
export const selectAuthError = createSelector(selectAuthState, (s) => s.error);
