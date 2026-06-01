import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BoardColumn } from '@org/shared-types';

export interface TicketDialogData {
  columns: BoardColumn[];
}

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
  readonly data = inject<TicketDialogData>(MAT_DIALOG_DATA);

  constructor() {
    this.columnId = this.data.columns[0]?.id ?? '';
  }

  submit() {
    if (this.title.trim() && this.columnId) {
      this.dialogRef.close({
        columnId: this.columnId,
        title: this.title.trim(),
        description: this.description.trim() || undefined,
      });
    }
  }
}
