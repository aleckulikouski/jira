import { createActionGroup, props } from '@ngrx/store';
import { BoardColumn, Ticket } from '@org/shared-types';

export const BoardActions = createActionGroup({
  source: 'Board',
  events: {
    'Load Columns': props<{ projectId: string }>(),
    'Load Columns Success': props<{ columns: BoardColumn[] }>(),
    'Load Columns Failure': props<{ error: string }>(),

    'Add Column': props<{ projectId: string; name: string }>(),
    'Add Column Success': props<{ column: BoardColumn }>(),
    'Add Column Failure': props<{ error: string }>(),

    'Update Column': props<{ id: string; data: { name?: string; order?: number } }>(),
    'Update Column Success': props<{ column: BoardColumn }>(),
    'Update Column Failure': props<{ error: string }>(),

    'Delete Column': props<{ id: string }>(),
    'Delete Column Success': props<{ id: string }>(),
    'Delete Column Failure': props<{ error: string }>(),

    'Load Tickets': props<{ columnId: string }>(),
    'Load Tickets Success': props<{ columnId: string; tickets: Ticket[] }>(),
    'Load Tickets Failure': props<{ error: string }>(),

    'Add Ticket': props<{ columnId: string; title: string; description?: string; tempId: string }>(),
    'Add Ticket Success': props<{ ticket: Ticket; tempId: string }>(),
    'Add Ticket Failure': props<{ tempId: string; error: string }>(),

    'Update Ticket': props<{ id: string; data: { title?: string; description?: string; columnId?: string } }>(),
    'Update Ticket Success': props<{ ticket: Ticket }>(),
    'Update Ticket Failure': props<{ error: string }>(),

    'Delete Ticket': props<{ id: string }>(),
    'Delete Ticket Success': props<{ id: string }>(),
    'Delete Ticket Failure': props<{ error: string }>(),

    'Move Ticket': props<{ id: string; columnId: string; position: number; previous: Ticket }>(),
    'Move Ticket Success': props<{ ticket: Ticket }>(),
    'Move Ticket Failure': props<{ ticket: Ticket; error: string }>(),

    'Show Error': props<{ message: string }>(),
  },
});
