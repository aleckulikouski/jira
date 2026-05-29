import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { Project } from '@org/shared-types';

export const ProjectActions = createActionGroup({
  source: 'Project',
  events: {
    'Load Project': emptyProps(),
    'Load Project Success': props<{ project: Project }>(),
    'Load Project Failure': props<{ error: string }>(),
  },
});
