import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { BoardFacade } from './board.facade';
import { BoardActions } from './board.actions';

describe('BoardFacade', () => {
  let facade: BoardFacade;
  let dispatchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const storeMock = { dispatch: vi.fn(), select: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        BoardFacade,
        { provide: Store, useValue: storeMock },
      ],
    });

    facade = TestBed.inject(BoardFacade);
    dispatchSpy = TestBed.inject(Store).dispatch as ReturnType<typeof vi.fn>;
  });

  describe('addColumn', () => {
    it('dispatches addColumn action with AddColumnData', () => {
      facade.addColumn({ projectId: 'p-1', name: 'New Col' });

      expect(dispatchSpy).toHaveBeenCalledWith(
        BoardActions.addColumn({ projectId: 'p-1', name: 'New Col' }),
      );
    });

    it('dispatches addColumn action with afterColumnId', () => {
      facade.addColumn({ projectId: 'p-1', name: 'New Col', afterColumnId: 'c-1' });

      expect(dispatchSpy).toHaveBeenCalledWith(
        BoardActions.addColumn({ projectId: 'p-1', name: 'New Col', afterColumnId: 'c-1' }),
      );
    });
  });

  describe('loadBoard', () => {
    it('dispatches loadBoard action with projectId', () => {
      facade.loadBoard('p-1');

      expect(dispatchSpy).toHaveBeenCalledWith(
        BoardActions.loadBoard({ projectId: 'p-1' }),
      );
    });
  });
});
