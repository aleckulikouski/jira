import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

const LAST_PROJECT_KEY = 'lastSelectedProjectId';

export const projectRedirectResolver: CanActivateFn = () => {
  const router = inject(Router);
  const lastId = localStorage.getItem(LAST_PROJECT_KEY);

  if (lastId) {
    return router.parseUrl(`/projects/${lastId}/board`);
  }

  return true;
};
