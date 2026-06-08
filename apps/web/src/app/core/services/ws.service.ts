import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { io, Socket } from 'socket.io-client';
import { TokenStorage } from '../tokens/token-storage';
import { BoardActions } from '../store/board/board.actions';
import type { Ticket, BoardColumn, ServerToClientEvents, ClientToServerEvents } from '@org/shared-types';

@Injectable({ providedIn: 'root' })
export class WsService {
  private readonly tokenStorage = inject(TokenStorage);
  private readonly store = inject(Store);

  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private currentProjectId: string | null = null;

  /** Buffered events before board is loaded — flushed on setBoardLoaded() */
  private pendingEvents: Array<() => void> = [];
  private boardLoaded = false;

  constructor() {
    const token = this.tokenStorage.get();
    if (token) {
      this.connect(token);
    }
  }

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io('http://localhost:3000', {
      auth: { token },
      autoConnect: true,
    });

    this.registerEvents();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentProjectId = null;
    this.boardLoaded = false;
    this.pendingEvents = [];
  }

  /**
   * Switch the active project room. Leaves previous room (if any)
   * and joins the new one. Safe to call before connect — the join
   * is deferred until the socket connects.
   */
  setCurrentProject(projectId: string): void {
    if (this.currentProjectId === projectId) return;

    if (this.currentProjectId && this.socket?.connected) {
      this.socket.emit('leave', { projectId: this.currentProjectId });
    }

    this.currentProjectId = projectId;

    if (this.socket?.connected) {
      this.socket.emit('join', { projectId });
    }
  }

  /** Mark the board as loaded — flushes any buffered incoming events. */
  setBoardLoaded(): void {
    this.boardLoaded = true;
    const pending = this.pendingEvents;
    this.pendingEvents = [];
    for (const fn of pending) {
      fn();
    }
  }

  private registerEvents(): void {
    const socket = this.socket!;

    // ── Reconnect handling ──────────────────────────────────────
    socket.on('connect', () => {
      // Re-join the current project room
      if (this.currentProjectId) {
        socket.emit('join', { projectId: this.currentProjectId });
      }
      // Refetch full board to correct any missed events
      if (this.currentProjectId) {
        this.store.dispatch(BoardActions.loadBoard({ projectId: this.currentProjectId }));
      }
    });

    // ── Column events ───────────────────────────────────────────
    socket.on('column:created', (column: BoardColumn) => {
      this.gate(() => this.store.dispatch(BoardActions.columnCreatedExternally({ column })));
    });

    socket.on('column:updated', (column: BoardColumn) => {
      this.gate(() => this.store.dispatch(BoardActions.updateColumnSuccess({ column })));
    });

    socket.on('column:deleted', (data: { id: string }) => {
      this.gate(() => this.store.dispatch(BoardActions.deleteColumnSuccess({ id: data.id })));
    });

    // ── Ticket events ───────────────────────────────────────────
    socket.on('ticket:created', (ticket: Ticket) => {
      this.gate(() => this.store.dispatch(BoardActions.ticketCreatedExternally({ ticket })));
    });

    socket.on('ticket:updated', (ticket: Ticket) => {
      // updateTicketSuccess handles both same-column updates and column moves
      this.gate(() => this.store.dispatch(BoardActions.updateTicketSuccess({ ticket })));
    });

    socket.on('ticket:deleted', (data: { id: string }) => {
      this.gate(() => this.store.dispatch(BoardActions.deleteTicketSuccess({ id: data.id })));
    });

    // ── Reorder (external-only action — no server round-trip) ───
    socket.on('columns:reordered', (data: { projectId: string; orderedIds: string[] }) => {
      this.gate(() =>
        this.store.dispatch(BoardActions.columnsReorderedExternally({ orderedIds: data.orderedIds })),
      );
    });

    // ── Error logging for troubleshooting ──────────────────────
    socket.on('connect_error', (err) => {
      console.error('[WsService] connect_error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[WsService] disconnect:', reason);
    });
  }

  /** Buffer the action if the board is not yet loaded, otherwise execute immediately. */
  private gate(fn: () => void): void {
    if (this.boardLoaded) {
      fn();
    } else {
      this.pendingEvents.push(fn);
    }
  }
}
