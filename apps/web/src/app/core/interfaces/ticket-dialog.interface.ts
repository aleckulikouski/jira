import type { BoardColumn, Ticket } from '@org/shared-types';

/** Data passed to the ticket create/edit dialog */
export interface TicketDialogData {
  columns: BoardColumn[];
  ticket?: Ticket;
  selectedColumnId: string;
}

/** Result returned when the ticket dialog closes */
export interface TicketDialogResult {
  action: 'save' | 'delete';
  columnId?: string;
  title?: string;
  description?: string;
}
