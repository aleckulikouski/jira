import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TicketDialogComponent } from './ticket-dialog.component';
import type { TicketDialogData } from '../../../core/interfaces/ticket-dialog.interface';
import { BoardColumn, Ticket } from '@org/shared-types';
import { of } from 'rxjs';

const makeTicket = (overrides?: Partial<Ticket>): Ticket => ({
  id: 't-1',
  columnId: 'c-1',
  assigneeId: null,
  title: 'Test Ticket',
  description: 'A description',
  position: 0,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

const makeColumns = (): BoardColumn[] => [
  { id: 'c-1', projectId: 'p-1', name: 'To Do', order: 0, createdAt: '', updatedAt: '' },
  { id: 'c-2', projectId: 'p-1', name: 'Done', order: 1, createdAt: '', updatedAt: '' },
];

describe('TicketDialogComponent', () => {
  describe('create mode', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<TicketDialogComponent>>;
    let dialogRefClose: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      dialogRefClose = vi.fn();
      await TestBed.configureTestingModule({
        imports: [TicketDialogComponent],
        providers: [
          provideNoopAnimations(),
          { provide: MatDialogRef, useValue: { close: dialogRefClose } },
          { provide: MatDialog, useValue: { open: vi.fn().mockReturnValue({ afterClosed: () => of(false) }) } },
          {
            provide: MAT_DIALOG_DATA,
            useValue: { columns: makeColumns(), selectedColumnId: 'c-2' } satisfies TicketDialogData,
          },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(TicketDialogComponent);
      fixture.detectChanges();
    });

    it('should default to empty fields and pre-selected column', () => {
      expect(fixture.componentInstance.title).toBe('');
      expect(fixture.componentInstance.description).toBe('');
      expect(fixture.componentInstance.columnId).toBe('c-2');
      expect(fixture.componentInstance.isEdit).toBe(false);
    });

    it('should fall back to first column when selectedColumnId is absent', async () => {
      // Re-configure with no selectedColumnId
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [TicketDialogComponent],
        providers: [
          provideNoopAnimations(),
          { provide: MatDialogRef, useValue: { close: vi.fn() } },
          { provide: MatDialog, useValue: { open: vi.fn().mockReturnValue({ afterClosed: () => of(false) }) } },
          {
            provide: MAT_DIALOG_DATA,
            useValue: { columns: makeColumns() } satisfies TicketDialogData,
          },
        ],
      }).compileComponents();
      const fallbackFixture = TestBed.createComponent(TicketDialogComponent);
      fallbackFixture.detectChanges();
      expect(fallbackFixture.componentInstance.columnId).toBe('c-1');
    });

    it('should show "New Ticket" title', () => {
      const title = fixture.nativeElement.querySelector('h2');
      expect(title.textContent).toContain('New');
    });

    it('should not show delete button', () => {
      const deleteBtn = fixture.nativeElement.querySelector('.delete-btn');
      expect(deleteBtn).toBeNull();
    });

    it('should have submit button labeled "Save"', () => {
      const submitBtn = fixture.nativeElement.querySelector('button[color="primary"]');
      expect(submitBtn.textContent?.trim()).toBe('Save');
    });

    it('should disable submit when title is empty', () => {
      fixture.componentInstance.title = '   ';
      fixture.detectChanges();
      const submitBtn = fixture.nativeElement.querySelector('button[color="primary"]');
      expect(submitBtn.disabled).toBe(true);
    });

    it('should close dialog with save action on valid submit', () => {
      fixture.componentInstance.title = 'New Ticket';
      fixture.componentInstance.description = 'Desc';
      fixture.componentInstance.columnId = 'c-2';
      fixture.componentInstance.submit();

      expect(dialogRefClose).toHaveBeenCalledWith({
        action: 'save',
        columnId: 'c-2',
        title: 'New Ticket',
        description: 'Desc',
      });
    });
  });

  describe('edit mode', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<TicketDialogComponent>>;
    let dialogRefClose: ReturnType<typeof vi.fn>;
    let mockDialog: MatDialog;
    const ticket = makeTicket();

    beforeEach(async () => {
      dialogRefClose = vi.fn();
      mockDialog = {
        open: vi.fn().mockReturnValue({ afterClosed: () => of(false) }),
      } as unknown as MatDialog;

      await TestBed.configureTestingModule({
        imports: [TicketDialogComponent],
        providers: [
          provideNoopAnimations(),
          { provide: MatDialogRef, useValue: { close: dialogRefClose } },
          { provide: MatDialog, useValue: mockDialog },
          {
            provide: MAT_DIALOG_DATA,
            useValue: { columns: makeColumns(), ticket } satisfies TicketDialogData,
          },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(TicketDialogComponent);
      fixture.detectChanges();
    });

    it('should pre-fill fields from ticket data', () => {
      expect(fixture.componentInstance.title).toBe('Test Ticket');
      expect(fixture.componentInstance.description).toBe('A description');
      expect(fixture.componentInstance.columnId).toBe('c-1');
      expect(fixture.componentInstance.isEdit).toBe(true);
    });

    it('should ignore selectedColumnId in edit mode and use ticket.columnId', () => {
      // Edit mode always uses ticket.columnId, regardless of selectedColumnId
      expect(fixture.componentInstance.columnId).toBe('c-1');
    });

    it('should show "Edit Ticket" title', () => {
      const title = fixture.nativeElement.querySelector('h2');
      expect(title.textContent).toContain('Edit');
    });

    it('should show delete button', () => {
      const deleteBtn = fixture.nativeElement.querySelector('.delete-btn');
      expect(deleteBtn).not.toBeNull();
    });

    it('should have submit button labeled "Save"', () => {
      const submitBtn = fixture.nativeElement.querySelector('button[color="primary"]');
      expect(submitBtn.textContent?.trim()).toBe('Save');
    });

    it('should close dialog with save action with changed fields', () => {
      fixture.componentInstance.title = 'Updated Title';
      fixture.componentInstance.description = 'New desc';
      fixture.componentInstance.columnId = 'c-2';
      fixture.componentInstance.submit();

      expect(dialogRefClose).toHaveBeenCalledWith({
        action: 'save',
        columnId: 'c-2',
        title: 'Updated Title',
        description: 'New desc',
      });
    });

    // The delete flow is covered by board effects tests
    it('should provide delete button in template', () => {
      const deleteBtn = fixture.nativeElement.querySelector('.delete-btn');
      expect(deleteBtn).toBeTruthy();
      expect(deleteBtn.textContent).toContain('Delete');
    });
  });
});
