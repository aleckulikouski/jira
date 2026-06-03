import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { MainLayoutComponent } from './main-layout.component';
import { UserFacade } from '../../store/user/user.facade';
import type { User } from '@org/shared-types';

describe('MainLayoutComponent', () => {
  let userFacade: { user$: Observable<User | null>; isAuthenticated$: Observable<boolean>; logout: ReturnType<typeof vi.fn> };
  let fixture: ReturnType<typeof TestBed.createComponent<MainLayoutComponent>>;

  beforeEach(async () => {
    userFacade = {
      user$: of(null),
      isAuthenticated$: of(false),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: UserFacade, useValue: userFacade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
  });

  it('should render the header', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-header')).toBeTruthy();
  });

  it('should contain a router-outlet', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });

  it('should wrap content in a padded container', () => {
    const el = fixture.nativeElement as HTMLElement;
    const wrapper = el.querySelector('.content-wrapper');
    expect(wrapper).toBeTruthy();
  });
});
