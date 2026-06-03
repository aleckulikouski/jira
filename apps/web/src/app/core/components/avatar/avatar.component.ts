import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { User } from '@org/shared-types';

const AVATAR_PALETTE = [
  '#1e88e5', '#43a047', '#e53935', '#8e24aa', '#fb8c00',
  '#00acc1', '#3949ab', '#6d4c41', '#c0ca33', '#f4511e',
  '#00897b', '#d81b60', '#5e35b1', '#ef6c00', '#039be5',
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

function getColor(name: string): string {
  return AVATAR_PALETTE[hashName(name) % AVATAR_PALETTE.length];
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (!parts[0]) return '?';
  const first = parts[0][0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + second).toUpperCase();
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Perceived brightness (sRGB luminance)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

@Component({
  selector: 'app-avatar',
  imports: [],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  readonly user = input<User | null>(null);
  readonly size = input<number>(40);

  get initials(): string {
    const u = this.user();
    if (!u) return '?';
    return getInitials(u.displayName);
  }

  get backgroundColor(): string {
    const u = this.user();
    if (!u) return AVATAR_PALETTE[0];
    return getColor(u.displayName);
  }

  get textColor(): string {
    return isLightColor(this.backgroundColor) ? '#212121' : '#ffffff';
  }

  get avatarUrl(): string | null {
    return this.user()?.avatarUrl ?? null;
  }

  get sizePx(): string {
    return `${this.size()}px`;
  }

  get fontSizePx(): string {
    return `${Math.round(this.size() * 0.4)}px`;
  }
}
