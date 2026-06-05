import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, first, skip, take } from 'rxjs';
import { ProjectFacade } from '../../core/store/project/project.facade';
import type { CreateProjectData } from '@org/shared-types';

@Component({
  selector: 'app-create-project-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Create project</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Project name</mat-label>
        <input matInput [(ngModel)]="name" (keyup.enter)="onCreate()" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!name.trim()" (click)="onCreate()">
        Create
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    mat-dialog-content { min-width: 320px; padding-top: 8px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProjectDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CreateProjectDialogComponent>);
  private readonly projectFacade = inject(ProjectFacade);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  name = '';
  private submitting = false;

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    const trimmed = this.name.trim();
    if (!trimmed || this.submitting) return;
    this.submitting = true;

    // Snapshot existing IDs so we can detect the new project by ID, not name
    const existingIds = new Set<string>();
    this.projectFacade.projects$
      .pipe(first())
      .subscribe((projects) => projects.forEach((p) => existingIds.add(p.id)));

    const data: CreateProjectData = { name: trimmed };
    this.projectFacade.createProject(data);

    // Watch for error
    this.projectFacade.error$
      .pipe(
        filter((e) => e !== null),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((error) => {
        this.snackBar.open(error, 'Close', { duration: 5000 });
        this.submitting = false;
      });

    // Watch for a new project ID to appear (create success)
    this.projectFacade.projects$
      .pipe(
        skip(1), // Skip the current emission, wait for the next one
        filter((projects) => projects.some((p) => !existingIds.has(p.id))),
        first(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((projects) => {
        const newProject = projects.find((p) => !existingIds.has(p.id))!;
        this.dialogRef.close();
        this.router.navigate(['/projects', newProject.id, 'board']);
      });
  }
}
