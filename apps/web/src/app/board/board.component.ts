import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { CdkDropList } from '@angular/cdk/drag-drop';
import { filter } from 'rxjs';
import { AuthFacade } from '../core/store/auth.facade';
import { BoardFacade } from '../core/store/board/board.facade';
import { ProjectFacade } from '../core/store/project/project.facade';
import { AddColumnDialogComponent } from './add-column-dialog/add-column-dialog.component';
import { DeleteConfirmDialogComponent } from './delete-confirm-dialog/delete-confirm-dialog.component';
import { BoardColumn } from '@org/shared-types';

@Component({
  selector: 'app-board',
  imports: [
    AsyncPipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatInputModule,
    CdkDropList,
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent implements OnInit {
  readonly auth = inject(AuthFacade);
  readonly board = inject(BoardFacade);
  readonly project = inject(ProjectFacade);
  private readonly dialog = inject(MatDialog);

  editingColumnId: string | null = null;
  editName = '';

  constructor() {
    this.project.project$.pipe(
      filter((p) => p !== null),
      takeUntilDestroyed(),
    ).subscribe((p) => {
      this.board.loadColumns(p.id);
    });
  }

  ngOnInit() {
    this.project.loadProject();
  }

  startEdit(column: BoardColumn) {
    this.editingColumnId = column.id;
    this.editName = column.name;
  }

  saveEdit(column: BoardColumn) {
    const name = this.editName.trim();
    if (name && name !== column.name) {
      this.board.updateColumn(column.id, { name });
    }
    this.editingColumnId = null;
  }

  cancelEdit() {
    this.editingColumnId = null;
  }

  openAddColumnDialog(projectId: string) {
    const ref = this.dialog.open(AddColumnDialogComponent, { width: '320px' });
    ref.afterClosed().subscribe((name: string | undefined) => {
      if (name) {
        this.board.addColumn(projectId, name);
      }
    });
  }

  confirmDelete(column: BoardColumn) {
    const ref = this.dialog.open(DeleteConfirmDialogComponent, {
      width: '400px',
      data: { columnName: column.name },
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.board.deleteColumn(column.id);
      }
    });
  }

  trackByColumnId(_: number, col: BoardColumn) {
    return col.id;
  }
}
