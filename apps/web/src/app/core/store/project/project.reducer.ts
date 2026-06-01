import { createReducer, on } from '@ngrx/store';
import type { Project } from '@org/shared-types';
import { ProjectActions } from './project.actions';

export interface ProjectState {
  project: Project | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  project: null,
  loading: false,
  error: null,
};

export const projectReducer = createReducer(
  initialState,

  on(ProjectActions.loadProject, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ProjectActions.loadProjectSuccess, (state, { project }) => ({
    ...state,
    project,
    loading: false,
  })),
  on(ProjectActions.loadProjectFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
