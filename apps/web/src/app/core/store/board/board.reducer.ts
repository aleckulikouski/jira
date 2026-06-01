import { createReducer, on } from '@ngrx/store';
import type { BoardColumn, Ticket } from '@org/shared-types';
import { BoardActions } from './board.actions';

export interface BoardState {
  columns: BoardColumn[];
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
}

const initialState: BoardState = {
  columns: [],
  tickets: [],
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
    error: null,
  })),
  on(BoardActions.addColumnSuccess, (state, { column }) => ({
    ...state,
    columns: [...state.columns, column],
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
    columns: state.columns.map((c) => (c.id === column.id ? column : c)),
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
    tickets: state.tickets.filter((t) => t.columnId !== id),
  })),
  on(BoardActions.deleteColumnFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  on(BoardActions.loadTickets, (state) => ({
    ...state,
    error: null,
  })),
  on(BoardActions.loadTicketsSuccess, (state, { columnId, tickets }) => ({
    ...state,
    tickets: [
      ...state.tickets.filter((t) => t.columnId !== columnId),
      ...tickets,
    ],
  })),
  on(BoardActions.loadTicketsFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  on(BoardActions.addTicket, (state, { columnId, title, description, tempId }) => ({
    ...state,
    error: null,
    tickets: [
      ...state.tickets,
      {
        id: tempId,
        columnId,
        title,
        description: description ?? '',
        position: -1,
        assigneeId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  })),
  on(BoardActions.addTicketSuccess, (state, { ticket, tempId }) => ({
    ...state,
    tickets: state.tickets.map((t) => (t.id === tempId ? ticket : t)),
  })),
  on(BoardActions.addTicketFailure, (state, { tempId, error }) => ({
    ...state,
    tickets: state.tickets.filter((t) => t.id !== tempId),
    error,
  })),

  on(BoardActions.updateTicket, (state) => ({
    ...state,
    error: null,
  })),
  on(BoardActions.updateTicketSuccess, (state, { ticket }) => ({
    ...state,
    tickets: state.tickets.map((t) => (t.id === ticket.id ? ticket : t)),
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
    tickets: state.tickets.filter((t) => t.id !== id),
  })),
  on(BoardActions.deleteTicketFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  on(BoardActions.moveTicket, (state, { id, columnId, position }) => ({
    ...state,
    error: null,
    tickets: state.tickets.map((t) =>
      t.id === id ? { ...t, columnId, position } : t,
    ),
  })),
  on(BoardActions.moveTicketSuccess, (state, { ticket }) => ({
    ...state,
    tickets: state.tickets.map((t) => (t.id === ticket.id ? ticket : t)),
  })),
  on(BoardActions.moveTicketFailure, (state, { ticket, error }) => ({
    ...state,
    tickets: state.tickets.map((t) => (t.id === ticket.id ? { ...ticket } : t)),
    error,
  })),
);
