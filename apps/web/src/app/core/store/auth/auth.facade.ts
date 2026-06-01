import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { selectUser, selectToken, selectIsAuthenticated, selectAuthLoading, selectAuthError } from './auth.selectors';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly store = inject(Store);

  user$ = this.store.select(selectUser);
  token$ = this.store.select(selectToken);
  isAuthenticated$ = this.store.select(selectIsAuthenticated);
  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);

  login(email: string, password: string) {
    this.store.dispatch(AuthActions.login({ email, password }));
  }

  register(email: string, password: string, displayName: string) {
    this.store.dispatch(AuthActions.register({ email, password, displayName }));
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
}
