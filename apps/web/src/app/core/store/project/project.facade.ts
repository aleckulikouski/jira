import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import type { CreateProjectData } from '@org/shared-types';
import { ProjectActions } from './project.actions';
import { selectProjectById, selectProjects, selectProjectLoading, selectProjectError } from './project.selectors';

@Injectable({ providedIn: 'root' })
export class ProjectFacade {
  private readonly store = inject(Store);

  projects$ = this.store.select(selectProjects);
  loading$ = this.store.select(selectProjectLoading);
  error$ = this.store.select(selectProjectError);

  /** Observe a single project by ID */
  getProject(id: string) {
    return this.store.select(selectProjectById(id));
  }

  loadProjects() {
    this.store.dispatch(ProjectActions.loadProjects());
  }

  createProject(data: CreateProjectData) {
    this.store.dispatch(ProjectActions.createProject({ data }));
  }

  /** Dispatch a project selection (writes localStorage, loads board) */
  selectProject(id: string) {
    this.store.dispatch(ProjectActions.selectProject({ id }));
  }
}
