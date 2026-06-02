import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { TokenStorage } from './token-storage';

export function authInterceptor(): HttpInterceptorFn {
  return (req, next) => {
    if (req.url.includes('/auth/')) {
      return next(req);
    }
    const token = inject(TokenStorage).get();
    if (!token) {
      return next(req);
    }
    return next(
      req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      }),
    );
  };
}
