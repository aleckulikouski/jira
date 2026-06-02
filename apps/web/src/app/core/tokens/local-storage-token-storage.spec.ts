import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageTokenStorage } from './local-storage-token-storage';

describe('LocalStorageTokenStorage', () => {
  let storage: LocalStorageTokenStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalStorageTokenStorage();
  });

  describe('get', () => {
    it('returns null when no token is stored', () => {
      expect(storage.get()).toBeNull();
    });

    it('returns the token after set() is called', () => {
      storage.set('test-token');
      expect(storage.get()).toBe('test-token');
    });
  });

  describe('set', () => {
    it('overwrites an existing token', () => {
      storage.set('old-token');
      storage.set('new-token');
      expect(storage.get()).toBe('new-token');
    });
  });

  describe('remove', () => {
    it('clears a stored token', () => {
      storage.set('test-token');
      storage.remove();
      expect(storage.get()).toBeNull();
    });

    it('is a no-op when no token is stored', () => {
      expect(() => storage.remove()).not.toThrow();
      expect(storage.get()).toBeNull();
    });
  });

  describe('readStoredToken', () => {
    it('returns the same value as get()', () => {
      storage.set('test-token');
      expect(LocalStorageTokenStorage.readStoredToken()).toBe('test-token');
      expect(LocalStorageTokenStorage.readStoredToken()).toBe(storage.get());
    });

    it('returns null when no token is stored', () => {
      expect(LocalStorageTokenStorage.readStoredToken()).toBeNull();
    });

    it('migrates token from old key to new key', () => {
      localStorage.setItem('token', 'legacy-token');
      expect(LocalStorageTokenStorage.readStoredToken()).toBe('legacy-token');
      // Old key should be removed
      expect(localStorage.getItem('token')).toBeNull();
      // New key should have the migrated value
      expect(localStorage.getItem('auth_token')).toBe('legacy-token');
    });

    it('prefers new key over old key when both exist', () => {
      localStorage.setItem('token', 'legacy-token');
      storage.set('current-token');
      expect(LocalStorageTokenStorage.readStoredToken()).toBe('current-token');
      // Old key is NOT removed — new key already exists, migration already happened
      // The old key is stale but harmless; removing it would be a side effect
    });
  });
});
