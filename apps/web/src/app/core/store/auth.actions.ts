import { createActionGroup, props, emptyProps } from '@ngrx/store';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Register: props<{ email: string; password: string; displayName: string }>(),
    'Register Success': props<{ accessToken: string; user: { id: string; email: string } }>(),
    'Register Failure': props<{ error: string }>(),

    Login: props<{ email: string; password: string }>(),
    'Login Success': props<{ accessToken: string; user: { id: string; email: string } }>(),
    'Login Failure': props<{ error: string }>(),

    Logout: emptyProps(),
  },
});
