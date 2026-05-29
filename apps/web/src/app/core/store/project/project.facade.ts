import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ProjectActions } from './project.actions';
import { selectProject, selectProjectLoading, selectProjectError } from './project.selectors';

@Injectable({ providedIn: 'root' })
export class ProjectFacade {
  private readonly store = inject(Store);

  project$ = this.store.select(selectProject);
  loading$ = this.store.select(selectProjectLoading);
  error$ = this.store.select(selectProjectError);

  loadProject() {
    this.store.dispatch(ProjectActions.loadProject());
  }
}
