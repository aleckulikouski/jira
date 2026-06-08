import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WsJwtGuard } from './ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';

function makeMockSocket(overrides?: { token?: string | null }) {
  const disconnect = vi.fn();
  const auth: Record<string, unknown> = {};
  if (overrides?.token !== undefined) {
    auth['token'] = overrides.token;
  }
  return {
    handshake: { auth } as { auth: Record<string, unknown> },
    data: {} as Record<string, unknown>,
    disconnect,
  };
}

function makeMockJwtService(verifyImpl?: (token: string) => unknown) {
  return {
    verify: vi.fn().mockImplementation(verifyImpl ?? (() => ({ sub: 'user-1', email: 'a@b.com' }))),
  } as unknown as JwtService;
}

function makeExecutionContext(client: ReturnType<typeof makeMockSocket>) {
  return {
    switchToWs: () => ({ getClient: () => client }),
  } as unknown as Parameters<WsJwtGuard['canActivate']>[0];
}

describe('WsJwtGuard', () => {
  let guard: WsJwtGuard;
  let jwtService: ReturnType<typeof makeMockJwtService>;

  beforeEach(() => {
    jwtService = makeMockJwtService();
    guard = new WsJwtGuard(jwtService);
  });

  it('returns true and attaches user when token is valid', () => {
    const client = makeMockSocket({ token: 'valid-token' });
    const ctx = makeExecutionContext(client);

    const result = guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(client.data.user).toEqual({ id: 'user-1', email: 'a@b.com' });
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('disconnects and returns false when token is missing', () => {
    const client = makeMockSocket({ token: null });
    const ctx = makeExecutionContext(client);

    const result = guard.canActivate(ctx);

    expect(result).toBe(false);
    expect(client.disconnect).toHaveBeenCalled();
    expect(client.data.user).toBeUndefined();
  });

  it('disconnects and returns false when handshake.auth is undefined', () => {
    const client = {
      handshake: { auth: undefined as unknown as Record<string, unknown> },
      data: {} as Record<string, unknown>,
      disconnect: vi.fn(),
    };
    const ctx = makeExecutionContext(client);

    const result = guard.canActivate(ctx);

    expect(result).toBe(false);
    expect(client.disconnect).toHaveBeenCalled();
  });

  it('disconnects and returns false when token is invalid', () => {
    jwtService.verify = vi.fn().mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const client = makeMockSocket({ token: 'expired-token' });
    const ctx = makeExecutionContext(client);

    const result = guard.canActivate(ctx);

    expect(result).toBe(false);
    expect(client.disconnect).toHaveBeenCalled();
    expect(client.data.user).toBeUndefined();
  });
});
