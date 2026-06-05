import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { ProjectActions } from './project.actions';
import { BoardActions } from '../board/board.actions';

const LAST_PROJECT_KEY = 'lastSelectedProjectId';

export const loadProjects$ = createEffect(
  (actions$ = inject(Actions), projectService = inject(ProjectService)) =>
    actions$.pipe(
      ofType(ProjectActions.loadProjects),
      switchMap(() =>
        projectService.getAll().pipe(
          map((projects) => ProjectActions.loadProjectsSuccess({ projects })),
          catchError((err) =>
            of(
              ProjectActions.loadProjectsFailure({
                error: err.error?.message ?? 'Failed to load projects',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const createProject$ = createEffect(
  (actions$ = inject(Actions), projectService = inject(ProjectService)) =>
    actions$.pipe(
      ofType(ProjectActions.createProject),
      switchMap(({ data }) =>
        projectService.create(data).pipe(
          map((project) => ProjectActions.createProjectSuccess({ project })),
          catchError((err) =>
            of(
              ProjectActions.createProjectFailure({
                error: err.error?.message ?? 'Failed to create project',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const selectProject$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ProjectActions.selectProject),
      tap(({ id }) => localStorage.setItem(LAST_PROJECT_KEY, id)),
      switchMap(({ id }) =>
        of(BoardActions.clearBoard(), BoardActions.loadColumns({ projectId: id })),
      ),
    ),
  { functional: true },
);
