import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { UserSettingsComponent } from './user-settings.component';
import { UserFacade } from '../../core/store/user/user.facade';
import { MatSnackBar } from '@angular/material/snack-bar';

function createMockFacade() {
  const user = new BehaviorSubject<any>({ id: '1', email: 'a@b.com', displayName: 'Alice', avatarUrl: null });
  const passwordChanging = new BehaviorSubject(false);
  const profileSaving = new BehaviorSubject(false);
  const error = new BehaviorSubject<string | null>(null);
  return {
    user$: user.asObservable(),
    isAuthenticated$: new BehaviorSubject(true).asObservable(),
    loading$: new BehaviorSubject(false).asObservable(),
    error$: error.asObservable(),
    profileSaving$: profileSaving.asObservable(),
    passwordChanging$: passwordChanging.asObservable(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    _user: user,
    _passwordChanging: passwordChanging,
    _profileSaving: profileSaving,
    _error: error,
  };
}

describe('UserSettingsComponent', () => {
  let mockFacade: ReturnType<typeof createMockFacade>;
  let snackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockFacade = createMockFacade();
    snackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [UserSettingsComponent],
      providers: [
        provideAnimations(),
        provideRouter([]),
        { provide: UserFacade, useValue: mockFacade },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();
  });

  it('renders the header with back arrow', () => {
    const fixture = TestBed.createComponent(UserSettingsComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('mat-icon')?.textContent).toContain('arrow_back');
  });

  it('renders profile and password card titles', () => {
    const fixture = TestBed.createComponent(UserSettingsComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Profile');
    expect(el.textContent).toContain('Change Password');
  });

  it('populates email field from store', () => {
    const fixture = TestBed.createComponent(UserSettingsComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const emailInput = el.querySelector('input[formcontrolname="email"]') as HTMLInputElement;
    expect(emailInput.value).toBe('a@b.com');
  });

  it('populates display name field from store', () => {
    const fixture = TestBed.createComponent(UserSettingsComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const displayNameInput = el.querySelector('input[formcontrolname="displayName"]') as HTMLInputElement;
    expect(displayNameInput.value).toBe('Alice');
  });

  it('email field is disabled', () => {
    const fixture = TestBed.createComponent(UserSettingsComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const emailInput = el.querySelector('input[formcontrolname="email"]') as HTMLInputElement;
    expect(emailInput.readOnly).toBe(true);
  });

  it('renders password fields', () => {
    const fixture = TestBed.createComponent(UserSettingsComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const inputs = el.querySelectorAll('input[type="password"]');
    expect(inputs.length).toBe(2);
  });

  it('shows spinner when profile save is in progress', () => {
    mockFacade._profileSaving.next(true);
    const fixture = TestBed.createComponent(UserSettingsComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('mat-spinner')).toBeTruthy();
  });

  describe('avatar removal', () => {
    function queryRemoveButton(el: HTMLElement): HTMLElement | null {
      return el.querySelector('[aria-label="Remove avatar"]');
    }

    it('hides remove button when user has no avatar', () => {
      const fixture = TestBed.createComponent(UserSettingsComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(queryRemoveButton(el)?.classList.contains('avatar-remove-btn--hidden')).toBe(true);
    });

    it('shows remove button when user has an existing avatar', () => {
      mockFacade._user.next({
        id: '1',
        email: 'a@b.com',
        displayName: 'Alice',
        avatarUrl: '/uploads/avatars/1.jpg',
      });
      const fixture = TestBed.createComponent(UserSettingsComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(queryRemoveButton(el)).toBeTruthy();
    });

    it('hides remove button after clicking it', () => {
      mockFacade._user.next({
        id: '1',
        email: 'a@b.com',
        displayName: 'Alice',
        avatarUrl: '/uploads/avatars/1.jpg',
      });
      const fixture = TestBed.createComponent(UserSettingsComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      queryRemoveButton(el)?.click();
      fixture.detectChanges();

      expect(queryRemoveButton(el)?.classList.contains('avatar-remove-btn--hidden')).toBe(true);
    });

    it('shows initials after clicking remove', () => {
      mockFacade._user.next({
        id: '1',
        email: 'a@b.com',
        displayName: 'Alice',
        avatarUrl: '/uploads/avatars/1.jpg',
      });
      const fixture = TestBed.createComponent(UserSettingsComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      queryRemoveButton(el)?.click();
      fixture.detectChanges();

      expect(el.querySelector('app-avatar')).toBeTruthy();
      expect(el.querySelector('.avatar-preview')).toBeNull();
    });

    it('sends removeAvatar in FormData on save', () => {
      mockFacade._user.next({
        id: '1',
        email: 'a@b.com',
        displayName: 'Alice',
        avatarUrl: '/uploads/avatars/1.jpg',
      });
      const fixture = TestBed.createComponent(UserSettingsComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      queryRemoveButton(el)?.click();
      fixture.detectChanges();

      const form = el.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(mockFacade.updateProfile).toHaveBeenCalled();
      const formData = mockFacade.updateProfile.mock.calls[0][0] as FormData;
      expect(formData.get('removeAvatar')).toBe('true');
    });

    it('allows navigation when no avatar changes', async () => {
      const fixture = TestBed.createComponent(UserSettingsComponent);
      fixture.detectChanges();

      const component = fixture.componentInstance;
      const result = await component.canDeactivate();
      expect(result).toBe(true);
    });
  });
});
