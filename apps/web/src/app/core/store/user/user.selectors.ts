import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { UserState } from './user.reducer';

export const selectUserState = createFeatureSelector<UserState>('user');

export const selectUser = createSelector(selectUserState, (s) => s.user);
export const selectToken = createSelector(selectUserState, (s) => s.token);
export const selectIsAuthenticated = createSelector(selectToken, (token) => !!token);
export const selectUserLoading = createSelector(selectUserState, (s) => s.loading);
export const selectUserError = createSelector(selectUserState, (s) => s.error);
export const selectProfileSaving = createSelector(selectUserState, (s) => s.profileSaving);
export const selectPasswordChanging = createSelector(selectUserState, (s) => s.passwordChanging);
