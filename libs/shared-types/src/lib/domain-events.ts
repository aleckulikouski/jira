import type { BoardColumn, Ticket } from '../index.js';

export interface ColumnCreatedPayload {
  projectId: string;
  column: BoardColumn;
}

export interface ColumnUpdatedPayload {
  projectId: string;
  column: BoardColumn;
}

export interface ColumnDeletedPayload {
  projectId: string;
  columnId: string;
}

export interface TicketCreatedPayload {
  projectId: string;
  ticket: Ticket;
}

export interface TicketUpdatedPayload {
  projectId: string;
  ticket: Ticket;
}

export interface TicketDeletedPayload {
  projectId: string;
  ticketId: string;
}

export interface ColumnsReorderedPayload {
  projectId: string;
  orderedIds: string[];
}

export interface DomainEvents {
  'column.created': ColumnCreatedPayload;
  'column.updated': ColumnUpdatedPayload;
  'column.deleted': ColumnDeletedPayload;
  'ticket.created': TicketCreatedPayload;
  'ticket.updated': TicketUpdatedPayload;
  'ticket.deleted': TicketDeletedPayload;
  'columns.reordered': ColumnsReorderedPayload;
}
