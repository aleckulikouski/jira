import { describe, it, expect } from 'vitest';
import { AuthActions } from './auth.actions';
import { authReducer, AuthState } from './auth.reducer';

describe('Auth Reducer', () => {
  const initial: AuthState = {
    user: null,
    token: null,
    loading: false,
    error: null,
  };

  it('should store displayName on registerSuccess', () => {
    const state = authReducer(
      initial,
      AuthActions.registerSuccess({
        accessToken: 'tok',
        user: { id: '1', email: 'a@b.com', displayName: 'Alice' },
      }),
    );
    expect(state.user).toEqual({ id: '1', email: 'a@b.com', displayName: 'Alice' });
  });

  it('should store displayName on loginSuccess', () => {
    const state = authReducer(
      initial,
      AuthActions.loginSuccess({
        accessToken: 'tok',
        user: { id: '1', email: 'a@b.com', displayName: 'Bob' },
      }),
    );
    expect(state.user).toEqual({ id: '1', email: 'a@b.com', displayName: 'Bob' });
  });

  it('should clear displayName on logout', () => {
    const loggedIn: AuthState = {
      user: { id: '1', email: 'a@b.com', displayName: 'Alice' },
      token: 'tok',
      loading: false,
      error: null,
    };
    const state = authReducer(loggedIn, AuthActions.logout());
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
});
