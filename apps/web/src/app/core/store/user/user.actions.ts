import { createActionGroup, props, emptyProps } from '@ngrx/store';
import type { AuthResponse, User } from '@org/shared-types';

export const UserActions = createActionGroup({
  source: 'User',
  events: {
    Register: props<{ email: string; password: string; displayName: string }>(),
    'Register Success': props<AuthResponse>(),
    'Register Failure': props<{ error: string }>(),

    Login: props<{ email: string; password: string }>(),
    'Login Success': props<AuthResponse>(),
    'Login Failure': props<{ error: string }>(),

    Logout: emptyProps(),

    'Update Profile': props<{ formData: FormData }>(),
    'Update Profile Success': props<{ user: User }>(),
    'Update Profile Failure': props<{ error: string }>(),

    'Change Password': props<{ newPassword: string; confirmPassword: string }>(),
    'Change Password Success': emptyProps(),
    'Change Password Failure': props<{ error: string }>(),
  },
});
