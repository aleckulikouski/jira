import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BoardService } from './board.service';


describe('BoardService', () => {
  let service: BoardService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BoardService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BoardService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getBoard', () => {
    it('calls GET /projects/:id/board with the correct URL', () => {
      const mockBoard = {
        id: 'p-1',
        name: 'Test Project',
        columns: [
          {
            id: 'c-1',
            projectId: 'p-1',
            name: 'To Do',
            order: 0,
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
            tickets: [],
          },
        ],
      };

      service.getBoard('p-1').subscribe((result) => {
        expect(result).toEqual(mockBoard);
      });

      const req = httpTesting.expectOne('http://localhost:3000/api/projects/p-1/board');
      expect(req.request.method).toBe('GET');
      req.flush(mockBoard);
    });
  });
});
