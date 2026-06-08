import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { WsGateway } from '../ws/ws.gateway';

describe('BoardController', () => {
  let controller: BoardController;
  let board: Record<string, ReturnType<typeof vi.fn>>;
  let ws: { emitToProject: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    board = {
      getBoard: vi.fn(),
      createColumn: vi.fn(),
      updateColumn: vi.fn(),
      deleteColumn: vi.fn(),
      reorderColumns: vi.fn(),
      createTicket: vi.fn(),
      updateTicket: vi.fn(),
      deleteTicket: vi.fn(),
    };

    ws = { emitToProject: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardController],
      providers: [
        { provide: BoardService, useValue: board },
        { provide: WsGateway, useValue: ws },
      ],
    }).compile();

    controller = module.get(BoardController);
  });

  describe('getBoard', () => {
    it('delegates to BoardService.getBoard', async () => {
      const mockBoard = { id: 'p-1', name: 'Test', columns: [] };
      board.getBoard.mockResolvedValue(mockBoard);

      const result = await controller.getBoard('p-1', {
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);

      expect(board.getBoard).toHaveBeenCalledWith('p-1', 'user-1');
      expect(result).toEqual(mockBoard);
    });
  });

  describe('createColumn', () => {
    it('delegates and broadcasts', async () => {
      const column = {
        id: 'c-1', projectId: 'p-1', name: 'New', order: 0,
        createdAt: '', updatedAt: '',
      };
      const broadcast = {
        event: 'column:created' as const,
        projectId: 'p-1',
        payload: column,
      };
      board.createColumn.mockResolvedValue({ column, broadcast });

      const dto = { name: 'New' };
      const result = await controller.createColumn('p-1', dto, {
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);

      expect(board.createColumn).toHaveBeenCalledWith('p-1', 'user-1', 'New', undefined);
      expect(ws.emitToProject).toHaveBeenCalledWith('column:created', 'p-1', column);
      expect(result).toEqual(column);
    });
  });

  describe('updateColumn', () => {
    it('delegates and broadcasts', async () => {
      const column = {
        id: 'c-1', projectId: 'p-1', name: 'Renamed', order: 0,
        createdAt: '', updatedAt: '',
      };
      const broadcast = {
        event: 'column:updated' as const,
        projectId: 'p-1',
        payload: column,
      };
      board.updateColumn.mockResolvedValue({ column, broadcast });

      const dto = { name: 'Renamed' };
      const result = await controller.updateColumn('c-1', dto, {
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);

      expect(board.updateColumn).toHaveBeenCalledWith('c-1', 'user-1', dto);
      expect(ws.emitToProject).toHaveBeenCalledWith('column:updated', 'p-1', column);
      expect(result).toEqual(column);
    });
  });

  describe('deleteColumn', () => {
    it('delegates and broadcasts', async () => {
      const broadcast = {
        event: 'column:deleted' as const,
        projectId: 'p-1',
        payload: { id: 'c-1' },
      };
      board.deleteColumn.mockResolvedValue({ broadcast });

      await controller.deleteColumn('c-1', {
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);

      expect(board.deleteColumn).toHaveBeenCalledWith('c-1', 'user-1');
      expect(ws.emitToProject).toHaveBeenCalledWith('column:deleted', 'p-1', { id: 'c-1' });
    });
  });

  describe('reorderColumns', () => {
    it('delegates and broadcasts', async () => {
      const broadcast = {
        event: 'columns:reordered' as const,
        projectId: 'p-1',
        payload: { projectId: 'p-1', orderedIds: ['c-2', 'c-1'] },
      };
      board.reorderColumns.mockResolvedValue({ broadcast });

      const dto = { orderedIds: ['c-2', 'c-1'] };
      const result = await controller.reorderColumns('p-1', dto, {
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);

      expect(board.reorderColumns).toHaveBeenCalledWith('p-1', 'user-1', ['c-2', 'c-1']);
      expect(ws.emitToProject).toHaveBeenCalled();
      expect(result).toEqual({ statusCode: 200 });
    });
  });

  describe('createTicket', () => {
    it('delegates and broadcasts', async () => {
      const ticket = {
        id: 't-1', columnId: 'c-1', title: 'New', description: '',
        position: 0, assigneeId: null, createdAt: '', updatedAt: '',
      };
      const broadcast = {
        event: 'ticket:created' as const,
        projectId: 'p-1',
        payload: ticket,
      };
      board.createTicket.mockResolvedValue({ ticket, broadcast });

      const dto = { title: 'New' };
      const result = await controller.createTicket('c-1', dto, {
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);

      expect(board.createTicket).toHaveBeenCalledWith('c-1', 'user-1', dto);
      expect(ws.emitToProject).toHaveBeenCalledWith('ticket:created', 'p-1', ticket);
      expect(result).toEqual(ticket);
    });
  });

  describe('updateTicket', () => {
    it('delegates and broadcasts', async () => {
      const ticket = {
        id: 't-1', columnId: 'c-1', title: 'Updated', description: '',
        position: 0, assigneeId: null, createdAt: '', updatedAt: '',
      };
      const broadcast = {
        event: 'ticket:updated' as const,
        projectId: 'p-1',
        payload: ticket,
      };
      board.updateTicket.mockResolvedValue({ ticket, broadcast });

      const dto = { title: 'Updated' };
      const result = await controller.updateTicket('t-1', dto, {
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);

      expect(board.updateTicket).toHaveBeenCalledWith('t-1', 'user-1', dto);
      expect(ws.emitToProject).toHaveBeenCalledWith('ticket:updated', 'p-1', ticket);
      expect(result).toEqual(ticket);
    });
  });

  describe('deleteTicket', () => {
    it('delegates and broadcasts', async () => {
      const broadcast = {
        event: 'ticket:deleted' as const,
        projectId: 'p-1',
        payload: { id: 't-1' },
      };
      board.deleteTicket.mockResolvedValue({ broadcast });

      await controller.deleteTicket('t-1', {
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);

      expect(board.deleteTicket).toHaveBeenCalledWith('t-1', 'user-1');
      expect(ws.emitToProject).toHaveBeenCalledWith('ticket:deleted', 'p-1', { id: 't-1' });
    });
  });
});
