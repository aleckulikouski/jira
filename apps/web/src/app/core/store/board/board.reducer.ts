import { createReducer, on } from '@ngrx/store';
import type { BoardColumn } from '@org/shared-types';
import { BoardActions } from './board.actions';
import { UserActions } from '../user/user.actions';

export interface BoardState {
  columns: BoardColumn[];
  loading: boolean;
  error: string | null;
  previousOrderedIds: string[] | null;
}

const initialState: BoardState = {
  columns: [],
  loading: false,
  error: null,
  previousOrderedIds: null,
};

export const boardReducer = createReducer(
  initialState,

  on(UserActions.logout, () => initialState),
  on(BoardActions.clearBoard, () => initialState),

  on(BoardActions.loadBoard, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(BoardActions.loadBoardSuccess, (state, { columns }) => ({
    ...state,
    columns,
    loading: false,
  })),
  on(BoardActions.loadBoardFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(BoardActions.addColumn, (state) => ({
    ...state,
    error: null,
  })),
  on(BoardActions.addColumnSuccess, (state, { column }) => ({
    ...state,
    columns: [...state.columns, { ...column, tickets: [] }].sort((a, b) => a.order - b.order),
  })),
  on(BoardActions.addColumnFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  on(BoardActions.updateColumn, (state) => ({
    ...state,
    error: null,
  })),
  on(BoardActions.updateColumnSuccess, (state, { column }) => ({
    ...state,
    columns: state.columns.map((c) => (c.id === column.id ? { ...column, tickets: c.tickets } : c)),
  })),
  on(BoardActions.updateColumnFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  on(BoardActions.deleteColumn, (state) => ({
    ...state,
    error: null,
  })),
  on(BoardActions.deleteColumnSuccess, (state, { id }) => ({
    ...state,
    columns: state.columns.filter((c) => c.id !== id),
  })),
  on(BoardActions.deleteColumnFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  on(BoardActions.addTicket, (state, { columnId, title, description, tempId }) => ({
    ...state,
    error: null,
    columns: state.columns.map((c) =>
      c.id === columnId
        ? {
            ...c,
            tickets: [
              ...(c.tickets ?? []),
              {
                id: tempId,
                columnId,
                title,
                description: description ?? '',
                position: 999999,
                assigneeId: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          }
        : c,
    ),
  })),
  on(BoardActions.addTicketSuccess, (state, { ticket, tempId }) => ({
    ...state,
    columns: state.columns.map((c) =>
      c.id === ticket.columnId
        ? { ...c, tickets: (c.tickets ?? []).map((t) => (t.id === tempId ? ticket : t)) }
        : c,
    ),
  })),
  on(BoardActions.addTicketFailure, (state, { tempId, error }) => ({
    ...state,
    columns: state.columns.map((c) => ({
      ...c,
      tickets: (c.tickets ?? []).filter((t) => t.id !== tempId),
    })),
    error,
  })),

  on(BoardActions.updateTicket, (state) => ({
    ...state,
    error: null,
  })),
  on(BoardActions.updateTicketSuccess, (state, { ticket }) => ({
    ...state,
    columns: state.columns.map((c) => {
      const filtered = (c.tickets ?? []).filter((t) => t.id !== ticket.id);
      if (c.id === ticket.columnId) {
        filtered.push(ticket);
      }
      return { ...c, tickets: filtered };
    }),
  })),
  on(BoardActions.updateTicketFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  on(BoardActions.deleteTicket, (state) => ({
    ...state,
    error: null,
  })),
  on(BoardActions.deleteTicketSuccess, (state, { id }) => ({
    ...state,
    columns: state.columns.map((c) => ({
      ...c,
      tickets: (c.tickets ?? []).filter((t) => t.id !== id),
    })),
  })),
  on(BoardActions.deleteTicketFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  on(BoardActions.moveTicket, (state, { id, columnId, position }) => ({
    ...state,
    error: null,
    columns: state.columns.map((c) => {
      // remove from source column
      const tickets = (c.tickets ?? []).filter((t) => t.id !== id);
      // add to target column at the correct position
      if (c.id === columnId) {
        const moved = state.columns.flatMap((col) => col.tickets ?? []).find((t) => t.id === id);
        if (moved) {
          const updated = { ...moved, columnId, position };
          const insertAt = tickets.findIndex((t) => t.position > position);
          if (insertAt === -1) {
            tickets.push(updated);
          } else {
            tickets.splice(insertAt, 0, updated);
          }
        }
      }
      return { ...c, tickets };
    }),
  })),
  on(BoardActions.moveTicketSuccess, (state, { ticket }) => ({
    ...state,
    columns: state.columns.map((c) => ({
      ...c,
      tickets: (c.tickets ?? []).map((t) => (t.id === ticket.id ? ticket : t)),
    })),
  })),
  on(BoardActions.moveTicketFailure, (state, { ticket, error }) => ({
    ...state,
    columns: state.columns.map((c) => {
      // roll back: remove from wherever it was moved to, re-add `ticket` (previous state) to its original column
      const without = (c.tickets ?? []).filter((t) => t.id !== ticket.id);
      if (c.id === ticket.columnId) {
        without.push(ticket);
      }
      return { ...c, tickets: without };
    }),
    error,
  })),

  on(BoardActions.reorderColumns, (state, { orderedIds, previousOrderedIds }) => {
    const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
    return {
      ...state,
      error: null,
      columns: state.columns
        .map((c) => ({ ...c, order: orderMap.get(c.id) ?? c.order }))
        .sort((a, b) => a.order - b.order),
      previousOrderedIds,
    };
  }),
  on(BoardActions.reorderColumnsSuccess, (state) => ({
    ...state,
    previousOrderedIds: null,
  })),
  on(BoardActions.reorderColumnsFailure, (state, { previousOrderedIds, error }) => {
    const orderMap = new Map(previousOrderedIds.map((id, i) => [id, i]));
    return {
      ...state,
      columns: state.columns
        .map((c) => ({ ...c, order: orderMap.get(c.id) ?? c.order }))
        .sort((a, b) => a.order - b.order),
      previousOrderedIds: null,
      error,
    };
  }),
);
