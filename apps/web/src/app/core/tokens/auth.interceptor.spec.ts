import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TokenStorage } from './token-storage';
import { authInterceptor } from './auth.interceptor';

class MockTokenStorage extends TokenStorage {
  private token: string | null = null;
  get(): string | null {
    return this.token;
  }
  set(t: string): void {
    this.token = t;
  }
  remove(): void {
    this.token = null;
  }
}

describe('authInterceptor', () => {
  let mockStorage: MockTokenStorage;
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    mockStorage = new MockTokenStorage();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor()])),
        provideHttpClientTesting(),
        { provide: TokenStorage, useValue: mockStorage },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('attaches Authorization: Bearer <token> header when token exists', async () => {
    mockStorage.set('my-jwt-token');

    const resp = firstValueFrom(
      http.get('http://localhost:3000/api/projects/me'),
    );
    const req = httpTesting.expectOne('http://localhost:3000/api/projects/me');

    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
    req.flush({});
    await resp;
  });

  it('does not attach Authorization header when no token', async () => {
    const resp = firstValueFrom(
      http.get('http://localhost:3000/api/projects/me'),
    );
    const req = httpTesting.expectOne('http://localhost:3000/api/projects/me');

    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
    await resp;
  });

  it('does not attach Authorization header for /auth/ URLs even when token exists', async () => {
    mockStorage.set('my-jwt-token');

    const resp = firstValueFrom(
      http.post('http://localhost:3000/api/auth/login', {}),
    );
    const req = httpTesting.expectOne('http://localhost:3000/api/auth/login');

    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
    await resp;
  });
});
