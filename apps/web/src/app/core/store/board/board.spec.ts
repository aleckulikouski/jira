import { describe, it, expect } from 'vitest';
import { BoardActions } from './board.actions';
import { UserActions } from '../user/user.actions';
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
  tickets: [],
  ...overrides,
});

describe('Board Actions', () => {
  it('should create loadBoard action', () => {
    const action = BoardActions.loadBoard({ projectId: 'p-1' });
    expect(action.projectId).toBe('p-1');
  });

  it('should create loadBoardSuccess action', () => {
    const columns = [makeColumn()];
    const action = BoardActions.loadBoardSuccess({ columns });
    expect(action.columns).toBe(columns);
  });

  it('should create loadBoardFailure action', () => {
    const action = BoardActions.loadBoardFailure({ error: 'oops' });
    expect(action.error).toBe('oops');
  });

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

describe('Board Reducer - Board load', () => {
  it('should return initial state', () => {
    const state = boardReducer(undefined, { type: '@@INIT' } as any);
    expect(state.columns).toEqual([]);
    expect(state.loading).toBe(false);
  });

  it('should set loading true on loadBoard', () => {
    const state = boardReducer(undefined, BoardActions.loadBoard({ projectId: 'p-1' }));
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should populate columns on loadBoardSuccess', () => {
    const columns = [
      makeColumn({ id: 'c-1', tickets: [makeTicket()] }),
      makeColumn({ id: 'c-2', tickets: [] }),
    ];
    const state = boardReducer(undefined, BoardActions.loadBoardSuccess({ columns }));
    expect(state.columns).toHaveLength(2);
    expect(state.columns[0].tickets).toHaveLength(1);
    expect(state.columns[1].tickets).toHaveLength(0);
    expect(state.loading).toBe(false);
  });

  it('should set error on loadBoardFailure', () => {
    const state = boardReducer(undefined, BoardActions.loadBoardFailure({ error: 'Failed' }));
    expect(state.error).toBe('Failed');
    expect(state.loading).toBe(false);
  });
});

describe('Board Reducer - Tickets (nested)', () => {
  const initial: BoardState = {
    columns: [
      makeColumn({ id: 'c-1', tickets: [makeTicket(), makeTicket({ id: 't-2', title: 'Second' })] }),
    ],
    loading: false,
    error: null,
    previousOrderedIds: null,
  };

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
      expect(state.columns[0].tickets).toHaveLength(2);
      const t = state.columns[0].tickets!.find((t) => t.id === 't-1');
      expect(t).toEqual(updated);
    });

    it('should move ticket across columns on updateTicketSuccess when columnId changes', () => {
      const initialMulti: BoardState = {
        columns: [
          makeColumn({ id: 'c-1', tickets: [makeTicket({ id: 't-1' })] }),
          makeColumn({ id: 'c-2', tickets: [] }),
        ],
        loading: false,
        error: null,
        previousOrderedIds: null,
      };

      const updated = makeTicket({ id: 't-1', columnId: 'c-2', position: 0 });
      const state = boardReducer(initialMulti, BoardActions.updateTicketSuccess({ ticket: updated }));

      expect(state.columns[0].tickets).toHaveLength(0);
      expect(state.columns[1].tickets).toHaveLength(1);
      expect(state.columns[1].tickets![0].id).toBe('t-1');
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
      expect(state.columns[0].tickets).toHaveLength(1);
      expect(state.columns[0].tickets![0].id).toBe('t-2');
    });
  });

  describe('moveTicket', () => {
    it('should clear error and update ticket position/column optimistically', () => {
      const state = boardReducer(
        { ...initial, error: 'prev' },
        BoardActions.moveTicket({ id: 't-1', columnId: 'c-2', position: 5, previous: makeTicket() }),
      );
      expect(state.error).toBeNull();
      // ticket should be removed from c-1
      const col1 = state.columns.find((c) => c.id === 'c-1')!;
      expect(col1.tickets!.find((t) => t.id === 't-1')).toBeUndefined();
    });

    it('should position-insert ticket within same column', () => {
      // Column with tickets at positions 0, 1000, 2000
      const cols = [makeColumn({
        id: 'c-1',
        tickets: [
          makeTicket({ id: 'a', position: 0 }),
          makeTicket({ id: 'b', position: 1000 }),
          makeTicket({ id: 'c', position: 2000 }),
        ],
      })];
      const s: BoardState = { columns: cols, loading: false, error: null, previousOrderedIds: null };
      const previous = makeTicket({ id: 'c', columnId: 'c-1', position: 2000 });

      const state = boardReducer(s, BoardActions.moveTicket({ id: 'c', columnId: 'c-1', position: 500, previous }));

      const tickets = state.columns[0].tickets!;
      expect(tickets.map((t) => t.id)).toEqual(['a', 'c', 'b']);
      expect(tickets.find((t) => t.id === 'c')!.position).toBe(500);
    });

    it('should position-insert when moving to a different column', () => {
      const a = makeColumn({ id: 'A', tickets: [makeTicket({ id: 'x', position: 0 })] });
      const b = makeColumn({ id: 'B', tickets: [
        makeTicket({ id: 'y', position: 0 }),
        makeTicket({ id: 'z', position: 1000 }),
      ]});
      const s: BoardState = { columns: [a, b], loading: false, error: null, previousOrderedIds: null };
      const previous = makeTicket({ id: 'x', columnId: 'A', position: 0 });

      const state = boardReducer(s, BoardActions.moveTicket({ id: 'x', columnId: 'B', position: 500, previous }));

      // x should be removed from A
      expect(state.columns[0].tickets).toHaveLength(0);
      // x should be inserted between y and z in B
      expect(state.columns[1].tickets!.map((t) => t.id)).toEqual(['y', 'x', 'z']);
    });

    it('should place ticket at the top when moving to position 0', () => {
      const cols = [makeColumn({
        id: 'c-1',
        tickets: [
          makeTicket({ id: 'a', position: 0 }),
          makeTicket({ id: 'b', position: 1000 }),
        ],
      })];
      const s: BoardState = { columns: cols, loading: false, error: null, previousOrderedIds: null };
      const previous = makeTicket({ id: 'b', columnId: 'c-1', position: 1000 });

      const state = boardReducer(s, BoardActions.moveTicket({ id: 'b', columnId: 'c-1', position: 0, previous }));

      // b should now be first, before a
      expect(state.columns[0].tickets!.map((t) => t.id)).toEqual(['b', 'a']);
      expect(state.columns[0].tickets!.find((t) => t.id === 'b')!.position).toBe(0);
      expect(state.columns[0].tickets!.find((t) => t.id === 'a')!.position).toBe(0);
    });

    it('should produce correct final state through full drag-drop flow with socket race', () => {
      // Simulate: user drags ticket from A to B, socket event arrives before HTTP response
      const a = makeColumn({ id: 'A', tickets: [makeTicket({ id: 'x', position: 0 })] });
      const b = makeColumn({ id: 'B', tickets: [
        makeTicket({ id: 'y', position: 0 }),
        makeTicket({ id: 'z', position: 1000 }),
      ]});
      const s: BoardState = { columns: [a, b], loading: false, error: null, previousOrderedIds: null };
      const previous = makeTicket({ id: 'x', columnId: 'A', position: 0 });

      // 1. Optimistic move
      let state = boardReducer(s, BoardActions.moveTicket({ id: 'x', columnId: 'B', position: 500, previous }));

      // 2. Socket event fires (arrives before HTTP)
      const serverTicket = makeTicket({ id: 'x', columnId: 'B', position: 500 });
      state = boardReducer(state, BoardActions.updateTicketSuccess({ ticket: serverTicket }));

      // 3. HTTP response arrives
      state = boardReducer(state, BoardActions.moveTicketSuccess({ ticket: serverTicket }));

      // Final: ticket x should be in column B, between y and z
      expect(state.columns[0].tickets).toHaveLength(0);
      expect(state.columns[1].tickets!.map((t) => t.id)).toEqual(['y', 'x', 'z']);
      expect(state.columns[1].tickets!.find((t) => t.id === 'x')!.position).toBe(500);
    });

    it('should replace ticket with server data on moveTicketSuccess', () => {
      const serverTicket = makeTicket({ id: 't-1', columnId: 'c-2', position: 3, title: 'Server Title' });
      const state = boardReducer(initial, BoardActions.moveTicketSuccess({ ticket: serverTicket }));
      const col1 = state.columns.find((c) => c.id === 'c-1')!;
      const moved = col1.tickets!.find((t) => t.id === 't-1');
      expect(moved!.columnId).toBe('c-2');
    });

    it('should roll back ticket and set error on moveTicketFailure', () => {
      const previous = makeTicket({ id: 't-1', columnId: 'c-1', position: 0 });
      let state = boardReducer(
        initial,
        BoardActions.moveTicket({ id: 't-1', columnId: 'c-2', position: 5, previous }),
      );
      state = boardReducer(state, BoardActions.moveTicketFailure({ ticket: previous, error: 'Move failed' }));
      const col1 = state.columns.find((c) => c.id === 'c-1')!;
      const rolledBack = col1.tickets!.find((t) => t.id === 't-1');
      expect(rolledBack!.columnId).toBe('c-1');
      expect(rolledBack!.position).toBe(0);
      expect(state.error).toBe('Move failed');
    });
  });

  describe('addTicket', () => {
    it('should add optimistic ticket to the column', () => {
      const state = boardReducer(
        initial,
        BoardActions.addTicket({ columnId: 'c-1', title: 'New Ticket', tempId: 'temp-1' }),
      );
      const col = state.columns.find((c) => c.id === 'c-1')!;
      const added = col.tickets!.find((t) => t.id === 'temp-1');
      expect(added).toBeDefined();
      expect(added!.title).toBe('New Ticket');
      expect(added!.position).toBe(999999);
    });

    it('should swap temp ticket with server ticket on addTicketSuccess', () => {
      const serverTicket = makeTicket({ id: 'real-1', columnId: 'c-1', title: 'New Ticket' });
      let state = boardReducer(
        initial,
        BoardActions.addTicket({ columnId: 'c-1', title: 'New Ticket', tempId: 'temp-1' }),
      );
      state = boardReducer(state, BoardActions.addTicketSuccess({ ticket: serverTicket, tempId: 'temp-1' }));
      const col = state.columns.find((c) => c.id === 'c-1')!;
      expect(col.tickets!.find((t) => t.id === 'temp-1')).toBeUndefined();
      expect(col.tickets!.find((t) => t.id === 'real-1')).toBeDefined();
    });

    it('should remove temp ticket on addTicketFailure', () => {
      let state = boardReducer(
        initial,
        BoardActions.addTicket({ columnId: 'c-1', title: 'New Ticket', tempId: 'temp-1' }),
      );
      state = boardReducer(state, BoardActions.addTicketFailure({ tempId: 'temp-1', error: 'Server error' }));
      const col = state.columns.find((c) => c.id === 'c-1')!;
      expect(col.tickets!.find((t) => t.id === 'temp-1')).toBeUndefined();
    });
  });

  describe('addColumn', () => {
    it('should clear error on addColumn', () => {
      const state = boardReducer(
        { ...initial, error: 'previous error' },
        BoardActions.addColumn({ projectId: 'p-1', name: 'New' }),
      );
      expect(state.error).toBeNull();
    });

    it('should append single column on addColumnSuccess sorted by order', () => {
      const newColumn = makeColumn({ id: 'c-new', name: 'New', order: 1, tickets: [] });
      const state = boardReducer(initial, BoardActions.addColumnSuccess({ column: newColumn }));
      expect(state.columns).toHaveLength(2);
      expect(state.columns[1].id).toBe('c-new');
      expect(state.columns[1].tickets).toEqual([]);
    });

    it('should set error on addColumnFailure', () => {
      const state = boardReducer(initial, BoardActions.addColumnFailure({ error: 'Server error' }));
      expect(state.error).toBe('Server error');
    });
  });

  describe('reorderColumns', () => {
    const columns = [
      makeColumn({ id: 'c-1', name: 'First', order: 0, tickets: [makeTicket()] }),
      makeColumn({ id: 'c-2', name: 'Second', order: 1, tickets: [] }),
      makeColumn({ id: 'c-3', name: 'Third', order: 2, tickets: [] }),
    ];
    const stateWithCols: BoardState = {
      columns,
      loading: false,
      error: null,
      previousOrderedIds: null,
    };

    it('should optimistically reorder columns and store previous order', () => {
      const state = boardReducer(
        stateWithCols,
        BoardActions.reorderColumns({
          projectId: 'p-1',
          orderedIds: ['c-3', 'c-1', 'c-2'],
          previousOrderedIds: ['c-1', 'c-2', 'c-3'],
        }),
      );
      expect(state.columns.map((c) => c.id)).toEqual(['c-3', 'c-1', 'c-2']);
      expect(state.previousOrderedIds).toEqual(['c-1', 'c-2', 'c-3']);
    });

    it('should roll back to previous order on failure', () => {
      let state = boardReducer(
        stateWithCols,
        BoardActions.reorderColumns({
          projectId: 'p-1',
          orderedIds: ['c-3', 'c-1', 'c-2'],
          previousOrderedIds: ['c-1', 'c-2', 'c-3'],
        }),
      );
      state = boardReducer(
        state,
        BoardActions.reorderColumnsFailure({
          previousOrderedIds: ['c-1', 'c-2', 'c-3'],
          error: 'Server error',
        }),
      );
      expect(state.columns.map((c) => c.id)).toEqual(['c-1', 'c-2', 'c-3']);
      expect(state.error).toBe('Server error');
    });
  });

  describe('logout', () => {
    it('should reset board state on logout', () => {
      const populated: BoardState = {
        columns: [makeColumn({ tickets: [makeTicket()] })],
        loading: false,
        error: null,
        previousOrderedIds: null,
      };
      const state = boardReducer(populated, UserActions.logout());
      expect(state.columns).toEqual([]);
    });
  });

  describe('ticketCreatedExternally', () => {
    const threeCols = [makeColumn({ id: 'c-1', tickets: [makeTicket(), makeTicket({ id: 't-2', position: 1 })] }), makeColumn({ id: 'c-2', tickets: [] }), makeColumn({ id: 'c-3', tickets: [] })];
    const state: BoardState = { columns: threeCols, loading: false, error: null, previousOrderedIds: null };

    it('should append the ticket to the target column', () => {
      const s = boardReducer(
        state,
        BoardActions.ticketCreatedExternally({
          ticket: makeTicket({ id: 't-ext', title: 'External', columnId: 'c-1' }),
        }),
      );
      const col = s.columns.find((c) => c.id === 'c-1')!;
      expect(col.tickets).toHaveLength(3);
      expect(col.tickets!.find((t) => t.id === 't-ext')).toBeDefined();
    });

    it('should skip when ticket ID already exists (self-sender dedup)', () => {
      const s = boardReducer(
        state,
        BoardActions.ticketCreatedExternally({
          ticket: makeTicket({ id: 't-1', title: 'Duplicate' }),
        }),
      );
      expect(s).toBe(state);
    });

    it('should skip when target column does not exist', () => {
      const s = boardReducer(
        { columns: [], loading: false, error: null, previousOrderedIds: null },
        BoardActions.ticketCreatedExternally({
          ticket: makeTicket({ id: 't-ghost', columnId: 'no-such-col' }),
        }),
      );
      expect(s.columns).toHaveLength(0);
    });
  });

  describe('columnCreatedExternally', () => {
    const threeCols = [makeColumn({ id: 'c-1' }), makeColumn({ id: 'c-2', order: 1 }), makeColumn({ id: 'c-3', order: 2 })];
    const state: BoardState = { columns: threeCols, loading: false, error: null, previousOrderedIds: null };

    it('should append the column and sort by order', () => {
      const s = boardReducer(
        state,
        BoardActions.columnCreatedExternally({
          column: makeColumn({ id: 'c-4', name: 'External', order: 5 }),
        }),
      );
      expect(s.columns).toHaveLength(4);
      expect(s.columns.find((c) => c.id === 'c-4')).toBeDefined();
      expect(s.columns.map((c) => c.id)).toEqual(['c-1', 'c-2', 'c-3', 'c-4']);
    });

    it('should skip when column ID already exists (self-sender dedup)', () => {
      const s = boardReducer(
        state,
        BoardActions.columnCreatedExternally({
          column: makeColumn({ id: 'c-1', name: 'Duplicate' }),
        }),
      );
      expect(s).toBe(state);
    });
  });

  describe('columnsReorderedExternally', () => {
    const threeCols = [makeColumn({ id: 'c-1', order: 0 }), makeColumn({ id: 'c-2', order: 1 }), makeColumn({ id: 'c-3', order: 2 })];
    const state: BoardState = { columns: threeCols, loading: false, error: null, previousOrderedIds: null };

    it('should reorder columns by orderedIds', () => {
      const s = boardReducer(
        state,
        BoardActions.columnsReorderedExternally({
          orderedIds: ['c-3', 'c-1', 'c-2'],
        }),
      );
      expect(s.columns.map((c) => c.id)).toEqual(['c-3', 'c-1', 'c-2']);
      expect(s.columns.find((c) => c.id === 'c-3')!.order).toBe(0);
      expect(s.columns.find((c) => c.id === 'c-1')!.order).toBe(1);
      expect(s.columns.find((c) => c.id === 'c-2')!.order).toBe(2);
    });

    it('should leave previousOrderedIds null (no effect trigger)', () => {
      const s = boardReducer(
        state,
        BoardActions.columnsReorderedExternally({
          orderedIds: ['c-2', 'c-1', 'c-3'],
        }),
      );
      expect(s.previousOrderedIds).toBeNull();
    });
  });
});
