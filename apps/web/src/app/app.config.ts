import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { appRoutes } from './app.routes';
import { authReducer } from './core/store/auth/auth.reducer';
import * as authEffects from './core/store/auth/auth.effects';
import { boardReducer } from './core/store/board/board.reducer';
import * as boardEffects from './core/store/board/board.effects';
import { projectReducer } from './core/store/project/project.reducer';
import * as projectEffects from './core/store/project/project.effects';
import { authInterceptor } from './core/tokens/auth.interceptor';
import { TokenStorage } from './core/tokens/token-storage';
import { LocalStorageTokenStorage } from './core/tokens/local-storage-token-storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor()])),
    { provide: TokenStorage, useClass: LocalStorageTokenStorage },
    provideStore({ auth: authReducer, board: boardReducer, project: projectReducer }),
    provideEffects(authEffects, boardEffects, projectEffects),
    provideStoreDevtools(),
  ],
};
