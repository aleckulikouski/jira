import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { AuthResponse } from '@org/shared-types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:3000/api/auth';

  register(email: string, password: string, displayName: string) {
    return this.http.post<AuthResponse>(`${this.base}/register`, { email, password, displayName });
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.base}/login`, { email, password });
  }
}
