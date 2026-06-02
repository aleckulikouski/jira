import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { UserSettingsComponent } from './user-settings.component';

describe('UserSettingsComponent', () => {
  it('should render a heading and placeholder text', async () => {
    await TestBed.configureTestingModule({
      imports: [UserSettingsComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(UserSettingsComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')).toBeTruthy();
    expect(el.textContent).toContain('Settings');
  });
});
