import { describe, it, expect, vi } from 'vitest';
import type { Action } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BoardService } from '../../services/board.service';
import { BoardActions } from './board.actions';
import { updateTicket$, deleteTicket$, moveTicket$, reorderColumns$, showError$ } from './board.effects';
import { Actions } from '@ngrx/effects';
import { Ticket } from '@org/shared-types';

const makeTicket = (overrides?: Partial<Ticket>): Ticket => ({
  id: 't-1',
  columnId: 'c-1',
  assigneeId: null,
  title: 'Test Ticket',
  description: '',
  position: 0,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('Board Effects', () => {
  describe('updateTicket$', () => {
    it('should call boardService.updateTicket and return success', () => {
      const ticket = makeTicket({ title: 'Updated' });
      const boardService = { updateTicket: vi.fn().mockReturnValue(of(ticket)) } as unknown as BoardService;
      const actions$ = new Actions(of(BoardActions.updateTicket({ id: 't-1', data: { title: 'Updated' } })));

      const result: Action[] = [];
      updateTicket$(actions$, boardService).subscribe((a) => result.push(a as Action));

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(BoardActions.updateTicketSuccess({ ticket }));
      expect(boardService.updateTicket).toHaveBeenCalledWith('t-1', { title: 'Updated' });
    });

    it('should return failure and show error on API error', () => {
      const boardService = {
        updateTicket: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Server error' } }))),
      } as unknown as BoardService;
      const actions$ = new Actions(of(BoardActions.updateTicket({ id: 't-1', data: { title: 'Updated' } })));

      const result: Action[] = [];
      updateTicket$(actions$, boardService).subscribe((a) => result.push(a as Action));

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(BoardActions.updateTicketFailure({ error: 'Server error' }));
      expect(result[1]).toEqual(BoardActions.showError({ message: 'Server error' }));
    });
  });

  describe('deleteTicket$', () => {
    it('should call boardService.deleteTicket and return success', () => {
      const boardService = { deleteTicket: vi.fn().mockReturnValue(of(undefined)) } as unknown as BoardService;
      const actions$ = new Actions(of(BoardActions.deleteTicket({ id: 't-1' })));

      const result: Action[] = [];
      deleteTicket$(actions$, boardService).subscribe((a) => result.push(a as Action));

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(BoardActions.deleteTicketSuccess({ id: 't-1' }));
      expect(boardService.deleteTicket).toHaveBeenCalledWith('t-1');
    });

    it('should return failure and show error on API error', () => {
      const boardService = {
        deleteTicket: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Not found' } }))),
      } as unknown as BoardService;
      const actions$ = new Actions(of(BoardActions.deleteTicket({ id: 't-1' })));

      const result: Action[] = [];
      deleteTicket$(actions$, boardService).subscribe((a) => result.push(a as Action));

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(BoardActions.deleteTicketFailure({ error: 'Not found' }));
      expect(result[1]).toEqual(BoardActions.showError({ message: 'Not found' }));
    });
  });

  describe('moveTicket$', () => {
    const previous = makeTicket({ id: 't-1', columnId: 'c-1', position: 0 });

    it('should call boardService.updateTicket with columnId and position and return success', () => {
      const ticket = makeTicket({ id: 't-1', columnId: 'c-2', position: 3 });
      const boardService = { updateTicket: vi.fn().mockReturnValue(of(ticket)) } as unknown as BoardService;
      const actions$ = new Actions(
        of(BoardActions.moveTicket({ id: 't-1', columnId: 'c-2', position: 3, previous })),
      );

      const result: Action[] = [];
      moveTicket$(actions$, boardService).subscribe((a) => result.push(a as Action));

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(BoardActions.moveTicketSuccess({ ticket }));
      expect(boardService.updateTicket).toHaveBeenCalledWith('t-1', { columnId: 'c-2', position: 3 });
    });

    it('should return failure with previous ticket and show error on API error', () => {
      const boardService = {
        updateTicket: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Server error' } }))),
      } as unknown as BoardService;
      const actions$ = new Actions(
        of(BoardActions.moveTicket({ id: 't-1', columnId: 'c-2', position: 3, previous })),
      );

      const result: Action[] = [];
      moveTicket$(actions$, boardService).subscribe((a) => result.push(a as Action));

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(BoardActions.moveTicketFailure({ ticket: previous, error: 'Server error' }));
      expect(result[1]).toEqual(BoardActions.showError({ message: 'Server error' }));
    });
  });

  describe('reorderColumns$', () => {
    const previousOrderedIds = ['c-1', 'c-2', 'c-3'];

    it('should call boardService.reorderColumns and return success', () => {
      const boardService = {
        reorderColumns: vi.fn().mockReturnValue(of({ statusCode: 200 })),
      } as unknown as BoardService;
      const actions$ = new Actions(
        of(BoardActions.reorderColumns({
          projectId: 'p-1',
          orderedIds: ['c-3', 'c-1', 'c-2'],
          previousOrderedIds,
        })),
      );

      const result: Action[] = [];
      reorderColumns$(actions$, boardService).subscribe((a) => result.push(a as Action));

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(BoardActions.reorderColumnsSuccess());
      expect(boardService.reorderColumns).toHaveBeenCalledWith('p-1', ['c-3', 'c-1', 'c-2']);
    });

    it('should return failure with previousOrderedIds and show error on API error', () => {
      const boardService = {
        reorderColumns: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Conflict' } }))),
      } as unknown as BoardService;
      const actions$ = new Actions(
        of(BoardActions.reorderColumns({
          projectId: 'p-1',
          orderedIds: ['c-3', 'c-1', 'c-2'],
          previousOrderedIds,
        })),
      );

      const result: Action[] = [];
      reorderColumns$(actions$, boardService).subscribe((a) => result.push(a as Action));

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        BoardActions.reorderColumnsFailure({ previousOrderedIds, error: 'Conflict' }),
      );
      expect(result[1]).toEqual(BoardActions.showError({ message: 'Conflict' }));
    });
  });

  describe('showError$', () => {
    it('should open snackbar on showError action', () => {
      const snackBar = { open: vi.fn() } as unknown as MatSnackBar;
      const actions$ = new Actions(of(BoardActions.showError({ message: 'Something went wrong' })));

      showError$(actions$, snackBar).subscribe();

      expect(snackBar.open).toHaveBeenCalledWith('Something went wrong', 'Close', { duration: 5000 });
    });
  });
});
