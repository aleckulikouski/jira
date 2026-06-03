import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { AuthResponse, User } from '@org/shared-types';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:3000/api/auth';

  register(email: string, password: string, displayName: string) {
    return this.http.post<AuthResponse>(`${this.base}/register`, { email, password, displayName });
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.base}/login`, { email, password });
  }

  updateProfile(formData: FormData) {
    return this.http.patch<User>('http://localhost:3000/api/users/me/profile', formData);
  }

  changePassword(newPassword: string, confirmPassword: string) {
    return this.http.post<void>('http://localhost:3000/api/users/me/change-password', { newPassword, confirmPassword });
  }
}
