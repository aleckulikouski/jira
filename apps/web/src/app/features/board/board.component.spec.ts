import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { BoardComponent } from './board.component';
import { BoardFacade } from '../../core/store/board/board.facade';
import { ProjectFacade } from '../../core/store/project/project.facade';
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

  function setup(columns: BoardColumn[], tickets: Ticket[]) {
    const ticketsByCol = new Map<string, Ticket[]>();
    for (const t of tickets) {
      const col = ticketsByCol.get(t.columnId) || [];
      col.push(t);
      ticketsByCol.set(t.columnId, col);
    }

    return TestBed.configureTestingModule({
      imports: [BoardComponent],
      providers: [
        provideNoopAnimations(),
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
          },
        },
        {
          provide: ProjectFacade,
          useValue: {
            project$: of({
              id: 'p-1',
              ownerId: 'u-1',
              name: 'Test Project',
              createdAt: '',
              updatedAt: '',
            }),
            loadProject: vi.fn(),
          },
        },
        {
          provide: MatDialog,
          useValue: {
            open: vi.fn().mockReturnValue({ afterClosed: () => of(false) }),
          },
        },
      ],
    }).compileComponents();
  }

  describe('delete button', () => {
    const emptyCol = makeColumn({ id: 'c-empty', name: 'Empty' });
    const fullCol = makeColumn({ id: 'c-full', name: 'Full', order: 1 });
    const ticket = makeTicket({ columnId: 'c-full' });

    beforeEach(async () => {
      await setup([emptyCol, fullCol], [ticket]);
      fixture = TestBed.createComponent(BoardComponent);
      fixture.detectChanges();
    });

    it('should be disabled when column has tickets', () => {
      const buttons: NodeListOf<HTMLButtonElement> =
        fixture.nativeElement.querySelectorAll('.delete-btn');
      expect(buttons.length).toBe(2);

      // Empty column button should be enabled
      expect(buttons[0].disabled).toBe(false);

      // Full column button should be disabled
      expect(buttons[1].disabled).toBe(true);
    });

    it('should be enabled when column is empty', () => {
      const buttons: NodeListOf<HTMLButtonElement> =
        fixture.nativeElement.querySelectorAll('.delete-btn');
      expect(buttons[0].disabled).toBe(false);
    });
  });
});
