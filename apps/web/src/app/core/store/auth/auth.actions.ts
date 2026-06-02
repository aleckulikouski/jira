import { createActionGroup, props, emptyProps } from '@ngrx/store';
import type { AuthResponse } from '@org/shared-types';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Register: props<{ email: string; password: string; displayName: string }>(),
    'Register Success': props<AuthResponse>(),
    'Register Failure': props<{ error: string }>(),

    Login: props<{ email: string; password: string }>(),
    'Login Success': props<AuthResponse>(),
    'Login Failure': props<{ error: string }>(),

    Logout: emptyProps(),
  },
});
