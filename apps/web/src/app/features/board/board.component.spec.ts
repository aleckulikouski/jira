import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { OverlayContainer } from '@angular/cdk/overlay';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { BoardComponent } from './board.component';
import { BoardFacade } from '../../core/store/board/board.facade';
import { ProjectFacade } from '../../core/store/project/project.facade';
import { WsService } from '../../core/services/ws.service';
import { TokenStorage } from '../../core/tokens/token-storage';
import { Store } from '@ngrx/store';
import type { BoardColumn, Ticket } from '@org/shared-types';

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

function makeTicket(overrides?: Partial<Ticket>): Ticket {
  return {
    id: 't-1',
    columnId: 'c-1',
    assigneeId: null,
    title: 'Test Ticket',
    description: '',
    position: 0,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('BoardComponent', () => {
  let fixture: ComponentFixture<BoardComponent>;
  let overlayContainer: OverlayContainer;
  let dialogOpen: ReturnType<typeof vi.fn>;

  function setup(columns: BoardColumn[], tickets: Ticket[]) {
    const ticketsByCol = new Map<string, Ticket[]>();
    for (const t of tickets) {
      const col = ticketsByCol.get(t.columnId) || [];
      col.push(t);
      ticketsByCol.set(t.columnId, col);
    }

    dialogOpen = vi.fn().mockReturnValue({ afterClosed: () => of(undefined) });

    return TestBed.configureTestingModule({
      imports: [BoardComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: vi.fn().mockReturnValue('p-1') } },
            paramMap: of(new Map([['id', 'p-1']])),
          },
        },
        {
          provide: BoardFacade,
          useValue: {
            columns$: of(columns),
            loading$: of(false),
            error$: of(null),
            tickets$: of(tickets),
            ticketsByColumn: vi.fn().mockImplementation((colId: string) =>
              of(ticketsByCol.get(colId) || []),
            ),
            loadColumns: vi.fn(),
            loadTickets: vi.fn(),
            addColumn: vi.fn(),
            updateColumn: vi.fn(),
            deleteColumn: vi.fn(),
            reorderColumns: vi.fn(),
          },
        },
        {
          provide: ProjectFacade,
          useValue: {
            projects$: of([]),
            loading$: of(false),
            error$: of(null),
            loadProjects: vi.fn(),
            selectProject: vi.fn(),
            createProject: vi.fn(),
          },
        },
        {
          provide: MatSnackBar,
          useValue: { open: vi.fn() },
        },
        {
          provide: WsService,
          useValue: {
            setCurrentProject: vi.fn(),
            setBoardLoaded: vi.fn(),
            connect: vi.fn(),
            disconnect: vi.fn(),
          },
        },
        {
          provide: TokenStorage,
          useValue: { get: vi.fn().mockReturnValue(null), set: vi.fn(), remove: vi.fn() },
        },
        {
          provide: Store,
          useValue: { dispatch: vi.fn(), select: vi.fn().mockReturnValue(of(null)) },
        },
      ],
    })
      .overrideProvider(MatDialog, { useValue: { open: dialogOpen } })
      .compileComponents();
  }

  function create() {
    fixture = TestBed.createComponent(BoardComponent);
    overlayContainer = TestBed.inject(OverlayContainer);
    fixture.detectChanges();
  }

  afterEach(() => {
    // Clean up the overlay container between tests
    overlayContainer.ngOnDestroy();
  });

  function getMenuTriggers(): HTMLButtonElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.column-actions-btn'),
    ) as HTMLButtonElement[];
  }

  function getOverlayMenuItems(): NodeListOf<Element> {
    return overlayContainer.getContainerElement().querySelectorAll('[mat-menu-item]');
  }

  function openMenu(trigger: HTMLButtonElement) {
    trigger.click();
    fixture.detectChanges();
  }

  describe('column actions menu', () => {
    const emptyCol = makeColumn({ id: 'c-empty', name: 'Empty' });
    const fullCol = makeColumn({ id: 'c-full', name: 'Full', order: 1 });
    const ticket = makeTicket({ columnId: 'c-full' });

    beforeEach(async () => {
      await setup([emptyCol, fullCol], [ticket]);
      create();
    });

    it('should render menu trigger button for each column', () => {
      const triggers = getMenuTriggers();
      expect(triggers.length).toBe(2);
    });

    it('should have more_vert icon in trigger', () => {
      const triggers = getMenuTriggers();
      const icon = triggers[0].querySelector('mat-icon');
      expect(icon?.textContent?.trim()).toBe('more_vert');
    });

    it('should have contextual aria-label on trigger', () => {
      const triggers = getMenuTriggers();
      expect(triggers[0].getAttribute('aria-label')).toBe('Column actions for Empty');
      expect(triggers[1].getAttribute('aria-label')).toBe('Column actions for Full');
    });

    it('should open menu on trigger click', () => {
      openMenu(getMenuTriggers()[0]);
      const items = getOverlayMenuItems();
      expect(items.length).toBeGreaterThan(0);
    });

    it('should have all menu items in correct order', () => {
      openMenu(getMenuTriggers()[0]);
      const items = Array.from(getOverlayMenuItems());
      const labels = items.map((i) => i.textContent?.trim());
      expect(labels).toHaveLength(4);
      expect(labels[0]).toContain('New ticket');
      expect(labels[1]).toContain('Add column');
      expect(labels[2]).toContain('Edit');
      expect(labels[3]).toContain('Delete');
    });

    it('should have correct icons for each menu item', () => {
      openMenu(getMenuTriggers()[0]);
      const items = Array.from(getOverlayMenuItems());
      const icons = items.map((i) => i.querySelector('mat-icon')?.textContent?.trim());
      expect(icons[0]).toBe('note_add');
      expect(icons[1]).toBe('add');
      expect(icons[2]).toBe('edit');
      expect(icons[3]).toBe('delete');
    });

    it('should have a separator before Delete', () => {
      openMenu(getMenuTriggers()[0]);
      const container = overlayContainer.getContainerElement();
      const divider = container.querySelector('mat-divider');
      expect(divider).toBeTruthy();
    });

    it('should have contextual aria-label on Edit item', () => {
      openMenu(getMenuTriggers()[0]);
      const items = Array.from(getOverlayMenuItems());
      const editItem = items.find((i) => i.getAttribute('aria-label')?.startsWith('Edit'));
      expect(editItem?.getAttribute('aria-label')).toBe('Edit Empty column');
    });

    it('should have contextual aria-label on Delete item', () => {
      openMenu(getMenuTriggers()[0]);
      const items = Array.from(getOverlayMenuItems());
      const deleteItem = items.find((i) => i.getAttribute('aria-label')?.startsWith('Delete'));
      expect(deleteItem?.getAttribute('aria-label')).toBe('Delete Empty column');
    });

    it('should disable Delete item when column has tickets', () => {
      openMenu(getMenuTriggers()[1]); // Full column (has ticket)
      const items = Array.from(getOverlayMenuItems());
      const deleteItem = items.find((i) => i.getAttribute('aria-label')?.startsWith('Delete'));
      expect((deleteItem as HTMLButtonElement)?.disabled).toBe(true);
    });

    it('should enable Delete item when column is empty', () => {
      openMenu(getMenuTriggers()[0]); // Empty column
      const items = Array.from(getOverlayMenuItems());
      const deleteItem = items.find((i) => i.getAttribute('aria-label')?.startsWith('Delete'));
      expect((deleteItem as HTMLButtonElement)?.disabled).toBe(false);
    });

    it('should show helper text when Delete is disabled', () => {
      openMenu(getMenuTriggers()[1]); // Full column
      const items = Array.from(getOverlayMenuItems());
      const deleteItem = items.find((i) => i.getAttribute('aria-label')?.startsWith('Delete'));
      expect(deleteItem?.textContent).toContain('Column must be empty');
    });

    it('should have aria-describedby on disabled Delete pointing to helper text', () => {
      openMenu(getMenuTriggers()[1]); // Full column
      const items = Array.from(getOverlayMenuItems());
      const deleteItem = items.find((i) => i.getAttribute('aria-label')?.startsWith('Delete'));
      const describedBy = deleteItem?.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      const helperEl = deleteItem?.querySelector(`#${describedBy}`);
      expect(helperEl).toBeTruthy();
    });

    it('should open edit dialog when Edit is clicked', () => {
      openMenu(getMenuTriggers()[0]);
      const items = Array.from(getOverlayMenuItems());
      const editItem = items.find((i) => i.getAttribute('aria-label')?.startsWith('Edit'));
      (editItem as HTMLElement)?.click();
      expect(dialogOpen).toHaveBeenCalled();
    });

    it('should open confirm dialog when Delete is clicked on empty column', () => {
      openMenu(getMenuTriggers()[0]); // Empty column
      const items = Array.from(getOverlayMenuItems());
      const deleteItem = items.find((i) => i.getAttribute('aria-label')?.startsWith('Delete'));
      (deleteItem as HTMLElement)?.click();
      expect(dialogOpen).toHaveBeenCalled();
    });

    it('should open ticket dialog with selectedColumnId when New ticket is clicked', () => {
      openMenu(getMenuTriggers()[0]);
      const items = Array.from(getOverlayMenuItems());
      const newTicketItem = items.find((i) => i.getAttribute('aria-label')?.startsWith('New ticket'));
      (newTicketItem as HTMLElement)?.click();
      expect(dialogOpen).toHaveBeenCalled();
      // Verify dialog data includes selectedColumnId set to the column id
      const callArgs = dialogOpen.mock.calls[dialogOpen.mock.calls.length - 1];
      expect(callArgs[1]?.data?.selectedColumnId).toBe('c-empty');
    });

    it('should open column editor dialog with afterColumnId when Add column is clicked', () => {
      openMenu(getMenuTriggers()[0]);
      const items = Array.from(getOverlayMenuItems());
      const addColItem = items.find((i) => i.getAttribute('aria-label')?.startsWith('Add column'));
      (addColItem as HTMLElement)?.click();
      expect(dialogOpen).toHaveBeenCalled();
      const callArgs = dialogOpen.mock.calls[dialogOpen.mock.calls.length - 1];
      expect(callArgs[1]?.data?.afterColumnId).toBe('c-empty');
    });
  });

  describe('removed elements', () => {
    beforeEach(async () => {
      await setup([makeColumn()], []);
      create();
    });

    it('should not have a FAB', () => {
      const fab = fixture.nativeElement.querySelector('.fab');
      expect(fab).toBeNull();
    });

    it('should not have header Add column button', () => {
      const headerBtn = fixture.nativeElement.querySelector('.add-column-btn');
      expect(headerBtn).toBeNull();
    });
  });

  describe('empty state', () => {
    beforeEach(async () => {
      await setup([], []);
      create();
    });

    it('should show a centered Add column button with icon', () => {
      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      const btn = emptyState.querySelector('button');
      expect(btn).toBeTruthy();
      expect(btn.textContent?.trim()).toContain('Add column');
      const icon = btn.querySelector('mat-icon');
      expect(icon?.textContent?.trim()).toBe('add');
    });
  });
});
