import type { BoardColumn, Ticket } from '@org/shared-types';

export interface BroadcastEvent {
  event: string;
  projectId: string;
  payload: unknown;
}

export interface ColumnCreatedEvent extends BroadcastEvent {
  event: 'column:created';
  projectId: string;
  payload: BoardColumn;
}

export interface ColumnUpdatedEvent extends BroadcastEvent {
  event: 'column:updated';
  projectId: string;
  payload: BoardColumn;
}

export interface ColumnDeletedEvent extends BroadcastEvent {
  event: 'column:deleted';
  projectId: string;
  payload: { id: string };
}

export interface ColumnsReorderedEvent extends BroadcastEvent {
  event: 'columns:reordered';
  projectId: string;
  payload: { projectId: string; orderedIds: string[] };
}

export interface TicketCreatedEvent extends BroadcastEvent {
  event: 'ticket:created';
  projectId: string;
  payload: Ticket;
}

export interface TicketUpdatedEvent extends BroadcastEvent {
  event: 'ticket:updated';
  projectId: string;
  payload: Ticket;
}

export interface TicketDeletedEvent extends BroadcastEvent {
  event: 'ticket:deleted';
  projectId: string;
  payload: { id: string };
}
