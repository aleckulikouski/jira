import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { ProjectState } from './project.reducer';

export const selectProjectState = createFeatureSelector<ProjectState>('project');

export const selectProjects = createSelector(selectProjectState, (s) => s.projects);
export const selectProjectLoading = createSelector(selectProjectState, (s) => s.loading);
export const selectProjectError = createSelector(selectProjectState, (s) => s.error);

/** Select a project by its ID (derived from route param or passed explicitly) */
export const selectProjectById = (projectId: string) =>
  createSelector(selectProjects, (projects) => projects.find((p) => p.id === projectId) ?? null);
