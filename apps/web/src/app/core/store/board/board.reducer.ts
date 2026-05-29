import { createReducer, on } from '@ngrx/store';
import { BoardColumn } from '@org/shared-types';
import { BoardActions } from './board.actions';

export interface BoardState {
  columns: BoardColumn[];
  loading: boolean;
  error: string | null;
}

const initialState: BoardState = {
  columns: [],
  loading: false,
  error: null,
};

export const boardReducer = createReducer(
  initialState,

  on(BoardActions.loadColumns, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(BoardActions.loadColumnsSuccess, (state, { columns }) => ({
    ...state,
    columns,
    loading: false,
  })),
  on(BoardActions.loadColumnsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(BoardActions.addColumn, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(BoardActions.addColumnSuccess, (state, { column }) => ({
    ...state,
    columns: [...state.columns, column],
    loading: false,
  })),
  on(BoardActions.addColumnFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(BoardActions.updateColumn, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(BoardActions.updateColumnSuccess, (state, { column }) => ({
    ...state,
    columns: state.columns.map((c) => (c.id === column.id ? column : c)),
    loading: false,
  })),
  on(BoardActions.updateColumnFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(BoardActions.deleteColumn, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(BoardActions.deleteColumnSuccess, (state, { id }) => ({
    ...state,
    columns: state.columns.filter((c) => c.id !== id),
    loading: false,
  })),
  on(BoardActions.deleteColumnFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
