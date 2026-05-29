import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { appRoutes } from './app.routes';
import { authReducer } from './core/store/auth.reducer';
import * as authEffects from './core/store/auth.effects';
import { boardReducer } from './core/store/board/board.reducer';
import * as boardEffects from './core/store/board/board.effects';
import { projectReducer } from './core/store/project/project.reducer';
import * as projectEffects from './core/store/project/project.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(),
    provideStore({ auth: authReducer, board: boardReducer, project: projectReducer }),
    provideEffects(authEffects, boardEffects, projectEffects),
    provideStoreDevtools(),
  ],
};
