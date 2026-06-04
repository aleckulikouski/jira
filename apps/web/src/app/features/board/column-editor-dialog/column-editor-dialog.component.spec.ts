import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { ColumnEditorDialogComponent } from './column-editor-dialog.component';
import type { BoardColumn } from '@org/shared-types';

function makeColumn(overrides?: Partial<BoardColumn>): BoardColumn {
  return {
    id: 'c-1',
    projectId: 'p-1',
    name: 'To Do',
    order: 0,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('ColumnEditorDialogComponent', () => {
  let fixture: ComponentFixture<ColumnEditorDialogComponent>;
  let backdropClick$: Subject<MouseEvent>;
  let keydownEvents$: Subject<KeyboardEvent>;
  let dialogRefClose: ReturnType<typeof vi.fn>;
  let dialogOpen: ReturnType<typeof vi.fn>;
  let afterClosed: Subject<boolean>;

  function setup(data: BoardColumn | undefined) {
    backdropClick$ = new Subject<MouseEvent>();
    keydownEvents$ = new Subject<KeyboardEvent>();
    dialogRefClose = vi.fn();
    afterClosed = new Subject<boolean>();
    dialogOpen = vi.fn().mockReturnValue({ afterClosed: () => afterClosed });

    return TestBed.configureTestingModule({
      imports: [ColumnEditorDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        {
          provide: MatDialogRef,
          useValue: {
            close: dialogRefClose,
            backdropClick: () => backdropClick$,
            keydownEvents: () => keydownEvents$,
          },
        },
      ],
    })
      .overrideProvider(MatDialog, { useValue: { open: dialogOpen } })
      .compileComponents();
  }

  function create() {
    fixture = TestBed.createComponent(ColumnEditorDialogComponent);
    fixture.detectChanges();
  }

  function getTitle(): string {
    return (fixture.nativeElement.querySelector('[mat-dialog-title]') as HTMLElement)?.textContent?.trim() ?? '';
  }

  function getNameInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }

  function getSubmitButton(): HTMLButtonElement {
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    return Array.from(buttons).find((b) => b.textContent?.trim() !== 'Cancel') as HTMLButtonElement;
  }

  function getCancelButton(): HTMLButtonElement {
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    return Array.from(buttons).find((b) => b.textContent?.trim() === 'Cancel') as HTMLButtonElement;
  }

  function setInputValue(value: string) {
    fixture.componentInstance.name = value;
    fixture.detectChanges();
  }

  describe('add mode (no BoardColumn data)', () => {
    beforeEach(async () => {
      await setup(undefined);
      create();
    });

    it('should have title "Add Column"', () => {
      expect(getTitle()).toBe('Add Column');
    });

    it('should have an empty name field', () => {
      expect(getNameInput().value).toBe('');
    });

    it('should have submit button labeled "Add"', () => {
      expect(getSubmitButton().textContent?.trim()).toBe('Add');
    });

    it('should disable submit button when name is empty', () => {
      expect(getSubmitButton().disabled).toBe(true);
    });

    it('should disable submit button when name is whitespace only', () => {
      setInputValue('   ');
      expect(getSubmitButton().disabled).toBe(true);
    });

    it('should enable submit button when name has content', () => {
      setInputValue('New Column');
      expect(getSubmitButton().disabled).toBe(false);
    });

    it('should close with trimmed name on submit', () => {
      setInputValue('  New Column  ');
      getSubmitButton().click();
      expect(dialogRefClose).toHaveBeenCalledWith({ name: 'New Column' });
    });

    it('should close on cancel button click', () => {
      getCancelButton().click();
      expect(dialogRefClose).toHaveBeenCalled();
    });

    it('should close on backdrop click', () => {
      backdropClick$.next(new MouseEvent('click'));
      expect(dialogRefClose).toHaveBeenCalled();
    });

    it('should close on Escape key', () => {
      keydownEvents$.next(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(dialogRefClose).toHaveBeenCalled();
    });
  });

  describe('edit mode (BoardColumn data passed)', () => {
    const column = makeColumn({ id: 'c-1', name: 'To Do' });

    beforeEach(async () => {
      await setup(column);
      create();
    });

    it('should have title "Edit Column"', () => {
      expect(getTitle()).toBe('Edit Column');
    });

    it('should pre-fill the name field with current column name', () => {
      expect(getNameInput().value).toBe('To Do');
    });

    it('should have submit button labeled "Save"', () => {
      expect(getSubmitButton().textContent?.trim()).toBe('Save');
    });

    it('should close silently when name is unchanged', () => {
      getSubmitButton().click();
      expect(dialogRefClose).toHaveBeenCalled();
    });

    it('should treat trimmed-whitespace-equivalent name as unchanged', () => {
      setInputValue('  To Do  ');
      getSubmitButton().click();
      expect(dialogRefClose).toHaveBeenCalled();
    });

    it('should close with id and new name when name is changed', () => {
      setInputValue('In Progress');
      getSubmitButton().click();
      expect(dialogRefClose).toHaveBeenCalledWith({ id: 'c-1', name: 'In Progress' });
    });

    it('should disable submit button when name is empty', () => {
      setInputValue('');
      expect(getSubmitButton().disabled).toBe(true);
    });

    describe('unsaved changes guard', () => {
      it('should close without prompt when cancel clicked with no changes', () => {
        getCancelButton().click();
        expect(dialogOpen).not.toHaveBeenCalled();
        expect(dialogRefClose).toHaveBeenCalled();
      });

      it('should show confirmation when cancel clicked with changes', () => {
        setInputValue('Changed');
        getCancelButton().click();
        expect(dialogOpen).toHaveBeenCalled();
      });

      it('should show confirmation on Escape with changes', () => {
        setInputValue('Changed');
        keydownEvents$.next(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(dialogOpen).toHaveBeenCalled();
      });

      it('should show confirmation on backdrop click with changes', () => {
        setInputValue('Changed');
        backdropClick$.next(new MouseEvent('click'));
        expect(dialogOpen).toHaveBeenCalled();
      });

      it('should keep dialog open when user chooses to stay', () => {
        setInputValue('Changed');
        getCancelButton().click();
        afterClosed.next(false);
        expect(dialogRefClose).not.toHaveBeenCalled();
      });

      it('should close dialog when user chooses to discard', () => {
        setInputValue('Changed');
        getCancelButton().click();
        afterClosed.next(true);
        expect(dialogRefClose).toHaveBeenCalled();
      });
    });
  });
});
