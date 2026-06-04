import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder, CdkDragDrop } from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { filter, map, Observable, take } from 'rxjs';
import { BoardFacade } from '../../core/store/board/board.facade';
import { ProjectFacade } from '../../core/store/project/project.facade';
import { ColumnEditorDialogComponent, type ColumnEditorDialogResult } from './column-editor-dialog/column-editor-dialog.component';
import type { TicketDialogResult } from '../../core/interfaces/ticket-dialog.interface';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../core/components/confirm-dialog/confirm-dialog.component';
import { TicketDialogComponent } from './ticket-dialog/ticket-dialog.component';
import { BoardColumn, Ticket } from '@org/shared-types';

@Component({
  selector: 'app-board',
  imports: [
    AsyncPipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
    CdkScrollable,
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent implements OnInit {
  readonly board = inject(BoardFacade);
  readonly project = inject(ProjectFacade);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  columnDropListIds: string[] = [];
  private projectId = '';

  private readonly ticketSelectors = new Map<string, Observable<Ticket[]>>();
  private loaded = false;

  constructor() {
    this.project.project$.pipe(
      filter((p) => p !== null),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((p) => {
      this.projectId = p.id;
      this.board.loadColumns(p.id);
    });

    this.board.columns$.pipe(
      filter((cols) => !this.loaded && cols.length > 0),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((cols) => {
      this.loaded = true;
      cols.forEach((c) => this.board.loadTickets(c.id));
    });

    this.board.columns$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((cols) => {
      this.columnDropListIds = cols.map((c) => c.id);
    });
  }

  ngOnInit() {
    this.project.loadProject();
  }

  ticketsFor(columnId: string): Observable<Ticket[]> {
    if (!this.ticketSelectors.has(columnId)) {
      this.ticketSelectors.set(columnId, this.board.ticketsByColumn(columnId));
    }
    return this.ticketSelectors.get(columnId)!;
  }

  isColumnEmpty(columnId: string): Observable<boolean> {
    return this.ticketsFor(columnId).pipe(map((tickets) => tickets.length === 0));
  }

  openColumnEditorDialog(column?: BoardColumn) {
    const ref = this.dialog.open(ColumnEditorDialogComponent, {
      width: '320px',
      disableClose: true,
      data: column,
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: ColumnEditorDialogResult | undefined) => {
      if (!result) return;
      if (column) {
        this.board.updateColumn(column.id, { name: result.name });
      } else {
        this.board.addColumn(this.projectId, result.name);
      }
    });
  }

  editColumn(column: BoardColumn) {
    this.openColumnEditorDialog(column);
  }

  openCreateTicketDialog(columns: BoardColumn[]) {
    const ref = this.dialog.open(TicketDialogComponent, {
      width: '480px',
      data: { columns },
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: TicketDialogResult | undefined) => {
      if (result?.action === 'save' && result.columnId) {
        const tempId = crypto.randomUUID();
        this.board.addTicket(result.columnId, result.title!, result.description, tempId);
      }
    });
  }

  openEditTicketDialog(ticket: Ticket, columns: BoardColumn[]) {
    const ref = this.dialog.open(TicketDialogComponent, {
      width: '480px',
      data: { columns, ticket },
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: TicketDialogResult | undefined) => {
      if (!result) return;

      if (result.action === 'save' && result.columnId) {
        const data: { title?: string; description?: string; columnId?: string } = {};
        if (result.title !== ticket.title) data.title = result.title;
        if ((result.description ?? '') !== (ticket.description ?? '')) data.description = result.description ?? '';
        if (result.columnId !== ticket.columnId) data.columnId = result.columnId;

        if (Object.keys(data).length > 0) {
          this.board.updateTicket(ticket.id, data);
        }
      } else if (result.action === 'delete') {
        this.board.deleteTicket(ticket.id);
      }
    });
  }

  confirmDelete(column: BoardColumn) {
    const data: ConfirmDialogData = {
      title: 'Delete Column',
      message: `Delete "${column.name}"? This cannot be undone.`,
    };
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data,
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.board.deleteColumn(column.id);
      }
    });
  }

  trackByColumnId(_: number, col: BoardColumn) {
    return col.id;
  }

  trackByTicketId(_: number, ticket: Ticket) {
    return ticket.id;
  }

  onDrop(event: CdkDragDrop<BoardColumn, BoardColumn, Ticket>) {
    const ticket = event.item.data;
    const targetColumn = event.container.data;

    // No-op: dropped in same position
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }

    // Get current tickets from store snapshot
    let allTickets: Ticket[] = [];
    this.board.tickets$.pipe(take(1)).subscribe((t) => (allTickets = t));

    // Filter tickets in target column, excluding the dragged ticket
    const targetTickets = allTickets
      .filter((t) => t.columnId === targetColumn.id && t.id !== ticket.id)
      .sort((a, b) => a.position - b.position);

    // Determine drop index from the actual cursor position, since CDK's
    // currentIndex can be unreliable when drag items are nested inside
    // mat-card-content rather than being direct children of cdkDropList.
    let dropIndex = targetTickets.length; // default: end of list
    if (event.dropPoint && targetTickets.length > 0) {
      const containerEl = event.container.element.nativeElement;
      // Get all ticket card elements in the target column (excluding the placeholder)
      const ticketElements = Array.from(
        containerEl.querySelectorAll('.ticket-card[cdkDrag]:not(.cdk-drag-placeholder)'),
      );
      // Find the element under the cursor
      const elAtPoint = document.elementFromPoint(event.dropPoint.x, event.dropPoint.y);
      if (elAtPoint) {
        const ticketEl = elAtPoint.closest('.ticket-card[cdkDrag]');
        if (ticketEl) {
          const idx = ticketElements.indexOf(ticketEl);
          if (idx !== -1) dropIndex = idx;
        } else {
          // Dropped before all tickets — check if cursor is above the first ticket
          const firstEl = ticketElements[0];
          if (firstEl) {
            const rect = firstEl.getBoundingClientRect();
            if (event.dropPoint.y < rect.top + rect.height / 2) {
              dropIndex = 0;
            }
          }
        }
      }
    }

    // Compute new position based on drop index
    let newPosition: number;
    if (targetTickets.length === 0 || dropIndex === 0) {
      newPosition = targetTickets.length === 0 ? 1000 : targetTickets[0].position / 2;
    } else if (dropIndex >= targetTickets.length) {
      newPosition = targetTickets[targetTickets.length - 1].position + 1000;
    } else {
      newPosition =
        (targetTickets[dropIndex - 1].position +
          targetTickets[dropIndex].position) /
        2;
    }

    // Store previous state for rollback
    const previous: Ticket = { ...ticket };

    // Dispatch optimistic move
    this.board.moveTicket(ticket.id, targetColumn.id, newPosition, previous);
  }

  onColumnDrop(event: CdkDragDrop<BoardColumn[], BoardColumn[], BoardColumn>) {
    const column = event.item.data;
    const columns = event.container.data;

    // No-op: dropped in same position
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const previousOrderedIds = columns.map((c) => c.id);
    const orderedIds = [...previousOrderedIds];
    orderedIds.splice(event.previousIndex, 1);
    orderedIds.splice(event.currentIndex, 0, column.id);

    this.board.reorderColumns(this.projectId, orderedIds, previousOrderedIds);
  }
}
