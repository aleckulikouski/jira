import { Injectable } from '@angular/core';
import { TokenStorage } from './token-storage';

@Injectable({ providedIn: 'root' })
export class LocalStorageTokenStorage implements TokenStorage {
  private static readonly KEY = 'auth_token';

  get(): string | null {
    return localStorage.getItem(LocalStorageTokenStorage.KEY);
  }

  set(token: string): void {
    localStorage.setItem(LocalStorageTokenStorage.KEY, token);
  }

  remove(): void {
    localStorage.removeItem(LocalStorageTokenStorage.KEY);
  }

  /**
   * Static escape hatch for NgRx reducer initial-state hydration.
   * Reducers are pure functions that cannot inject — this one-line bridge
   * can be deleted when hydration moves to an APP_INITIALIZER action.
   */
  static readStoredToken(): string | null {
    const token = localStorage.getItem(LocalStorageTokenStorage.KEY);
    if (token) return token;

    // One-time migration: read from old key and migrate to new key
    const legacy = localStorage.getItem('token');
    if (legacy) {
      localStorage.setItem(LocalStorageTokenStorage.KEY, legacy);
      localStorage.removeItem('token');
      return legacy;
    }
    return null;
  }
}
