import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-add-column-dialog',
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule],
  templateUrl: './add-column-dialog.component.html',
  styleUrl: './add-column-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddColumnDialogComponent {
  name = '';
  private readonly dialogRef = inject(MatDialogRef<AddColumnDialogComponent>);

  submit() {
    if (this.name.trim()) {
      this.dialogRef.close(this.name.trim());
    }
  }
}
