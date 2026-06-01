import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, mergeMap, of, switchMap, tap } from 'rxjs';
import { BoardService } from '../../services/board.service';
import { BoardActions } from './board.actions';

export const loadColumns$ = createEffect(
  (actions$ = inject(Actions), boardService = inject(BoardService)) =>
    actions$.pipe(
      ofType(BoardActions.loadColumns),
      switchMap(({ projectId }) =>
        boardService.getColumns(projectId).pipe(
          map((columns) => BoardActions.loadColumnsSuccess({ columns })),
          catchError((err) => {
            const msg = err.error?.message ?? 'Failed to load columns';
            return of(BoardActions.loadColumnsFailure({ error: msg }), BoardActions.showError({ message: msg }));
          }),
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
          catchError((err) => {
            const msg = err.error?.message ?? 'Failed to add column';
            return of(BoardActions.addColumnFailure({ error: msg }), BoardActions.showError({ message: msg }));
          }),
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
          catchError((err) => {
            const msg = err.error?.message ?? 'Failed to update column';
            return of(BoardActions.updateColumnFailure({ error: msg }), BoardActions.showError({ message: msg }));
          }),
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
          catchError((err) => {
            const msg = err.error?.message ?? 'Failed to delete column';
            return of(BoardActions.deleteColumnFailure({ error: msg }), BoardActions.showError({ message: msg }));
          }),
        ),
      ),
    ),
  { functional: true },
);

export const loadTickets$ = createEffect(
  (actions$ = inject(Actions), boardService = inject(BoardService)) =>
    actions$.pipe(
      ofType(BoardActions.loadTickets),
      mergeMap(({ columnId }) =>
        boardService.getTickets(columnId).pipe(
          map((tickets) => BoardActions.loadTicketsSuccess({ columnId, tickets })),
          catchError((err) => {
            const msg = err.error?.message ?? 'Failed to load tickets';
            return of(BoardActions.loadTicketsFailure({ error: msg }), BoardActions.showError({ message: msg }));
          }),
        ),
      ),
    ),
  { functional: true },
);

export const addTicket$ = createEffect(
  (actions$ = inject(Actions), boardService = inject(BoardService)) =>
    actions$.pipe(
      ofType(BoardActions.addTicket),
      mergeMap(({ columnId, title, description, tempId }) =>
        boardService.createTicket(columnId, { title, description }).pipe(
          map((ticket) => BoardActions.addTicketSuccess({ ticket, tempId })),
          catchError((err) => {
            const msg = err.error?.message ?? 'Failed to create ticket';
            return of(BoardActions.addTicketFailure({ tempId, error: msg }), BoardActions.showError({ message: msg }));
          }),
        ),
      ),
    ),
  { functional: true },
);

export const updateTicket$ = createEffect(
  (actions$ = inject(Actions), boardService = inject(BoardService)) =>
    actions$.pipe(
      ofType(BoardActions.updateTicket),
      mergeMap(({ id, data }) =>
        boardService.updateTicket(id, data).pipe(
          map((ticket) => BoardActions.updateTicketSuccess({ ticket })),
          catchError((err) => {
            const msg = err.error?.message ?? 'Failed to update ticket';
            return of(BoardActions.updateTicketFailure({ error: msg }), BoardActions.showError({ message: msg }));
          }),
        ),
      ),
    ),
  { functional: true },
);

export const deleteTicket$ = createEffect(
  (actions$ = inject(Actions), boardService = inject(BoardService)) =>
    actions$.pipe(
      ofType(BoardActions.deleteTicket),
      mergeMap(({ id }) =>
        boardService.deleteTicket(id).pipe(
          map(() => BoardActions.deleteTicketSuccess({ id })),
          catchError((err) => {
            const msg = err.error?.message ?? 'Failed to delete ticket';
            return of(BoardActions.deleteTicketFailure({ error: msg }), BoardActions.showError({ message: msg }));
          }),
        ),
      ),
    ),
  { functional: true },
);

export const showError$ = createEffect(
  (actions$ = inject(Actions), snackBar = inject(MatSnackBar)) =>
    actions$.pipe(
      ofType(BoardActions.showError),
      tap(({ message }) => snackBar.open(message, 'Close', { duration: 5000 })),
    ),
  { functional: true, dispatch: false },
);
