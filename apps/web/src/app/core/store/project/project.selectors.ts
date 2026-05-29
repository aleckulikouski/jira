import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProjectState } from './project.reducer';

export const selectProjectState = createFeatureSelector<ProjectState>('project');

export const selectProject = createSelector(selectProjectState, (s) => s.project);
export const selectProjectLoading = createSelector(selectProjectState, (s) => s.loading);
export const selectProjectError = createSelector(selectProjectState, (s) => s.error);
