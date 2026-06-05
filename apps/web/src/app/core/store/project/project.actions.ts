import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { CreateProjectData, Project } from '@org/shared-types';

export const ProjectActions = createActionGroup({
  source: 'Project',
  events: {
    'Load Projects': emptyProps(),
    'Load Projects Success': props<{ projects: Project[] }>(),
    'Load Projects Failure': props<{ error: string }>(),

    'Create Project': props<{ data: CreateProjectData }>(),
    'Create Project Success': props<{ project: Project }>(),
    'Create Project Failure': props<{ error: string }>(),

    'Select Project': props<{ id: string }>(),
  },
});
