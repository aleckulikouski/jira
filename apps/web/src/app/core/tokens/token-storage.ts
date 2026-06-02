export abstract class TokenStorage {
  abstract get(): string | null;
  abstract set(token: string): void;
  abstract remove(): void;
}
