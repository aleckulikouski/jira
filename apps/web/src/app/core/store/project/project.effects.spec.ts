import { describe, it, expect, vi } from 'vitest';
import type { Action } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { Actions } from '@ngrx/effects';
import { ProjectService } from '../../services/project.service';
import { ProjectActions } from './project.actions';
import { BoardActions } from '../board/board.actions';
import { loadProjects$, createProject$, selectProject$ } from './project.effects';
import type { Project } from '@org/shared-types';

const makeProject = (overrides?: Partial<Project>): Project => ({
  id: 'p-1',
  ownerId: 'user-1',
  name: 'Test Project',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('Project Effects', () => {
  describe('loadProjects$', () => {
    it('should call projectService.getAll and return success', () => {
      const projects = [makeProject(), makeProject({ id: 'p-2', name: 'Second' })];
      const projectService = { getAll: vi.fn().mockReturnValue(of(projects)) } as unknown as ProjectService;
      const actions$ = new Actions(of(ProjectActions.loadProjects()));

      const result: Action[] = [];
      loadProjects$(actions$, projectService).subscribe((a) => result.push(a as Action));

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(ProjectActions.loadProjectsSuccess({ projects }));
      expect(projectService.getAll).toHaveBeenCalled();
    });

    it('should return failure on API error', () => {
      const projectService = {
        getAll: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Server error' } }))),
      } as unknown as ProjectService;
      const actions$ = new Actions(of(ProjectActions.loadProjects()));

      const result: Action[] = [];
      loadProjects$(actions$, projectService).subscribe((a) => result.push(a as Action));

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(ProjectActions.loadProjectsFailure({ error: 'Server error' }));
    });

    it('should return default error message when API error has no message', () => {
      const projectService = {
        getAll: vi.fn().mockReturnValue(throwError(() => ({}))),
      } as unknown as ProjectService;
      const actions$ = new Actions(of(ProjectActions.loadProjects()));

      const result: Action[] = [];
      loadProjects$(actions$, projectService).subscribe((a) => result.push(a as Action));

      expect(result[0]).toEqual(ProjectActions.loadProjectsFailure({ error: 'Failed to load projects' }));
    });
  });

  describe('createProject$', () => {
    it('should call projectService.create and return success', () => {
      const project = makeProject({ name: 'New Project' });
      const projectService = { create: vi.fn().mockReturnValue(of(project)) } as unknown as ProjectService;
      const actions$ = new Actions(of(ProjectActions.createProject({ data: { name: 'New Project' } })));

      const result: Action[] = [];
      createProject$(actions$, projectService).subscribe((a) => result.push(a as Action));

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(ProjectActions.createProjectSuccess({ project }));
      expect(projectService.create).toHaveBeenCalledWith({ name: 'New Project' });
    });

    it('should return failure on API error', () => {
      const projectService = {
        create: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Duplicate' } }))),
      } as unknown as ProjectService;
      const actions$ = new Actions(of(ProjectActions.createProject({ data: { name: 'New' } })));

      const result: Action[] = [];
      createProject$(actions$, projectService).subscribe((a) => result.push(a as Action));

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(ProjectActions.createProjectFailure({ error: 'Duplicate' }));
    });
  });

  describe('selectProject$', () => {
    it('should persist id to localStorage and dispatch clearBoard + loadBoard', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
      const actions$ = new Actions(of(ProjectActions.selectProject({ id: 'p-1' })));

      const result: Action[] = [];
      selectProject$(actions$).subscribe((a) => result.push(a as Action));

      expect(setItemSpy).toHaveBeenCalledWith('lastSelectedProjectId', 'p-1');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(BoardActions.clearBoard());
      expect(result[1]).toEqual(BoardActions.loadBoard({ projectId: 'p-1' }));

      setItemSpy.mockRestore();
    });
  });
});
