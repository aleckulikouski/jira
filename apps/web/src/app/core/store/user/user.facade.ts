import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { UserActions } from './user.actions';
import { selectUser, selectToken, selectIsAuthenticated, selectUserLoading, selectUserError, selectProfileSaving, selectPasswordChanging } from './user.selectors';

@Injectable({ providedIn: 'root' })
export class UserFacade {
  private readonly store = inject(Store);

  user$ = this.store.select(selectUser);
  token$ = this.store.select(selectToken);
  isAuthenticated$ = this.store.select(selectIsAuthenticated);
  loading$ = this.store.select(selectUserLoading);
  error$ = this.store.select(selectUserError);
  profileSaving$ = this.store.select(selectProfileSaving);
  passwordChanging$ = this.store.select(selectPasswordChanging);

  login(email: string, password: string) {
    this.store.dispatch(UserActions.login({ email, password }));
  }

  register(email: string, password: string, displayName: string) {
    this.store.dispatch(UserActions.register({ email, password, displayName }));
  }

  logout() {
    this.store.dispatch(UserActions.logout());
  }

  updateProfile(formData: FormData) {
    this.store.dispatch(UserActions.updateProfile({ formData }));
  }

  changePassword(newPassword: string, confirmPassword: string) {
    this.store.dispatch(UserActions.changePassword({ newPassword, confirmPassword }));
  }
}
