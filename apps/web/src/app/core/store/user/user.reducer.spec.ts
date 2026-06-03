import { describe, it, expect } from 'vitest';
import { UserActions } from './user.actions';
import { userReducer, UserState } from './user.reducer';

describe('User Reducer', () => {
  const initial: UserState = {
    user: null,
    token: null,
    loading: false,
    error: null,
    profileSaving: false,
    passwordChanging: false,
  };

  it('should store displayName on registerSuccess', () => {
    const state = userReducer(
      initial,
      UserActions.registerSuccess({
        accessToken: 'tok',
        user: { id: '1', email: 'a@b.com', displayName: 'Alice' },
      }),
    );
    expect(state.user).toEqual({ id: '1', email: 'a@b.com', displayName: 'Alice' });
  });

  it('should store displayName on loginSuccess', () => {
    const state = userReducer(
      initial,
      UserActions.loginSuccess({
        accessToken: 'tok',
        user: { id: '1', email: 'a@b.com', displayName: 'Bob' },
      }),
    );
    expect(state.user).toEqual({ id: '1', email: 'a@b.com', displayName: 'Bob' });
  });

  it('should clear displayName on logout', () => {
    const loggedIn: UserState = {
      user: { id: '1', email: 'a@b.com', displayName: 'Alice' },
      token: 'tok',
      loading: false,
      error: null,
      profileSaving: false,
      passwordChanging: false,
    };
    const state = userReducer(loggedIn, UserActions.logout());
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('should set profileSaving on updateProfile', () => {
    const formData = new FormData();
    formData.set('displayName', 'New Name');
    const state = userReducer(initial, UserActions.updateProfile({ formData }));
    expect(state.profileSaving).toBe(true);
  });

  it('should update user on updateProfileSuccess', () => {
    const updated = { id: '1', email: 'a@b.com', displayName: 'New Name' };
    const state = userReducer(
      { ...initial, user: { id: '1', email: 'a@b.com', displayName: 'Old' }, profileSaving: true },
      UserActions.updateProfileSuccess({ user: updated }),
    );
    expect(state.profileSaving).toBe(false);
    expect(state.user).toEqual(updated);
  });

  it('should set error on updateProfileFailure', () => {
    const state = userReducer(
      { ...initial, profileSaving: true },
      UserActions.updateProfileFailure({ error: 'Server error' }),
    );
    expect(state.profileSaving).toBe(false);
    expect(state.error).toBe('Server error');
  });

  it('should set passwordChanging on changePassword', () => {
    const state = userReducer(
      initial,
      UserActions.changePassword({ newPassword: 'new', confirmPassword: 'new' }),
    );
    expect(state.passwordChanging).toBe(true);
  });

  it('should clear passwordChanging on changePasswordSuccess', () => {
    const state = userReducer(
      { ...initial, passwordChanging: true },
      UserActions.changePasswordSuccess(),
    );
    expect(state.passwordChanging).toBe(false);
  });

  it('should set error on changePasswordFailure', () => {
    const state = userReducer(
      { ...initial, passwordChanging: true },
      UserActions.changePasswordFailure({ error: 'Password change failed' }),
    );
    expect(state.passwordChanging).toBe(false);
    expect(state.error).toBe('Password change failed');
  });
});
