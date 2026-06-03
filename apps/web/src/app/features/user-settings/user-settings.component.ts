import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, DestroyRef, OnInit, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { Observable, pairwise, filter, withLatestFrom, startWith } from 'rxjs';
import { ConfirmDialogComponent } from '../../core/components/confirm-dialog/confirm-dialog.component';
import { UserFacade } from '../../core/store/user/user.facade';
import { CanComponentDeactivate } from '../../core/interfaces/can-component-deactivate.interface';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';

const AVATAR_SIZE = 256;
const AVATAR_QUALITY = 0.85;

@Component({
  selector: 'app-user-settings',
  imports: [
    AsyncPipe,
    AvatarComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './user-settings.component.html',
  styleUrl: './user-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettingsComponent implements OnInit, OnDestroy, CanComponentDeactivate {
  private readonly fb = inject(FormBuilder);
  private readonly userFacade = inject(UserFacade);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);

  readonly profileSaving$ = this.userFacade.profileSaving$;
  readonly passwordChanging$ = this.userFacade.passwordChanging$;
  readonly user$ = this.userFacade.user$;

  readonly profileForm = this.fb.nonNullable.group({
    email: [{ value: '', disabled: true }],
    displayName: ['', [Validators.required]],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      newPassword: [''],
      confirmPassword: [''],
    },
    { validators: passwordsMatch },
  );

  avatarFile: Blob | null = null;
  avatarPreviewUrl: string | null = null;
  avatarChanged = false;
  private objectUrl: string | null = null;

  ngOnInit(): void {
    // Populate form from store
    this.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (user) {
          this.profileForm.patchValue({
            email: user.email,
            displayName: user.displayName,
          });
        }
      });

    // Password change result detection
    this.passwordChanging$
      .pipe(
        startWith(false),
        pairwise(),
        filter(([was, now]) => was && !now),
        withLatestFrom(this.userFacade.error$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([, error]) => {
        if (error) {
          this.snackBar.open(error, 'Close', { duration: 5000 });
        } else {
          this.snackBar.open('Password changed', 'Close', { duration: 5000 });
          this.passwordForm.reset();
          Object.keys(this.passwordForm.controls).forEach((k) =>
            this.passwordForm.get(k)?.markAsPristine(),
          );
        }
      });

    // Profile save result detection
    this.profileSaving$
      .pipe(
        startWith(false),
        pairwise(),
        filter(([was, now]) => was && !now),
        withLatestFrom(this.userFacade.error$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([, error]) => {
        if (error) {
          this.snackBar.open(error, 'Close', { duration: 5000 });
        } else {
          this.snackBar.open('Profile updated', 'Close', { duration: 5000 });
          this.profileForm.markAsPristine();
          this.avatarChanged = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.revokePreviewUrl();
  }

  onAvatarClick(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      this.resizeAndPreview(file);
      input.remove();
    };
    input.click();
  }

  private resizeAndPreview(file: File): void {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          this.avatarFile = blob;

          // Revoke previous object URL and create new one
          this.revokePreviewUrl();
          this.objectUrl = URL.createObjectURL(blob);
          this.avatarPreviewUrl = this.objectUrl;
          this.avatarChanged = true;
          this.cdr.markForCheck();
        },
        'image/jpeg',
        AVATAR_QUALITY,
      );
    };
  }

  private revokePreviewUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) return;
    const { displayName } = this.profileForm.getRawValue();
    const formData = new FormData();
    formData.append('displayName', displayName);
    if (this.avatarFile) {
      formData.append('file', this.avatarFile, 'avatar.jpg');
    }
    this.userFacade.updateProfile(formData);
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) return;
    const { newPassword, confirmPassword } = this.passwordForm.getRawValue();
    this.userFacade.changePassword(newPassword, confirmPassword);
  }

  onBack(): void {
    this.router.navigate(['/board']);
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (!this.profileForm.dirty && !this.passwordForm.dirty && !this.avatarChanged) {
      return true;
    }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: {
        title: 'Unsaved changes',
        message: 'You have unsaved changes. Are you sure you want to leave?',
        confirmLabel: 'Yes',
        cancelLabel: 'No',
      },
    });
    return dialogRef.afterClosed();
  }
}

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordsMatch: true } : null;
}
