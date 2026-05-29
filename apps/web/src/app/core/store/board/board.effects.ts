import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { BoardService } from '../../services/board.service';
import { BoardActions } from './board.actions';

export const loadColumns$ = createEffect(
  (actions$ = inject(Actions), boardService = inject(BoardService)) =>
    actions$.pipe(
      ofType(BoardActions.loadColumns),
      switchMap(({ projectId }) =>
        boardService.getColumns(projectId).pipe(
          map((columns) => BoardActions.loadColumnsSuccess({ columns })),
          catchError((err) =>
            of(BoardActions.loadColumnsFailure({ error: err.error?.message ?? 'Failed to load columns' })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const addColumn$ = createEffect(
  (actions$ = inject(Actions), boardService = inject(BoardService)) =>
    actions$.pipe(
      ofType(BoardActions.addColumn),
      switchMap(({ projectId, name }) =>
        boardService.createColumn(projectId, name).pipe(
          map((column) => BoardActions.addColumnSuccess({ column })),
          catchError((err) =>
            of(BoardActions.addColumnFailure({ error: err.error?.message ?? 'Failed to add column' })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const updateColumn$ = createEffect(
  (actions$ = inject(Actions), boardService = inject(BoardService)) =>
    actions$.pipe(
      ofType(BoardActions.updateColumn),
      switchMap(({ id, data }) =>
        boardService.updateColumn(id, data).pipe(
          map((column) => BoardActions.updateColumnSuccess({ column })),
          catchError((err) =>
            of(BoardActions.updateColumnFailure({ error: err.error?.message ?? 'Failed to update column' })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const deleteColumn$ = createEffect(
  (actions$ = inject(Actions), boardService = inject(BoardService)) =>
    actions$.pipe(
      ofType(BoardActions.deleteColumn),
      switchMap(({ id }) =>
        boardService.deleteColumn(id).pipe(
          map(() => BoardActions.deleteColumnSuccess({ id })),
          catchError((err) =>
            of(BoardActions.deleteColumnFailure({ error: err.error?.message ?? 'Failed to delete column' })),
          ),
        ),
      ),
    ),
  { functional: true },
);
