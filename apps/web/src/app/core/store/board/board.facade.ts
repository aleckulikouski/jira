import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BoardActions } from './board.actions';
import { selectColumns, selectBoardLoading, selectBoardError } from './board.selectors';

@Injectable({ providedIn: 'root' })
export class BoardFacade {
  private readonly store = inject(Store);

  columns$ = this.store.select(selectColumns);
  loading$ = this.store.select(selectBoardLoading);
  error$ = this.store.select(selectBoardError);

  loadColumns(projectId: string) {
    this.store.dispatch(BoardActions.loadColumns({ projectId }));
  }

  addColumn(projectId: string, name: string) {
    this.store.dispatch(BoardActions.addColumn({ projectId, name }));
  }

  updateColumn(id: string, data: { name?: string; order?: number }) {
    this.store.dispatch(BoardActions.updateColumn({ id, data }));
  }

  deleteColumn(id: string) {
    this.store.dispatch(BoardActions.deleteColumn({ id }));
  }
}
