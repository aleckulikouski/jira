import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { BoardState } from './board.reducer';

export const selectBoardState = createFeatureSelector<BoardState>('board');

export const selectColumns = createSelector(selectBoardState, (s) => {
  const cols = s.columns;
  const sorted = cols.every((c, i) => i === 0 || c.order >= cols[i - 1].order);
  return sorted ? cols : [...cols].sort((a, b) => a.order - b.order);
});
export const selectBoardLoading = createSelector(selectBoardState, (s) => s.loading);
export const selectBoardError = createSelector(selectBoardState, (s) => s.error);

export const selectTickets = createSelector(selectBoardState, (s) => s.tickets);

export const selectTicketsByColumn = (columnId: string) =>
  createSelector(selectTickets, (tickets) =>
    tickets
      .filter((t) => t.columnId === columnId)
      .sort((a, b) => a.position - b.position),
  );
