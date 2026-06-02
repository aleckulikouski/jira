import { Route } from '@angular/router';
import { LoginComponent } from './core/features/auth/login/login.component';
import { RegisterComponent } from './core/features/auth/register/register.component';
import { BoardComponent } from './core/features/board/board.component';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { UserSettingsComponent } from './core/features/user-settings/user-settings.component';
import { authGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'board', component: BoardComponent },
      { path: 'user-settings', component: UserSettingsComponent },
      { path: '', redirectTo: 'board', pathMatch: 'full' },
    ],
  },
];
