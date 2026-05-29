import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { ProjectActions } from './project.actions';

export const loadProject$ = createEffect(
  (actions$ = inject(Actions), projectService = inject(ProjectService)) =>
    actions$.pipe(
      ofType(ProjectActions.loadProject),
      switchMap(() =>
        projectService.getMine().pipe(
          map((project) => ProjectActions.loadProjectSuccess({ project })),
          catchError((err) =>
            of(ProjectActions.loadProjectFailure({ error: err.error?.message ?? 'Failed to load project' })),
          ),
        ),
      ),
    ),
  { functional: true },
);
