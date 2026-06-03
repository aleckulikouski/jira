import { Route } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { BoardComponent } from './features/board/board.component';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { UserSettingsComponent } from './features/user-settings/user-settings.component';
import { authGuard } from './core/guards/auth.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'board', component: BoardComponent },
      { path: 'user-settings', component: UserSettingsComponent, canDeactivate: [unsavedChangesGuard] },
      { path: '', redirectTo: 'board', pathMatch: 'full' },
    ],
  },
];
