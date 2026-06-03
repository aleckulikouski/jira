import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { AvatarComponent } from './avatar.component';
import type { User } from '@org/shared-types';

function makeUser(overrides?: Partial<User>): User {
  return {
    id: 'user-1',
    email: 'test@test.com',
    displayName: 'John Doe',
    avatarUrl: null,
    ...overrides,
  };
}

@Component({
  imports: [AvatarComponent],
  template: `<app-avatar [user]="user" [size]="size" />`,
})
class TestHost {
  user: User | null = null;
  size = 48;
}

function qs(el: HTMLElement, selector: string): HTMLElement {
  return el.querySelector(selector)! as HTMLElement;
}

describe('AvatarComponent', () => {
  let hostFixture: ComponentFixture<TestHost>;
  let host: TestHost;

  function getAvatarElement(): HTMLElement {
    return hostFixture.debugElement.query(By.directive(AvatarComponent)).nativeElement;
  }

  function setup(user: User | null, size?: number): void {
    host.user = user;
    if (size !== undefined) host.size = size;
    hostFixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost, AvatarComponent],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHost);
    host = hostFixture.componentInstance;
  });

  describe('when user has avatarUrl', () => {
    it('renders an <img> element', () => {
      setup(makeUser({ avatarUrl: '/uploads/avatars/user-1.jpg' }));
      const img = getAvatarElement().querySelector('img');
      expect(img).toBeTruthy();
    });

    it('sets the img src to the avatarUrl', () => {
      setup(makeUser({ avatarUrl: '/uploads/avatars/user-1.jpg' }));
      const img = getAvatarElement().querySelector('img')!;
      expect(img.getAttribute('src')).toBe('/uploads/avatars/user-1.jpg');
    });

    it('sizes the img to the size input', () => {
      setup(makeUser({ avatarUrl: '/uploads/avatars/user-1.jpg' }), 64);
      const img = getAvatarElement().querySelector('img') as HTMLElement;
      expect(img.getAttribute('width')).toBe('64');
      expect(img.getAttribute('height')).toBe('64');
    });

    it('does not render the initials circle', () => {
      setup(makeUser({ avatarUrl: '/uploads/avatars/user-1.jpg' }));
      const circle = getAvatarElement().querySelector('.avatar-initials');
      expect(circle).toBeNull();
    });
  });

  describe('when user has no avatarUrl', () => {
    it('renders the initials element', () => {
      setup(makeUser({ displayName: 'Alice Smith', avatarUrl: null }));
      const initials = getAvatarElement().querySelector('.avatar-initials');
      expect(initials).toBeTruthy();
    });

    it('shows up to 2 initials from displayName', () => {
      setup(makeUser({ displayName: 'Alice Smith', avatarUrl: null }));
      const initials = qs(getAvatarElement(), '.avatar-initials');
      expect(initials.textContent?.trim()).toBe('AS');
    });

    it('shows only first initial when displayName has one word', () => {
      setup(makeUser({ displayName: 'Alice', avatarUrl: null }));
      const initials = qs(getAvatarElement(), '.avatar-initials');
      expect(initials.textContent?.trim()).toBe('A');
    });

    it('shows "?" when displayName is empty', () => {
      setup(makeUser({ displayName: '', avatarUrl: null }));
      const initials = qs(getAvatarElement(), '.avatar-initials');
      expect(initials.textContent?.trim()).toBe('?');
    });
  });

  describe('when user is null', () => {
    it('renders the initials element with "?"', () => {
      setup(null);
      const initials = qs(getAvatarElement(), '.avatar-initials');
      expect(initials.textContent?.trim()).toBe('?');
    });

    it('does not render an img', () => {
      setup(null);
      const img = getAvatarElement().querySelector('img');
      expect(img).toBeNull();
    });
  });

  describe('deterministic color', () => {
    it('produces same background color for same displayName', () => {
      setup(makeUser({ displayName: 'John Doe', avatarUrl: null }));
      const color1 = qs(getAvatarElement(), '.avatar-initials').style.backgroundColor;

      const fixture2 = TestBed.createComponent(TestHost);
      fixture2.componentInstance.user = makeUser({ displayName: 'John Doe', avatarUrl: null });
      fixture2.detectChanges();
      const avatarEl = fixture2.debugElement.query(By.directive(AvatarComponent)).nativeElement as HTMLElement;
      const color2 = qs(avatarEl, '.avatar-initials').style.backgroundColor;

      expect(color1).toBe(color2);
    });

    it('produces different colors for different displayNames', () => {
      setup(makeUser({ displayName: 'Alice', avatarUrl: null }));
      const colorA = qs(getAvatarElement(), '.avatar-initials').style.backgroundColor;

      const fixture2 = TestBed.createComponent(TestHost);
      fixture2.componentInstance.user = makeUser({ displayName: 'Bob', avatarUrl: null });
      fixture2.detectChanges();
      const avatarEl = fixture2.debugElement.query(By.directive(AvatarComponent)).nativeElement as HTMLElement;
      const colorB = qs(avatarEl, '.avatar-initials').style.backgroundColor;

      expect(colorA).not.toBe(colorB);
    });
  });

  describe('size', () => {
    it('sets circle diameter to the size input', () => {
      setup(makeUser({ displayName: 'Test', avatarUrl: null }), 32);
      const circle = qs(getAvatarElement(), '.avatar-initials');
      expect(circle.style.width).toBe('32px');
      expect(circle.style.height).toBe('32px');
    });

    it('defaults size to 40 when not provided', () => {
      const fixture = TestBed.createComponent(AvatarComponent);
      expect(fixture.componentInstance.size()).toBe(40);
    });
  });
});
