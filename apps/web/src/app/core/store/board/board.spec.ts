import { describe, it, expect } from 'vitest';
import { BoardActions } from './board.actions';
import { boardReducer, BoardState } from './board.reducer';
import { BoardColumn, Ticket } from '@org/shared-types';

const makeTicket = (overrides?: Partial<Ticket>): Ticket => ({
  id: 't-1',
  columnId: 'c-1',
  assigneeId: null,
  title: 'Test Ticket',
  description: '',
  position: 0,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

const makeColumn = (overrides?: Partial<BoardColumn>): BoardColumn => ({
  id: 'c-1',
  projectId: 'p-1',
  name: 'To Do',
  order: 0,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('Board Actions', () => {
  it('should create updateTicket action', () => {
    const action = BoardActions.updateTicket({ id: 't-1', data: { title: 'Updated' } });
    expect(action.id).toBe('t-1');
    expect(action.data.title).toBe('Updated');
  });

  it('should create updateTicketSuccess action', () => {
    const ticket = makeTicket();
    const action = BoardActions.updateTicketSuccess({ ticket });
    expect(action.ticket).toBe(ticket);
  });

  it('should create updateTicketFailure action', () => {
    const action = BoardActions.updateTicketFailure({ error: 'oops' });
    expect(action.error).toBe('oops');
  });

  it('should create deleteTicket action', () => {
    const action = BoardActions.deleteTicket({ id: 't-1' });
    expect(action.id).toBe('t-1');
  });

  it('should create deleteTicketSuccess action', () => {
    const action = BoardActions.deleteTicketSuccess({ id: 't-1' });
    expect(action.id).toBe('t-1');
  });

  it('should create deleteTicketFailure action', () => {
    const action = BoardActions.deleteTicketFailure({ error: 'oops' });
    expect(action.error).toBe('oops');
  });

  it('should create showError action', () => {
    const action = BoardActions.showError({ message: 'test error' });
    expect(action.message).toBe('test error');
  });
});

describe('Board Reducer - Tickets', () => {
  const initial: BoardState = {
    columns: [makeColumn()],
    tickets: [makeTicket(), makeTicket({ id: 't-2', title: 'Second' })],
    loading: false,
    error: null,
  };

  it('should return initial state', () => {
    const state = boardReducer(undefined, { type: '@@INIT' } as any);
    expect(state.tickets).toEqual([]);
  });

  describe('updateTicket', () => {
    it('should clear error on updateTicket', () => {
      const state = boardReducer(
        { ...initial, error: 'previous error' },
        BoardActions.updateTicket({ id: 't-1', data: { title: 'New' } }),
      );
      expect(state.error).toBeNull();
    });

    it('should replace the ticket on updateTicketSuccess', () => {
      const updated = makeTicket({ id: 't-1', title: 'Updated Title', description: 'New desc' });
      const state = boardReducer(initial, BoardActions.updateTicketSuccess({ ticket: updated }));
      expect(state.tickets).toHaveLength(2);
      expect(state.tickets.find((t) => t.id === 't-1')).toEqual(updated);
      expect(state.tickets.find((t) => t.id === 't-2')!.title).toBe('Second');
    });

    it('should handle ticket column change on updateTicketSuccess', () => {
      const updated = makeTicket({ id: 't-1', columnId: 'c-2', position: 0 });
      const state = boardReducer(initial, BoardActions.updateTicketSuccess({ ticket: updated }));
      const ticket = state.tickets.find((t) => t.id === 't-1');
      expect(ticket!.columnId).toBe('c-2');
      expect(ticket!.position).toBe(0);
    });

    it('should set error on updateTicketFailure', () => {
      const state = boardReducer(initial, BoardActions.updateTicketFailure({ error: 'Update failed' }));
      expect(state.error).toBe('Update failed');
    });
  });

  describe('deleteTicket', () => {
    it('should clear error on deleteTicket', () => {
      const state = boardReducer(
        { ...initial, error: 'prev' },
        BoardActions.deleteTicket({ id: 't-1' }),
      );
      expect(state.error).toBeNull();
    });

    it('should remove the ticket on deleteTicketSuccess', () => {
      const state = boardReducer(initial, BoardActions.deleteTicketSuccess({ id: 't-1' }));
      expect(state.tickets).toHaveLength(1);
      expect(state.tickets[0].id).toBe('t-2');
    });

    it('should set error on deleteTicketFailure', () => {
      const state = boardReducer(initial, BoardActions.deleteTicketFailure({ error: 'Delete failed' }));
      expect(state.error).toBe('Delete failed');
    });
  });
});
