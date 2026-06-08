import { describe, it, expect, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { WsService } from './ws.service';
import { TokenStorage } from '../tokens/token-storage';
import { BoardActions } from '../store/board/board.actions';

interface MockSocket {
  on: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  connected: boolean;
  listeners: Map<string, Array<(...args: unknown[]) => void>>;
}

function makeMockSocket(): MockSocket {
  const listeners = new Map<string, Array<(...args: unknown[]) => void>>();

  const on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
    const existing = listeners.get(event) || [];
    existing.push(handler);
    listeners.set(event, existing);
  });

  return {
    on,
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
    listeners,
  };
}

let mockSocket: MockSocket;

/** Captured io() calls so tests can inspect auth parameters */
let ioCallArgs: unknown[][] = [];

vi.mock('socket.io-client', () => ({
  io: vi.fn((...args: unknown[]) => {
    ioCallArgs.push(args);
    return mockSocket;
  }),
}));

function makeTokenStorage(token: string | null = null) {
  return {
    get: vi.fn().mockReturnValue(token),
    set: vi.fn(),
    remove: vi.fn(),
  };
}

describe('WsService', () => {
  let service: WsService;
  let tokenStorage: ReturnType<typeof makeTokenStorage>;
  let dispatch: ReturnType<typeof vi.fn>;

  function createService(token: string | null = null) {
    mockSocket = makeMockSocket();
    tokenStorage = makeTokenStorage(token);
    dispatch = vi.fn();
    ioCallArgs = [];

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        WsService,
        { provide: TokenStorage, useValue: tokenStorage },
        { provide: Store, useValue: { dispatch, select: vi.fn() } },
      ],
    });

    service = TestBed.inject(WsService);
  }

  afterEach(() => {
    try {
      service?.disconnect();
    } catch {
      // already cleaned up
    }
  });

  // ── Connection lifecycle ───────────────────────────────────

  describe('constructor', () => {
    it('connects immediately when a stored token exists', () => {
      createService('existing-token');

      expect(mockSocket.on).toHaveBeenCalled();
      expect(tokenStorage.get).toHaveBeenCalled();
    });

    it('does NOT connect when no stored token exists', () => {
      createService(null);

      expect(ioCallArgs).toHaveLength(0);
    });
  });

  describe('connect(token)', () => {
    it('creates socket with auth token and registers events', () => {
      createService(null);
      service.connect('my-token');

      expect(ioCallArgs).toHaveLength(1);
      expect(ioCallArgs[0][0]).toBe('http://localhost:3000');
      expect(ioCallArgs[0][1]).toEqual({ auth: { token: 'my-token' }, autoConnect: true });
      expect(mockSocket.on).toHaveBeenCalled();
    });

    it('is a no-op when already connected', () => {
      createService('token');
      const callCount = mockSocket.on.mock.calls.length;

      service.connect('token');
      expect(mockSocket.on.mock.calls.length).toBe(callCount);
    });
  });

  describe('disconnect()', () => {
    it('calls socket.disconnect and clears state', () => {
      createService('token');
      service.setCurrentProject('p-1');
      service.setBoardLoaded();

      service.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      mockSocket.emit.mockClear();
      service.setCurrentProject('p-2');
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  // ── Room management ────────────────────────────────────────

  describe('setCurrentProject(projectId)', () => {
    it('joins the project room', () => {
      createService('token');
      service.setCurrentProject('p-1');

      expect(mockSocket.emit).toHaveBeenCalledWith('join', { projectId: 'p-1' });
    });

    it('leaves previous room and joins new one when switching projects', () => {
      createService('token');
      service.setCurrentProject('p-1');
      service.setCurrentProject('p-2');

      expect(mockSocket.emit).toHaveBeenCalledWith('leave', { projectId: 'p-1' });
      expect(mockSocket.emit).toHaveBeenCalledWith('join', { projectId: 'p-2' });
    });

    it('is a no-op when setting the same project', () => {
      createService('token');
      service.setCurrentProject('p-1');
      const emitCount = mockSocket.emit.mock.calls.length;

      service.setCurrentProject('p-1');

      expect(mockSocket.emit.mock.calls.length).toBe(emitCount);
    });
  });

  // ── Board-loaded gating ────────────────────────────────────

  describe('setBoardLoaded()', () => {
    it('flushes buffered events', () => {
      createService('token');
      service.setCurrentProject('p-1');

      const handler = mockSocket.listeners.get('ticket:created')?.[0];
      expect(handler).toBeDefined();

      handler!({
        id: 't-ext',
        columnId: 'c-1',
        assigneeId: null,
        title: 'External',
        description: '',
        position: 500,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      });

      expect(dispatch).not.toHaveBeenCalled();

      service.setBoardLoaded();

      expect(dispatch).toHaveBeenCalledWith(
        BoardActions.ticketCreatedExternally({
          ticket: expect.objectContaining({ id: 't-ext' }),
        }),
      );
    });

    it('dispatches immediately when board is already loaded', () => {
      createService('token');
      service.setCurrentProject('p-1');
      service.setBoardLoaded();

      const handler = mockSocket.listeners.get('ticket:created')?.[0];
      handler!({
        id: 't-instant',
        columnId: 'c-1',
        assigneeId: null,
        title: 'Instant',
        description: '',
        position: 500,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      });

      expect(dispatch).toHaveBeenCalledWith(
        BoardActions.ticketCreatedExternally({
          ticket: expect.objectContaining({ id: 't-instant' }),
        }),
      );
    });
  });

  // ── Event-to-action mapping ────────────────────────────────

  function fireEvent(event: string, ...args: unknown[]) {
    createService('token');
    service.setCurrentProject('p-1');
    service.setBoardLoaded();
    dispatch.mockClear();

    const handler = mockSocket.listeners.get(event)?.[0];
    handler?.(...args);
  }

  describe('column:created', () => {
    it('dispatches columnCreatedExternally', () => {
      const col = { id: 'c-1', projectId: 'p-1', name: 'To Do', order: 0, createdAt: '', updatedAt: '' };
      fireEvent('column:created', col);

      expect(dispatch).toHaveBeenCalledWith(BoardActions.columnCreatedExternally({ column: col }));
    });
  });

  describe('column:updated', () => {
    it('dispatches updateColumnSuccess', () => {
      const col = { id: 'c-1', projectId: 'p-1', name: 'Renamed', order: 0, createdAt: '', updatedAt: '' };
      fireEvent('column:updated', col);

      expect(dispatch).toHaveBeenCalledWith(BoardActions.updateColumnSuccess({ column: col }));
    });
  });

  describe('column:deleted', () => {
    it('dispatches deleteColumnSuccess', () => {
      fireEvent('column:deleted', { id: 'c-1' });

      expect(dispatch).toHaveBeenCalledWith(BoardActions.deleteColumnSuccess({ id: 'c-1' }));
    });
  });

  describe('ticket:created', () => {
    it('dispatches ticketCreatedExternally', () => {
      const ticket = { id: 't-1', columnId: 'c-1', assigneeId: null, title: 'New', description: '', position: 1000, createdAt: '', updatedAt: '' };
      fireEvent('ticket:created', ticket);

      expect(dispatch).toHaveBeenCalledWith(BoardActions.ticketCreatedExternally({ ticket }));
    });
  });

  describe('ticket:updated', () => {
    it('dispatches updateTicketSuccess', () => {
      const ticket = { id: 't-1', columnId: 'c-1', assigneeId: null, title: 'Updated', description: '', position: 1000, createdAt: '', updatedAt: '' };
      fireEvent('ticket:updated', ticket);

      expect(dispatch).toHaveBeenCalledWith(BoardActions.updateTicketSuccess({ ticket }));
    });
  });

  describe('ticket:deleted', () => {
    it('dispatches deleteTicketSuccess', () => {
      fireEvent('ticket:deleted', { id: 't-1' });

      expect(dispatch).toHaveBeenCalledWith(BoardActions.deleteTicketSuccess({ id: 't-1' }));
    });
  });

  describe('columns:reordered', () => {
    it('dispatches columnsReorderedExternally, not reorderColumns', () => {
      const data = { projectId: 'p-1', orderedIds: ['c-2', 'c-1', 'c-3'] };
      fireEvent('columns:reordered', data);

      expect(dispatch).toHaveBeenCalledWith(
        BoardActions.columnsReorderedExternally({ orderedIds: ['c-2', 'c-1', 'c-3'] }),
      );
    });
  });

  // ── Reconnect ──────────────────────────────────────────────

  describe('reconnect', () => {
    it('re-joins the current project room and refetches board', () => {
      createService('token');
      service.setCurrentProject('p-1');
      service.setBoardLoaded();

      dispatch.mockClear();
      mockSocket.emit.mockClear();

      const handler = mockSocket.listeners.get('connect')?.[0];
      handler?.();

      expect(mockSocket.emit).toHaveBeenCalledWith('join', { projectId: 'p-1' });
      expect(dispatch).toHaveBeenCalledWith(BoardActions.loadBoard({ projectId: 'p-1' }));
    });
  });

  // ── Error logging ──────────────────────────────────────────

  describe('error logging', () => {
    it('subscribes to connect_error', () => {
      createService('token');
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });
  });
});
