import type { BoardColumn, Ticket } from '../index.js';

export interface ServerToClientEvents {
  'column:created': (column: BoardColumn) => void;
  'column:updated': (column: BoardColumn) => void;
  'column:deleted': (data: { id: string }) => void;
  'ticket:created': (ticket: Ticket) => void;
  'ticket:updated': (ticket: Ticket) => void;
  'ticket:deleted': (data: { id: string }) => void;
  'columns:reordered': (data: { projectId: string; orderedIds: string[] }) => void;
}

export interface ClientToServerEvents {
  join: (data: { projectId: string }) => void;
  leave: (data: { projectId: string }) => void;
}
