import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { UserFacade } from '../store/user/user.facade';

export const authGuard: CanActivateFn = () => {
  const auth = inject(UserFacade);
  const router = inject(Router);

  return auth.isAuthenticated$.pipe(
    map((ok) => {
      if (ok) return true;
      router.navigate(['/login']);
      return false;
    }),
  );
};
