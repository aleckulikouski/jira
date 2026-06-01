import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import type { TicketDialogData, TicketDialogResult } from '../../core/interfaces/ticket-dialog.interface';
import { DeleteConfirmDialogComponent } from '../delete-confirm-dialog/delete-confirm-dialog.component';

@Component({
  selector: 'app-ticket-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
  ],
  templateUrl: './ticket-dialog.component.html',
  styleUrl: './ticket-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketDialogComponent {
  title = '';
  description = '';
  columnId: string;

  private readonly dialogRef = inject(MatDialogRef<TicketDialogComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = inject<TicketDialogData>(MAT_DIALOG_DATA);

  get isEdit(): boolean {
    return !!this.data.ticket;
  }

  constructor() {
    if (this.data.ticket) {
      this.title = this.data.ticket.title;
      this.description = this.data.ticket.description ?? '';
      this.columnId = this.data.ticket.columnId;
    } else {
      this.columnId = this.data.columns[0]?.id ?? '';
    }
  }

  submit() {
    if (this.title.trim() && this.columnId) {
      this.dialogRef.close({
        action: 'save',
        columnId: this.columnId,
        title: this.title.trim(),
        description: this.description.trim() || undefined,
      } satisfies TicketDialogResult);
    }
  }

  deleteTicket() {
    const confirmRef = this.dialog.open(DeleteConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Ticket', message: 'Are you sure you want to delete this ticket?' },
    });
    confirmRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.dialogRef.close({ action: 'delete' } satisfies TicketDialogResult);
        }
      });
  }
}
