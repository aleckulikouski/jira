import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { UserFacade } from '../../store/user/user.facade';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-header',
  imports: [
    AsyncPipe,
    AvatarComponent,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly userFacade = inject(UserFacade);
  private readonly router = inject(Router);

  onLogout() {
    this.userFacade.logout();
  }

  onSettingsClick(trigger: MatMenuTrigger) {
    if (this.router.url === '/user-settings') {
      trigger.closeMenu();
    } else {
      this.router.navigate(['/user-settings']);
      trigger.closeMenu();
    }
  }
}
