import { createActionGroup, props } from '@ngrx/store';
import { BoardColumn } from '@org/shared-types';

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
  },
});
