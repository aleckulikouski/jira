import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BoardState } from './board.reducer';

export const selectBoardState = createFeatureSelector<BoardState>('board');

export const selectColumns = createSelector(selectBoardState, (s) => s.columns);
export const selectBoardLoading = createSelector(selectBoardState, (s) => s.loading);
export const selectBoardError = createSelector(selectBoardState, (s) => s.error);
