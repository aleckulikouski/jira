import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { UserFacade } from '../../store/user/user.facade';
import type { User } from '@org/shared-types';

describe('HeaderComponent', () => {
  let userFacade: { user$: Observable<User | null>; isAuthenticated$: Observable<boolean>; logout: ReturnType<typeof vi.fn> };
  let fixture: ReturnType<typeof TestBed.createComponent<HeaderComponent>>;

  beforeEach(async () => {
    userFacade = {
      user$: of(null),
      isAuthenticated$: of(false),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([
          { path: 'board', component: {} as any },
          { path: 'user-settings', component: {} as any },
        ]),
        { provide: UserFacade, useValue: userFacade },
      ],
    }).compileComponents();
  });

  describe('branding', () => {
    it('should render Jira Clone branding text', () => {
      fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Jira Clone');
    });
  });

  describe('user display', () => {
    const user: User = { id: '1', email: 'alice@example.com', displayName: 'Alice' };

    it('should show displayName when available', () => {
      userFacade.user$ = of(user);
      userFacade.isAuthenticated$ = of(true);
      fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Alice');
    });

    it('should fall back to email when displayName is empty', () => {
      userFacade.user$ = of({ id: '1', email: 'alice@example.com', displayName: '' });
      userFacade.isAuthenticated$ = of(true);
      fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('alice@example.com');
    });
  });

  describe('dropdown menu', () => {
    it('should show user display name outside the menu trigger button', () => {
      userFacade.user$ = of({ id: '1', email: 'a@b.com', displayName: 'Alice' });
      userFacade.isAuthenticated$ = of(true);
      fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const userInfo = el.querySelector('.user-info');
      const trigger = el.querySelector('.user-menu-trigger');
      expect(userInfo).toBeTruthy();
      expect(trigger).toBeTruthy();
      expect(userInfo!.textContent).toContain('Alice');
      // The trigger button should NOT contain the user name anymore
      expect(trigger!.textContent).not.toContain('Alice');
    });

    it('should have a mat-menu in the template', () => {
      userFacade.user$ = of({ id: '1', email: 'a@b.com', displayName: 'Alice' });
      userFacade.isAuthenticated$ = of(true);
      fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();

      // mat-menu element has the mat-menu directive attribute
      const el = fixture.nativeElement as HTMLElement;
      const menu = el.querySelector('mat-menu');
      expect(menu).toBeTruthy();
    });
  });

  describe('logout', () => {
    it('should call UserFacade.logout when onLogout is called', () => {
      userFacade.user$ = of({ id: '1', email: 'a@b.com', displayName: 'Test' });
      userFacade.isAuthenticated$ = of(true);
      fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();

      fixture.componentInstance.onLogout();
      expect(userFacade.logout).toHaveBeenCalled();
    });
  });

  describe('settings navigation', () => {
    it('should close menu without navigating when already on /user-settings', async () => {
      userFacade.user$ = of({ id: '1', email: 'a@b.com', displayName: 'Test' });
      userFacade.isAuthenticated$ = of(true);
      fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();

      const router = TestBed.inject(Router);
      await router.navigate(['/user-settings']);

      const trigger = { closeMenu: vi.fn() } as any;
      fixture.componentInstance.onSettingsClick(trigger);

      expect(trigger.closeMenu).toHaveBeenCalled();
      expect(router.url).toBe('/user-settings');
    });

    it('should navigate to /user-settings when on a different page', async () => {
      userFacade.user$ = of({ id: '1', email: 'a@b.com', displayName: 'Test' });
      userFacade.isAuthenticated$ = of(true);
      fixture = TestBed.createComponent(HeaderComponent);
      fixture.detectChanges();

      const router = TestBed.inject(Router);
      await router.navigate(['/board']);
      fixture.detectChanges();

      const trigger = { closeMenu: vi.fn() } as any;
      fixture.componentInstance.onSettingsClick(trigger);
      await fixture.whenStable();

      expect(trigger.closeMenu).toHaveBeenCalled();
      expect(router.url).toBe('/user-settings');
    });
  });
});
