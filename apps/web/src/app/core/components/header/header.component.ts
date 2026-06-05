import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { UserFacade } from '../../store/user/user.facade';
import { AvatarComponent } from '../avatar/avatar.component';
import { CreateProjectDialogComponent } from '../../../features/project/create-project-dialog.component';

@Component({
  selector: 'app-header',
  imports: [
    AsyncPipe,
    AvatarComponent,
    MatToolbarModule,
    MatButtonModule,
    MatDividerModule,
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
  private readonly dialog = inject(MatDialog);

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

  onCreateProject(trigger: MatMenuTrigger) {
    trigger.closeMenu();
    this.dialog.open(CreateProjectDialogComponent, {
      width: '400px',
      disableClose: true,
    });
  }
}
