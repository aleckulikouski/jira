import { createReducer, on } from '@ngrx/store';
import type { Project } from '@org/shared-types';
import { ProjectActions } from './project.actions';
import { UserActions } from '../user/user.actions';

export interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  loading: false,
  error: null,
};

export const projectReducer = createReducer(
  initialState,

  on(UserActions.logout, () => initialState),

  on(ProjectActions.loadProjects, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ProjectActions.loadProjectsSuccess, (state, { projects }) => ({
    ...state,
    projects,
    loading: false,
  })),
  on(ProjectActions.loadProjectsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(ProjectActions.createProject, (state) => ({
    ...state,
    error: null,
  })),
  on(ProjectActions.createProjectSuccess, (state, { project }) => ({
    ...state,
    projects: [...state.projects, project],
  })),
  on(ProjectActions.createProjectFailure, (state, { error }) => ({
    ...state,
    error,
  })),
);
