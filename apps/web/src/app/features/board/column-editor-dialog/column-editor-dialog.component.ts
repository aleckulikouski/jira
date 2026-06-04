import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { A11yModule } from '@angular/cdk/a11y';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { filter } from 'rxjs';
import { ConfirmDialogComponent } from '../../../core/components/confirm-dialog/confirm-dialog.component';
import type { BoardColumn } from '@org/shared-types';

export type ColumnEditorDialogData = BoardColumn | undefined;

export interface ColumnEditorDialogResult {
  id?: string;
  name: string;
}

@Component({
  selector: 'app-column-editor-dialog',
  imports: [A11yModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule],
  templateUrl: './column-editor-dialog.component.html',
  styleUrl: './column-editor-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnEditorDialogComponent {
  name = '';

  private readonly dialogRef = inject(MatDialogRef<ColumnEditorDialogComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = inject<ColumnEditorDialogData>(MAT_DIALOG_DATA);

  get isEditMode(): boolean {
    return !!this.data;
  }

  private get initialName(): string {
    return this.data?.name?.trim() ?? '';
  }

  get isDirty(): boolean {
    return this.name.trim() !== this.initialName;
  }

  constructor() {
    if (this.data) {
      this.name = this.data.name;
    }

    this.dialogRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cancel());

    this.dialogRef
      .keydownEvents()
      .pipe(
        filter((e) => e.key === 'Escape'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.cancel());
  }

  submit() {
    const trimmed = this.name.trim();
    if (!trimmed) return;

    if (this.isEditMode && trimmed === this.initialName) {
      this.dialogRef.close();
      return;
    }

    const result: ColumnEditorDialogResult = this.isEditMode
      ? { id: this.data!.id, name: trimmed }
      : { name: trimmed };

    this.dialogRef.close(result);
  }

  cancel() {
    if (this.isEditMode && this.isDirty) {
      const confirmRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Unsaved Changes',
          message: 'Unsaved changes will be lost. Are you sure you want to discard them?',
          confirmLabel: 'Yes',
          cancelLabel: 'No',
        },
      });
      confirmRef
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((confirmed: boolean) => {
          if (confirmed) {
            this.dialogRef.close();
          }
        });
      return;
    }
    this.dialogRef.close();
  }
}
