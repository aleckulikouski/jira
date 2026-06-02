import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-user-settings',
  imports: [],
  templateUrl: './user-settings.component.html',
  styleUrl: './user-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettingsComponent {}
